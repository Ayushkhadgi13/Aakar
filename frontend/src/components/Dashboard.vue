<template>
  <div class="dashboard">
    <!-- Verification Alert Banner -->
    <div v-if="user && !user.email_verified_at" class="verify-banner">
      <span>Account not verified. Please check your email.</span>
      <button @click="resendEmail" :disabled="resending">{{ resending ? 'Sending...' : 'Resend' }}</button>
    </div>

    <nav class="sidebar">
      <div class="side-logo">AAKAR</div>
      <ul class="nav-links">
        <li class="active">Overview</li>
        <li>Projects</li>
        <li>Inventory</li>
      </ul>
      <button @click="logout" class="btn-logout">Sign Out</button>
    </nav>

    <main class="content">
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
const resending = ref(false);

const fetchUser = async () => {
  try {
    const response = await axios.get('/user');
    user.value = response.data;
  } catch (e) {
    router.push('/login');
  }
};

const resendEmail = async () => {
  resending.value = true;
  try {
    await axios.post('/email/verification-notification');
    alert('Sent!');
  } catch (e) {
    alert('Error sending mail.');
  } finally {
    resending.value = false;
  }
};

const logout = async () => {
  await axios.post('/logout');
  localStorage.clear();
  router.push('/login');
};

onMounted(fetchUser);
</script>

<style scoped>
.dashboard { display: flex; min-height: 100vh; background: #f8f8f6; }

.verify-banner {
  position: fixed; top: 0; left: 0; width: 100%; background: #A65D43;
  color: white; padding: 12px; text-align: center; z-index: 1000;
  display: flex; justify-content: center; align-items: center; gap: 15px; font-size: 0.9rem;
}
.verify-banner button { background: white; color: #A65D43; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; }

.sidebar { width: 260px; background: #2c3e50; color: white; padding: 2rem; display: flex; flex-direction: column; }
.side-logo { font-size: 1.5rem; font-weight: 800; letter-spacing: 3px; color: #A65D43; margin-bottom: 3rem; }
.nav-links { list-style: none; padding: 0; flex-grow: 1; }
.nav-links li { padding: 12px 0; color: #bdc3c7; cursor: pointer; transition: 0.3s; }
.nav-links li.active { color: white; font-weight: bold; }

.content { flex-grow: 1; padding: 4rem; margin-top: 20px; }
header h1 { color: #2c3e50; margin: 0; }
header p { color: #888; }

.grid { margin-top: 3rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
.card { background: white; padding: 2rem; border-radius: 8px; border: 1px solid #eee; }

.status-v { color: #27ae60; font-weight: bold; }
.status-p { color: #A65D43; font-weight: bold; }

.btn-logout { background: transparent; border: 1px solid #444; color: #bdc3c7; padding: 10px; cursor: pointer; }
</style>