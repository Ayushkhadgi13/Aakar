<template>
  <div class="employees-page">
    <header class="page-header">
      <div class="header-left">
        <span class="eyebrow">Reporting workspace</span>
        <h1>Monthly Reports</h1>
        <p>Review the auto-generated financial snapshot for each closed month.</p>
      </div>
      <div class="header-right">
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
          </tr>
        </thead>
        <tbody>
          <tr v-if="reports.length === 0">
            <td colspan="6" class="text-center">No monthly reports generated yet.</td>
          </tr>
          <tr v-for="report in reports" :key="`${report.year}-${report.month_number}`">
            <td><strong>{{ report.report_month }}</strong></td>
            <td>Rs. {{ formatMoney(report.income) }}</td>
            <td>Rs. {{ formatMoney(report.expense) }}</td>
            <td :class="{ positive: report.balance >= 0, negative: report.balance < 0 }">Rs. {{ formatMoney(report.balance) }}</td>
            <td>{{ report.top_category || 'N/A' }}</td>
            <td>{{ report.transaction_count }}</td>
          </tr>
        </tbody>
      </table>
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

const formatMoney = (value) => Number(value || 0).toLocaleString();

const fetchReports = async () => {
  await loadUser();
  if (!isAdmin.value) {
    router.push('/dashboard');
    return;
  }

  const response = await axios.get('/reports/monthly');
  reports.value = response.data;
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

.table-container { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; }
.table-header { padding: 22px 24px 18px; border-bottom: 1px solid var(--border); }
.table-header h2 { margin: 0 0 6px 0; font-size: 1.05rem; color: var(--text-main); font-weight: 700; }
.table-header p { margin: 0; color: var(--text-secondary); font-size: 0.88rem; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: color-mix(in srgb, var(--bg-surface) 72%, var(--bg-input) 28%); color: var(--text-secondary); padding: 16px 24px; text-align: left; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
.data-table td { padding: 18px 24px; border-bottom: 1px solid var(--border); color: var(--text-body); font-size: 0.95rem; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: color-mix(in srgb, var(--bg-surface) 75%, var(--bg-input) 25%); }
.text-center { text-align: center; color: var(--text-muted); }
.positive { color: #059669; }
.negative { color: #dc2626; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 900px) {
  .page-header { flex-direction: column; align-items: stretch; }
}

@media (max-width: 768px) {
  .employees-page { padding: 24px 20px; }
  .data-table th,
  .data-table td { padding-left: 16px; padding-right: 16px; }
}
</style>
