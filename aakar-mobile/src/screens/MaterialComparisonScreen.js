import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import api from '../api/axios';
import { colors, shadows } from '../theme';

export default function MaterialComparisonScreen({ route, navigation }) {
  const { projectId, projectName } = route.params;
  const [materials, setMaterials] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMaterials = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/materials/comparison`);
      setMaterials(res.data.materials || []);
      setSummary(res.data.summary || null);
    } catch (e) {
      console.log('Failed to load material comparison', e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [projectId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMaterials();
    setRefreshing(false);
  };

  const getStatusStyle = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('over')) {
      return { color: colors.danger, backgroundColor: colors.dangerSoft };
    }
    return { color: colors.success, backgroundColor: colors.successSoft };
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.materialName}>{item.material_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Estimated</Text>
          <Text style={styles.metricValue}>{Number(item.estimated_quantity || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Actual</Text>
          <Text style={styles.metricValue}>{Number(item.actual_quantity || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Variance</Text>
          <Text
            style={[
              styles.metricValue,
              { color: Number(item.quantity_variance || 0) > 0 ? colors.danger : colors.success },
            ]}
          >
            {Number(item.quantity_variance || 0) > 0 ? '+' : ''}
            {Number(item.quantity_variance || 0).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

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
        data={materials}
        keyExtractor={(item, index) => `${item.material_name}-${index}`}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={(
          <View style={styles.headerWrap}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <ChevronLeft color={colors.textSoft} size={18} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.eyebrow}>Material analysis</Text>
            <Text style={styles.pageTitle}>Material Comparison</Text>
            <Text style={styles.pageSub}>
              {projectName || 'Project'} estimated versus actual material usage.
            </Text>

            {summary && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Estimated Qty</Text>
                  <Text style={styles.summaryValue}>{Number(summary.estimated_quantity || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Actual Qty</Text>
                  <Text style={styles.summaryValue}>{Number(summary.actual_quantity || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Variance</Text>
                  <Text style={styles.summaryValue}>{Number(summary.variance_quantity || 0).toLocaleString()}</Text>
                </View>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No material comparison data available yet.</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerWrap: { marginTop: 8, marginBottom: 18 },
  headerRow: { marginBottom: 14 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backText: { color: colors.textSoft, fontSize: 13, fontWeight: '800', marginLeft: 6 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 },
  pageTitle: { fontSize: 30, fontWeight: '900', color: colors.text },
  pageSub: { fontSize: 14, color: colors.textSoft, marginTop: 6, lineHeight: 21, maxWidth: 320 },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 18,
    ...shadows.card,
  },
  summaryItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3EEE7' },
  summaryLabel: { fontSize: 11, color: colors.textSoft, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  summaryValue: { fontSize: 18, color: colors.text, fontWeight: '900', marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 },
  materialName: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  metricLabel: { fontSize: 12, color: colors.textSoft, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.9 },
  metricValue: { fontSize: 14, color: colors.text, fontWeight: '800' },
  emptyBox: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
