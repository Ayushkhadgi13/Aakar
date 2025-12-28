<template>
  <div class="analytics-container">
    <!-- TOP HEADER -->
    <header class="analytics-header">
      <div class="title-group">
        <h1>Financial Analytics</h1>
        <p>Detailed overview of Aakar Construction's financial situation</p>
      </div>
      <div class="action-group">
        <button @click="showVendorModal = true" class="btn-outline">Manage Vendors</button>
        <button @click="showTransactionModal = true" class="btn-primary">+ Add Transaction</button>
      </div>
    </header>

    <!-- TOP STAT CARDS -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="card-header">
          <span>Total Balance</span>
          <span class="currency-tag">NPR</span>
        </div>
        <h2>Rs. {{ summary?.total_balance.toLocaleString() }}</h2>
        <div class="card-footer success">
          <span class="trend">↑ 12%</span> vs last month
        </div>
      </div>

      <div class="stat-card">
        <div class="card-header">
          <span>Total Income</span>
          <span class="currency-tag">NPR</span>
        </div>
        <h2>Rs. {{ summary?.total_income.toLocaleString() }}</h2>
        <div class="card-footer success">
          <span class="trend">↑ 8%</span> vs last month
        </div>
      </div>

      <div class="stat-card">
        <div class="card-header">
          <span>Total Expense</span>
          <span class="currency-tag">NPR</span>
        </div>
        <h2>Rs. {{ summary?.total_expense.toLocaleString() }}</h2>
        <div class="card-footer danger">
          <span class="trend">↑ 2.4%</span> vs last month
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT GRID -->
    <div class="main-grid">
      <div class="charts-column">
        <div class="chart-card line-chart-box">
          <div class="chart-header">
            <h3>Balance Overview</h3>
            <select class="small-select"><option>This year</option></select>
          </div>
          <div class="visual-placeholder line-viz">
            <div class="line-path"></div>
          </div>
        </div>

        <div class="chart-card bar-chart-box">
          <div class="chart-header">
            <h3>Budget vs Expense</h3>
            <div class="legend">
              <span class="dot income"></span> Income <span class="dot expense"></span> Expense
            </div>
          </div>
          <div class="bar-container">
            <div v-for="stat in summary?.monthly_stats" :key="stat.month" class="bar-group">
              <div class="bars">
                <div class="bar inc" :style="{ height: (stat.income / 1000) + 'px' }"></div>
                <div class="bar exp" :style="{ height: (stat.expense / 1000) + 'px' }"></div>
              </div>
              <span class="month-label">{{ stat.month.substring(0,3) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="side-column">
        <div class="chart-card stats-box">
          <h3>Expense Statistics</h3>
          <div class="donut-container">
            <div class="donut-ring">
              <div class="donut-center">
                <small>Total Exp</small>
                <strong>{{ summary?.total_expense }}</strong>
              </div>
            </div>
          </div>
          <div class="category-list">
            <div v-for="cat in summary?.category_breakdown" :key="cat.category" class="cat-item">
              <div class="cat-info">
                <span class="dot" :style="{ backgroundColor: getRandomColor() }"></span>
                <span class="cat-name">{{ cat.category }}</span>
              </div>
              <span class="cat-val">Rs. {{ parseFloat(cat.total).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <div class="chart-card recent-box">
          <h3>Recent Activities</h3>
          <div class="mini-list">
            <div v-for="t in summary?.recent_transactions" :key="t.id" class="list-row">
              <div class="list-main">
                <span class="list-title">{{ t.category }}</span>
                <small>{{ t.vendor?.name || 'Internal' }}</small>
              </div>
              <span :class="['list-amt', t.type]">
                {{ t.type === 'income' ? '+' : '-' }} {{ t.amount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MONTHLY REPORTS TABLE SECTION -->
    <section class="reports-section">
      <div class="chart-card">
        <div class="chart-header">
          <h3>Monthly Historical Reports</h3>
          <p class="report-hint">Automatically generated on the 1st of every month</p>
        </div>

        <div v-if="reports.length === 0" class="no-reports">
          No monthly reports have been generated yet.
        </div>

        <table v-else class="report-table">
          <thead>
            <tr>
              <th>Report Period</th>
              <th>Total Income</th>
              <th>Total Expense</th>
              <th>Net Balance</th>
              <th>Top Category</th>
              <th>Activity Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in reports" :key="report.id">
              <td class="period-cell">{{ report.report_month }}</td>
              <td class="income-cell">Rs. {{ parseFloat(report.total_income).toLocaleString() }}</td>
              <td class="expense-cell">Rs. {{ parseFloat(report.total_expense).toLocaleString() }}</td>
              <td :class="['balance-cell', report.net_balance >= 0 ? 'pos' : 'neg']">
                Rs. {{ parseFloat(report.net_balance).toLocaleString() }}
              </td>
              <td>{{ report.top_expense_category }}</td>
              <td>{{ report.transaction_count }} entries</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MODALS -->
    <div v-if="showTransactionModal" class="modal-overlay">
      <div class="modal-content">
        <h3>New Transaction</h3>
        <form @submit.prevent="saveTransaction">
          <div class="form-row">
            <div class="f-group">
              <label>Type</label>
              <select v-model="formT.type" required>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div class="f-group">
              <label>Amount</label>
              <input type="number" v-model="formT.amount" required />
            </div>
          </div>
          <label>Category</label>
          <input type="text" v-model="formT.category" placeholder="Salary, Materials, etc." required />
          <label>Date</label>
          <input type="date" v-model="formT.date" required />
          <div class="modal-btns">
            <button type="submit" class="btn-primary">Add Now</button>
            <button type="button" @click="showTransactionModal = false" class="btn-outline">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const summary = ref(null);
const transactions = ref([]);
const vendors = ref([]);
const reports = ref([]);
const showTransactionModal = ref(false);
const showVendorModal = ref(false);

const formT = ref({ type: 'expense', amount: '', category: '', date: new Date().toISOString().split('T')[0], vendor_id: null });

const loadData = async () => {
  try {
    const [sum, trans, vends, reps] = await Promise.all([
      axios.get('/finance/summary'),
      axios.get('/finance/transactions'),
      axios.get('/finance/vendors'),
      axios.get('/finance/reports')
    ]);
    summary.value = sum.data;
    transactions.value = trans.data;
    vendors.value = vends.data;
    reports.value = reps.data;
  } catch (err) {
    console.error("Failed to load finance data", err);
  }
};

const saveTransaction = async () => {
  await axios.post('/finance/transactions', formT.value);
  showTransactionModal.value = false;
  loadData();
};

const getRandomColor = () => {
  const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
  return colors[Math.floor(Math.random() * colors.length)];
};

onMounted(loadData);
</script>

<style scoped>
.analytics-container {
  padding: 10px;
  background: #fcfcfd;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.title-group h1 { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
.title-group p { color: #6b7280; font-size: 14px; margin-top: 5px; }

.action-group { display: flex; gap: 12px; }

/* STAT CARDS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 20px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.card-header { display: flex; justify-content: space-between; color: #6b7280; font-weight: 600; font-size: 14px; }
.currency-tag { background: #f3f4f6; padding: 2px 8px; border-radius: 6px; font-size: 10px; }
.stat-card h2 { font-size: 28px; margin: 15px 0; color: #111827; }
.card-footer { font-size: 13px; color: #9ca3af; }
.trend { font-weight: 700; margin-right: 5px; }
.success .trend { color: #10b981; }
.danger .trend { color: #ef4444; }

/* MAIN GRID */
.main-grid {
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 24px;
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid #f3f4f6;
}

.chart-header { display: flex; flex-direction: column; margin-bottom: 20px; }
.chart-header h3 { font-size: 16px; font-weight: 700; margin-bottom: 4px;}
.report-hint { font-size: 12px; color: #9ca3af; }

/* BAR CHART */
.bar-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 150px;
  padding-top: 20px;
}

.bar-group { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.bars { display: flex; gap: 4px; align-items: flex-end; }
.bar { width: 12px; border-radius: 4px; transition: 0.3s; }
.bar.inc { background: #c7d2fe; }
.bar.exp { background: #6366f1; }
.month-label { font-size: 11px; color: #9ca3af; font-weight: 600; }

/* DONUT CHART SIMULATION */
.donut-container { display: flex; justify-content: center; margin: 20px 0; }
.donut-ring {
  width: 150px; height: 150px;
  border-radius: 50%;
  border: 15px solid #f3f4f6;
  border-top-color: #6366f1;
  border-right-color: #8b5cf6;
  display: flex; align-items: center; justify-content: center;
}
.donut-center { text-align: center; }
.donut-center strong { display: block; font-size: 18px; }

.category-list { margin-top: 20px; }
.cat-item { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
.cat-info { display: flex; align-items: center; gap: 10px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }

/* RECENT LIST */
.list-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f9fafb; }
.list-title { font-weight: 600; color: #111827; display: block; font-size: 14px; }
.list-main small { color: #9ca3af; font-size: 12px; }
.list-amt { font-weight: 700; font-size: 14px; }
.list-amt.income { color: #10b981; }
.list-amt.expense { color: #111827; }

/* REPORTS TABLE */
.reports-section { margin-top: 20px; }
.report-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.report-table th { text-align: left; padding: 12px; font-size: 12px; color: #6b7280; border-bottom: 2px solid #f3f4f6; }
.report-table td { padding: 16px 12px; font-size: 14px; border-bottom: 1px solid #f9fafb; }
.period-cell { font-weight: 700; color: #111827; }
.income-cell { color: #10b981; font-weight: 600; }
.expense-cell { color: #ef4444; font-weight: 600; }
.balance-cell.pos { color: #10b981; font-weight: 800; }
.balance-cell.neg { color: #ef4444; font-weight: 800; }
.no-reports { padding: 40px; text-align: center; color: #9ca3af; font-style: italic; }

/* BUTTONS & MODALS */
.btn-primary { background: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; }
.btn-outline { background: white; border: 1px solid #e5e7eb; padding: 10px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background: white; padding: 32px; border-radius: 24px; width: 400px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
.form-row { display: flex; gap: 15px; margin-bottom: 15px; }
.f-group { flex: 1; }
input, select { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e5e7eb; margin: 8px 0 16px; }

@media (max-width: 1200px) {
  .main-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr; }
}
</style>