<template>
  <div class="employees-page">
    <header class="page-header">
      <div class="header-left">
        <span class="eyebrow">Reporting workspace</span>
        <h1>Monthly Reports</h1>
        <p>Review the auto-generated financial snapshot for each closed month.</p>
      </div>
      <div class="header-right">
        <button class="btn primary" @click="generateReports" :disabled="isGenerating">
          {{ isGenerating ? 'Generating...' : 'Generate Latest Report' }}
        </button>
        <div class="header-stats">
          <div class="stat-chip">
            <span class="stat-label">Reports</span>
            <strong>{{ reports.length }}</strong>
          </div>
        </div>
      </div>
    </header>

    <div class="table-container">
      <div class="table-header">
        <div>
          <h2>Archive</h2>
          <p>Generated from the previous month transaction history.</p>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Income</th>
            <th>Expense</th>
            <th>Balance</th>
            <th>Top Category</th>
            <th>Transactions</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="reports.length === 0">
            <td colspan="7" class="text-center">No monthly reports generated yet.</td>
          </tr>
          <tr
            v-for="report in reports"
            :key="`${report.year}-${report.month_number}`"
            class="clickable-row"
            @click="openReport(report)"
          >
            <td><strong>{{ report.report_month }}</strong></td>
            <td>Rs. {{ formatMoney(report.income) }}</td>
            <td>Rs. {{ formatMoney(report.expense) }}</td>
            <td :class="{ positive: report.balance >= 0, negative: report.balance < 0 }">Rs. {{ formatMoney(report.balance) }}</td>
            <td>{{ report.top_category || 'N/A' }}</td>
            <td>{{ report.transaction_count }}</td>
            <td>
              <button class="link-btn" @click.stop="openReport(report)">More info</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selectedReport" class="modal-backdrop" @click.self="closeReport">
      <section class="report-modal">
        <header class="modal-header">
          <div>
            <span class="eyebrow">Detailed report</span>
            <h2>{{ selectedReport.report_month }}</h2>
            <p>Full financial activity for this month.</p>
          </div>
          <button class="close-btn" @click="closeReport" aria-label="Close report details">x</button>
        </header>

        <div v-if="isLoadingDetails" class="detail-loading">Loading full report details...</div>
        <template v-else>
          <div class="summary-grid">
            <div class="summary-card">
              <span>Income</span>
              <strong class="positive">Rs. {{ formatMoney(selectedReport.income) }}</strong>
            </div>
            <div class="summary-card">
              <span>Expense</span>
              <strong class="negative">Rs. {{ formatMoney(selectedReport.expense) }}</strong>
            </div>
            <div class="summary-card">
              <span>Balance</span>
              <strong :class="{ positive: selectedReport.balance >= 0, negative: selectedReport.balance < 0 }">
                Rs. {{ formatMoney(selectedReport.balance) }}
              </strong>
            </div>
            <div class="summary-card">
              <span>Transactions</span>
              <strong>{{ selectedReport.transaction_count }}</strong>
            </div>
          </div>

          <div class="detail-sections">
            <section class="detail-panel">
              <h3>By Type</h3>
              <div v-for="item in reportDetails.type_breakdown" :key="item.type" class="breakdown-row">
                <span>{{ formatLabel(item.type) }} | {{ item.transaction_count }} tx</span>
                <strong>Rs. {{ formatMoney(item.total) }}</strong>
              </div>
              <p v-if="!reportDetails.type_breakdown?.length" class="empty-copy">No type data found.</p>
            </section>

            <section class="detail-panel">
              <h3>By Category</h3>
              <div v-for="item in reportDetails.category_breakdown" :key="item.category" class="breakdown-row">
                <span>{{ item.category || 'Uncategorized' }} | {{ item.transaction_count }} tx</span>
                <strong>Rs. {{ formatMoney(item.total) }}</strong>
              </div>
              <p v-if="!reportDetails.category_breakdown?.length" class="empty-copy">No category data found.</p>
            </section>

            <section class="detail-panel wide">
              <h3>By Project</h3>
              <div v-for="item in reportDetails.project_breakdown" :key="item.project_name" class="breakdown-row">
                <span>{{ item.project_name }} | {{ item.transaction_count }} tx</span>
                <strong>Rs. {{ formatMoney(item.total) }}</strong>
              </div>
              <p v-if="!reportDetails.project_breakdown?.length" class="empty-copy">No project data found.</p>
            </section>
          </div>

          <section class="transactions-panel">
            <h3>All Transactions</h3>
            <div class="transaction-list">
              <article v-for="transaction in reportDetails.transactions" :key="transaction.id" class="transaction-row">
                <div>
                  <strong>{{ transaction.category || 'Uncategorized' }}</strong>
                  <span>{{ transaction.description || 'No description' }}</span>
                  <small>
                    {{ transaction.date }} | {{ formatLabel(transaction.type) }}
                    <template v-if="transaction.project?.name"> | {{ transaction.project.name }}</template>
                    <template v-if="transaction.vendor?.name"> | {{ transaction.vendor.name }}</template>
                  </small>
                </div>
                <strong :class="{ positive: transaction.type === 'income', negative: transaction.type !== 'income' }">
                  {{ transaction.type === 'income' ? '+' : '-' }} Rs. {{ formatMoney(transaction.amount) }}
                </strong>
              </article>
              <p v-if="!reportDetails.transactions?.length" class="empty-copy">No transactions found for this report month.</p>
            </div>
          </section>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useAuth } from '../useAuth';

const router = useRouter();
const { isAdmin, loadUser } = useAuth();
const reports = ref([]);
const isGenerating = ref(false);
const isLoadingDetails = ref(false);
const selectedReport = ref(null);
const reportDetails = ref({
  category_breakdown: [],
  type_breakdown: [],
  project_breakdown: [],
  transactions: [],
});

const formatMoney = (value) => Number(value || 0).toLocaleString();
const formatLabel = (value) => String(value || 'N/A').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const fetchReports = async () => {
  await loadUser();
  if (!isAdmin.value) {
    router.push('/dashboard');
    return;
  }

  const response = await axios.get('/reports/monthly');
  reports.value = response.data;
};

const generateReports = async () => {
  isGenerating.value = true;
  try {
    const response = await axios.post('/reports/monthly/generate');
    reports.value = response.data.reports || [];
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to generate monthly reports.');
  } finally {
    isGenerating.value = false;
  }
};

const openReport = async (report) => {
  selectedReport.value = report;
  isLoadingDetails.value = true;
  reportDetails.value = {
    category_breakdown: [],
    type_breakdown: [],
    project_breakdown: [],
    transactions: [],
  };

  try {
    const response = await axios.get(`/reports/monthly/${report.id}`);
    selectedReport.value = response.data.report || report;
    reportDetails.value = {
      category_breakdown: response.data.category_breakdown || [],
      type_breakdown: response.data.type_breakdown || [],
      project_breakdown: response.data.project_breakdown || [],
      transactions: response.data.transactions || [],
    };
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to load report details.');
    selectedReport.value = null;
  } finally {
    isLoadingDetails.value = false;
  }
};

const closeReport = () => {
  selectedReport.value = null;
};

onMounted(fetchReports);
</script>

<style scoped>
.employees-page { padding: 40px; max-width: 1280px; margin: 0 auto; animation: fadeIn 0.3s ease-out; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 32px; }
.eyebrow { display: inline-block; margin-bottom: 10px; color: var(--primary); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.header-left h1 { color: var(--text-main); font-size: 2.15rem; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.04em; }
.header-left p { color: var(--text-secondary); margin: 0; font-size: 0.98rem; max-width: 540px; }
.header-right { display: flex; align-items: center; gap: 14px; }
.header-stats { display: flex; gap: 12px; }
.stat-chip { min-width: 122px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-surface); display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.stat-chip strong { font-size: 1.1rem; color: var(--text-main); line-height: 1; }
.btn { padding: 0 18px; height: 44px; border-radius: 12px; border: none; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: 0.2s; }
.btn.primary { background: var(--primary); color: white; }
.btn:disabled { opacity: 0.7; cursor: wait; }

.table-container { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; }
.table-header { padding: 22px 24px 18px; border-bottom: 1px solid var(--border); }
.table-header h2 { margin: 0 0 6px 0; font-size: 1.05rem; color: var(--text-main); font-weight: 700; }
.table-header p { margin: 0; color: var(--text-secondary); font-size: 0.88rem; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: color-mix(in srgb, var(--bg-surface) 72%, var(--bg-input) 28%); color: var(--text-secondary); padding: 16px 24px; text-align: left; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
.data-table td { padding: 18px 24px; border-bottom: 1px solid var(--border); color: var(--text-body); font-size: 0.95rem; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: color-mix(in srgb, var(--bg-surface) 75%, var(--bg-input) 25%); }
.clickable-row { cursor: pointer; }
.link-btn { border: none; background: transparent; color: var(--primary); font-weight: 800; cursor: pointer; padding: 0; }
.text-center { text-align: center; color: var(--text-muted); }
.positive { color: #059669; }
.negative { color: #dc2626; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.52); z-index: 40; display: flex; align-items: center; justify-content: center; padding: 24px; }
.report-modal { width: min(1080px, 100%); max-height: 88vh; overflow: auto; background: var(--bg-surface); border-radius: 18px; border: 1px solid var(--border); box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24); padding: 26px; }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 22px; }
.modal-header h2 { margin: 0 0 6px; color: var(--text-main); font-size: 1.7rem; }
.modal-header p { margin: 0; color: var(--text-secondary); }
.close-btn { width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-input); color: var(--text-main); font-size: 1.5rem; line-height: 1; cursor: pointer; }
.detail-loading { padding: 36px; text-align: center; color: var(--text-secondary); font-weight: 700; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.summary-card { border: 1px solid var(--border); border-radius: 12px; padding: 16px; background: color-mix(in srgb, var(--bg-surface) 74%, var(--bg-input) 26%); display: flex; flex-direction: column; gap: 8px; }
.summary-card span { color: var(--text-secondary); font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; }
.summary-card strong { color: var(--text-main); font-size: 1.1rem; }
.detail-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
.detail-panel, .transactions-panel { border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
.detail-panel.wide { grid-column: 1 / -1; }
.detail-panel h3, .transactions-panel h3 { margin: 0 0 14px; color: var(--text-main); font-size: 1rem; }
.breakdown-row, .transaction-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.breakdown-row:last-child, .transaction-row:last-child { border-bottom: none; }
.breakdown-row span { color: var(--text-secondary); }
.breakdown-row strong { color: var(--text-main); white-space: nowrap; }
.transaction-list { display: flex; flex-direction: column; }
.transaction-row div { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.transaction-row div strong { color: var(--text-main); }
.transaction-row span { color: var(--text-secondary); }
.transaction-row small { color: var(--text-muted); }
.transaction-row > strong { white-space: nowrap; }
.empty-copy { margin: 0; color: var(--text-muted); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 900px) {
  .page-header { flex-direction: column; align-items: stretch; }
}

@media (max-width: 768px) {
  .employees-page { padding: 24px 20px; }
  .data-table th,
  .data-table td { padding-left: 16px; padding-right: 16px; }
  .modal-backdrop { align-items: stretch; padding: 12px; }
  .report-modal { max-height: calc(100vh - 24px); padding: 20px; }
  .summary-grid,
  .detail-sections { grid-template-columns: 1fr; }
  .transaction-row { flex-direction: column; }
}
</style>
