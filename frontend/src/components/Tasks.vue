<template>
  <div class="tasks-page">
    <header class="page-header">
      <div class="header-left">
        <h1>My Tasks</h1>
        <p>Manage your daily assignments.</p>
      </div>
      <div class="header-right">
        <!-- ONLY ADMIN CAN ASSIGN TASKS -->
        <button v-if="isAdmin" @click="openAssignModal" class="btn primary">+ Assign Task</button>
      </div>
    </header>

    <div class="task-sections">
      <!-- SECTION 1: TASKS ASSIGNED TO ME -->
      <section class="task-column">
        <h3 class="col-title">Assigned to Me</h3>
        <div v-if="myTasks.length === 0" class="empty-col">
          <div class="empty-icon">📂</div>
          <p>No tasks assigned to you yet.</p>
        </div>
        <div v-for="task in myTasks" :key="task.id" class="task-card">
          <div class="card-header">
            <h4>{{ task.title }}</h4>
            <span :class="['status-badge', task.status.toLowerCase().replace(' ', '-')]">{{ task.status }}</span>
          </div>
          <p class="task-desc">{{ task.description || 'No description provided.' }}</p>
          <div class="meta">
            <span class="date">📅 Due: {{ formatDate(task.due_date) }}</span>
            <span class="creator">By: {{ task.creator?.name }}</span>
          </div>
          <div class="actions">
            <label>Update Status:</label>
            <select v-model="task.status" @change="updateStatus(task)" class="status-select">
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </section>

      <!-- SECTION 2: TASKS ASSIGNED BY ME (ADMIN ONLY) -->
      <section v-if="isAdmin" class="task-column">
        <h3 class="col-title">Assigned by Me</h3>
        <div v-if="assignedByMe.length === 0" class="empty-col">
          <div class="empty-icon">📝</div>
          <p>You haven't assigned any tasks.</p>
        </div>
        <div v-for="task in assignedByMe" :key="task.id" class="task-card">
          <div class="card-header">
            <h4>{{ task.title }}</h4>
            <span :class="['status-badge', task.status.toLowerCase().replace(' ', '-')]">{{ task.status }}</span>
          </div>
          <p class="task-desc">{{ task.description }}</p>
          <div class="meta">
            <span class="assignee">👤 To: <strong>{{ task.assignee?.name }}</strong></span>
            <span class="date">📅 {{ formatDate(task.due_date) }}</span>
          </div>
          <div class="actions admin-actions">
            <!-- Admins can also update status if needed -->
            <select v-model="task.status" @change="updateStatus(task)" class="status-select small">
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </section>
    </div>

    <!-- NEW TASK MODAL -->
    <div v-if="showTaskModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Assign New Task</h3>
          <button @click="showTaskModal = false" class="close-btn">×</button>
        </div>
        <form @submit.prevent="saveTask">
          <div class="form-group">
            <label>Task Title</label>
            <input type="text" v-model="form.title" required placeholder="e.g. Site Survey" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="form.description" rows="3" placeholder="Task details..."></textarea>
          </div>
          <div class="form-group">
            <label>Assign To</label>
            <select v-model="form.assigned_to" required>
              <option value="" disabled>Select User</option>
              <option v-for="u in users" :key="u.id" :value="u.id">
                {{ u.name }} ({{ u.role }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" v-model="form.due_date" required />
          </div>
          <button type="submit" class="btn-save full-width">Assign Task</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const myTasks = ref([]);
const assignedByMe = ref([]);
const users = ref([]);
const showTaskModal = ref(false);
const isAdmin = ref(false); // Default to false, check on load

const form = ref({ title: '', description: '', assigned_to: '', due_date: '' });

const loadPageData = async () => {
  try {
    // 1. Check User Role directly from API to ensure security
    const userRes = await axios.get('/user');
    isAdmin.value = userRes.data.role === 'admin';

    // 2. Fetch Tasks
    const taskRes = await axios.get('/tasks');
    myTasks.value = taskRes.data.my_tasks;
    assignedByMe.value = taskRes.data.assigned_by_me || [];

  } catch (e) {
    console.error("Failed to load task data", e);
  }
};

const openAssignModal = async () => {
  if (users.value.length === 0) {
    try {
      const res = await axios.get('/users-list');
      users.value = res.data;
    } catch (e) {
      alert("Failed to load users list.");
      return;
    }
  }
  showTaskModal.value = true;
};

const saveTask = async () => {
  try {
    await axios.post('/tasks', form.value);
    showTaskModal.value = false;
    form.value = { title: '', description: '', assigned_to: '', due_date: '' };
    loadPageData(); // Refresh list
  } catch (e) {
    alert("Failed to assign task");
  }
};

const updateStatus = async (task) => {
  try {
    await axios.put(`/tasks/${task.id}`, { status: task.status });
  } catch (e) {
    alert("Update failed");
  }
};

const formatDate = (d) => new Date(d).toLocaleDateString();

onMounted(loadPageData);
</script>

<style scoped>
.tasks-page { padding: 40px; max-width: 1400px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
h1 { color: var(--text-main); font-size: 2rem; font-weight: 800; margin: 0; }
p { color: var(--text-secondary); margin-top: 5px; }

.task-sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 30px; }
.task-column { display: flex; flex-direction: column; gap: 15px; }
.col-title { font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 10px; font-weight: 700; border-bottom: 2px solid var(--border); padding-bottom: 10px; }

/* Empty State */
.empty-col { text-align: center; padding: 40px; background: var(--bg-surface); border-radius: 16px; border: 2px dashed var(--border); color: var(--text-muted); }
.empty-icon { font-size: 2rem; margin-bottom: 10px; opacity: 0.5; }

/* Cards */
.task-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; box-shadow: var(--shadow-sm); transition: 0.2s; position: relative; }
.task-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--primary); }

.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
h4 { margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700; }

.status-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.pending { background: var(--warning-bg); color: var(--warning-text); }
.in-progress { background: #DBEAFE; color: #1E40AF; }
.completed { background: var(--success-bg); color: var(--success-text); }

.task-desc { font-size: 0.9rem; color: var(--text-body); margin-bottom: 15px; line-height: 1.5; white-space: pre-wrap; }

.meta { display: flex; flex-direction: column; gap: 5px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 15px; border-top: 1px solid var(--border); padding-top: 10px; }
.meta span { display: flex; align-items: center; gap: 5px; }
.meta strong { color: var(--text-main); }

.actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.actions label { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); }

.status-select { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-input); color: var(--text-main); font-size: 0.9rem; cursor: pointer; }
.status-select.small { padding: 4px 8px; font-size: 0.8rem; }

/* Modal Reuse */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-card { background: var(--bg-surface); padding: 35px; border-radius: 24px; width: 450px; border: 1px solid var(--border); box-shadow: var(--shadow-lg); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { color: var(--text-main); margin: 0; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: var(--text-secondary); }
input, select, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border); box-sizing: border-box; background: var(--bg-input); color: var(--text-main); font-family: inherit; }
.btn { padding: 12px 20px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; }
.primary { background: var(--primary); color: white; }
.btn-save { background: var(--text-main); color: var(--bg-surface); padding: 15px; width: 100%; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; margin-top: 10px; }
.full-width { width: 100%; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>