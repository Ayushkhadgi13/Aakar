<template>
  <div class="employees-page">
    <header class="page-header">
      <div class="header-left">
        <h1>Employee Management</h1>
        <p>Manage system users and staff access.</p>
      </div>
      <div class="header-right">
        <button @click="showModal = true" class="btn primary">+ New Employee</button>
      </div>
    </header>

    <div class="table-container">
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

    <!-- NEW EMPLOYEE MODAL -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Create Employee</h3>
          <button @click="showModal = false" class="close-btn">×</button>
        </div>
        <p class="modal-hint">The employee's password will be their Date of Birth (YYYY-MM-DD).</p>
        
        <form @submit.prevent="saveEmployee">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" v-model="form.name" required placeholder="Jane Doe" />
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" v-model="form.email" required placeholder="jane@aakar.com" />
          </div>
          <div class="form-group">
            <label>Date of Birth (Password)</label>
            <input type="date" v-model="form.dob" required />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="form.role" required>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label>Monthly Salary (Optional)</label>
            <input type="number" v-model="form.salary" min="0" placeholder="Rs. 0" />
          </div>
          <button type="submit" class="btn-save full-width" :disabled="isSaving">
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

const router = useRouter();
const users = ref([]);
const showModal = ref(false);
const isSaving = ref(false);
const form = ref({ name: '', email: '', dob: '', role: 'user', salary: null });

const fetchUsers = async () => {
  try {
    const userRes = await axios.get('/user');
    // SECURITY CHECK
    if (userRes.data.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const res = await axios.get('/system/employees');
    users.value = res.data.users;
  } catch (e) {
    console.error("Failed to fetch employees", e);
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
    alert(e.response?.data?.message || "Failed to create employee.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(fetchUsers);
</script>

<style scoped>
.employees-page { padding: 40px; animation: fadeIn 0.4s ease-out; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
h1 { color: var(--text-main); font-size: 2rem; font-weight: 800; margin: 0; }
p { color: var(--text-secondary); margin-top: 5px; }

.table-container { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-sm); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: var(--bg-input); color: var(--text-secondary); padding: 16px 24px; text-align: left; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; }
.data-table td { padding: 16px 24px; border-bottom: 1px solid var(--border); color: var(--text-body); font-size: 0.95rem; }
.data-table tr:last-child td { border-bottom: none; }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 36px; height: 36px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; }
.role-badge { background: var(--bg-input); border: 1px solid var(--border); padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-main); }

.text-center { text-align: center; color: var(--text-muted); font-style: italic; }

/* MODAL */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-card { background: var(--bg-surface); padding: 35px; border-radius: 24px; width: 450px; border: 1px solid var(--border); box-shadow: var(--shadow-lg); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.modal-header h3 { color: var(--text-main); margin: 0; }
.modal-hint { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; background: var(--bg-input); padding: 8px 12px; border-radius: 8px; border: 1px dashed var(--border); }

.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: var(--text-secondary); }
input, select { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-input); color: var(--text-main); box-sizing: border-box; }
input:focus, select:focus { border-color: var(--primary); outline: none; }

.btn { padding: 12px 20px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; }
.primary { background: var(--primary); color: white; }
.btn-save { background: var(--text-main); color: var(--bg-surface); padding: 15px; width: 100%; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; margin-top: 10px; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); }
.full-width { width: 100%; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>