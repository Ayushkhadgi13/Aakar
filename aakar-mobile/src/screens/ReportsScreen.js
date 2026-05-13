import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import api from '../api/axios';
import { colors, shadows } from '../theme';

const emptyDetails = {
  category_breakdown: [],
  type_breakdown: [],
  project_breakdown: [],
  transactions: [],
};

const money = (value) => Number(value || 0).toLocaleString();
const label = (value) => String(value || 'N/A').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [details, setDetails] = useState(emptyDetails);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/monthly');
      setReports(res.data || []);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to load reports.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReports = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post('/reports/monthly/generate');
      setReports(res.data?.reports || []);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to generate reports.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openReport = async (report) => {
    setSelectedReport(report);
    setDetails(emptyDetails);
    setIsLoadingDetails(true);

    try {
      const res = await api.get(`/reports/monthly/${report.id}`);
      setSelectedReport(res.data?.report || report);
      setDetails({
        category_breakdown: res.data?.category_breakdown || [],
        type_breakdown: res.data?.type_breakdown || [],
        project_breakdown: res.data?.project_breakdown || [],
        transactions: res.data?.transactions || [],
      });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to load report details.');
      setSelectedReport(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeReport = () => {
    setSelectedReport(null);
    setDetails(emptyDetails);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Reporting workspace</Text>
          <Text style={styles.pageTitle}>Monthly Reports</Text>
          <Text style={styles.pageSub}>Open any month to see full totals, breakdowns, projects, and transactions.</Text>
        </View>

        <TouchableOpacity style={[styles.generateButton, isGenerating && styles.disabledButton]} onPress={generateReports} disabled={isGenerating}>
          <Text style={styles.generateButtonText}>{isGenerating ? 'Generating...' : 'Generate Latest Report'}</Text>
        </TouchableOpacity>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Archive</Text>
            <Text style={styles.sectionMeta}>{reports.length} reports</Text>
          </View>

          {reports.length === 0 ? (
            <Text style={styles.emptyText}>No monthly reports generated yet.</Text>
          ) : (
            reports.map((report) => (
              <TouchableOpacity key={report.id} style={styles.reportRow} onPress={() => openReport(report)} activeOpacity={0.82}>
                <View style={styles.reportMain}>
                  <Text style={styles.reportMonth}>{report.report_month}</Text>
                  <Text style={styles.reportMeta}>{report.top_category || 'N/A'} | {report.transaction_count} transactions</Text>
                </View>
                <View style={styles.reportRight}>
                  <Text style={[styles.balanceText, report.balance >= 0 ? styles.positive : styles.negative]}>Rs. {money(report.balance)}</Text>
                  <Text style={styles.moreInfo}>More info</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      <Modal visible={!!selectedReport} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeReport}>
        <SafeAreaView style={styles.modalSafeArea}>
          <ScrollView style={styles.modalContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBlock}>
                <Text style={styles.eyebrow}>Detailed report</Text>
                <Text style={styles.modalTitle}>{selectedReport?.report_month}</Text>
                <Text style={styles.pageSub}>Full financial activity for this month.</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeReport}>
                <X color={colors.text} size={20} />
              </TouchableOpacity>
            </View>

            {isLoadingDetails ? (
              <View style={styles.detailLoading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Loading full report details...</Text>
              </View>
            ) : (
              <>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Income</Text>
                    <Text style={[styles.summaryValue, styles.positive]}>Rs. {money(selectedReport?.income)}</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Expense</Text>
                    <Text style={[styles.summaryValue, styles.negative]}>Rs. {money(selectedReport?.expense)}</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Balance</Text>
                    <Text style={[styles.summaryValue, selectedReport?.balance >= 0 ? styles.positive : styles.negative]}>Rs. {money(selectedReport?.balance)}</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Transactions</Text>
                    <Text style={styles.summaryValue}>{selectedReport?.transaction_count || 0}</Text>
                  </View>
                </View>

                <Breakdown title="By Type" items={details.type_breakdown} nameKey="type" />
                <Breakdown title="By Category" items={details.category_breakdown} nameKey="category" />
                <Breakdown title="By Project" items={details.project_breakdown} nameKey="project_name" />

                <View style={styles.detailCard}>
                  <Text style={styles.sectionTitle}>All Transactions</Text>
                  {details.transactions.length === 0 ? (
                    <Text style={styles.emptyText}>No transactions found for this report month.</Text>
                  ) : (
                    details.transactions.map((transaction) => (
                      <View key={transaction.id} style={styles.transactionRow}>
                        <View style={styles.transactionMain}>
                          <Text style={styles.transactionTitle}>{transaction.category || 'Uncategorized'}</Text>
                          <Text style={styles.transactionDescription}>{transaction.description || 'No description'}</Text>
                          <Text style={styles.transactionMeta}>
                            {transaction.date} | {label(transaction.type)}
                            {transaction.project?.name ? ` | ${transaction.project.name}` : ''}
                            {transaction.vendor?.name ? ` | ${transaction.vendor.name}` : ''}
                          </Text>
                        </View>
                        <Text style={[styles.transactionAmount, transaction.type === 'income' ? styles.positive : styles.negative]}>
                          {transaction.type === 'income' ? '+' : '-'} Rs. {money(transaction.amount)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Breakdown({ title, items, nameKey }) {
  return (
    <View style={styles.detailCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No data found.</Text>
      ) : (
        items.map((item, index) => (
          <View key={`${item[nameKey]}-${index}`} style={styles.breakdownRow}>
            <Text style={styles.breakdownName}>{nameKey === 'type' ? label(item[nameKey]) : item[nameKey] || 'N/A'} | {item.transaction_count} tx</Text>
            <Text style={styles.breakdownTotal}>Rs. {money(item.total)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  modalSafeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  modalContainer: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { marginTop: 8, marginBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 },
  pageTitle: { fontSize: 30, fontWeight: '900', color: colors.text },
  pageSub: { fontSize: 14, color: colors.textSoft, marginTop: 6, lineHeight: 21, maxWidth: 320 },
  generateButton: { height: 48, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16, ...shadows.soft },
  generateButtonText: { color: colors.surface, fontSize: 15, fontWeight: '900' },
  disabledButton: { opacity: 0.7 },
  listCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 18, ...shadows.card },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
  sectionMeta: { color: colors.textMuted, fontWeight: '800', fontSize: 12 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F3EEE7' },
  reportMain: { flex: 1 },
  reportMonth: { color: colors.text, fontSize: 16, fontWeight: '900' },
  reportMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  reportRight: { alignItems: 'flex-end', justifyContent: 'center' },
  balanceText: { fontWeight: '900', fontSize: 14 },
  moreInfo: { color: colors.primary, fontSize: 12, fontWeight: '900', marginTop: 5 },
  positive: { color: colors.success },
  negative: { color: colors.danger },
  emptyText: { color: colors.textMuted, marginTop: 10, lineHeight: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 8, marginBottom: 18 },
  modalTitleBlock: { flex: 1 },
  modalTitle: { fontSize: 26, fontWeight: '900', color: colors.text },
  closeButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  detailLoading: { backgroundColor: colors.surface, borderRadius: 22, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  loadingText: { color: colors.textSoft, marginTop: 10, fontWeight: '700' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  summaryBox: { width: '47.5%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 15, ...shadows.soft },
  summaryLabel: { color: colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 },
  summaryValue: { color: colors.text, fontSize: 16, fontWeight: '900' },
  detailCard: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 18, marginTop: 14, ...shadows.card },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderColor: '#F3EEE7' },
  breakdownName: { flex: 1, color: colors.textSoft, fontWeight: '700' },
  breakdownTotal: { color: colors.text, fontWeight: '900' },
  transactionRow: { paddingVertical: 13, borderBottomWidth: 1, borderColor: '#F3EEE7' },
  transactionMain: { marginBottom: 8 },
  transactionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  transactionDescription: { color: colors.textSoft, marginTop: 4, lineHeight: 19 },
  transactionMeta: { color: colors.textMuted, fontSize: 12, marginTop: 5, lineHeight: 17 },
  transactionAmount: { fontWeight: '900' },
});
