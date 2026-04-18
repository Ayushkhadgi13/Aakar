import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { colors, shadows } from '../theme';

const screenWidth = Dimensions.get('window').width - 56;

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(166, 93, 67, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: { borderRadius: 20 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
  propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '' },
};

export default function DashboardScreen() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      if (user?.role === 'admin') {
        const [financeRes, vendorRes] = await Promise.all([
          api.get('/finance/summary'),
          api.get('/finance/vendors'),
        ]);
        setData({ ...financeRes.data, vendors: vendorRes.data });
      } else {
        const res = await api.get('/tasks/stats');
        setData(res.data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const buildMonthlyChart = () => {
    const transactions = data?.recent_transactions || [];
    const months = {};
    transactions.forEach((tx) => {
      const month = tx.date?.slice(0, 7);
      if (!month) return;
      if (!months[month]) months[month] = { income: 0, expense: 0 };
      if (tx.type === 'income') months[month].income += Number(tx.amount);
      else months[month].expense += Number(tx.amount);
    });
    const keys = Object.keys(months).sort().slice(-5);
    if (keys.length === 0) return null;
    return {
      labels: keys.map((k) => k.slice(5)),
      datasets: [
        { data: keys.map((k) => months[k].income), color: (o = 1) => `rgba(16,185,129,${o})`, strokeWidth: 2 },
        { data: keys.map((k) => months[k].expense), color: (o = 1) => `rgba(239,68,68,${o})`, strokeWidth: 2 },
      ],
      legend: ['Income', 'Expense'],
    };
  };

  const buildTaskChart = () => ({
    labels: ['Pending', 'In Progress', 'Done'],
    datasets: [{
      data: [
        data?.pending_count || 0,
        data?.in_progress_count || 0,
        data?.completed_count || 0,
      ],
    }],
  });

  const monthlyChart = user?.role === 'admin' ? buildMonthlyChart() : null;
  const taskChart = user?.role !== 'admin' ? buildTaskChart() : null;
  const net = (data?.total_income || 0) - (data?.total_expense || 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Daily overview</Text>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.subGreeting}>
            {user?.role === 'admin'
              ? 'A clear snapshot of revenue, expenses, and vendors.'
              : 'A focused view of your work and current task load.'}
          </Text>
        </View>

        {user?.role === 'admin' ? (
          <>
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, styles.kpiCardWide]}>
                <Text style={styles.kpiLabel}>Total Revenue</Text>
                <Text style={[styles.kpiValue, { color: colors.success }]}>
                  Rs. {Number(data?.total_income || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Expenses</Text>
                <Text style={[styles.kpiValueSmall, { color: colors.danger }]}>
                  Rs. {Number(data?.total_expense || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={[styles.highlightCard, { backgroundColor: net >= 0 ? colors.successSoft : colors.dangerSoft }]}>
              <Text style={styles.highlightLabel}>Net Balance</Text>
              <Text style={[styles.highlightValue, { color: net >= 0 ? colors.success : colors.danger }]}>
                {net >= 0 ? '+' : '-'}Rs. {Math.abs(net).toLocaleString()}
              </Text>
              <Text style={styles.highlightSub}>{net >= 0 ? 'Operating healthy this period' : 'Expenses are running high'}</Text>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Income vs Expense</Text>
              <Text style={styles.chartSub}>Recent monthly movement</Text>
              {monthlyChart ? (
                <LineChart
                  data={monthlyChart}
                  width={screenWidth}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  withInnerLines={false}
                  withOuterLines={false}
                  legend={monthlyChart.legend}
                />
              ) : (
                <View style={styles.noDataBox}>
                  <Text style={styles.noDataText}>No transaction data yet</Text>
                </View>
              )}
            </View>

            {!!data?.vendors?.length && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.chartTitle}>Vendor Directory</Text>
                  <View style={styles.pill}><Text style={styles.pillText}>{data.vendors.length}</Text></View>
                </View>
                {data.vendors.slice(0, 5).map((vendor, i) => (
                  <View key={vendor.id || i} style={styles.listRow}>
                    <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
                      <Text style={styles.rowIconText}>V</Text>
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{vendor.name}</Text>
                      <Text style={styles.rowSub}>{vendor.contact || vendor.phone || 'No contact info'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!!data?.recent_transactions?.length && (
              <View style={styles.card}>
                <Text style={styles.chartTitle}>Recent Transactions</Text>
                {data.recent_transactions.slice(0, 5).map((tx, i) => (
                  <View key={tx.id || i} style={styles.listRow}>
                    <View style={[styles.rowIcon, { backgroundColor: tx.type === 'income' ? colors.successSoft : colors.dangerSoft }]}>
                      <Text style={styles.rowIconText}>{tx.type === 'income' ? '+' : '-'}</Text>
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{tx.category}</Text>
                      <Text style={styles.rowSub}>{tx.date}</Text>
                    </View>
                    <Text style={[styles.amountText, { color: tx.type === 'income' ? colors.success : colors.danger }]}>
                      {tx.type === 'income' ? '+' : '-'} Rs. {Number(tx.amount).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Pending</Text>
                <Text style={[styles.kpiValueSmall, { color: colors.danger }]}>{data?.pending_count || 0}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>In Progress</Text>
                <Text style={[styles.kpiValueSmall, { color: colors.info }]}>{data?.in_progress_count || 0}</Text>
              </View>
            </View>

            <View style={[styles.highlightCard, { backgroundColor: colors.successSoft }]}>
              <Text style={styles.highlightLabel}>Completed</Text>
              <Text style={[styles.highlightValue, { color: colors.success }]}>{data?.completed_count || 0}</Text>
              <Text style={styles.highlightSub}>Tasks closed successfully</Text>
            </View>

            {taskChart && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Task Overview</Text>
                <Text style={styles.chartSub}>Status breakdown</Text>
                <BarChart
                  data={taskChart}
                  width={screenWidth}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  withInnerLines={false}
                  showValuesOnTopOfBars
                  fromZero
                />
              </View>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { marginTop: 10, marginBottom: 22 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 },
  greeting: { fontSize: 30, fontWeight: '900', color: colors.text },
  subGreeting: { fontSize: 14, color: colors.textSoft, marginTop: 8, lineHeight: 22, maxWidth: 320 },

  kpiGrid: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  kpiCardWide: { flex: 1.3 },
  kpiLabel: { fontSize: 11, color: colors.textSoft, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  kpiValue: { fontSize: 24, fontWeight: '900' },
  kpiValueSmall: { fontSize: 22, fontWeight: '900' },

  highlightCard: {
    padding: 22,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlightLabel: { fontSize: 11, color: colors.textSoft, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  highlightValue: { fontSize: 30, fontWeight: '900', marginTop: 6 },
  highlightSub: { fontSize: 13, color: colors.textSoft, marginTop: 6 },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pill: { backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  pillText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  chartTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  chartSub: { fontSize: 13, color: colors.textMuted, marginBottom: 12, marginTop: 4 },
  chart: { borderRadius: 20, marginTop: 8 },
  noDataBox: { height: 100, justifyContent: 'center', alignItems: 'center' },
  noDataText: { color: colors.textMuted, fontSize: 14 },

  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3EEE7' },
  rowIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowIconText: { color: colors.primary, fontWeight: '800' },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  amountText: { fontSize: 14, fontWeight: '800', marginLeft: 10 },
});
