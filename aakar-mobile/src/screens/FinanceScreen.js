import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import api from '../api/axios';
import { colors, shadows } from '../theme';

const screenWidth = Dimensions.get('window').width;

export default function FinanceScreen() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchFinance();
  }, []);

  const fetchFinance = async () => {
    try {
      const res = await api.get('/finance/summary');
      setSummary(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  if (!summary) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const pieData = (summary.category_breakdown || []).map((item, index) => ({
    name: item.category,
    population: Number(item.total),
    color: [colors.warning, colors.danger, colors.info, colors.success][index % 4],
    legendFontColor: colors.textSoft,
    legendFontSize: 12,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Finance workspace</Text>
          <Text style={styles.pageTitle}>Finance Overview</Text>
          <Text style={styles.pageSub}>A simple view of revenue, expenses, and recent cash movement.</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>Rs. {Number(summary.total_income || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Expense</Text>
            <Text style={[styles.statValue, { color: colors.danger }]}>Rs. {Number(summary.total_expense || 0).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Expenses by Category</Text>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth - 50}
              height={220}
              chartConfig={{ color: () => colors.text }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
            />
          ) : <Text style={styles.emptyText}>No data yet.</Text>}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Recent Transactions</Text>
          {summary.recent_transactions?.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View>
                <Text style={styles.txCat}>{tx.category}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'income' ? colors.success : colors.danger }]}>
                {tx.type === 'income' ? '+' : '-'} Rs. {Number(tx.amount).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
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
  pageSub: { fontSize: 14, color: colors.textSoft, marginTop: 6, lineHeight: 21, maxWidth: 320 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  statBox: { backgroundColor: colors.surface, flex: 1, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: colors.border, ...shadows.soft },
  statLabel: { fontSize: 11, color: colors.textSoft, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  statValue: { fontSize: 19, fontWeight: '900' },
  chartCard: { backgroundColor: colors.surface, padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  chartTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14, color: colors.text },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3EEE7' },
  txCat: { fontWeight: '800', color: colors.text },
  txDate: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  txAmount: { fontWeight: '800', marginLeft: 10 },
  emptyText: { color: colors.textMuted },
});
