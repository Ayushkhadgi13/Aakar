<template>
  <div class="dashboard-wrapper">
    <nav class="top-navbar">
      <div class="nav-inner">
        <div class="brand-box clickable" @click="router.push('/dashboard')" title="Go to Dashboard">
          <div class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a2 2 0 0 1 1.95-1.2h2.9a2 2 0 0 1 1.95 1.2L13 21"></path><path d="M4.6 17h6.9"></path><path d="M15 21l-3.35-7.7a2 2 0 0 1 0-1.6l3.35-7.7a2 2 0 0 1 3.6 0l3.35 7.7a2 2 0 0 1 0 1.6L18.6 21"></path></svg>
          </div>
          <div class="brand-text">AAKAR</div>
        </div>

        <div class="nav-links">
          <button @click="router.push('/dashboard')" :class="['nav-item', { active: $route.path === '/dashboard' }]">Overview</button>
          <button v-if="user?.role === 'admin'" @click="router.push('/finance')" :class="['nav-item', { active: $route.path === '/finance' }]">Finance</button>
          <button v-if="user?.role === 'admin'" @click="router.push('/vendors')" :class="['nav-item', { active: $route.path === '/vendors' }]">Vendors</button>
          <button v-if="user?.role === 'admin'" @click="router.push('/reports/monthly')" :class="['nav-item', { active: $route.path === '/reports/monthly' }]">Reports</button>
          <button @click="router.push('/projects')" :class="['nav-item', { active: $route.path.startsWith('/projects') }]">Projects</button>
          <button @click="router.push('/tasks')" :class="['nav-item', { active: $route.path === '/tasks' }]">Tasks</button>
          <button v-if="user?.role === 'admin'" @click="router.push('/employees')" :class="['nav-item', { active: $route.path === '/employees' }]">Employees</button>
        </div>

        <div class="user-actions">
          <div class="notif-wrapper" @click.stop>
            <button class="icon-btn" @click="toggleNotifMenu">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
            </button>
            <div v-if="showNotifMenu" class="notif-dropdown">
              <div class="notif-header">
                <strong>Notifications</strong>
                <button v-if="notifications.length > 0" @click="markAllRead" class="text-xs">Mark all read</button>
              </div>
              <div v-if="notifications.length === 0" class="notif-empty">No new notifications</div>
              <div class="notif-list" v-else>
                <div v-for="notif in notifications" :key="notif.id" class="notif-item" @click="markAsRead(notif.id)">
                  <p class="n-title">{{ notif.data.title }}</p>
                  <p class="n-msg">{{ notif.data.message }}</p>
                  <span class="n-time">{{ new Date(notif.created_at).toLocaleDateString() }}</span>
                </div>
              </div>
            </div>
          </div>

          <button @click="toggleTheme" class="icon-btn theme-btn">
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          </button>

          <div class="divider"></div>

          <div class="profile-info">
            <span class="user-name">{{ user?.name || 'User' }}</span>
            <span class="user-role">{{ user?.role?.toUpperCase() || 'LOADING...' }}</span>
          </div>

          <div class="avatar-wrapper" @click.stop>
            <div class="avatar clickable" @click="toggleProfileMenu" title="View Profile Info">
              {{ user?.name?.charAt(0) || 'U' }}
            </div>
            <div v-if="showProfileMenu" class="profile-dropdown">
              <div class="dropdown-header">
                <strong>{{ user?.name }}</strong>
                <span>{{ user?.email }}</span>
              </div>
              <div class="dropdown-body">
                <div class="info-row">
                  <span class="info-label">Role</span>
                  <span class="info-value">{{ user?.role?.toUpperCase() }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Joined</span>
                  <span class="info-value">{{ user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>

          <button @click="logout" class="icon-btn logout-btn" title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in"><component :is="Component" /></transition>
      </router-view>

      <div v-if="$route.path === '/dashboard' && user?.role === 'admin'" class="overview-container">
        <header class="page-header">
          <div class="header-text">
            <h1>Overview</h1>
            <p>Financial performance and project metrics for {{ todayDate }}</p>
          </div>
        </header>

        <div class="kpi-grid">
          <div class="kpi-card" @click="router.push('/finance')">
            <div class="kpi-header">
              <span class="kpi-label">Total Revenue</span>
              <div class="icon-wrapper income">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              </div>
            </div>
            <div class="kpi-value">Rs. {{ summary?.total_income?.toLocaleString() || 0 }}</div>
          </div>
          <div class="kpi-card" @click="router.push('/finance')">
            <div class="kpi-header">
              <span class="kpi-label">Total Expenses</span>
              <div class="icon-wrapper expense">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
            </div>
            <div class="kpi-value">Rs. {{ summary?.total_expense?.toLocaleString() || 0 }}</div>
          </div>
          <div class="kpi-card" @click="router.push('/projects')">
            <div class="kpi-header">
              <span class="kpi-label">Active Projects</span>
              <div class="icon-wrapper project">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              </div>
            </div>
            <div class="kpi-value">{{ projects.length }}</div>
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
            <apexchart type="bar" height="300" :options="financeChartOptions" :series="financeSeries"></apexchart>
          </div>
          <div class="chart-card side-chart">
            <div class="chart-header"><h3>Project Status</h3></div>
            <apexchart type="donut" height="300" :options="statusChartOptions" :series="statusSeries"></apexchart>
          </div>
        </div>
      </div>

      <div v-if="$route.path === '/dashboard' && user?.role !== 'admin'" class="overview-container">
        <header class="page-header">
          <div class="header-text">
            <h1>Welcome, {{ user?.name.split(' ')[0] }}</h1>
            <p>Your daily work summary for {{ todayDate }}</p>
          </div>
        </header>

        <div class="kpi-grid">
          <div class="kpi-card" @click="router.push('/tasks')">
            <div class="kpi-header">
              <span class="kpi-label">Pending Tasks</span>
              <div class="icon-wrapper pending"><span style="font-size: 1rem">⏳</span></div>
            </div>
            <div class="kpi-value">{{ empStats?.pending_count || 0 }}</div>
          </div>
          <div class="kpi-card" @click="router.push('/tasks')">
             <div class="kpi-header">
              <span class="kpi-label">In Progress</span>
              <div class="icon-wrapper progress"><span style="font-size: 1rem">🏃</span></div>
            </div>
            <div class="kpi-value">{{ empStats?.in_progress_count || 0 }}</div>
          </div>
          <div class="kpi-card" @click="router.push('/projects')">
            <div class="kpi-header">
              <span class="kpi-label">Active Projects</span>
              <div class="icon-wrapper project">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              </div>
            </div>
            <div class="kpi-value">{{ empStats?.active_projects || 0 }}</div>
          </div>
        </div>

        <div class="emp-section">
          <h3>Upcoming Deadlines</h3>
          <div v-if="!empStats?.recent_tasks || empStats.recent_tasks.length === 0" class="empty-state">
            <p>No pending tasks currently assigned.</p>
          </div>
          <div v-else class="task-list">
            <div v-for="task in empStats.recent_tasks" :key="task.id" class="task-row">
              <div class="t-info">
                <strong>{{ task.title }}</strong>
                <small>{{ task.description }}</small>
              </div>
              <div class="t-due">Due: {{ new Date(task.due_date).toLocaleDateString() }}</div>
              <span :class="['status-badge', task.status.toLowerCase().replace(' ', '-')]">{{ task.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import apexchart from "vue3-apexcharts";
import { useAuth } from '../useAuth';

const router = useRouter();

const { user, notifications, unreadCount, loadUser, markAsRead, markAllRead, logout } = useAuth();

const summary = ref(null);
const projects = ref([]);
const empStats = ref(null);
const isDark = ref(localStorage.getItem('theme') === 'dark');
const showProfileMenu = ref(false);
const showNotifMenu = ref(false);
const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const toggleProfileMenu = () => { showProfileMenu.value = !showProfileMenu.value; showNotifMenu.value = false; };
const toggleNotifMenu = () => { showNotifMenu.value = !showNotifMenu.value; showProfileMenu.value = false; };
const closeMenus = () => { showProfileMenu.value = false; showNotifMenu.value = false; };

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

const financeSeries = computed(() => [
  { name: 'Income', data: summary.value?.monthly_stats?.map(s => s.income) || [] },
  { name: 'Expense', data: summary.value?.monthly_stats?.map(s => s.expense) || [] }
]);

const financeChartOptions = ref({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Plus Jakarta Sans' },
  colors: ['#10B981', '#EF4444'],
  plotOptions: { bar: { horizontal: false, columnWidth: '30%', borderRadius: 4, borderRadiusApplication: 'end' } },
  dataLabels: { enabled: false },
  stroke: { show: false },
  xaxis: { 
    categories: [], 
    axisBorder: { show: false }, 
    axisTicks: { show: false }, 
    labels: { style: { colors: '#94A3B8', fontSize: '12px', fontWeight: 500 } } 
  },
  yaxis: { 
    labels: { style: { colors: '#94A3B8', fontSize: '12px', fontWeight: 500 }, formatter: (val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val } 
  },
  grid: { show: false },
  legend: { show: false },
  tooltip: { theme: 'light', y: { formatter: (val) => `Rs. ${val.toLocaleString()}` } }
});

const statusSeries = computed(() => {
  if (!projects.value.length) return [];
  const counts = { 'In Progress': 0, 'Upcoming': 0, 'Completed': 0, 'On Hold': 0 };
  projects.value.forEach(p => counts[p.status]++);
  return Object.values(counts);
});

const statusChartOptions = ref({
  labels: ['In Progress', 'Upcoming', 'Completed', 'On Hold'],
  colors: ['#F59E0B', '#94A3B8', '#10B981', '#EF4444'],
  legend: { position: 'bottom', markers: { radius: 12 }, itemMargin: { horizontal: 10, vertical: 5 }, labels: { colors: '#64748B' } },
  dataLabels: { enabled: false },
  stroke: { show: false },
  plotOptions: { pie: { donut: { size: '75%', labels: { show: true, total: { show: true, label: 'Projects', color: '#64748B', formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) } } } } },
  tooltip: { theme: 'light' }
});

const updateChartTheme = () => {
  const textColor = isDark.value ? '#94A3B8' : '#64748B';
  const themeMode = isDark.value ? 'dark' : 'light';
  financeChartOptions.value = { ...financeChartOptions.value, xaxis: { ...financeChartOptions.value.xaxis, labels: { style: { colors: textColor } } }, yaxis: { ...financeChartOptions.value.yaxis, labels: { style: { colors: textColor } } }, theme: { mode: themeMode }, tooltip: { theme: themeMode } };
  statusChartOptions.value = { ...statusChartOptions.value, legend: { ...statusChartOptions.value.legend, labels: { colors: textColor } }, plotOptions: { ...statusChartOptions.value.plotOptions, pie: { donut: { labels: { total: { color: textColor } } } } }, tooltip: { theme: themeMode } };
};

const fetchDashboardData = async () => {
  await loadUser();

  if (user.value?.role === 'admin') {
    const [sumRes, projRes] = await Promise.all([
      axios.get('/finance/summary'),
      axios.get('/projects')
    ]);
    summary.value = sumRes.data;
    projects.value = projRes.data;
    if (summary.value.monthly_stats) {
      financeChartOptions.value = {
        ...financeChartOptions.value,
        xaxis: { ...financeChartOptions.value.xaxis, categories: summary.value.monthly_stats.map(s => s.month) }
      };
    }
    updateChartTheme();
  } else {
    const empRes = await axios.get('/tasks/stats');
    empStats.value = empRes.data;
  }
};

onMounted(() => {
  applyTheme();
  fetchDashboardData();
  document.addEventListener('click', closeMenus);
});

onUnmounted(() => {
  document.removeEventListener('click', closeMenus);
});
</script>

<style scoped>
.top-navbar { position: fixed; top: 0; left: 0; width: 100%; height: 74px; background: color-mix(in srgb, var(--bg-surface) 88%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 88%, transparent); backdrop-filter: blur(14px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.nav-inner { width: 100%; max-width: 1200px; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; }
.brand-box { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.1rem; letter-spacing: 1px; color: var(--text-main); }
.brand-box.clickable { cursor: pointer; transition: opacity 0.2s; }
.brand-box.clickable:hover { opacity: 0.7; }
.logo-icon { width: 32px; height: 32px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; border-radius: 8px; }

.nav-links { display: flex; gap: 10px; padding: 6px; border-radius: 14px; background: color-mix(in srgb, var(--bg-surface) 68%, var(--bg-input) 32%); border: 1px solid var(--border); }
.nav-item { background: transparent; border: none; padding: 10px 14px; font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: 0.2s; position: relative; border-radius: 10px; }
.nav-item::after { display: none; }
.nav-item:hover { color: var(--text-main); background: var(--bg-surface); }
.nav-item.active { color: var(--text-main); background: var(--bg-surface); box-shadow: 0 8px 18px -18px rgba(0,0,0,0.6); }

.user-actions { display: flex; align-items: center; gap: 16px; }
.divider { width: 1px; height: 24px; background: var(--border); margin: 0 8px; }

.icon-btn { background: transparent; border: none; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; position: relative; transition: background 0.2s; }
.icon-btn:hover { background: var(--bg-input); color: var(--text-main); }
.notif-badge { position: absolute; top: 4px; right: 4px; background: var(--danger-text); color: white; font-size: 9px; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; font-weight: bold; }

.profile-info { display: flex; flex-direction: column; align-items: flex-end; }
.user-name { font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
.user-role { font-size: 0.7rem; color: var(--text-muted); font-weight: 500; letter-spacing: 0.5px; }

.notif-wrapper, .avatar-wrapper { position: relative; }
.notif-dropdown, .profile-dropdown { position: absolute; top: 50px; right: 0; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow-md); width: 320px; z-index: 2000; overflow: hidden; animation: fadeIn 0.15s ease; text-align: left; }
.profile-dropdown { width: 220px; }

.notif-header, .dropdown-header { padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.notif-header strong { font-size: 0.9rem; color: var(--text-main); }
.text-xs { font-size: 0.75rem; color: var(--primary); background: none; border: none; cursor: pointer; font-weight: 600; }
.notif-empty { padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem; }
.notif-list { max-height: 300px; overflow-y: auto; }
.notif-item { padding: 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s; }
.notif-item:hover { background: var(--bg-input); }
.n-title { font-weight: 600; font-size: 0.85rem; margin: 0 0 4px; color: var(--text-main); }
.n-msg { font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 8px; line-height: 1.4; }
.n-time { font-size: 0.7rem; color: var(--text-muted); }

.avatar { width: 36px; height: 36px; background: var(--primary); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.9rem; }
.avatar.clickable { cursor: pointer; transition: opacity 0.2s; }
.avatar.clickable:hover { opacity: 0.85; }

.dropdown-header { flex-direction: column; align-items: flex-start; gap: 4px; background: var(--bg-input); }
.dropdown-header strong { color: var(--text-main); font-size: 0.95rem; }
.dropdown-header span { font-size: 0.8rem; color: var(--text-secondary); }
.dropdown-body { padding: 16px; }
.info-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
.info-row:last-child { margin-bottom: 0; }
.info-label { font-size: 0.8rem; color: var(--text-secondary); }
.info-value { font-size: 0.8rem; color: var(--text-main); font-weight: 600; }

.main-content { padding-top: 108px; padding-bottom: 60px; max-width: 1200px; margin: 0 auto; padding-left: 40px; padding-right: 40px; }

.page-header { margin-bottom: 40px; }
.header-text h1 { font-size: 1.95rem; font-weight: 800; color: var(--text-main); margin: 0 0 8px 0; letter-spacing: -0.04em; }
.header-text p { color: var(--text-secondary); font-size: 0.95rem; margin: 0; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px; }
.kpi-card { background: color-mix(in srgb, var(--bg-surface) 82%, var(--bg-input) 18%); padding: 24px; border-radius: 18px; border: 1px solid var(--border); cursor: pointer; transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; gap: 16px; }
.kpi-card:hover { border-color: color-mix(in srgb, var(--primary) 45%, var(--border) 55%); transform: translateY(-2px); box-shadow: 0 16px 24px -20px rgba(0,0,0,0.35); }
.kpi-header { display: flex; justify-content: space-between; align-items: center; }
.kpi-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
.kpi-value { font-size: 1.8rem; font-weight: 700; color: var(--text-main); line-height: 1; }

.icon-wrapper { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.income { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.expense { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
.project { background: rgba(166, 93, 67, 0.1); color: var(--primary); }
.pending { background: rgba(245, 158, 11, 0.1); }
.progress { background: rgba(59, 130, 246, 0.1); }

.charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
.chart-card { background: var(--bg-surface); padding: 24px; border-radius: 18px; border: 1px solid var(--border); }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.chart-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main); }
.legend-custom { display: flex; gap: 16px; font-size: 0.8rem; color: var(--text-secondary); }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
.dot.inc { background: #10B981; }
.dot.exp { background: #EF4444; }

.emp-section { background: var(--bg-surface); padding: 24px; border-radius: 18px; border: 1px solid var(--border); }
.emp-section h3 { margin: 0 0 24px 0; color: var(--text-main); font-size: 1.1rem; font-weight: 600; }
.empty-state { text-align: center; color: var(--text-muted); padding: 32px 0; font-size: 0.9rem; }

.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-row { display: flex; align-items: center; justify-content: space-between; padding: 16px; border: 1px solid var(--border); border-radius: 14px; background: transparent; transition: background 0.2s, border-color 0.2s; }
.task-row:hover { background: var(--bg-input); border-color: color-mix(in srgb, var(--primary) 35%, var(--border) 65%); }
.t-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.t-info strong { color: var(--text-main); font-size: 0.95rem; font-weight: 600; }
.t-info small { color: var(--text-secondary); font-size: 0.8rem; }
.t-due { font-size: 0.85rem; color: var(--text-secondary); width: 120px; text-align: right; margin-right: 24px; }

.status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: var(--bg-input); color: var(--text-body); border: 1px solid var(--border); width: 100px; text-align: center; }
.in-progress { background: rgba(59, 130, 246, 0.1); color: #2563EB; border-color: transparent; }
.pending { background: rgba(245, 158, 11, 0.1); color: #D97706; border-color: transparent; }
.completed { background: rgba(16, 185, 129, 0.1); color: #059669; border-color: transparent; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 1024px) { 
  .charts-grid { grid-template-columns: 1fr; } 
  .nav-links { display: none; } 
  .nav-inner { padding: 0 20px; }
  .main-content { padding-left: 20px; padding-right: 20px; }
}
</style>
