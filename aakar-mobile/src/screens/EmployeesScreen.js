import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../api/axios';

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmps = async () => {
      try {
        const res = await api.get('/system/employees');
        setEmployees(res.data.users);
      } catch (e) { console.log(e); }
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

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Employees</Text>
      <FlatList 
        data={employees}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB', padding: 20, paddingTop: 50 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#A65D43', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  info: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: 16 },
  email: { color: '#64748B', fontSize: 12 },
  roleBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  roleText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#111827' }
});