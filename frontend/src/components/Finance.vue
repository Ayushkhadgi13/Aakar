<template>
  <div class="finance-page">
    <header class="finance-header">
      <div class="header-left">
        <span class="eyebrow">Finance workspace</span>
        <h1>Finance & Analytics</h1>
        <p>Manage procurement, track cash flow, and keep payroll operations organized.</p>
      </div>
      <div class="header-right">
        <div v-if="isAdmin && summary" class="header-stats">
          <div class="stat-chip">
            <span class="stat-label">This Period</span>
            <strong>{{ summary.activity_period_label || currentMonthLabel }}</strong>
          </div>
          <div class="stat-chip">
            <span class="stat-label">Projects</span>
            <strong>{{ projects.length }}</strong>
          </div>
        </div>
        <div v-if="isAdmin" class="action-buttons">
          <button @click="showTransactionModal = true" class="btn primary">Add Transaction</button>
        </div>
      </div>
    </header>

    <div class="filter-panel" v-if="isAdmin">
      <div class="filter-group project-filter">
        <label>Filter by Project</label>
        <div class="select-wrapper">
          <select v-model="filters.project_id" @change="loadData" class="styled-input">
            <option value="">All Projects Overview</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
      </div>
      
      <div class="filter-group">
        <label>Date From</label>
        <div class="calendar-field" @click.stop>
          <div class="custom-date-box" :class="{ open: activeCalendar === 'start' }" @click="toggleCalendar('start')">
            <span :class="{'text-placeholder': !filters.start_date}">
              {{ filters.start_date ? formatDateDisplay(filters.start_date) : 'Select Start Date' }}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div v-if="activeCalendar === 'start'" class="calendar-popout">
            <div class="calendar-header">
              <button type="button" class="calendar-nav" @click="changeCalendarMonth('start', -1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <strong>{{ getCalendarTitle('start') }}</strong>
              <button type="button" class="calendar-nav" @click="changeCalendarMonth('start', 1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
            <div class="calendar-weekdays">
              <span v-for="day in weekdayLabels" :key="day">{{ day }}</span>
            </div>
            <div class="calendar-grid">
              <button
                v-for="day in getCalendarDays('start')"
                :key="day.iso"
                type="button"
                class="calendar-day"
                :class="{ muted: !day.isCurrentMonth, selected: day.isSelected, today: day.isToday }"
                @click="selectCalendarDate('start', day.iso)"
              >
                {{ day.dayNumber }}
              </button>
            </div>
            <div class="calendar-footer">
              <button type="button" class="calendar-link" @click="clearCalendarDate('start')">Clear</button>
              <button type="button" class="calendar-link" @click="selectToday('start')">Today</button>
            </div>
          </div>
        </div>
      </div>

      <div class="filter-group">
        <label>Date To</label>
        <div class="calendar-field" @click.stop>
          <div class="custom-date-box" :class="{ open: activeCalendar === 'end' }" @click="toggleCalendar('end')">
            <span :class="{'text-placeholder': !filters.end_date}">
              {{ filters.end_date ? formatDateDisplay(filters.end_date) : 'Select End Date' }}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div v-if="activeCalendar === 'end'" class="calendar-popout">
            <div class="calendar-header">
              <button type="button" class="calendar-nav" @click="changeCalendarMonth('end', -1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <strong>{{ getCalendarTitle('end') }}</strong>
              <button type="button" class="calendar-nav" @click="changeCalendarMonth('end', 1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
            <div class="calendar-weekdays">
              <span v-for="day in weekdayLabels" :key="day">{{ day }}</span>
            </div>
            <div class="calendar-grid">
              <button
                v-for="day in getCalendarDays('end')"
                :key="day.iso"
                type="button"
                class="calendar-day"
                :class="{ muted: !day.isCurrentMonth, selected: day.isSelected, today: day.isToday }"
                @click="selectCalendarDate('end', day.iso)"
              >
                {{ day.dayNumber }}
              </button>
            </div>
            <div class="calendar-footer">
              <button type="button" class="calendar-link" @click="clearCalendarDate('end')">Clear</button>
              <button type="button" class="calendar-link" @click="selectToday('end')">Today</button>
            </div>
          </div>
        </div>
      </div>

      <div class="filter-group filter-action">
        <button @click="clearFilters" class="btn-ghost" :class="{ 'visible': filters.project_id || filters.start_date || filters.end_date }">
          Clear Filters
        </button>
      </div>
    </div>

    <section class="stats-container" v-if="isAdmin && summary">
      <div class="stat-box">
        <span class="stat-label">Available Balance</span>
        <div class="stat-value">Rs. {{ summary.total_balance?.toLocaleString() || 0 }}</div>
      </div>
      <div class="stat-box">
        <span class="stat-label">Total Revenue</span>
        <div class="stat-value positive">Rs. {{ summary.total_income?.toLocaleString() || 0 }}</div>
      </div>
      <div class="stat-box">
        <span class="stat-label">Total Expenses</span>
        <div class="stat-value negative">Rs. {{ summary.total_expense?.toLocaleString() || 0 }}</div>
      </div>
    </section>

    <div class="detailed-charts" v-if="isAdmin && summary">
        <div class="chart-card full-width-chart">
            <div class="chart-header">
              <h3>Monthly Expense Breakdown by Project</h3>
            </div>
            <apexchart type="bar" height="380" :options="trendChartOptions" :series="trendSeries" />
        </div>

        <div class="chart-card">
            <div class="chart-header">
              <h3>Expenses by Category</h3>
              <span class="chart-subtitle">Based on your transaction entries</span>
            </div>
            <apexchart type="donut" height="320" :options="categoryChartOptions" :series="categorySeries" />
        </div>

        <div class="chart-card">
            <div class="chart-header">
              <h3>Specific Material Costs</h3>
              <span class="chart-subtitle">Cost breakdown of procured items</span>
            </div>
            <apexchart type="bar" height="320" :options="materialChartOptions" :series="materialSeries" />
        </div>
    </div>

    <div class="finance-grid" :class="{ 'full-width': !isAdmin }">
      <section class="content-card" v-if="isAdmin">
        <div class="card-head">
          <div class="head-title">
            <h2>Employee Payroll</h2>
            <span class="month-label">{{ currentMonthLabel }}</span>
          </div>
          <span class="badge">{{ employees.length }} Staff</span>
        </div>
        
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Salary</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="employees.length === 0">
                <td colspan="4" class="text-center text-muted">No employees found.</td>
              </tr>
              <tr v-for="emp in employees" :key="emp.id">
                <td><strong>{{ emp.name }}</strong></td>
                <td class="text-muted">{{ emp.role }}</td>
                <td>Rs. {{ Number(emp.salary_amount).toLocaleString() }}</td>
                <td class="text-right">
                  <span v-if="emp.paid_this_month" class="status-badge success">Paid</span>
                  <button v-else @click="processSalary(emp)" class="btn-xs primary-outline">Pay</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="content-card">
        <div class="card-head">
          <div class="head-title">
            <h2>Monthly Activity</h2>
            <span class="month-label">{{ summary.activity_period_label || currentMonthLabel }}</span>
          </div>
          <span class="badge">{{ summary.monthly_activity?.length || 0 }} Entries</span>
        </div>
        
        <div class="activity-list">
          <div v-if="!summary.monthly_activity?.length" class="text-center text-muted" style="padding: 30px;">
            No income or expense activity found for this period.
          </div>
          <div
            v-for="activity in summary.monthly_activity"
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-main">
              <div class="activity-top">
                <span class="activity-type" :class="activity.type">{{ activity.type }}</span>
                <span class="activity-date">{{ formatDateDisplay(activity.date) }}</span>
              </div>
              <h3>{{ activity.category }}</h3>
              <span class="activity-project">{{ activity.project?.name || 'General / Unassigned' }}</span>
              <p class="activity-description">{{ activity.description || 'No additional note provided.' }}</p>
            </div>
            <div class="activity-amount" :class="activity.type">
              {{ activity.type === 'income' ? '+' : '-' }}Rs. {{ Number(activity.amount || 0).toLocaleString() }}
            </div>
          </div>
        </div>
      </section>
    </div>
    <div v-if="showTransactionModal" class="modal-backdrop" @click.self="showTransactionModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Record Transaction</h3>
          <button @click="showTransactionModal = false" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <form @submit.prevent="saveTransaction">
          <div class="form-group">
            <label>Transaction Type</label>
            <div class="select-wrapper">
              <select v-model="formT.type" class="styled-input" required>
                <option value="income">Income (Client Payment)</option>
                <option value="expense">Expense (Outflow)</option>
                <option value="pre-payment">Pre-payment / Advance</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>Link to Project (Optional)</label>
            <div class="select-wrapper">
              <select v-model="formT.project_id" class="styled-input">
                <option value="">General / No Specific Project</option>
                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Amount (Rs.)</label>
              <input type="number" v-model="formT.amount" class="styled-input" required min="0" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label>Date</label>
              <div class="calendar-field" @click.stop>
                <div class="custom-date-box" :class="{ open: activeCalendar === 'transaction' }" @click="toggleCalendar('transaction')">
                  <span :class="{'text-placeholder': !formT.date}">
                    {{ formT.date ? formatDateDisplay(formT.date) : 'Select Date' }}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <div v-if="activeCalendar === 'transaction'" class="calendar-popout calendar-popout-modal">
                  <div class="calendar-header">
                    <button type="button" class="calendar-nav" @click="changeCalendarMonth('transaction', -1)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <strong>{{ getCalendarTitle('transaction') }}</strong>
                    <button type="button" class="calendar-nav" @click="changeCalendarMonth('transaction', 1)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </div>
                  <div class="calendar-weekdays">
                    <span v-for="day in weekdayLabels" :key="day">{{ day }}</span>
                  </div>
                  <div class="calendar-grid">
                    <button
                      v-for="day in getCalendarDays('transaction')"
                      :key="day.iso"
                      type="button"
                      class="calendar-day"
                      :class="{ muted: !day.isCurrentMonth, selected: day.isSelected, today: day.isToday }"
                      @click="selectCalendarDate('transaction', day.iso)"
                    >
                      {{ day.dayNumber }}
                    </button>
                  </div>
                  <div class="calendar-footer">
                    <button type="button" class="calendar-link" @click="clearCalendarDate('transaction')">Clear</button>
                    <button type="button" class="calendar-link" @click="selectToday('transaction')">Today</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Category</label>
            <input type="text" v-model="formT.category" class="styled-input" required placeholder="e.g. Labor, Concrete, Machinery" />
          </div>
          <div class="form-group">
            <label>Description (Optional)</label>
            <textarea v-model="formT.description" class="styled-input" rows="3" placeholder="Brief details regarding the transaction..."></textarea>
          </div>
          <button type="submit" class="btn primary full-width">Save Transaction</button>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import apexchart from "vue3-apexcharts";
import { useAuth } from '../useAuth';

const { isAdmin, loadUser } = useAuth();
const summary = ref({});
const employees = ref([]);
const projects = ref([]);

const filters = ref({ start_date: '', end_date: '', project_id: '' });
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const activeCalendar = ref(null);

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${months[parseInt(month)-1]} ${year}`;
};

const createViewDate = (dateStr) => {
  const baseDate = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
};

const calendarView = ref({
  start: createViewDate(filters.value.start_date),
  end: createViewDate(filters.value.end_date),
  transaction: createViewDate(new Date().toISOString().split('T')[0])
});

const formatDateIso = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFieldValue = (key) => {
  if (key === 'start') return filters.value.start_date;
  if (key === 'end') return filters.value.end_date;
  return formT.value.date;
};

const setFieldValue = (key, value) => {
  if (key === 'start') filters.value.start_date = value;
  else if (key === 'end') filters.value.end_date = value;
  else formT.value.date = value;
};

const syncCalendarView = (key) => {
  calendarView.value[key] = createViewDate(getFieldValue(key));
};

const toggleCalendar = (key) => {
  if (activeCalendar.value === key) {
    activeCalendar.value = null;
    return;
  }
  syncCalendarView(key);
  activeCalendar.value = key;
};

const getCalendarTitle = (key) => {
  const viewDate = calendarView.value[key];
  return viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const changeCalendarMonth = (key, direction) => {
  const nextView = new Date(calendarView.value[key]);
  nextView.setMonth(nextView.getMonth() + direction);
  calendarView.value[key] = new Date(nextView.getFullYear(), nextView.getMonth(), 1);
};

const getCalendarDays = (key) => {
  const viewDate = calendarView.value[key];
  const selectedDate = getFieldValue(key);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startOffset);
  const todayIso = formatDateIso(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + index);
    const iso = formatDateIso(current);

    return {
      iso,
      dayNumber: current.getDate(),
      isCurrentMonth: current.getMonth() === month,
      isToday: iso === todayIso,
      isSelected: iso === selectedDate
    };
  });
};

const selectCalendarDate = (key, value) => {
  setFieldValue(key, value);
  activeCalendar.value = null;
  if (key !== 'transaction') loadData();
};

const clearCalendarDate = (key) => {
  setFieldValue(key, '');
  activeCalendar.value = null;
  if (key !== 'transaction') loadData();
};

const selectToday = (key) => {
  selectCalendarDate(key, formatDateIso(new Date()));
};

const closeCalendar = () => {
  activeCalendar.value = null;
};

const chartFont = 'Plus Jakarta Sans, sans-serif';
const archColors = ['#A65D43', '#475569', '#94A3B8', '#D97706', '#1E293B', '#64748B'];

const trendSeries = ref([]);
const trendChartOptions = ref({
    chart: { type: 'bar', stacked: true, fontFamily: chartFont, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '40%' } },
    dataLabels: { enabled: false },
    xaxis: { 
      categories:[], 
      axisBorder: { show: false }, 
      axisTicks: { show: false }, 
      labels: { style: { colors: '#64748B', fontSize: '13px', fontWeight: 500 } } 
    },
    yaxis: { 
      labels: { 
        style: { colors: '#64748B', fontSize: '13px', fontWeight: 500 }, 
        formatter: (val) => {
          if (isNaN(val) || val === null) return val;
          return `Rs. ${(val/1000).toFixed(1)}k`;
        }
      } 
    },
    colors: archColors,
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#475569' }, markers: { radius: 12 } },
    fill: { opacity: 1 },
    grid: { show: false } 
});

const categorySeries = ref([]);
const categoryChartOptions = ref({
    labels:[],
    chart: { type: 'donut', fontFamily: chartFont },
    colors: archColors,
    dataLabels: { enabled: false },
    stroke: { show: false },
    legend: { position: 'bottom', labels: { colors: '#475569' }, markers: { radius: 12 } },
    tooltip: {
      y: { formatter: function(val) { return "Rs. " + val.toLocaleString() } }
    }
});

const materialSeries = ref([]);
const materialChartOptions = ref({
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: chartFont },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '50%' } },
    dataLabels: { enabled: false },
    xaxis: { 
      axisBorder: { show: false }, 
      axisTicks: { show: false }, 
      labels: { 
        style: { colors: '#64748B', fontSize: '13px', fontWeight: 500 },
        formatter: (val) => {
          if (isNaN(val) || val === null) return val;
          return `Rs. ${(val/1000).toFixed(1)}k`;
        }
      } 
    },
    yaxis: { 
      labels: { 
        style: { colors: '#64748B', fontSize: '13px', fontWeight: 600 }
      } 
    },
    colors: ['#A65D43'], 
    grid: { show: false },
    tooltip: {
      y: { formatter: function(val) { return "Rs. " + val.toLocaleString() } }
    }
});

const showTransactionModal = ref(false);
const currentMonthLabel = ref(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));

const formT = ref({ type: 'expense', amount: '', category: '', project_id: '', date: new Date().toISOString().split('T')[0], description: '' });

const clearFilters = () => {
    filters.value = { start_date: '', end_date: '', project_id: '' };
    loadData();
};

const loadData = async () => {
  try {
    await loadUser();

    const params = {};
    if (filters.value.start_date && filters.value.end_date) {
        params.start_date = filters.value.start_date;
        params.end_date = filters.value.end_date;
    }
    if (filters.value.project_id) {
        params.project_id = filters.value.project_id;
    }

    const commonReqs = [axios.get('/projects')];

    if (isAdmin.value) {
      commonReqs.push(axios.get('/finance/summary', { params }));
      commonReqs.push(axios.get('/finance/employees'));
    }

    const responses = await Promise.all(commonReqs);
    projects.value = responses[0].data ||[];

    if (isAdmin.value) {
      summary.value = responses[1].data || {};
      employees.value = responses[2].data ||[];

      const stats = summary.value.project_monthly_stats ||[];
      const catStats = summary.value.category_breakdown || [];
      const matStats = summary.value.material_breakdown || [];

      const months =[...new Set(stats.map(s => s.month))];
      const projectNames =[...new Set(stats.map(s => s.project_name))];

      trendSeries.value = projectNames.map(pName => {
        return {
          name: pName,
          data: months.map(m => {
            const record = stats.find(s => s.project_name === pName && s.month === m);
            return record ? Number(record.cost) : 0;
          })
        };
      });
      trendChartOptions.value = { ...trendChartOptions.value, xaxis: { ...trendChartOptions.value.xaxis, categories: months } };

      categorySeries.value = catStats.map(c => Number(c.total));
      categoryChartOptions.value = {
          ...categoryChartOptions.value,
          labels: catStats.map(c => c.category) 
      };

      materialSeries.value =[{
          name: 'Total Cost',
          data: matStats.map(m => Number(m.total_cost))
      }];
      materialChartOptions.value = {
          ...materialChartOptions.value,
          xaxis: { ...materialChartOptions.value.xaxis },
          xaxis: { ...materialChartOptions.value.xaxis, categories: matStats.map(m => m.material_name) }
      };
    }
  } catch (e) {
    console.error("Data load failed! API Error:", e.response?.data || e);
  }
};

const processSalary = async (emp) => {
  if (confirm(`Process salary payment of Rs. ${emp.salary_amount} for ${emp.name}?`)) {
    try {
      await axios.post(`/finance/employees/${emp.id}/pay`);
      loadData();
    } catch (e) {
      if (e.response && e.response.status === 422) { alert(e.response.data.message); }
      else { alert("Failed to process salary payment."); }
    }
  }
};

const saveTransaction = async () => {
  try {
    const payload = { ...formT.value };
    payload.project_id = payload.project_id || null;

    await axios.post('/finance/transactions', payload);
    showTransactionModal.value = false;
    formT.value = { type: 'expense', amount: '', category: '', project_id: '', date: new Date().toISOString().split('T')[0], description: '' };
    loadData();
  } catch (e) { alert("Failed to save transaction."); }
};

onMounted(() => {
  loadData();
  document.addEventListener('click', closeCalendar);
});

onUnmounted(() => {
  document.removeEventListener('click', closeCalendar);
});
</script>

<style scoped>
.finance-page { padding: 40px; animation: fadeIn 0.3s ease-out; max-width: 1280px; margin: 0 auto; }
.finance-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 32px; }
.eyebrow { display: inline-block; margin-bottom: 10px; color: var(--primary); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.header-left h1 { color: var(--text-main); font-size: 2.15rem; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.04em; }
.header-left p { color: var(--text-secondary); margin: 0; font-size: 0.98rem; max-width: 560px; }
.header-right { display: flex; align-items: center; gap: 14px; }
.header-stats { display: flex; gap: 12px; }
.stat-chip { min-width: 108px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-surface); display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.stat-chip strong { font-size: 1.05rem; color: var(--text-main); line-height: 1; }
.action-buttons { display: flex; gap: 12px; }

.styled-input {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  height: 48px;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-main);
  font-family: inherit;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
textarea.styled-input { height: auto; }
.styled-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1);
  background: var(--bg-surface);
}
.styled-input.solid { background: var(--bg-surface); }

.select-wrapper { position: relative; width: 100%; }
.select-wrapper::after {
  content: '';
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: contain;
  pointer-events: none;
}
.select-wrapper select { padding-right: 48px; cursor: pointer; }

.custom-date-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}
.custom-date-box.open,
.custom-date-box:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1);
  background: var(--bg-surface);
}
.custom-date-box:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1);
  background: var(--bg-surface);
}
.custom-date-box span { font-size: 1rem; color: var(--text-main); pointer-events: none; }
.custom-date-box span.text-placeholder { color: var(--text-muted); }
.custom-date-box svg { color: var(--text-secondary); pointer-events: none; }

.calendar-field {
  position: relative;
}

.calendar-popout {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  width: 320px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid var(--border);
  background:
    radial-gradient(circle at top right, rgba(166, 93, 67, 0.12), transparent 34%),
    radial-gradient(circle at bottom left, rgba(166, 93, 67, 0.08), transparent 32%),
    var(--bg-surface);
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.14);
  z-index: 40;
  animation: calendarIn 0.18s ease;
}

.calendar-popout-modal {
  width: 100%;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.calendar-header strong {
  font-size: 1.1rem;
  color: var(--text-main);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.calendar-nav {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-main);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-nav:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.calendar-weekdays span {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  height: 38px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-main);
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.18s ease;
}

.calendar-day:hover {
  border-color: color-mix(in srgb, var(--primary) 40%, var(--border) 60%);
  background: rgba(166, 93, 67, 0.08);
}

.calendar-day.muted {
  color: var(--text-muted);
}

.calendar-day.today {
  border-color: var(--border);
}

.calendar-day.selected {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  box-shadow: 0 10px 18px -14px rgba(166, 93, 67, 0.9);
}

.calendar-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.calendar-link {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 0;
}

.calendar-link:hover {
  color: var(--text-main);
}

.filter-panel { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 20px; 
  margin-bottom: 32px; 
  align-items: flex-end; 
  background: var(--bg-surface);
  padding: 24px;
  border-radius: 18px;
  border: 1px solid var(--border);
}
.filter-group { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 200px; }
.project-filter { flex: 2; }
.filter-group label { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.filter-action { flex: 0; }

.btn { padding: 0 24px; height: 46px; border-radius: 10px; font-weight: 700; font-size: 0.94rem; cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; letter-spacing: 0.2px; }
.btn.primary { background: var(--primary); color: white; }
.btn.primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(166, 93, 67, 0.2); }
.btn.secondary { background: transparent; border: 2px solid var(--border); color: var(--text-main); }
.btn.secondary:hover { border-color: var(--primary); color: var(--primary); }

.btn-ghost { background: transparent; color: var(--text-secondary); border: none; font-size: 0.95rem; font-weight: 700; cursor: pointer; padding: 0 20px; height: 48px; transition: 0.2s; border-radius: 8px; opacity: 0; visibility: hidden; }
.btn-ghost.visible { opacity: 1; visibility: visible; }
.btn-ghost:hover { color: var(--danger-text); background: var(--danger-bg); }

.btn.full-width { width: 100%; margin-top: 24px; }
.btn-xs { padding: 8px 16px; font-size: 0.85rem; border-radius: 6px; cursor: pointer; font-weight: 700; transition: 0.2s; border: none; }
.primary-outline { background: transparent; border: 2px solid var(--primary); color: var(--primary); }
.primary-outline:hover { background: var(--primary); color: white; }

.btn-text { background: transparent; border: none; color: var(--primary); font-size: 0.95rem; font-weight: 700; cursor: pointer; padding: 4px 8px; transition: 0.2s;}
.btn-text:hover { color: var(--text-main); }
.btn-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; cursor: pointer; border-radius: 6px; transition: 0.2s; }
.btn-icon.danger { color: var(--text-muted); }
.btn-icon.danger:hover { background: var(--danger-bg); color: var(--danger-text); }

.stats-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
.stat-box { background: color-mix(in srgb, var(--bg-surface) 82%, var(--bg-input) 18%); padding: 28px; border-radius: 18px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px; transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; }
.stat-box:hover { border-color: color-mix(in srgb, var(--primary) 45%, var(--border) 55%); transform: translateY(-2px); box-shadow: 0 16px 24px -20px rgba(0,0,0,0.35); }
.stats-container .stat-label { font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.08em; }
.stat-value { font-size: 2rem; font-weight: 800; color: var(--text-main); line-height: 1; }
.positive { color: #10B981; }
.negative { color: #EF4444; }

.detailed-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px; }
.chart-card { background: var(--bg-surface); padding: 28px; border-radius: 18px; border: 1px solid var(--border); display: flex; flex-direction: column;}
.full-width-chart { grid-column: 1 / -1; }
.chart-header { margin-bottom: 30px; display: flex; flex-direction: column; gap: 4px; }
.chart-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-main); }
.chart-subtitle { font-size: 0.85rem; color: var(--text-muted); }

.finance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.finance-grid.full-width { grid-template-columns: 1fr; }

.content-card { background: var(--bg-surface); border-radius: 18px; border: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 24px 30px; border-bottom: 1px solid var(--border); background: var(--bg-input); }
.head-title h2 { color: var(--text-main); margin: 0 0 6px 0; font-size: 1.2rem; font-weight: 700; }
.month-label { font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;}
.badge { background: var(--bg-surface); color: var(--text-main); padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 700; border: 1px solid var(--border); }

.table-wrapper { width: 100%; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th { padding: 16px 30px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); border-bottom: 1px solid var(--border); }
.data-table td { padding: 20px 30px; font-size: 0.95rem; color: var(--text-main); border-bottom: 1px solid var(--border); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tfoot td { padding: 20px 30px; border-top: 2px solid var(--border); background: var(--bg-input); }
.text-right { text-align: right; }
.text-center { text-align: center; }
.text-muted { color: var(--text-secondary); }
.font-medium { font-weight: 600; }
.font-bold { font-weight: 800; font-size: 1.1rem; }
.text-main { color: var(--text-main); }

.status-badge { display: inline-block; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; }
.status-badge.success { background: rgba(16, 185, 129, 0.1); color: #059669; }

.activity-list { display: flex; flex-direction: column; overflow-y: auto; max-height: 450px; }
.activity-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 20px 30px; border-bottom: 1px solid var(--border); transition: background 0.2s; }
.activity-item:last-child { border-bottom: none; }
.activity-item:hover { background: color-mix(in srgb, var(--bg-surface) 78%, var(--bg-input) 22%); }
.activity-main { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.activity-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.activity-type { padding: 5px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
.activity-type.income { background: rgba(16, 185, 129, 0.12); color: #059669; }
.activity-type.expense,
.activity-type.pre-payment { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
.activity-date { font-size: 0.82rem; color: var(--text-secondary); }
.activity-main h3 { margin: 0; font-size: 1.02rem; color: var(--text-main); font-weight: 700; }
.activity-project { font-size: 0.86rem; color: var(--primary); font-weight: 600; }
.activity-description { margin: 0; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.55; max-width: 520px; }
.activity-amount { font-weight: 800; font-size: 1.05rem; white-space: nowrap; }
.activity-amount.income { color: #059669; }
.activity-amount.expense,
.activity-amount.pre-payment { color: #dc2626; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.42); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeIn 0.2s ease; padding: 20px; }
.modal-card { background: var(--bg-surface); padding: 32px; border-radius: 18px; width: 500px; border: 1px solid var(--border); box-shadow: 0 24px 50px rgba(0,0,0,0.12); max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; }
.modal-card.wide { width: 750px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.modal-header h3 { color: var(--text-main); margin: 0; font-size: 1.4rem; font-weight: 800; }
.close-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 8px; border-radius: 8px; transition: 0.2s; }
.close-btn:hover { background: var(--bg-input); color: var(--text-main); }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }

.material-builder { border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin: 10px 0 30px 0; background: var(--bg-input); }
.builder-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.builder-header label { font-size: 0.95rem; font-weight: 700; color: var(--text-main); }
.builder-labels { display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 16px; font-size: 0.8rem; color: var(--text-secondary); font-weight: 700; margin-bottom: 12px; padding: 0 4px; text-transform: uppercase; letter-spacing: 0.5px;}
.builder-row { display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 16px; margin-bottom: 12px; align-items: center; }
.builder-row:last-child { margin-bottom: 0; }

.detail-content { display: flex; flex-direction: column; gap: 30px; }
.vendor-profile { background: var(--bg-input); border: 1px solid var(--border); padding: 24px; border-radius: 8px; display: flex; flex-direction: column; gap: 20px; }
.vp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.vp-item { display: flex; flex-direction: column; gap: 6px; }
.vp-item label { font-size: 0.8rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;}
.vp-item span { font-size: 1.05rem; color: var(--text-main); font-weight: 600;}
.section-title { margin: 0; color: var(--text-main); font-size: 1.2rem; font-weight: 700; border-left: 4px solid var(--primary); padding-left: 12px;}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes calendarIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

@media (max-width: 1024px) { 
  .finance-grid, .stats-container, .detailed-charts { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .filter-panel { flex-direction: column; align-items: stretch; }
  .finance-header { flex-direction: column; align-items: stretch; }
  .header-right { flex-direction: column; align-items: stretch; }
  .header-stats { width: 100%; }
  .stat-chip { flex: 1; }
  .builder-labels { display: none; } 
  .builder-row { grid-template-columns: 1fr; gap: 12px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px dashed var(--border); }
  .builder-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .calendar-popout { width: min(320px, 100%); }
}
</style>
