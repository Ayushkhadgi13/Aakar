<template>
  <div class="dashboard-wrapper">
    <!-- TOP NAVIGATION BAR -->
    <nav class="top-navbar">
      <div class="nav-container">
        <div class="brand-box">
          <div class="logo-icon">A</div>
          <div class="brand-text">
            <span class="logo-main">AAKAR</span>
            <span class="logo-sub">CONSTRUCTION</span>
          </div>
        </div>

      <!-- Inside your nav-menu ul -->
      <ul class="nav-menu">
          <li @click="router.push('/dashboard')" :class="{ active: $route.path === '/dashboard' }">
             <i class="icon-overview"></i> Overview
          </li>
          <li @click="router.push('/finance')" :class="{ active: $route.path === '/finance' }">
            <i class="icon-finance"></i> Finance
          </li>
           <li @click="router.push('/projects')" :class="{ active: $route.path === '/projects' }">
              <i class="icon-projects"></i> Projects
            </li>
           <li><i class="icon-inventory"></i> Inventory</li>
      </ul>
        <div class="user-actions">
          <div class="user-profile">
            <div class="avatar">{{ user?.name?.charAt(0) }}</div>
            <div class="user-info">
              <span class="u-name">{{ user?.name }}</span>
              <span class="u-role">Administrator</span>
            </div>
          </div>
          <button @click="logout" class="logout-pill">Sign Out</button>
        </div>
      </div>
    </nav>

    <!-- MAIN CONTENT AREA -->
    <main class="main-stage">
      <router-view v-if="$route.path !== '/dashboard'"></router-view>
      
      <div v-else class="overview-layout">
        <header class="content-header">
          <div class="welcome-msg">
            <h1>Workspace Overview</h1>
            <p>Welcome back, <strong>{{ user?.name }}</strong>. Here is what's happening today.</p>
          </div>
          <div class="date-display">{{ new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</div>
        </header>

        <!-- STATS GRID -->
        <div class="dashboard-grid">
          <!-- Financial Snapshot -->
          <div class="glass-card finance-card" @click="router.push('/finance')">
            <div class="card-label">Financial Snapshot</div>
            <div class="stat-flex">
              <div class="stat-group">
                <small>Monthly Income</small>
                <span class="val positive">Rs. {{ summary?.total_income?.toLocaleString() || 0 }}</span>
              </div>
              <div class="divider"></div>
              <div class="stat-group">
                <small>Monthly Expenses</small>
                <span class="val negative">Rs. {{ summary?.total_expense?.toLocaleString() || 0 }}</span>
              </div>
            </div>
            <div class="card-footer">View detailed analytics →</div>
          </div>

          <!-- Project Status Placeholder -->
          <div class="glass-card info-card">
            <div class="card-label">Active Projects</div>
            <div class="big-num">04</div>
            <div class="progress-bar"><div class="fill" style="width: 65%"></div></div>
            <p class="status-note">2 projects nearing deadline</p>
          </div>

          <!-- Inventory Status Placeholder -->
          <div class="glass-card info-card">
            <div class="card-label">Inventory Alerts</div>
            <div class="alert-box">
              <span class="alert-icon">!</span>
              <p>Low stock on Structural Steel (Site B)</p>
            </div>
            <div class="card-footer">Check Inventory</div>
          </div>
        </div>

        <!-- RECENT ACTIVITY TABLE MOCKUP -->
        <div class="recent-activity-section glass-card">
          <div class="card-label">Recent Project Logs</div>
          <div class="mock-table">
            <div class="t-row header">
              <span>Project Name</span>
              <span>Supervisor</span>
              <span>Status</span>
              <span>Update</span>
            </div>
            <div class="t-row empty">
              <p>No recent activity logs found for this week.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const user = ref(null);
const summary = ref(null);

const fetchData = async () => {
  try {
    const userRes = await axios.get('/user');
    user.value = userRes.data;

    try {
      const sumRes = await axios.get('/finance/summary');
      summary.value = sumRes.data;
    } catch (e) {
      console.error("Finance summary load failed");
    }
  } catch (e) {
    localStorage.clear();
    router.push('/login');
  }
};

const logout = async () => {
  try {
    await axios.post('/logout');
  } catch (e) {}
  localStorage.clear();
  router.push('/login');
};

onMounted(fetchData);
</script>

<style scoped>
.dashboard-wrapper {
  min-height: 100vh;
  background-color: #f4f7f9;
  font-family: 'Inter', system-ui, sans-serif;
}

/* TOP NAVBAR */
.top-navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 70px;
  background: #1a252f;
  color: white;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 30px;
}

.brand-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  background: var(--primary-color);
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  border-radius: 6px;
  font-size: 1.2rem;
}

.logo-main {
  display: block;
  font-weight: 800;
  letter-spacing: 2px;
  font-size: 1.1rem;
}

.logo-sub {
  font-size: 0.6rem;
  letter-spacing: 3px;
  color: #94a3b8;
  font-weight: bold;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 5px;
  margin: 0;
  padding: 0;
}

.nav-menu li {
  padding: 8px 20px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #cbd5e1;
  border-radius: 8px;
  transition: 0.2s;
  font-weight: 500;
}

.nav-menu li:hover, .nav-menu li.active {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-menu li.active {
  color: var(--primary-color);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 20px;
  border-right: 1px solid rgba(255,255,255,0.1);
}

.avatar {
  width: 35px;
  height: 35px;
  background: #34495e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: var(--primary-color);
  border: 2px solid rgba(255,255,255,0.1);
}

.user-info { display: flex; flex-direction: column; }
.u-name { font-size: 0.85rem; font-weight: 600; }
.u-role { font-size: 0.7rem; color: #94a3b8; }

.logout-pill {
  background: transparent;
  border: 1px solid #475569;
  color: white;
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: 0.2s;
}

.logout-pill:hover {
  background: #e74c3c;
  border-color: #e74c3c;
}

/* MAIN CONTENT */
.main-stage {
  padding-top: 100px;
  padding-bottom: 50px;
  max-width: 1400px;
  margin: 0 auto;
  padding-left: 30px;
  padding-right: 30px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
}

.welcome-msg h1 { font-size: 2rem; margin: 0; color: #1e293b; font-weight: 800; }
.welcome-msg p { color: #64748b; margin: 5px 0 0; }
.date-display { font-size: 0.9rem; color: #94a3b8; font-weight: 500; }

/* GRID & CARDS */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 25px;
  margin-bottom: 30px;
}

.glass-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid #edf2f7;
  transition: transform 0.2s, box-shadow 0.2s;
}

.glass-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.card-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
  font-weight: 700;
  margin-bottom: 20px;
}

/* FINANCE CARD SPECIFIC */
.finance-card { cursor: pointer; border-left: 5px solid var(--primary-color); }
.stat-flex { display: flex; align-items: center; justify-content: space-around; margin-top: 10px; }
.stat-group { display: flex; flex-direction: column; }
.stat-group small { font-size: 0.7rem; color: #64748b; margin-bottom: 5px; }
.stat-group .val { font-size: 1.4rem; font-weight: 800; }
.positive { color: #10b981; }
.negative { color: #ef4444; }
.divider { width: 1px; height: 40px; background: #e2e8f0; }

/* INFO CARDS */
.big-num { font-size: 3rem; font-weight: 800; color: #1e293b; line-height: 1; margin-bottom: 15px; }
.progress-bar { width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.progress-bar .fill { height: 100%; background: var(--primary-color); }
.status-note { font-size: 0.85rem; color: #64748b; margin-top: 10px; }

.alert-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff5f5;
  padding: 12px;
  border-radius: 10px;
  color: #c53030;
  font-size: 0.85rem;
  font-weight: 500;
}

.alert-icon {
  background: #feb2b2;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
}

.card-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #f1f5f9;
  font-size: 0.8rem;
  color: var(--primary-color);
  font-weight: 600;
}

/* TABLE SECTION */
.recent-activity-section { margin-top: 10px; }
.mock-table { margin-top: 15px; }
.t-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
.t-row.header { color: #94a3b8; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
.t-row.empty { padding: 40px; text-align: center; color: #94a3b8; border: none; font-style: italic; }

@media (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .nav-menu { display: none; } /* Mobile optimization needed later */
}
</style>