import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/axios';
import { colors, shadows } from '../theme';

export default function ProjectsScreen({ navigation }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (e) {
      console.log('Error fetching projects', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return colors.success;
      case 'in progress': return colors.primary;
      case 'on hold': return colors.warning;
      default: return colors.textMuted;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.projectName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>{item.description || 'No project description available.'}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{item.progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>{item.start_date} -> {item.end_date || 'Ongoing'}</Text>
      </View>
    </TouchableOpacity>
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
        data={projects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Project workspace</Text>
            <Text style={styles.pageTitle}>Projects</Text>
            <Text style={styles.pageSub}>Track progress, status, and build timelines in one place.</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No projects found.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
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
  pageSub: { fontSize: 14, color: colors.textSoft, marginTop: 6, lineHeight: 21, maxWidth: 310 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10 },
  projectName: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  description: { fontSize: 13, color: colors.textSoft, marginBottom: 15, lineHeight: 19 },
  progressContainer: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: colors.textSoft, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  progressValue: { fontSize: 12, color: colors.text, fontWeight: '800' },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 999 },
  progressFill: { height: 8, backgroundColor: colors.primary, borderRadius: 999 },
  cardFooter: { borderTopWidth: 1, borderColor: '#F3EEE7', paddingTop: 12 },
  footerText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 50, fontSize: 16 },
});
