<template>
  <div class="dashboard">
    <div v-if="user && !user.email_verified_at" class="verify-banner">
      <span>Account not verified. Please check your email.</span>
      <button @click="resendEmail" :disabled="resending">{{ resending ? 'Sending...' : 'Resend' }}</button>
    </div>

    <nav class="sidebar">
      <div class="side-logo">AAKAR</div>
      <ul class="nav-links">
        <li @click="router.push('/dashboard')" :class="{ active: $route.path === '/dashboard' }">Overview</li>
        <li @click="router.push('/finance')" :class="{ active: $route.path === '/finance' }">Finance</li>
        <li>Projects</li>
        <li>Inventory</li>
      </ul>
      <button @click="logout" class="btn-logout">Sign Out</button>
    </nav>

    <main class="content">
      <router-view v-if="$route.path !== '/dashboard'"></router-view>
      
      <div v-else>
        <header>
          <h1>Welcome, {{ user?.name }}</h1>
          <p>Architectural & Construction Management Dashboard</p>
        </header>

        <div class="grid">
          <div class="card">
            <h3>Verification Status</h3>
            <p :class="user?.email_verified_at ? 'status-v' : 'status-p'">
              {{ user?.email_verified_at ? '✓ Verified' : '⚠ Action Required' }}
            </p>
          </div>
          
          <div class="card finance-preview" @click="router.push('/finance')">
            <h3>Quick Cash Flow</h3>
            <div v-if="summary" class="summary-flex">
              <div class="sum-item">
                <small>Income</small>
                <span class="text-v">Rs. {{ summary.total_income }}</span>
              </div>
              <div class="sum-item">
                <small>Expenses</small>
                <span class="text-p">Rs. {{ summary.total_expense }}</span>
              </div>
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
const resending = ref(false);

const fetchData = async () => {
  try {
    const userRes = await axios.get('/user');
    user.value = userRes.data;
    const sumRes = await axios.get('/finance/summary');
    summary.value = sumRes.data;
  } catch (e) {
    router.push('/login');
  }
};

const logout = async () => {
  await axios.post('/logout');
  localStorage.clear();
  router.push('/login');
};

onMounted(fetchData);
</script>

<style scoped>
.dashboard { display: flex; min-height: 100vh; background: #f8f8f6; }
.verify-banner {
  position: fixed; top: 0; left: 0; width: 100%; background: var(--primary-color);
  color: white; padding: 12px; text-align: center; z-index: 1000;
  display: flex; justify-content: center; align-items: center; gap: 15px;
}
.verify-banner button { background: white; color: var(--primary-color); border: none; padding: 4px 12px; border-radius: 4px; font-weight: bold; }

.sidebar { width: 260px; background: #1a252f; color: white; padding: 2rem; display: flex; flex-direction: column; }
.side-logo { font-size: 1.5rem; font-weight: 800; letter-spacing: 3px; color: var(--primary-color); margin-bottom: 3rem; }
.nav-links { list-style: none; padding: 0; flex-grow: 1; }
.nav-links li { padding: 12px 15px; color: #bdc3c7; cursor: pointer; transition: 0.3s; border-radius: 6px; margin-bottom: 5px; }
.nav-links li:hover, .nav-links li.active { background: rgba(166, 93, 67, 0.1); color: var(--primary-color); font-weight: bold; }

.content { flex-grow: 1; padding: 3rem; overflow-y: auto; }
.grid { margin-top: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
.card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); cursor: pointer; }

.summary-flex { display: flex; gap: 20px; margin-top: 10px; }
.sum-item small { display: block; color: #777; font-size: 0.7rem; text-transform: uppercase; }
.sum-item span { font-size: 1.2rem; font-weight: bold; }

.text-v { color: #27ae60; }
.text-p { color: var(--primary-color); }
.status-v { color: #27ae60; font-weight: bold; }
.status-p { color: var(--primary-color); font-weight: bold; }
.btn-logout { background: transparent; border: 1px solid #444; color: #bdc3c7; padding: 10px; cursor: pointer; border-radius: 6px; }
</style>