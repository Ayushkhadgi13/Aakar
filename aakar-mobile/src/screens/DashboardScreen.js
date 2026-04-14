import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, Dimensions, ActivityIndicator
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const screenWidth = Dimensions.get('window').width - 40;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(166, 93, 67, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#A65D43' },
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

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#A65D43" />
      </View>
    );
  }

  const buildMonthlyChart = () => {
    const transactions = data?.recent_transactions || [];
    const months = {};
    transactions.forEach(tx => {
      const month = tx.date?.slice(0, 7);
      if (!month) return;
      if (!months[month]) months[month] = { income: 0, expense: 0 };
      if (tx.type === 'income') months[month].income += Number(tx.amount);
      else months[month].expense += Number(tx.amount);
    });
    const keys = Object.keys(months).sort().slice(-5);
    if (keys.length === 0) return null;
    return {
      labels: keys.map(k => k.slice(5)),
      datasets: [
        { data: keys.map(k => months[k].income), color: (o = 1) => `rgba(16,185,129,${o})`, strokeWidth: 2 },
        { data: keys.map(k => months[k].expense), color: (o = 1) => `rgba(239,68,68,${o})`, strokeWidth: 2 },
      ],
      legend: ['Income', 'Expense'],
    };
  };

  const buildTaskChart = () => {
    if (!data) return null;
    return {
      labels: ['Pending', 'In Progress', 'Done'],
      datasets: [{
        data: [
          data.pending_count || 0,
          data.in_progress_count || 0,
          data.completed_count || 0,
        ],
      }],
    };
  };

  const monthlyChart = user?.role === 'admin' ? buildMonthlyChart() : null;
  const taskChart = user?.role !== 'admin' ? buildTaskChart() : null;
  const net = (data?.total_income || 0) - (data?.total_expense || 0);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A65D43" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
        <Text style={styles.subGreeting}>Here is your daily summary</Text>
      </View>

      {user?.role === 'admin' ? (
        <>
          {/* KPI Cards */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: '#10B981' }]}>
              <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
              <Text style={[styles.kpiValue, { color: '#10B981' }]}>
                Rs. {Number(data?.total_income || 0).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: '#EF4444' }]}>
              <Text style={styles.kpiLabel}>TOTAL EXPENSES</Text>
              <Text style={[styles.kpiValue, { color: '#EF4444' }]}>
                Rs. {Number(data?.total_expense || 0).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Net Balance */}
          <View style={[styles.netCard, { backgroundColor: net >= 0 ? '#ECFDF5' : '#FEF2F2' }]}>
            <Text style={styles.netLabel}>NET BALANCE</Text>
            <Text style={[styles.netValue, { color: net >= 0 ? '#10B981' : '#EF4444' }]}>
              {net >= 0 ? '+' : ''}Rs. {Math.abs(net).toLocaleString()}
            </Text>
            <Text style={styles.netSub}>{net >= 0 ? 'Profitable' : 'Over Budget'}</Text>
          </View>

          {/* Monthly Chart */}
          {monthlyChart ? (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Income vs Expense</Text>
              <Text style={styles.chartSub}>Last {monthlyChart.labels.length} months</Text>
              <LineChart
                data={monthlyChart}
                width={screenWidth}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
                legend={monthlyChart.legend}
              />
            </View>
          ) : (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Income vs Expense</Text>
              <View style={styles.noDataBox}>
                <Text style={styles.noDataText}>No transaction data yet</Text>
              </View>
            </View>
          )}

          {/* Vendors */}
          {data?.vendors?.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Vendors</Text>
              <Text style={styles.chartSub}>{data.vendors.length} registered vendors</Text>
              {data.vendors.slice(0, 5).map((vendor, i) => (
                <View key={vendor.id || i} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Text>🏢</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txCat}>{vendor.name}</Text>
                    <Text style={styles.txDate}>{vendor.contact || vendor.phone || 'No contact info'}</Text>
                  </View>
                  <View style={styles.vendorBadge}>
                    <Text style={styles.vendorBadgeText}>Active</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Recent Transactions */}
          {data?.recent_transactions?.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Recent Transactions</Text>
              {data.recent_transactions.slice(0, 5).map((tx, i) => (
                <View key={tx.id || i} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? '#ECFDF5' : '#FEF2F2' }]}>
                    <Text>{tx.type === 'income' ? '↑' : '↓'}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txCat}>{tx.category}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'income' ? '#10B981' : '#EF4444' }]}>
                    {tx.type === 'income' ? '+' : '-'} Rs. {Number(tx.amount).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          {/* Employee KPI Cards */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: '#EF4444' }]}>
              <Text style={styles.kpiLabel}>PENDING</Text>
              <Text style={[styles.kpiValue, { color: '#EF4444' }]}>{data?.pending_count || 0}</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: '#3B82F6' }]}>
              <Text style={styles.kpiLabel}>IN PROGRESS</Text>
              <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>{data?.in_progress_count || 0}</Text>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: '#10B981', width: '100%' }]}>
              <Text style={styles.kpiLabel}>COMPLETED</Text>
              <Text style={[styles.kpiValue, { color: '#10B981' }]}>{data?.completed_count || 0}</Text>
            </View>
          </View>

          {/* Task Bar Chart */}
          {taskChart && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Task Overview</Text>
              <Text style={styles.chartSub}>Status breakdown</Text>
              <BarChart
                data={taskChart}
                width={screenWidth}
                height={200}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(166, 93, 67, ${opacity})`,
                }}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB', paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginTop: 60, marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subGreeting: { fontSize: 14, color: '#64748B', marginTop: 4 },

  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  kpiCard: {
    backgroundColor: '#fff', width: '48%', padding: 18,
    borderRadius: 16, borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  kpiLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  kpiValue: { fontSize: 22, fontWeight: '800' },

  netCard: {
    padding: 20, borderRadius: 16, marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  netLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', letterSpacing: 1 },
  netValue: { fontSize: 28, fontWeight: '900', marginTop: 4 },
  netSub: { fontSize: 12, color: '#94A3B8', marginTop: 4 },

  chartCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  chartSub: { fontSize: 12, color: '#94A3B8', marginBottom: 12, marginTop: 2 },
  chart: { borderRadius: 12, marginTop: 8 },
  noDataBox: { height: 80, justifyContent: 'center', alignItems: 'center' },
  noDataText: { color: '#94A3B8', fontSize: 14 },

  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  txIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txCat: { fontSize: 14, fontWeight: '600', color: '#111827' },
  txDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },

  vendorBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  vendorBadgeText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
});