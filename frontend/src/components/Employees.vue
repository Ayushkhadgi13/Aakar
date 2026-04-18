<template>
  <div class="employees-page">
    <header class="page-header">
      <div class="header-left">
        <span class="eyebrow">Team workspace</span>
        <h1>Employee Management</h1>
        <p>Manage system users, access levels, and payroll-ready staff records.</p>
      </div>
      <div class="header-right">
        <div class="header-stats">
          <div class="stat-chip">
            <span class="stat-label">Total staff</span>
            <strong>{{ users.length }}</strong>
          </div>
        </div>
        <button @click="showModal = true" class="btn primary">New Employee</button>
      </div>
    </header>

    <div class="table-container">
      <div class="table-header">
        <div>
          <h2>Directory</h2>
          <p>All active users in the system.</p>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="users.length === 0">
            <td colspan="4" class="text-center">No employees found.</td>
          </tr>
          <tr v-for="user in users" :key="user.id">
            <td>
              <div class="user-cell">
                <div class="avatar">{{ user.name.charAt(0) }}</div>
                <strong>{{ user.name }}</strong>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td><span class="role-badge">{{ user.role }}</span></td>
            <td>{{ new Date(user.created_at).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Create Employee</h3>
          <button @click="showModal = false" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <p class="modal-hint">The employee's password will be their date of birth in `YYYY-MM-DD` format.</p>

        <form @submit.prevent="saveEmployee">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" v-model="form.name" class="styled-input" required placeholder="Jane Doe" />
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" v-model="form.email" class="styled-input" required placeholder="jane@aakar.com" />
          </div>
          <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" v-model="form.dob" class="styled-input" required />
          </div>
          <div class="form-group">
            <label>Role</label>
            <div class="select-wrapper">
              <select v-model="form.role" class="styled-input" required>
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Monthly Salary</label>
            <input type="number" v-model="form.salary" class="styled-input" min="0" placeholder="Rs. 0" />
          </div>
          <button type="submit" class="btn primary full-width" :disabled="isSaving">
            {{ isSaving ? 'Creating Account...' : 'Create Employee' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useAuth } from '../useAuth';

const router = useRouter();
const { isAdmin, loadUser } = useAuth();
const users = ref([]);
const showModal = ref(false);
const isSaving = ref(false);
const form = ref({ name: '', email: '', dob: '', role: 'user', salary: null });

const fetchUsers = async () => {
  try {
    await loadUser();
    if (!isAdmin.value) {
      router.push('/dashboard');
      return;
    }
    const res = await axios.get('/system/employees');
    users.value = res.data.users;
  } catch (e) {
    console.error('Failed to fetch employees', e);
  }
};

const saveEmployee = async () => {
  isSaving.value = true;
  try {
    await axios.post('/system/employees', form.value);
    alert(`Employee ${form.value.name} created! Password is ${form.value.dob}`);
    showModal.value = false;
    form.value = { name: '', email: '', dob: '', role: 'user', salary: null };
    fetchUsers();
  } catch (e) {
    alert(e.response?.data?.message || 'Failed to create employee.');
  } finally {
    isSaving.value = false;
  }
};

onMounted(fetchUsers);
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
.data-table tbody tr { transition: background 0.2s ease; }
.data-table tbody tr:hover { background: color-mix(in srgb, var(--bg-surface) 75%, var(--bg-input) 25%); }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 38px; height: 38px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; }
.role-badge { background: var(--bg-input); border: 1px solid var(--border); padding: 6px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-main); letter-spacing: 0.06em; }
.text-center { text-align: center; color: var(--text-muted); }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.42); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
.modal-card { background: var(--bg-surface); padding: 32px; border-radius: 18px; width: 460px; border: 1px solid var(--border); box-shadow: 0 24px 50px rgba(0,0,0,0.12); max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.modal-header h3 { color: var(--text-main); margin: 0; font-size: 1.3rem; font-weight: 800; }
.modal-hint { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; background: var(--bg-input); padding: 10px 12px; border-radius: 10px; border: 1px dashed var(--border); }
.form-group { margin-bottom: 18px; display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 0.82rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.08em; }

.styled-input { appearance: none; -webkit-appearance: none; width: 100%; height: 48px; padding: 12px 16px; background: transparent; border: 1px solid var(--border); border-radius: 10px; color: var(--text-main); box-sizing: border-box; font-size: 0.98rem; transition: all 0.2s ease; }
.styled-input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1); background: var(--bg-surface); }
.select-wrapper { position: relative; }
.select-wrapper::after { content: ''; position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-size: contain; pointer-events: none; }
.select-wrapper select { padding-right: 48px; cursor: pointer; }

.btn { padding: 0 24px; height: 46px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.94rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.btn.primary { background: var(--primary); color: white; }
.btn.primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(166, 93, 67, 0.2); }
.btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
.close-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 8px; border-radius: 8px; }
.close-btn:hover { background: var(--bg-input); color: var(--text-main); }
.full-width { width: 100%; margin-top: 8px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 900px) {
  .page-header { flex-direction: column; align-items: stretch; }
  .header-right { flex-direction: column; align-items: stretch; }
}

@media (max-width: 768px) {
  .employees-page { padding: 24px 20px; }
  .data-table th,
  .data-table td { padding-left: 16px; padding-right: 16px; }
}
</style>
