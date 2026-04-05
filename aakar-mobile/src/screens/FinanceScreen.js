import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import api from '../api/axios';

const screenWidth = Dimensions.get("window").width;

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

  if (!summary) return null;

  // Map category data for Pie Chart
  const pieData = (summary.category_breakdown || []).map((item, index) => ({
    name: item.category,
    population: Number(item.total),
    color: ['#F59E0B', '#EF4444', '#3B82F6', '#10B981'][index % 4],
    legendFontColor: "#64748B",
    legendFontSize: 12
  }));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Finance Overview</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>Rs. {summary.total_income}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Expense</Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>Rs. {summary.total_expense}</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Expenses by Category</Text>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={screenWidth - 60}
            height={200}
            chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        ) : <Text>No Data</Text>}
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Recent Transactions</Text>
        {summary.recent_transactions?.map(tx => (
          <View key={tx.id} style={styles.txRow}>
            <View>
              <Text style={styles.txCat}>{tx.category}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.type === 'income' ? '#10B981' : '#EF4444' }]}>
              {tx.type === 'income' ? '+' : '-'} Rs. {tx.amount}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB', padding: 20, paddingTop: 50 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { backgroundColor: '#fff', width: '48%', padding: 20, borderRadius: 16, elevation: 2 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  chartCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#111827' },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  txCat: { fontWeight: 'bold', color: '#111827' },
  txDate: { fontSize: 12, color: '#94A3B8' },
  txAmount: { fontWeight: 'bold' }
});