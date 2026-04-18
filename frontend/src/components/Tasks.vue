<template>
  <div class="tasks-page">
    <header class="page-header">
      <div class="header-left">
        <span class="eyebrow">Task workspace</span>
        <h1>My Tasks</h1>
        <p>Track what needs attention and keep team handoffs tidy.</p>
      </div>
      <div class="header-right">
        <div class="header-stats">
          <div class="stat-chip">
            <span class="stat-label">Assigned to me</span>
            <strong>{{ myTasks.length }}</strong>
          </div>
          <div v-if="isAdmin" class="stat-chip">
            <span class="stat-label">Assigned by me</span>
            <strong>{{ assignedByMe.length }}</strong>
          </div>
        </div>
        <button v-if="isAdmin" @click="openAssignModal" class="btn primary">Assign Task</button>
      </div>
    </header>

    <div class="task-sections" :class="{'single-col': !isAdmin}">
      <section class="task-column">
        <div class="column-header">
          <div>
            <h3 class="col-title">Assigned to Me</h3>
            <p class="col-subtitle">{{ myTasks.length }} active item<span v-if="myTasks.length !== 1">s</span> in your queue.</p>
          </div>
        </div>

        <div class="column-body">
          <div v-if="myTasks.length === 0" class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <p>No tasks currently assigned to you.</p>
          </div>

          <article v-for="task in myTasks" :key="task.id" class="task-card">
            <div class="card-topline">
              <span class="meta-kicker">Assigned by {{ task.creator?.name || 'Unknown' }}</span>
              <span :class="['status-badge', task.status.toLowerCase().replace(' ', '-')]">{{ task.status }}</span>
            </div>
            <div class="card-header">
              <h4>{{ task.title }}</h4>
            </div>
            <p class="task-desc">{{ task.description || 'No description provided.' }}</p>

            <div class="meta-container">
              <div class="meta-row">
                <span class="meta-label">Due</span>
                <strong>{{ formatDateDisplay(task.due_date) }}</strong>
              </div>
              <div class="meta-row">
                <span class="meta-label">Created by</span>
                <strong>{{ task.creator?.name || 'Unknown' }}</strong>
              </div>
            </div>

            <div class="card-actions">
              <label>Status</label>
              <div class="select-wrapper small">
                <select v-model="task.status" @change="updateStatus(task)" class="styled-input small">
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section v-if="isAdmin" class="task-column">
        <div class="column-header">
          <div>
            <h3 class="col-title">Assigned by Me</h3>
            <p class="col-subtitle">A lightweight view of delegated work and due dates.</p>
          </div>
        </div>

        <div class="column-body">
          <div v-if="assignedByMe.length === 0" class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            <p>You haven't assigned any tasks.</p>
          </div>

          <article v-for="task in assignedByMe" :key="task.id" class="task-card">
            <div class="card-topline">
              <span class="meta-kicker">Assigned to {{ task.assignee?.name || 'Unknown' }}</span>
              <span :class="['status-badge', task.status.toLowerCase().replace(' ', '-')]">{{ task.status }}</span>
            </div>
            <div class="card-header">
              <h4>{{ task.title }}</h4>
            </div>
            <p class="task-desc">{{ task.description || 'No description provided.' }}</p>

            <div class="meta-container">
              <div class="meta-row">
                <span class="meta-label">Due</span>
                <strong>{{ formatDateDisplay(task.due_date) }}</strong>
              </div>
              <div class="meta-row">
                <span class="meta-label">Owner</span>
                <strong>{{ task.assignee?.name || 'Unknown' }}</strong>
              </div>
            </div>

            <div class="card-actions">
              <label>Status</label>
              <div class="select-wrapper small">
                <select v-model="task.status" @change="updateStatus(task)" class="styled-input small">
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- NEW TASK MODAL -->
    <div v-if="showTaskModal" class="modal-backdrop" @click.self="showTaskModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Assign New Task</h3>
          <button @click="showTaskModal = false" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <form @submit.prevent="saveTask">
          <div class="form-group">
            <label>Task Title</label>
            <input type="text" v-model="form.title" class="styled-input" required placeholder="e.g. Site Survey for Foundation" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="form.description" class="styled-input" rows="3" placeholder="Provide specific details about the assignment..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Assign To</label>
              <div class="select-wrapper">
                <select v-model="form.assigned_to" class="styled-input" required>
                  <option value="" disabled>Select User</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">
                    {{ u.name }} ({{ u.role }})
                  </option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Due Date</label>
              <div class="custom-date-box" @click="openPicker(dueDateRef)">
                <span :class="{'text-placeholder': !form.due_date}">
                  {{ form.due_date ? formatDateDisplay(form.due_date) : 'mm/dd/yyyy' }}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <input type="date" ref="dueDateRef" v-model="form.due_date" required class="hidden-date-input" />
              </div>
            </div>
          </div>
          <button type="submit" class="btn primary full-width" :disabled="isSaving">
            {{ isSaving ? 'Assigning...' : 'Assign Task' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuth } from '../useAuth';

const { isAdmin, loadUser } = useAuth();
const myTasks = ref([]);
const assignedByMe = ref([]);
const users = ref([]);
const showTaskModal = ref(false);
const isSaving = ref(false);
const form = ref({ title: '', description: '', assigned_to: '', due_date: '' });

const dueDateRef = ref(null);

// ----------------------------------------------------
// CALENDAR LOGIC
// ----------------------------------------------------
const openPicker = (inputElement) => {
  const target = inputElement?.value || inputElement;
  if (target && typeof target.showPicker === 'function') {
    target.showPicker();
  } else if (target) {
    target.focus();
  }
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
};

// ----------------------------------------------------
// DATA FETCHING & ACTIONS
// ----------------------------------------------------
const loadPageData = async () => {
  try {
    await loadUser();
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
  isSaving.value = true;
  try {
    await axios.post('/tasks', form.value);
    showTaskModal.value = false;
    form.value = { title: '', description: '', assigned_to: '', due_date: '' };
    loadPageData();
  } catch (e) { 
    alert("Failed to assign task"); 
  } finally {
    isSaving.value = false;
  }
};

const updateStatus = async (task) => {
  try {
    await axios.put(`/tasks/${task.id}`, { status: task.status });
  } catch (e) { 
    alert("Update failed"); 
  }
};

onMounted(loadPageData);
</script>

<style scoped>
/* PAGE LAYOUT */
.tasks-page { padding: 40px; max-width: 1280px; margin: 0 auto; animation: fadeIn 0.3s ease-out; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 32px; }
.eyebrow { display: inline-block; margin-bottom: 10px; color: var(--primary); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.header-left h1 { color: var(--text-main); font-size: 2.15rem; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.04em; }
.header-left p { color: var(--text-secondary); margin: 0; font-size: 0.98rem; max-width: 520px; }
.header-right { display: flex; align-items: center; gap: 14px; }
.header-stats { display: flex; align-items: center; gap: 12px; }
.stat-chip { min-width: 122px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-surface); display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.stat-chip strong { font-size: 1.1rem; color: var(--text-main); line-height: 1; }

/* TASK COLUMNS */
.task-sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; }
.task-sections.single-col { grid-template-columns: minmax(320px, 820px); justify-content: center; }
.task-column { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; min-height: 100%; }
.column-header { padding: 22px 24px 18px; border-bottom: 1px solid var(--border); }
.column-body { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
.col-title { font-size: 1.05rem; color: var(--text-main); margin: 0 0 6px 0; font-weight: 700; letter-spacing: -0.02em; }
.col-subtitle { margin: 0; color: var(--text-secondary); font-size: 0.88rem; }

/* EMPTY STATE */
.empty-state { text-align: center; padding: 56px 20px; background: transparent; border-radius: 14px; border: 1px dashed var(--border); color: var(--text-secondary); display: flex; flex-direction: column; align-items: center; gap: 16px; }
.empty-icon { color: var(--text-muted); opacity: 0.45; }

/* TASK CARDS */
.task-card { background: color-mix(in srgb, var(--bg-surface) 82%, var(--bg-input) 18%); border: 1px solid var(--border); border-radius: 16px; padding: 18px; transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; gap: 14px; }
.task-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--primary) 45%, var(--border) 55%); box-shadow: 0 16px 24px -20px rgba(0, 0, 0, 0.35); }
.card-topline { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.meta-kicker { color: var(--text-muted); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; }
.card-header h4 { margin: 0; font-size: 1.05rem; color: var(--text-main); font-weight: 700; line-height: 1.35; }

/* STATUS BADGE */
.status-badge { padding: 6px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
.pending { background: rgba(245, 158, 11, 0.12); color: #d97706; }
.in-progress { background: rgba(166, 93, 67, 0.12); color: var(--primary); }
.completed { background: rgba(16, 185, 129, 0.12); color: #059669; }

.task-desc { font-size: 0.93rem; color: var(--text-body); margin: 0; line-height: 1.6; white-space: pre-wrap; }

/* META DATA */
.meta-container { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.meta-row { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border-radius: 12px; background: var(--bg-input); border: 1px solid var(--border); }
.meta-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.meta-row strong { color: var(--text-main); font-size: 0.92rem; font-weight: 600; }

/* CARD ACTIONS */
.card-actions { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 2px; }
.card-actions label { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.08em; }

/* =========================================
   GLOBAL INPUT RESET & CUSTOM STYLING 
   ========================================= */
.styled-input {
  appearance: none; -webkit-appearance: none; width: 100%; height: 48px; padding: 12px 16px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--text-main); font-family: inherit; font-size: 1rem; transition: all 0.2s ease; box-sizing: border-box;
}
textarea.styled-input { height: auto; }
.styled-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1); background: var(--bg-surface); }
.styled-input.small { height: 40px; min-width: 160px; padding: 6px 36px 6px 12px; font-size: 0.85rem; font-weight: 600; background: var(--bg-surface); }

/* SVG WRAPPERS */
.select-wrapper { position: relative; width: 100%; }
.select-wrapper::after { content: ''; position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-size: contain; pointer-events: none; }
.select-wrapper.small::after { right: 10px; width: 14px; height: 14px; }
.select-wrapper select { padding-right: 48px; cursor: pointer; }

/* POP-OUT DATE PICKER */
.custom-date-box {
  position: relative; display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 16px; border: 1px solid var(--border); border-radius: 8px; background: transparent; cursor: pointer; transition: all 0.2s ease;
}
.custom-date-box:hover { border-color: var(--primary); }
.custom-date-box:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1); background: var(--bg-surface); }
.custom-date-box span { font-size: 1rem; color: var(--text-main); pointer-events: none; }
.custom-date-box span.text-placeholder { color: var(--text-muted); }
.custom-date-box svg { color: var(--text-secondary); pointer-events: none; }
.hidden-date-input { position: absolute; top: 100%; left: 0; width: 0; height: 0; opacity: 0; padding: 0; margin: 0; border: none; pointer-events: none; }


/* =========================================
   MODALS
   ========================================= */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.42); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeIn 0.2s ease; padding: 20px; }
.modal-card { background: var(--bg-surface); padding: 32px; border-radius: 18px; width: 500px; border: 1px solid var(--border); box-shadow: 0 24px 50px rgba(0,0,0,0.12); max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.modal-header h3 { color: var(--text-main); margin: 0; font-size: 1.4rem; font-weight: 800; }
.close-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 8px; border-radius: 8px; transition: 0.2s; }
.close-btn:hover { background: var(--bg-input); color: var(--text-main); }

/* FORMS IN MODALS */
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }

/* BUTTONS */
.btn { padding: 0 24px; height: 46px; border-radius: 10px; font-weight: 700; font-size: 0.94rem; cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; letter-spacing: 0.2px; }
.btn.primary { background: var(--primary); color: white; }
.btn.primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(166, 93, 67, 0.2); }
.btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
.full-width { width: 100%; margin-top: 10px;}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 900px) {
  .page-header { flex-direction: column; align-items: stretch; }
  .header-right { flex-direction: column; align-items: stretch; }
  .header-stats { width: 100%; }
  .stat-chip { flex: 1; }
}

@media (max-width: 768px) {
  .tasks-page { padding: 24px 20px; }
  .task-sections,
  .task-sections.single-col { grid-template-columns: 1fr; }
  .column-header { padding: 20px; }
  .column-body { padding: 14px; }
  .meta-container { grid-template-columns: 1fr; }
  .card-actions { flex-direction: column; align-items: stretch; }
  .form-row { grid-template-columns: 1fr; gap: 0; }
}
</style>
