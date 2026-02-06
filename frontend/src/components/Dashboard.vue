<template>
  <div class="dashboard-wrapper">
    <!-- TOP NAVIGATION BAR -->
    <nav class="top-navbar">
      <div class="nav-inner">
        <div class="brand-box">
          <div class="logo-icon">A</div>
          <div class="brand-text">AAKAR</div>
        </div>

        <div class="nav-links">
          <button @click="router.push('/dashboard')" :class="['nav-item', { active: $route.path === '/dashboard' }]">Overview</button>
          <button @click="router.push('/finance')" :class="['nav-item', { active: $route.path === '/finance' }]">Finance</button>
          <button @click="router.push('/projects')" :class="['nav-item', { active: $route.path === '/projects' }]">Projects</button>
          <!-- NEW TASK LINK -->
          <button @click="router.push('/tasks')" :class="['nav-item', { active: $route.path === '/tasks' }]">Tasks</button>
        </div>

        <div class="user-actions">
          <button @click="toggleTheme" class="theme-btn" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <span v-if="isDark">☀️</span>
            <span v-else>🌙</span>
          </button>

          <div class="profile-info">
            <span class="user-name">{{ user?.name || 'Admin' }}</span>
            <span class="user-role">{{ user?.role?.toUpperCase() }}</span>
          </div>
          <div class="avatar">{{ user?.name?.charAt(0) || 'A' }}</div>
          <button @click="logout" class="logout-btn"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></button>
        </div>
      </div>
    </nav>

    <!-- MAIN CONTENT -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in"><component :is="Component" /></transition>
      </router-view>
      
      <!-- DASHBOARD WIDGETS (Only visible on /dashboard root) -->
      <div v-if="$route.path === '/dashboard'" class="overview-container">
        <header class="page-header">
          <div class="header-text">
            <h1>Dashboard Overview</h1>
            <p>Visualizing your construction metrics and financial health.</p>
          </div>
          <div class="date-pill">📅 {{ new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }}</div>
        </header>

        <!-- KPI CARDS -->
        <div class="kpi-grid">
          <div class="kpi-card" @click="router.push('/finance')">
            <div class="icon-wrapper income">💰</div>
            <div class="kpi-data">
              <span class="kpi-label">Monthly Income</span>
              <div class="kpi-value">Rs. {{ summary?.total_income?.toLocaleString() || 0 }}</div>
            </div>
          </div>
          <div class="kpi-card" @click="router.push('/finance')">
            <div class="icon-wrapper expense">📉</div>
            <div class="kpi-data">
              <span class="kpi-label">Monthly Expenses</span>
              <div class="kpi-value">Rs. {{ summary?.total_expense?.toLocaleString() || 0 }}</div>
            </div>
          </div>
          <div class="kpi-card highlight" @click="router.push('/projects')">
            <div class="icon-wrapper project">🏗️</div>
            <div class="kpi-data">
              <span class="kpi-label">Active Projects</span>
              <div class="kpi-value link">{{ projectCount }} Projects</div>
            </div>
          </div>
        </div>

        <!-- CHARTS SECTION -->
        <div class="charts-grid">
          <div class="chart-card main-chart">
            <div class="chart-header">
              <h3>Financial Trend</h3>
              <span>Last 6 Months</span>
            </div>
            <apexchart 
              type="area" 
              height="300" 
              :options="financeChartOptions" 
              :series="financeSeries"
            ></apexchart>
          </div>

          <div class="chart-card side-chart">
            <div class="chart-header">
              <h3>Project Status</h3>
              <span>Distribution</span>
            </div>
            <apexchart 
              type="donut" 
              height="320" 
              :options="statusChartOptions" 
              :series="statusSeries"
            ></apexchart>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import apexchart from "vue3-apexcharts";

const router = useRouter();
const user = ref(null);
const summary = ref(null);
const projects = ref([]);
const isDark = ref(localStorage.getItem('theme') === 'dark');

const projectCount = computed(() => projects.value.length);

const applyTheme = () => {
  if (isDark.value) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  }
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  applyTheme();
  updateChartTheme();
};

const financeSeries = computed(() => [
  { name: 'Income', data: summary.value?.monthly_stats?.map(s => s.income) || [0,0,0,0,0,0] },
  { name: 'Expense', data: summary.value?.monthly_stats?.map(s => s.expense) || [0,0,0,0,0,0] }
]);

const financeChartOptions = ref({
  chart: { toolbar: { show: false }, fontFamily: 'Plus Jakarta Sans', background: 'transparent' },
  colors: ['#10B981', '#EF4444'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 } },
  xaxis: { 
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], 
    axisBorder: { show: false },
    labels: { style: { colors: isDark.value ? '#94A3B8' : '#64748B' } }
  },
  yaxis: { labels: { style: { colors: isDark.value ? '#94A3B8' : '#64748B' } } },
  grid: { borderColor: isDark.value ? '#334155' : '#f1f5f9' },
  theme: { mode: isDark.value ? 'dark' : 'light' }
});

const statusSeries = computed(() => {
  const counts = { 'In Progress': 0, 'Upcoming': 0, 'Completed': 0, 'On Hold': 0 };
  projects.value.forEach(p => counts[p.status]++);
  return Object.values(counts);
});

const statusChartOptions = ref({
  labels: ['In Progress', 'Upcoming', 'Completed', 'On Hold'],
  colors: ['#A65D43', '#94A3B8', '#10B981', '#F59E0B'],
  chart: { fontFamily: 'Plus Jakarta Sans', background: 'transparent' },
  legend: { position: 'bottom', labels: { colors: isDark.value ? '#94A3B8' : '#64748B' } },
  dataLabels: { enabled: false },
  stroke: { show: false },
  plotOptions: { pie: { donut: { size: '75%' } } }
});

const updateChartTheme = () => {
  const textColor = isDark.value ? '#94A3B8' : '#64748B';
  const gridColor = isDark.value ? '#334155' : '#f1f5f9';
  
  financeChartOptions.value = {
    ...financeChartOptions.value,
    xaxis: { ...financeChartOptions.value.xaxis, labels: { style: { colors: textColor } } },
    yaxis: { ...financeChartOptions.value.yaxis, labels: { style: { colors: textColor } } },
    grid: { borderColor: gridColor },
    theme: { mode: isDark.value ? 'dark' : 'light' }
  };

  statusChartOptions.value = {
    ...statusChartOptions.value,
    legend: { ...statusChartOptions.value.legend, labels: { colors: textColor } }
  };
};

const fetchData = async () => {
  try {
    const [userRes, sumRes, projRes] = await Promise.all([
      axios.get('/user'),
      axios.get('/finance/summary'),
      axios.get('/projects')
    ]);
    user.value = userRes.data;
    summary.value = sumRes.data;
    projects.value = projRes.data;
  } catch (e) {
    if(e.response?.status === 401) { localStorage.clear(); router.push('/login'); }
  }
};

const logout = async () => {
  try { await axios.post('/logout'); } catch (e) {}
  localStorage.clear();
  router.push('/login');
};

onMounted(() => {
  applyTheme();
  updateChartTheme();
  fetchData();
});
</script>

<style scoped>
.top-navbar { position: fixed; top: 0; left: 0; width: 100%; height: 80px; background: var(--bg-nav); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); z-index: 1000; display: flex; align-items: center; justify-content: center; transition: background 0.3s, border-color 0.3s; }
.nav-inner { width: 100%; max-width: 1400px; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; }
.brand-box { display: flex; align-items: center; gap: 12px; }
.logo-icon { width: 40px; height: 40px; background: var(--primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; border-radius: 10px; }
.brand-text { font-weight: 800; font-size: 1.2rem; color: var(--text-main); }
.nav-links { display: flex; background: var(--bg-input); padding: 5px; border-radius: 12px; gap: 5px; border: 1px solid var(--border); }
.nav-item { background: transparent; border: none; padding: 8px 24px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; color: var(--text-body); cursor: pointer; transition: 0.3s; }
.nav-item.active { background: var(--bg-surface); color: var(--text-main); box-shadow: var(--shadow-sm); }
.nav-item:hover:not(.active) { color: var(--primary); }
.nav-item.disabled { opacity: 0.5; }
.user-actions { display: flex; align-items: center; gap: 16px; }
.profile-info { text-align: right; }
.user-name { display: block; font-weight: 700; font-size: 0.9rem; color: var(--text-main); }
.user-role { font-size: 0.75rem; color: var(--text-muted); }
.avatar { width: 42px; height: 42px; background: var(--text-main); color: var(--bg-surface); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.logout-btn { border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-muted); padding: 10px; border-radius: 12px; cursor: pointer; transition: 0.2s; }
.logout-btn:hover { background: var(--danger-bg); color: var(--danger-text); border-color: var(--danger-bg); }
.theme-btn { background: transparent; border: 1px solid var(--border); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.2rem; transition: 0.3s; }
.theme-btn:hover { background: var(--bg-input); }
.main-content { padding-top: 120px; padding-bottom: 60px; max-width: 1400px; margin: 0 auto; padding-left: 40px; padding-right: 40px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
h1 { font-size: 2rem; font-weight: 800; color: var(--text-main); margin: 0; }
.header-text p { color: var(--text-secondary); margin-top: 5px; }
.date-pill { background: var(--bg-surface); border: 1px solid var(--border); padding: 10px 20px; border-radius: 30px; font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 30px; }
.kpi-card { background: var(--bg-surface); padding: 25px; border-radius: 24px; display: flex; align-items: center; gap: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); cursor: pointer; transition: 0.3s; }
.kpi-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); border-color: var(--primary); }
.icon-wrapper { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.income { background: var(--success-bg); color: var(--success-text); }
.expense { background: var(--danger-bg); color: var(--danger-text); }
.project { background: var(--warning-bg); color: var(--warning-text); }
.kpi-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
.kpi-value { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
.charts-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
.chart-card { background: var(--bg-surface); padding: 30px; border-radius: 24px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.chart-header h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-main); }
.chart-header span { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
@media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr; } }
</style>