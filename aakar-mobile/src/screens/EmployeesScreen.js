import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/axios';
import { colors, shadows } from '../theme';

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmps = async () => {
      try {
        const res = await api.get('/system/employees');
        setEmployees(res.data.users);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEmps();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0)}</Text></View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <View style={styles.roleBadge}><Text style={styles.roleText}>{item.role}</Text></View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={styles.container}
        data={employees}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Team workspace</Text>
            <Text style={styles.pageTitle}>Employees</Text>
            <Text style={styles.pageSub}>A lightweight directory of active staff accounts.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { marginTop: 8, marginBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 },
  pageTitle: { fontSize: 30, fontWeight: '900', color: colors.text },
  pageSub: { fontSize: 14, color: colors.textSoft, marginTop: 6, lineHeight: 21 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: 'white', fontWeight: '800', fontSize: 18 },
  info: { flex: 1 },
  name: { fontWeight: '800', fontSize: 16, color: colors.text },
  email: { color: colors.textSoft, fontSize: 12, marginTop: 3 },
  roleBadge: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  roleText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: colors.text },
});
