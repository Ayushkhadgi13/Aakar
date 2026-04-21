<template>
  <div class="projects-page">
    <header class="page-header">
      <div class="header-left">
        <span class="eyebrow">Project workspace</span>
        <h1>Projects</h1>
        <p>Active construction sites, budgets, and progress at a glance.</p>
      </div>
      <div class="header-right">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" v-model="searchQuery" @input="fetchProjects" placeholder="Search projects..." />
        </div>
        <div class="stat-chip">
          <span class="stat-label">Projects</span>
          <strong>{{ projects.length }}</strong>
        </div>
        <button v-if="isAdmin" @click="openCreateModal" class="btn primary">New Project</button>
      </div>
    </header>

    <div v-if="loading" class="loader-container">
        <div class="spinner"></div>
    </div>
    
    <div v-else class="project-grid">
      <div v-for="project in projects" :key="project.id" class="project-card" @click="goToDetails(project.id)">
        <div class="card-top">
          <span :class="['status-badge', project.status.toLowerCase().replace(' ', '-')]">
            {{ project.status }}
          </span>
          
          <div v-if="isAdmin" class="card-dots-wrapper" @click.stop>
            <div class="card-dots" @click="toggleDropdown(project.id)">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
            </div>
            
            <div v-if="activeDropdown === project.id" class="context-menu">
              <button @click.stop="openEditModal(project)">Edit Project</button>
              <button class="text-danger" @click.stop="deleteProject(project.id)">Delete</button>
            </div>
          </div>
        </div>

        <div class="card-content">
          <h3>{{ project.name }}</h3>
          <p class="client-name">Client: <span>{{ project.client_name }}</span></p>
          <div class="location-tag">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            {{ project.location || 'N/A' }}
          </div>
        </div>

        <div class="card-footer">
          <div class="footer-item">
            <small>Budget</small>
            <p>Rs. {{ Number(project.budget).toLocaleString() }}</p>
          </div>
          <div class="footer-item text-right">
            <small>Start Date</small>
            <p>{{ new Date(project.start_date).toLocaleDateString() }}</p>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-info">
            <span>Phase: {{ getPhaseName(project.progress) }}</span>
            <span>{{ project.progress }}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-fill" :style="{ width: project.progress + '%', background: getProgressColor(project.progress) }"></div>
          </div>
        </div>
      </div>

      <div v-if="projects.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
        <p>No projects found.</p>
      </div>
    </div>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Project' : 'New Project' }}</h3>
          <button @click="closeModal" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <form @submit.prevent="saveProject">
          <div class="form-group">
            <label>Project Name</label>
            <input type="text" v-model="form.name" class="styled-input" required placeholder="e.g. Skyline Residency" />
          </div>
          <div class="form-group">
            <label>Client Name</label>
            <input type="text" v-model="form.client_name" class="styled-input" required placeholder="Full name or company" />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Location</label>
              <input type="text" v-model="form.location" class="styled-input" placeholder="City / Area" />
            </div>
            <div class="form-group">
              <label>Budget (Rs.)</label>
              <input type="number" v-model="form.budget" class="styled-input" required min="1" step="0.01" placeholder="0.00" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Start Date</label>
              <div class="custom-date-box" @click="openPicker(startDateRef)">
                <span :class="{'text-placeholder': !form.start_date}">
                  {{ form.start_date ? formatDateDisplay(form.start_date) : 'mm/dd/yyyy' }}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <input type="date" ref="startDateRef" v-model="form.start_date" required class="hidden-date-input" />
              </div>
            </div>
            <div class="form-group">
              <label>Status</label>
              <div class="select-wrapper">
                <select v-model="form.status" class="styled-input">
                  <option value="Upcoming">Upcoming</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Current Construction Phase</label>
            <div class="select-wrapper">
              <select v-model.number="form.progress" class="styled-input">
                <option v-for="phase in constructionPhases" :key="phase.value" :value="phase.value">
                  {{ phase.name }} ({{ phase.value }}%)
                </option>
              </select>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="submit" class="btn primary full-width" :disabled="isSaving">
                {{ isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Project') }}
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
import { useAuth } from '../useAuth';

const router = useRouter();
const { isAdmin, loadUser } = useAuth();

const projects = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const showModal = ref(false);
const isEditing = ref(false);
const editId = ref(null);
const activeDropdown = ref(null);
const isSaving = ref(false);

const startDateRef = ref(null);

const form = ref({ name: '', client_name: '', location: '', budget: '', start_date: '', end_date: '', status: 'Upcoming', progress: 0 });

const constructionPhases = [
  { name: 'Not Started', value: 0 },
  { name: 'Design', value: 5 },
  { name: 'Permit', value: 10 },
  { name: 'Excavation', value: 20 },
  { name: 'Foundation', value: 25 },
  { name: 'DPC Done', value: 30 },
  { name: 'Floor 1 Concreting', value: 50 },
  { name: 'Wall Work', value: 60 },
  { name: 'Plaster', value: 70 },
  { name: 'Flooring', value: 80 },
  { name: 'Finishing', value: 100 }
];

const getPhaseName = (progressValue) => {
  const phase = [...constructionPhases].reverse().find(p => progressValue >= p.value);
  return phase ? phase.name : 'Unknown';
};

const fetchProjects = async () => {
  try {
    const res = await axios.get('/projects', { params: { search: searchQuery.value } });
    projects.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

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

const openCreateModal = () => {
  isEditing.value = false;
  form.value = { name: '', client_name: '', location: '', budget: '', start_date: '', end_date: '', status: 'Upcoming', progress: 0 };
  showModal.value = true;
};

const openEditModal = (project) => {
  isEditing.value = true;
  editId.value = project.id;
  
  let snappedProgress = project.progress;
  if (!constructionPhases.some(p => p.value === project.progress)) {
      const phase = [...constructionPhases].reverse().find(p => project.progress >= p.value);
      snappedProgress = phase ? phase.value : 0;
  }

  form.value = { 
    name: project.name, 
    client_name: project.client_name, 
    location: project.location, 
    budget: project.budget, 
    start_date: project.start_date, 
    end_date: project.end_date, 
    status: project.status,
    progress: snappedProgress
  };
  showModal.value = true;
  activeDropdown.value = null;
};

const closeModal = () => { showModal.value = false; };

const saveProject = async () => {
  isSaving.value = true;
  try {
    if (isEditing.value) {
      await axios.put(`/projects/${editId.value}`, form.value);
    } else {
      await axios.post('/projects', form.value);
    }
    closeModal();
    fetchProjects();
  } catch (e) { 
    alert("Failed to save project."); 
  } finally {
    isSaving.value = false;
  }
};

const deleteProject = async (id) => {
  if (confirm('Delete this project? This cannot be undone.')) {
    try { await axios.delete(`/projects/${id}`); fetchProjects(); }
    catch (e) { alert("Failed to delete."); }
  }
  activeDropdown.value = null;
};

const goToDetails = (id) => router.push(`/projects/${id}`);
const toggleDropdown = (id) => { activeDropdown.value = activeDropdown.value === id ? null : id; };

const getProgressColor = (p) => p >= 100 ? '#10B981' : p >= 50 ? '#A65D43' : '#64748B';

onMounted(async () => {
  await loadUser();
  fetchProjects();
  document.addEventListener('click', () => { activeDropdown.value = null; });
});
</script>

<style scoped>
.projects-page { padding: 40px; animation: fadeIn 0.3s ease-out; max-width: 1280px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 32px; }
.eyebrow { display: inline-block; margin-bottom: 10px; color: var(--primary); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.header-left h1 { color: var(--text-main); font-size: 2.15rem; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.04em; }
.header-left p { color: var(--text-secondary); margin: 0; font-size: 0.98rem; max-width: 520px; }
.header-right { display: flex; gap: 14px; align-items: center; }
.stat-chip { min-width: 110px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-surface); display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.stat-chip strong { font-size: 1.05rem; color: var(--text-main); line-height: 1; }

.search-box { 
  background: var(--bg-surface); 
  border: 1px solid var(--border); 
  border-radius: 12px; 
  display: flex; 
  align-items: center; 
  padding: 0 16px; 
  width: 320px; 
  height: 48px;
  transition: all 0.2s ease; 
}
.search-box:focus-within { 
  border-color: var(--primary); 
  box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1); 
  background: var(--bg-surface);
}
.search-box input { 
  border: none; 
  outline: none; 
  width: 100%; 
  font-size: 1rem; 
  color: var(--text-main); 
  background: transparent; 
  font-family: inherit;
}
.search-icon { color: var(--text-muted); margin-right: 12px; }

.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }

.project-card { 
  background: color-mix(in srgb, var(--bg-surface) 82%, var(--bg-input) 18%); 
  border-radius: 18px; 
  padding: 24px; 
  border: 1px solid var(--border); 
  transition: all 0.2s ease; 
  position: relative; 
  cursor: pointer; 
  display: flex;
  flex-direction: column;
}
.project-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--primary) 45%, var(--border) 55%); box-shadow: 0 16px 24px -20px rgba(0,0,0,0.35); }

.card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.status-badge { padding: 6px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }

.upcoming { background: var(--bg-input); color: var(--text-secondary); }
.in-progress { background: rgba(166, 93, 67, 0.1); color: var(--primary); }
.on-hold { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
.completed { background: rgba(16, 185, 129, 0.1); color: #10B981; }

.card-dots-wrapper { position: relative; }
.card-dots { color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 6px; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
.card-dots:hover { color: var(--text-main); background: var(--bg-input); }
.context-menu { position: absolute; right: 0; top: 100%; margin-top: 4px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow-md); z-index: 50; display: flex; flex-direction: column; min-width: 140px; overflow: hidden; padding: 6px; }
.context-menu button { padding: 10px 14px; text-align: left; background: transparent; border: none; font-size: 0.85rem; font-weight: 600; color: var(--text-body); cursor: pointer; transition: 0.2s; border-radius: 6px; }
.context-menu button:hover { background: var(--bg-input); color: var(--text-main); }
.context-menu button.text-danger { color: var(--danger-text); }
.context-menu button.text-danger:hover { background: var(--danger-bg); }

.card-content { flex: 1; margin-bottom: 24px; }
.card-content h3 { font-size: 1.2rem; margin: 0 0 8px 0; color: var(--text-main); font-weight: 700; line-height: 1.3; }
.client-name { font-size: 0.9rem; color: var(--text-secondary); margin: 0 0 12px 0; }
.client-name span { color: var(--text-main); font-weight: 600; }
.location-tag { font-size: 0.85rem; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 6px; background: var(--bg-input); padding: 8px 12px; border-radius: 999px; font-weight: 500; border: 1px solid var(--border);}
.location-tag svg { color: var(--primary); }

.card-footer { display: flex; justify-content: space-between; margin-bottom: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
.footer-item small { font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.5px; }
.footer-item p { font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0; }
.text-right { text-align: right; }

.progress-section { width: 100%; }
.progress-info { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; margin-bottom: 8px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.progress-bar-bg { width: 100%; height: 6px; background: var(--bg-input); border-radius: 6px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 6px; transition: width 0.8s ease-in-out, background 0.3s; }

.empty-state { grid-column: 1 / -1; text-align: center; padding: 80px 20px; background: var(--bg-surface); border-radius: 12px; border: 1px dashed var(--border); color: var(--text-secondary); display: flex; flex-direction: column; align-items: center; gap: 16px; }
.empty-icon { color: var(--text-muted); opacity: 0.5; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.42); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeIn 0.2s; padding: 20px; }
.modal-card { background: var(--bg-surface); width: 520px; padding: 32px; border-radius: 18px; box-shadow: 0 24px 50px rgba(0,0,0,0.12); border: 1px solid var(--border); max-height: 90vh; overflow-y: auto;}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.modal-header h3 { font-size: 1.4rem; font-weight: 800; margin: 0; color: var(--text-main); }
.close-btn { background: transparent; border: none; padding: 8px; border-radius: 8px; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;}
.close-btn:hover { background: var(--bg-input); color: var(--text-main); }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }
.form-group label span { color: var(--primary); }

.styled-input {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  height: 48px;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-main);
  font-family: inherit;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.styled-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1); background: var(--bg-surface); }

.select-wrapper { position: relative; width: 100%; }
.select-wrapper::after {
  content: ''; position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-size: contain; pointer-events: none; 
}
.select-wrapper select { padding-right: 48px; cursor: pointer; }

.custom-date-box {
  position: relative; display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 16px; border: 1px solid var(--border); border-radius: 8px; background: transparent; cursor: pointer; transition: all 0.2s ease;
}
.custom-date-box:hover { border-color: var(--primary); }
.custom-date-box:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1); background: var(--bg-surface); }
.custom-date-box span { font-size: 1rem; color: var(--text-main); pointer-events: none; }
.custom-date-box span.text-placeholder { color: var(--text-muted); }
.custom-date-box svg { color: var(--text-secondary); pointer-events: none; }
.hidden-date-input { position: absolute; top: 100%; left: 0; width: 0; height: 0; opacity: 0; padding: 0; margin: 0; border: none; pointer-events: none; }


.btn { padding: 0 24px; height: 46px; border-radius: 10px; font-weight: 700; font-size: 0.94rem; cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; letter-spacing: 0.2px; }
.btn.primary { background: var(--primary); color: white; }
.btn.primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(166, 93, 67, 0.2); }
.full-width { width: 100%; margin-top: 10px;}

.loader-container { padding: 100px; display: flex; justify-content: center; }
.spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top: 3px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

@media (max-width: 1024px) { 
  .form-row { grid-template-columns: 1fr; gap: 0; }
  .header-right { flex-direction: column; align-items: stretch; width: 100%; margin-top: 20px;}
  .search-box { width: 100%; }
  .stat-chip { width: 100%; box-sizing: border-box; }
}
</style>
