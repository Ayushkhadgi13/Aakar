import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

export default function DashboardScreen() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      if (user?.role === 'admin') {
        const res = await api.get('/finance/summary');
        setData(res.data);
      } else {
        const res = await api.get('/tasks/stats');
        setData(res.data);
      }
    } catch (e) {
      console.log(e);
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name.split(' ')[0]} 👋</Text>
        <Text style={styles.subGreeting}>Here is your daily summary</Text>
      </View>

      <View style={styles.kpiContainer}>
        {user?.role === 'admin' ? (
          <>
            <KpiCard title="Total Revenue" value={`Rs. ${data?.total_income?.toLocaleString() || 0}`} color="#10B981" />
            <KpiCard title="Total Expenses" value={`Rs. ${data?.total_expense?.toLocaleString() || 0}`} color="#EF4444" />
          </>
        ) : (
          <>
            <KpiCard title="Pending Tasks" value={data?.pending_count || 0} color="#EF4444" />
            <KpiCard title="In Progress" value={data?.in_progress_count || 0} color="#3B82F6" />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const KpiCard = ({ title, value, color }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={[styles.cardValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB', padding: 20 },
  header: { marginBottom: 20, marginTop: 40 },
  greeting: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subGreeting: { fontSize: 14, color: '#64748B', marginTop: 5 },
  kpiContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  card: { backgroundColor: '#fff', width: '48%', padding: 20, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 12, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  cardValue: { fontSize: 20, fontWeight: '800' },
});