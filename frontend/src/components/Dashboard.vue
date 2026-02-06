<template>
  <div class="dashboard-wrapper">
    <!-- TOP NAVIGATION BAR -->
    <nav class="top-navbar">
      <div class="nav-inner">
        <!-- BRAND -->
        <div class="brand-box">
          <div class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a2 2 0 0 1 1.95-1.2h2.9a2 2 0 0 1 1.95 1.2L13 21"></path><path d="M4.6 17h6.9"></path><path d="M15 21l-3.35-7.7a2 2 0 0 1 0-1.6l3.35-7.7a2 2 0 0 1 3.6 0l3.35 7.7a2 2 0 0 1 0 1.6L18.6 21"></path></svg>
          </div>
          <div class="brand-text">AAKAR</div>
        </div>

        <!-- NAV LINKS -->
        <div class="nav-links">
          <button @click="router.push('/dashboard')" :class="['nav-item', { active: $route.path === '/dashboard' }]">
            Overview
          </button>
          <button @click="router.push('/finance')" :class="['nav-item', { active: $route.path === '/finance' }]">
            Finance
          </button>
          <button @click="router.push('/projects')" :class="['nav-item', { active: $route.path === '/projects' }]">
            Projects
          </button>
          <button @click="router.push('/tasks')" :class="['nav-item', { active: $route.path === '/tasks' }]">
            Tasks
          </button>
        </div>

        <!-- USER ACTIONS -->
        <div class="user-actions">
          <button @click="toggleTheme" class="icon-btn theme-btn" :title="isDark ? 'Light Mode' : 'Dark Mode'">
            <!-- Sun Icon -->
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            <!-- Moon Icon -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          </button>

          <div class="profile-info">
            <span class="user-name">{{ user?.name || 'Admin' }}</span>
            <span class="user-role">{{ user?.role?.toUpperCase() || 'USER' }}</span>
          </div>
          <div class="avatar">{{ user?.name?.charAt(0) || 'A' }}</div>
          
          <button @click="logout" class="icon-btn logout-btn" title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </nav>

    <!-- MAIN CONTENT -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in"><component :is="Component" /></transition>
      </router-view>
      
      <!-- DASHBOARD WIDGETS -->
      <div v-if="$route.path === '/dashboard'" class="overview-container">
        <header class="page-header">
          <div class="header-text">
            <h1>Dashboard Overview</h1>
            <p>Visualizing your construction metrics and financial health.</p>
          </div>
          <div class="date-pill">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            {{ new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }}
          </div>
        </header>

        <!-- KPI CARDS -->
        <div class="kpi-grid">
          <!-- Income Card -->
          <div class="kpi-card" @click="router.push('/finance')">
            <div class="icon-wrapper income">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Monthly Income</span>
              <div class="kpi-value">Rs. {{ summary?.total_income?.toLocaleString() || 0 }}</div>
            </div>
            <div class="kpi-arrow up">↗</div>
          </div>

          <!-- Expense Card -->
          <div class="kpi-card" @click="router.push('/finance')">
            <div class="icon-wrapper expense">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Monthly Expenses</span>
              <div class="kpi-value">Rs. {{ summary?.total_expense?.toLocaleString() || 0 }}</div>
            </div>
            <div class="kpi-arrow down">↘</div>
          </div>

          <!-- Projects Card -->
          <div class="kpi-card highlight" @click="router.push('/projects')">
            <div class="icon-wrapper project">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Active Projects</span>
              <div class="kpi-value link">{{ projectCount }} Projects</div>
            </div>
            <div class="kpi-arrow neutral">→</div>
          </div>
        </div>

        <!-- CHARTS SECTION -->
        <div class="charts-grid">
          <div class="chart-card main-chart">
            <div class="chart-header">
              <div class="chart-title-group">
                <div class="chart-icon-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
                </div>
                <h3>Financial Trend</h3>
              </div>
              <span class="chart-subtitle">Last 6 Months</span>
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
              <div class="chart-title-group">
                <div class="chart-icon-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                </div>
                <h3>Project Status</h3>
              </div>
              <span class="chart-subtitle">Distribution</span>
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
  grid: { borderColor: isDark.value ? '#334155' : '#E2E8F0', strokeDashArray: 4 },
  theme: { mode: isDark.value ? 'dark' : 'light' },
  tooltip: { theme: isDark.value ? 'dark' : 'light' }
});

const statusSeries = computed(() => {
  const counts = { 'In Progress': 0, 'Upcoming': 0, 'Completed': 0, 'On Hold': 0 };
  projects.value.forEach(p => counts[p.status]++);
  return Object.values(counts);
});

const statusChartOptions = ref({
  labels: ['In Progress', 'Upcoming', 'Completed', 'On Hold'],
  colors: ['#A65D43', '#64748B', '#10B981', '#F59E0B'],
  chart: { fontFamily: 'Plus Jakarta Sans', background: 'transparent' },
  legend: { position: 'bottom', labels: { colors: isDark.value ? '#94A3B8' : '#64748B' } },
  dataLabels: { enabled: false },
  stroke: { show: false },
  plotOptions: { pie: { donut: { size: '75%', labels: { show: false } } } },
  tooltip: { theme: isDark.value ? 'dark' : 'light' }
});

const updateChartTheme = () => {
  const textColor = isDark.value ? '#94A3B8' : '#64748B';
  const gridColor = isDark.value ? '#334155' : '#E2E8F0';
  const themeMode = isDark.value ? 'dark' : 'light';
  
  financeChartOptions.value = {
    ...financeChartOptions.value,
    xaxis: { ...financeChartOptions.value.xaxis, labels: { style: { colors: textColor } } },
    yaxis: { ...financeChartOptions.value.yaxis, labels: { style: { colors: textColor } } },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    theme: { mode: themeMode },
    tooltip: { theme: themeMode }
  };

  statusChartOptions.value = {
    ...statusChartOptions.value,
    legend: { ...statusChartOptions.value.legend, labels: { colors: textColor } },
    tooltip: { theme: themeMode }
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
/* TOP NAV BAR */
.top-navbar { position: fixed; top: 0; left: 0; width: 100%; height: 80px; background: var(--bg-nav); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); z-index: 1000; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; }
.nav-inner { width: 100%; max-width: 1400px; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; }

.brand-box { display: flex; align-items: center; gap: 12px; }
.logo-icon { width: 40px; height: 40px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; border-radius: 12px; box-shadow: 0 4px 10px rgba(166, 93, 67, 0.3); }
.brand-text { font-weight: 800; font-size: 1.3rem; color: var(--text-main); letter-spacing: -0.5px; }

.nav-links { display: flex; background: var(--bg-input); padding: 5px; border-radius: 14px; gap: 5px; border: 1px solid var(--border); }
.nav-item { background: transparent; border: none; padding: 8px 24px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; color: var(--text-body); cursor: pointer; transition: all 0.2s ease; }
.nav-item.active { background: var(--bg-surface); color: var(--text-main); box-shadow: var(--shadow-sm); }
.nav-item:hover:not(.active) { color: var(--primary); background: rgba(0,0,0,0.02); }

.user-actions { display: flex; align-items: center; gap: 16px; }
.profile-info { text-align: right; }
.user-name { display: block; font-weight: 700; font-size: 0.9rem; color: var(--text-main); }
.user-role { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px; }
.avatar { width: 42px; height: 42px; background: var(--text-main); color: var(--bg-surface); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; }

.icon-btn { background: var(--bg-surface); border: 1px solid var(--border); width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; }
.icon-btn:hover { background: var(--bg-input); color: var(--text-main); transform: translateY(-1px); }
.logout-btn:hover { background: var(--danger-bg); color: var(--danger-text); border-color: transparent; }

/* LAYOUT & HEADER */
.main-content { padding-top: 120px; padding-bottom: 60px; max-width: 1400px; margin: 0 auto; padding-left: 40px; padding-right: 40px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
.header-text h1 { font-size: 2.2rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -1px; }
.header-text p { color: var(--text-secondary); margin-top: 6px; font-size: 1rem; }
.date-pill { background: var(--bg-surface); border: 1px solid var(--border); padding: 8px 16px; border-radius: 30px; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; box-shadow: var(--shadow-sm); }

/* KPI CARDS */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 30px; }
.kpi-card { background: var(--bg-surface); padding: 24px; border-radius: 20px; display: flex; align-items: center; gap: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden; }
.kpi-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--primary); }

.icon-wrapper { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; }
/* Icons with aesthetic subtle backgrounds */
.income { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.expense { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
.project { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }

/* On Hover fill effect */
.kpi-card:hover .income { background: #10B981; color: white; }
.kpi-card:hover .expense { background: #EF4444; color: white; }
.kpi-card:hover .project { background: #F59E0B; color: white; }

.kpi-data { flex: 1; }
.kpi-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
.kpi-value { font-size: 1.6rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.5px; }

.kpi-arrow { font-size: 1.2rem; font-weight: bold; opacity: 0.2; transition: 0.2s; }
.up { color: #10B981; }
.down { color: #EF4444; }
.kpi-card:hover .kpi-arrow { opacity: 1; transform: translateX(3px); }

/* CHARTS GRID */
.charts-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; }
.chart-card { background: var(--bg-surface); padding: 30px; border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.chart-title-group { display: flex; align-items: center; gap: 12px; }
.chart-icon-box { width: 36px; height: 36px; background: var(--bg-input); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }
.chart-header h3 { margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main); }
.chart-subtitle { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; background: var(--bg-input); padding: 4px 10px; border-radius: 8px; }

@media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .nav-links { display: none; } .page-header { flex-direction: column; align-items: flex-start; gap: 15px; } }
</style>