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
import api from '../api/axios';
import { colors, shadows } from '../theme';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (e) {
      console.log('Failed to load notifications', e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      await api.patch('/notifications/read-all');
      setNotifications([]);
    } catch (e) {
      console.log('Failed to mark notifications read', e.response?.data || e.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.data?.title || 'Notification'}</Text>
      <Text style={styles.message}>{item.data?.message || 'No details available.'}</Text>
      <Text style={styles.date}>{formatDate(item.created_at)}</Text>
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
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Inbox</Text>
            <Text style={styles.pageTitle}>Notifications</Text>
            <Text style={styles.pageSub}>Project alerts, salary notices, and team activity in one feed.</Text>
            <TouchableOpacity
              style={[styles.markButton, markingAll && styles.markButtonDisabled]}
              onPress={markAllRead}
              disabled={markingAll || notifications.length === 0}
            >
              <Text style={styles.markButtonText}>
                {markingAll ? 'Updating...' : 'Mark all read'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No new notifications.</Text>
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
  header: { marginTop: 8, marginBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 },
  pageTitle: { fontSize: 30, fontWeight: '900', color: colors.text },
  pageSub: { fontSize: 14, color: colors.textSoft, marginTop: 6, lineHeight: 21, maxWidth: 320 },
  markButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 16,
  },
  markButtonDisabled: { opacity: 0.6 },
  markButtonText: { color: colors.surface, fontSize: 13, fontWeight: '800' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 },
  message: { fontSize: 14, color: colors.textSoft, lineHeight: 21 },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 12, fontWeight: '700' },
  emptyBox: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
