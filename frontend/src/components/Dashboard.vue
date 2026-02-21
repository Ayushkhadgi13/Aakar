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
          <button @click="router.push('/dashboard')" :class="['nav-item', { active: $route.path === '/dashboard' }]">Overview</button>
          <button v-if="user?.role === 'admin'" @click="router.push('/finance')" :class="['nav-item', { active: $route.path === '/finance' }]">Finance</button>
          <button @click="router.push('/projects')" :class="['nav-item', { active: $route.path.startsWith('/projects') }]">Projects</button>
          <button @click="router.push('/tasks')" :class="['nav-item', { active: $route.path === '/tasks' }]">Tasks</button>
          <button v-if="user?.role === 'admin'" @click="router.push('/employees')" :class="['nav-item', { active: $route.path === '/employees' }]">Employees</button>
        </div>

        <!-- USER ACTIONS -->
        <div class="user-actions">
          <button @click="toggleTheme" class="icon-btn theme-btn">
            <span v-if="isDark">☀️</span><span v-else>🌙</span>
          </button>

          <div class="profile-info">
            <span class="user-name">{{ user?.name || 'User' }}</span>
            <span class="user-role">{{ user?.role?.toUpperCase() || 'LOADING...' }}</span>
          </div>
          <div class="avatar">{{ user?.name?.charAt(0) || 'U' }}</div>
          
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
      
      <!-- === ADMIN DASHBOARD === -->
      <div v-if="$route.path === '/dashboard' && user?.role === 'admin'" class="overview-container">
        <header class="page-header">
          <div class="header-text">
            <h1>Overview</h1>
            <p>Financial performance and project metrics.</p>
          </div>
          <div class="date-pill">{{ todayDate }}</div>
        </header>

        <div class="kpi-grid">
          <div class="kpi-card" @click="router.push('/finance')">
            <div class="icon-wrapper income"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg></div>
            <div class="kpi-data"><span class="kpi-label">Revenue</span><div class="kpi-value">Rs. {{ summary?.total_income?.toLocaleString() || 0 }}</div></div>
          </div>
          <div class="kpi-card" @click="router.push('/finance')">
            <div class="icon-wrapper expense"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
            <div class="kpi-data"><span class="kpi-label">Expenses</span><div class="kpi-value">Rs. {{ summary?.total_expense?.toLocaleString() || 0 }}</div></div>
          </div>
          <div class="kpi-card highlight" @click="router.push('/projects')">
            <div class="icon-wrapper project"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
            <div class="kpi-data"><span class="kpi-label">Projects</span><div class="kpi-value link">{{ projects.length }} Active</div></div>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-card main-chart">
            <div class="chart-header">
              <h3>Financial Trend</h3>
              <div class="legend-custom">
                <span class="dot inc"></span> Income
                <span class="dot exp"></span> Expense
              </div>
            </div>
            <apexchart type="bar" height="320" :options="financeChartOptions" :series="financeSeries"></apexchart>
          </div>
          <div class="chart-card side-chart">
            <div class="chart-header"><h3>Project Status</h3></div>
            <apexchart type="donut" height="320" :options="statusChartOptions" :series="statusSeries"></apexchart>
          </div>
        </div>
      </div>

      <!-- === EMPLOYEE DASHBOARD === -->
      <div v-if="$route.path === '/dashboard' && user?.role !== 'admin'" class="overview-container">
        <header class="page-header">
          <div class="header-text">
            <h1>Welcome, {{ user?.name.split(' ')[0] }}! 👋</h1>
            <p>Here is your daily work summary.</p>
          </div>
          <div class="date-pill">{{ todayDate }}</div>
        </header>

        <div class="kpi-grid">
          <div class="kpi-card" @click="router.push('/tasks')">
            <div class="icon-wrapper pending"><span style="font-size: 1.5rem">⏳</span></div>
            <div class="kpi-data"><span class="kpi-label">Pending Tasks</span><div class="kpi-value">{{ empStats?.pending_count || 0 }}</div></div>
          </div>
          <div class="kpi-card" @click="router.push('/tasks')">
            <div class="icon-wrapper progress"><span style="font-size: 1.5rem">🏃</span></div>
            <div class="kpi-data"><span class="kpi-label">In Progress</span><div class="kpi-value">{{ empStats?.in_progress_count || 0 }}</div></div>
          </div>
          <div class="kpi-card highlight" @click="router.push('/projects')">
            <div class="icon-wrapper project"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
            <div class="kpi-data"><span class="kpi-label">Active Projects</span><div class="kpi-value">{{ empStats?.active_projects || 0 }}</div></div>
          </div>
        </div>

        <div class="emp-section">
          <h3>Your Upcoming Deadlines</h3>
          <div v-if="!empStats?.recent_tasks || empStats.recent_tasks.length === 0" class="empty-state">
            <p>No pending tasks! 🎉</p>
          </div>
          <div v-else class="task-list">
            <div v-for="task in empStats.recent_tasks" :key="task.id" class="task-row">
              <div class="t-info">
                <strong>{{ task.title }}</strong>
                <small>{{ task.description }}</small>
              </div>
              <div class="t-due">
                📅 {{ new Date(task.due_date).toLocaleDateString() }}
              </div>
              <span :class="['status-badge', task.status.toLowerCase().replace(' ', '-')]">{{ task.status }}</span>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import apexchart from "vue3-apexcharts";

const router = useRouter();
const user = ref(null);
const summary = ref(null); 
const projects = ref([]); 
const empStats = ref(null); 
const isDark = ref(localStorage.getItem('theme') === 'dark');

const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

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
  if (user.value?.role === 'admin') updateChartTheme();
};

/* --- PREMIUM CHART CONFIGURATION --- */
const financeSeries = computed(() => [
  { name: 'Income', data: summary.value?.monthly_stats?.map(s => s.income) || [] },
  { name: 'Expense', data: summary.value?.monthly_stats?.map(s => s.expense) || [] }
]);

// Premium Bar Chart Config
const financeChartOptions = ref({
  chart: { 
    type: 'bar', 
    toolbar: { show: false }, 
    fontFamily: 'Plus Jakarta Sans',
    background: 'transparent' 
  },
  colors: ['#10B981', '#F43F5E'], // Emerald Green & Rose Red
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '40%', // Slimmer bars
      borderRadius: 6,    // Smooth corners
      borderRadiusApplication: 'end' // Only top corners
    },
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 4, colors: ['transparent'] },
  fill: { 
    type: 'gradient', 
    gradient: { shade: 'light', type: "vertical", shadeIntensity: 0.25, opacityFrom: 1, opacityTo: 0.85, stops: [0, 100] } 
  },
  xaxis: { 
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#94A3B8', fontSize: '12px', fontWeight: 500 } } 
  },
  yaxis: { 
    labels: { 
      style: { colors: '#94A3B8', fontSize: '12px', fontWeight: 500 },
      formatter: (val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val
    } 
  },
  grid: { 
    borderColor: '#F1F5F9', 
    strokeDashArray: 5,
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } }
  },
  legend: { show: false }, // Using custom legend in HTML
  tooltip: { 
    theme: 'light',
    y: { formatter: (val) => `Rs. ${val.toLocaleString()}` },
    style: { fontSize: '13px', fontFamily: 'Plus Jakarta Sans' }
  }
});

const statusSeries = computed(() => {
  if (!projects.value.length) return [];
  const counts = { 'In Progress': 0, 'Upcoming': 0, 'Completed': 0, 'On Hold': 0 };
  projects.value.forEach(p => counts[p.status]++);
  return Object.values(counts);
});

// Premium Donut Config
const statusChartOptions = ref({
  labels: ['In Progress', 'Upcoming', 'Completed', 'On Hold'],
  colors: ['#F59E0B', '#64748B', '#10B981', '#F43F5E'],
  legend: { 
    position: 'bottom', 
    markers: { radius: 12 }, 
    itemMargin: { horizontal: 10, vertical: 5 },
    labels: { colors: '#64748B' }
  },
  dataLabels: { enabled: false },
  stroke: { show: false },
  plotOptions: { 
    pie: { 
      donut: { 
        size: '70%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Projects',
            color: '#64748B',
            formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0)
          }
        } 
      } 
    } 
  },
  tooltip: { theme: 'light' }
});

const updateChartTheme = () => {
  const textColor = isDark.value ? '#94A3B8' : '#64748B';
  const gridColor = isDark.value ? '#334155' : '#F1F5F9';
  const themeMode = isDark.value ? 'dark' : 'light';
  
  financeChartOptions.value = { 
    ...financeChartOptions.value, 
    xaxis: { ...financeChartOptions.value.xaxis, labels: { style: { colors: textColor } } }, 
    yaxis: { ...financeChartOptions.value.yaxis, labels: { style: { colors: textColor } } }, 
    grid: { borderColor: gridColor, strokeDashArray: 5 }, 
    theme: { mode: themeMode }, 
    tooltip: { theme: themeMode } 
  };
  
  statusChartOptions.value = { 
    ...statusChartOptions.value, 
    legend: { ...statusChartOptions.value.legend, labels: { colors: textColor } },
    plotOptions: { ...statusChartOptions.value.plotOptions, pie: { donut: { labels: { total: { color: textColor } } } } },
    tooltip: { theme: themeMode } 
  };
};

const fetchData = async () => {
  try {
    const userRes = await axios.get('/user');
    user.value = userRes.data;

    if (user.value.role === 'admin') {
      const [sumRes, projRes] = await Promise.all([
        axios.get('/finance/summary'),
        axios.get('/projects')
      ]);
      summary.value = sumRes.data;
      projects.value = projRes.data;

      // Update Chart X-Axis with actual Month Names
      if (summary.value.monthly_stats) {
        financeChartOptions.value = {
          ...financeChartOptions.value,
          xaxis: {
            ...financeChartOptions.value.xaxis,
            categories: summary.value.monthly_stats.map(s => s.month)
          }
        };
      }

      updateChartTheme();
    } else {
      const empRes = await axios.get('/tasks/stats');
      empStats.value = empRes.data;
    }
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
  fetchData();
});
</script>

<style scoped>
/* GLOBAL & LAYOUT */
.top-navbar { position: fixed; top: 0; left: 0; width: 100%; height: 80px; background: var(--bg-nav); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.nav-inner { width: 100%; max-width: 1400px; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; }
.brand-box { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 1.3rem; color: var(--text-main); }
.logo-icon { width: 40px; height: 40px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
.nav-links { display: flex; background: var(--bg-input); padding: 5px; border-radius: 14px; gap: 5px; border: 1px solid var(--border); }
.nav-item { background: transparent; border: none; padding: 8px 24px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; color: var(--text-body); cursor: pointer; transition: 0.2s; }
.nav-item.active { background: var(--bg-surface); color: var(--text-main); box-shadow: var(--shadow-sm); }
.nav-item:hover:not(.active) { color: var(--primary); background: rgba(0,0,0,0.02); }
.user-actions { display: flex; align-items: center; gap: 16px; }
.icon-btn { background: var(--bg-surface); border: 1px solid var(--border); width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; }
.user-name { font-weight: 700; color: var(--text-main); display: block; }
.user-role { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }
.avatar { width: 42px; height: 42px; background: var(--text-main); color: var(--bg-surface); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; }

.main-content { padding-top: 120px; padding-bottom: 60px; max-width: 1400px; margin: 0 auto; padding-left: 40px; padding-right: 40px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
.header-text h1 { font-size: 2.2rem; font-weight: 800; color: var(--text-main); margin: 0; }
.header-text p { color: var(--text-secondary); margin-top: 6px; }
.date-pill { background: var(--bg-surface); border: 1px solid var(--border); padding: 8px 16px; border-radius: 30px; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary); }

/* WIDGETS */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 30px; }
.kpi-card { background: var(--bg-surface); padding: 24px; border-radius: 20px; display: flex; align-items: center; gap: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); cursor: pointer; transition: 0.3s; }
.kpi-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--primary); }
.icon-wrapper { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.income { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.expense { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
.project { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
.pending { background: rgba(239, 68, 68, 0.1); }
.progress { background: rgba(59, 130, 246, 0.1); }
.kpi-data { flex: 1; }
.kpi-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block; }
.kpi-value { font-size: 1.6rem; font-weight: 800; color: var(--text-main); }

/* CHARTS & LISTS */
.charts-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; }
.chart-card { background: var(--bg-surface); padding: 30px; border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.chart-header h3 { margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main); }

/* Custom Legend */
.legend-custom { display: flex; gap: 15px; font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 5px; }
.dot.inc { background: #10B981; }
.dot.exp { background: #F43F5E; }

/* EMPLOYEE TASK LIST */
.emp-section { background: var(--bg-surface); padding: 30px; border-radius: 24px; border: 1px solid var(--border); }
.emp-section h3 { margin: 0 0 20px 0; color: var(--text-main); }
.empty-state { text-align: center; color: var(--text-secondary); padding: 20px; }
.task-list { display: flex; flex-direction: column; gap: 10px; }
.task-row { display: flex; align-items: center; justify-content: space-between; padding: 15px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg-input); }
.t-info { display: flex; flex-direction: column; }
.t-info strong { color: var(--text-main); font-size: 0.95rem; }
.t-info small { color: var(--text-muted); }
.t-due { font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; }
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.pending { background: var(--warning-bg); color: var(--warning-text); }
.in-progress { background: #DBEAFE; color: #1E40AF; }

@media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .nav-links { display: none; } .page-header { flex-direction: column; align-items: flex-start; gap: 15px; } }
</style>