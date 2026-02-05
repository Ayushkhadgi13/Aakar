<template>
  <div class="projects-page">
    <!-- PAGE HEADER -->
    <header class="page-header">
      <div class="header-left">
        <h1>Construction Projects</h1>
        <p>Manage site progress, clients, and timelines</p>
      </div>
      <div class="header-right">
        <div class="search-box">
          <i class="icon-search"></i>
          <input type="text" v-model="searchQuery" @input="fetchProjects" placeholder="Search project or client..." />
        </div>
        <button @click="showModal = true" class="btn primary">+ New Project</button>
      </div>
    </header>

    <!-- PROJECT GRID -->
    <div v-if="loading" class="loader-container">
        <div class="spinner"></div>
        <p>Loading projects...</p>
    </div>
    
    <div v-else class="project-grid">
      <!-- Added @click to navigate -->
      <div v-for="project in projects" :key="project.id" class="project-card" @click="goToDetails(project.id)">
        <div class="card-top">
          <span :class="['status-badge', project.status.toLowerCase().replace(' ', '-')]">
            {{ project.status }}
          </span>
          <div class="card-options">•••</div>
        </div>

        <div class="card-content">
          <h3>{{ project.name }}</h3>
          <p class="client-name">Client: {{ project.client_name }}</p>
          <div class="location-tag">📍 {{ project.location || 'Location Not Set' }}</div>
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
        <p>No projects found. Create one to start tracking.</p>
      </div>
    </div>

    <!-- NEW PROJECT MODAL -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Register New Project</h3>
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
            <label>Initial Progress (%)</label>
            <input type="range" v-model.number="form.progress" min="0" max="100" />
            <div class="range-val">{{ form.progress }}%</div>
          </div>
          <div class="modal-footer">
            <button type="submit" class="btn-save full-width" :disabled="isSaving">
                {{ isSaving ? 'Saving...' : 'Launch Project' }}
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
    if (e.response && e.response.status === 422) {
        const errors = e.response.data.errors;
        const firstError = Object.values(errors)[0][0];
        alert("Validation Error: " + firstError);
    } else {
        alert("Server Error: Make sure you ran 'php artisan migrate'");
    }
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
.projects-page { padding: 40px; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
.page-header h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; }
.page-header p { color: #64748b; margin-top: 5px; }

.header-right { display: flex; gap: 15px; }

.search-box {
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  width: 300px;
}
.search-box input { border: none; padding: 12px; outline: none; width: 100%; font-size: 14px; }

/* PROJECT GRID */
.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px; }

.project-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);
  transition: 0.3s;
  cursor: pointer; /* Clickable cursor */
}
.project-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); border-color: #A65D43; }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.status-badge { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.upcoming { background: #eff6ff; color: #3b82f6; }
.in-progress { background: #fff7ed; color: #f59e0b; }
.on-hold { background: #fef2f2; color: #ef4444; }
.completed { background: #ecfdf5; color: #10b981; }

.card-content h3 { font-size: 18px; margin: 0; color: #1e293b; font-weight: 700; }
.client-name { font-size: 13px; color: #64748b; margin: 5px 0; }
.location-tag { font-size: 12px; color: #94a3b8; margin-top: 10px; }

.progress-section { margin: 20px 0; }
.progress-info { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
.progress-bar-bg { width: 100%; height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; transition: 0.5s; }

.card-footer { display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 15px; }
.footer-item small { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
.footer-item p { font-size: 13px; font-weight: 700; color: #1e293b; margin: 2px 0 0; }

/* MODAL */
.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-card { background: white; width: 500px; padding: 35px; border-radius: 28px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-group { margin-bottom: 15px; text-align: left; }
.form-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #475569; }
input, select { width: 100%; padding: 12px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 14px; box-sizing: border-box;}
input:focus { border-color: #A65D43; outline: none; }
.range-val { text-align: right; font-weight: 800; color: #A65D43; font-size: 14px; margin-top: 5px; }

.btn { padding: 12px 25px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; transition: 0.2s; }
.primary { background: #A65D43; color: white; }
.btn-save { background: #0f172a; color: white; border: none; padding: 15px; border-radius: 14px; font-weight: 700; cursor: pointer; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.full-width { width: 100%; margin-top: 10px; }
.close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }

.loader-container { text-align: center; padding: 100px; color: #64748b; }
.spinner { border: 4px solid #f3f3f3; border-top: 4px solid #A65D43; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.empty-state { grid-column: 1 / -1; text-align: center; padding: 100px; background: white; border-radius: 30px; border: 2px dashed #e2e8f0; }
.empty-icon { font-size: 50px; margin-bottom: 15px; }
</style>