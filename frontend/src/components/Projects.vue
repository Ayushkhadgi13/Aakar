<template>
  <div class="projects-page">
    <!-- PAGE HEADER -->
    <header class="page-header">
      <div class="header-left">
        <h1>Projects</h1>
        <p>Active construction sites and timelines.</p>
      </div>
      <div class="header-right">
        <div class="search-box">
          <i class="icon-search">🔍</i>
          <input type="text" v-model="searchQuery" @input="fetchProjects" placeholder="Search projects..." />
        </div>
        <button @click="showModal = true" class="btn primary">+ New Project</button>
      </div>
    </header>

    <!-- PROJECT GRID -->
    <div v-if="loading" class="loader-container">
        <div class="spinner"></div>
    </div>
    
    <div v-else class="project-grid">
      <div v-for="project in projects" :key="project.id" class="project-card" @click="goToDetails(project.id)">
        <div class="card-top">
          <span :class="['status-badge', project.status.toLowerCase().replace(' ', '-')]">
            {{ project.status }}
          </span>
          <div class="card-dots">•••</div>
        </div>

        <div class="card-content">
          <h3>{{ project.name }}</h3>
          <p class="client-name">Client: {{ project.client_name }}</p>
          <div class="location-tag">📍 {{ project.location || 'N/A' }}</div>
        </div>

        <div class="progress-section">
          <div class="progress-info">
            <span>Progress</span>
            <span>{{ project.progress }}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-fill" :style="{ width: project.progress + '%', background: getProgressColor(project.progress) }"></div>
          </div>
        </div>

        <div class="card-footer">
          <div class="footer-item">
            <small>Budget</small>
            <p>Rs. {{ Number(project.budget).toLocaleString() }}</p>
          </div>
          <div class="footer-item">
            <small>Start Date</small>
            <p>{{ new Date(project.start_date).toLocaleDateString() }}</p>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-if="projects.length === 0" class="empty-state">
        <div class="empty-icon">🏗️</div>
        <p>No projects found.</p>
      </div>
    </div>

    <!-- NEW PROJECT MODAL -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>New Project</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <form @submit.prevent="saveProject">
          <div class="form-group">
            <label>Project Name</label>
            <input type="text" v-model="form.name" required placeholder="e.g. Skyline Residency" />
          </div>
          <div class="form-group">
            <label>Client Name</label>
            <input type="text" v-model="form.client_name" required placeholder="Full name or company" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Location</label>
              <input type="text" v-model="form.location" placeholder="City/Site Area" />
            </div>
            <div class="form-group">
              <label>Budget (Rs.)</label>
              <input type="number" v-model="form.budget" required min="0" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" v-model="form.start_date" required />
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="form.status">
                <option value="Upcoming">Upcoming</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Initial Progress: {{ form.progress }}%</label>
            <input type="range" v-model.number="form.progress" min="0" max="100" class="range-slider" />
          </div>
          <div class="modal-footer">
            <button type="submit" class="btn-save full-width" :disabled="isSaving">
                {{ isSaving ? 'Saving...' : 'Create Project' }}
            </button>
          </div>
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
const projects = ref([]);
const searchQuery = ref('');
const showModal = ref(false);
const loading = ref(false);
const isSaving = ref(false);

const initialForm = {
  name: '', 
  client_name: '', 
  location: '', 
  budget: null,
  status: 'In Progress', 
  start_date: new Date().toISOString().split('T')[0],
  progress: 0
};

const form = ref({ ...initialForm });

const closeModal = () => {
    showModal.value = false;
    form.value = { ...initialForm };
};

const fetchProjects = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/projects', { params: { search: searchQuery.value } });
    projects.value = res.data;
  } catch (e) {
    console.error("Fetch Error:", e);
  } finally {
    loading.value = false;
  }
};

const saveProject = async () => {
  isSaving.value = true;
  try {
    await axios.post('/projects', form.value);
    closeModal();
    fetchProjects();
  } catch (e) {
    alert("Error saving project. Ensure all fields are valid.");
  } finally {
    isSaving.value = false;
  }
};

const goToDetails = (id) => {
  router.push(`/projects/${id}`);
};

const getProgressColor = (p) => {
  if (p < 30) return '#ef4444';
  if (p < 70) return '#f59e0b';
  return '#10b981';
};

onMounted(fetchProjects);
</script>

<style scoped>
.projects-page { animation: fadeIn 0.4s ease-out; }

/* HEADER */
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.page-header h1 { font-size: 2rem; font-weight: 800; color: var(--text-main); margin: 0; }
.page-header p { color: var(--text-secondary); margin-top: 5px; }

.header-right { display: flex; gap: 15px; }

/* SEARCH BOX */
.search-box {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  width: 300px;
  transition: 0.2s;
}
.search-box:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(166, 93, 67, 0.1); }
.search-box input { border: none; padding: 12px; outline: none; width: 100%; font-size: 0.95rem; color: var(--text-main); background: transparent; }
.icon-search { margin-right: 8px; filter: grayscale(1); opacity: 0.5; }

/* GRID */
.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 25px; }

.project-card {
  background: var(--bg-surface);
  border-radius: 20px;
  padding: 25px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s var(--ease-spring);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.project-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); border-color: var(--primary); }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.status-badge { padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.card-dots { color: var(--text-muted); }

/* Badge Colors */
.upcoming { background: var(--bg-input); color: var(--text-body); }
.in-progress { background: var(--warning-bg); color: var(--warning-text); }
.on-hold { background: var(--danger-bg); color: var(--danger-text); }
.completed { background: var(--success-bg); color: var(--success-text); }

.card-content h3 { font-size: 1.25rem; margin: 0; color: var(--text-main); font-weight: 700; line-height: 1.3; }
.client-name { font-size: 0.9rem; color: var(--text-secondary); margin: 5px 0 15px; }
.location-tag { font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 5px; background: var(--bg-input); padding: 6px 10px; border-radius: 8px; width: fit-content; font-weight: 500;}

/* PROGRESS */
.progress-section { margin: 25px 0; }
.progress-info { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--text-main); }
.progress-bar-bg { width: 100%; height: 8px; background: var(--border); border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 10px; transition: width 0.8s ease-in-out; }

.card-footer { display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 20px; margin-top: 5px; }
.footer-item small { font-size: 0.7rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px; }
.footer-item p { font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin: 0; }

/* MODAL */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeIn 0.2s; }
.modal-card { background: var(--bg-surface); width: 500px; padding: 40px; border-radius: 24px; box-shadow: var(--shadow-lg); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid var(--border); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.modal-header h3 { font-size: 1.5rem; font-weight: 800; margin: 0; color: var(--text-main); }
.close-btn { background: none; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px; display: block; }
input, select { width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border); font-size: 0.95rem; margin-bottom: 20px; transition: 0.2s; background: var(--bg-input); color: var(--text-main); box-sizing: border-box; }
input:focus, select:focus { border-color: var(--primary); background: var(--bg-surface); box-shadow: 0 0 0 3px rgba(166, 93, 67, 0.1); outline: none; }
.range-slider { padding: 0; }

.btn { padding: 12px 24px; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; transition: 0.2s; font-size: 0.95rem; }
.primary { background: var(--primary); color: white; box-shadow: 0 4px 10px rgba(166, 93, 67, 0.3); }
.primary:hover { background: var(--primary-light); color: var(--primary); transform: translateY(-1px); }
.btn-save { background: var(--text-main); color: var(--bg-surface); width: 100%; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; border: none; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

/* SPINNER & EMPTY STATE */
.loader-container { padding: 100px; display: flex; justify-content: center; }
.spinner { width: 40px; height: 40px; border: 4px solid var(--border); border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { grid-column: 1 / -1; text-align: center; padding: 100px; background: var(--bg-surface); border-radius: 20px; border: 2px dashed var(--border); color: var(--text-secondary); }
.empty-icon { font-size: 3rem; margin-bottom: 10px; }

/* ANIMATIONS */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>