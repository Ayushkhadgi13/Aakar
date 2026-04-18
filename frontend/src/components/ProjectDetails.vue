<template>
  <div class="details-page">
    <div class="nav-back" @click="$router.push('/projects')">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      <span>Back to Projects</span>
    </div>

    <div v-if="project" class="content-split">
      <div class="info-sidebar">
        
        <!-- PROJECT OVERVIEW CARD -->
        <div class="content-card">
          <div class="card-header-flex">
            <h1>{{ project.name }}</h1>
            <span :class="['status-badge', project.status.toLowerCase().replace(' ', '-')]">{{ project.status }}</span>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item">
              <label>Client</label>
              <p>{{ project.client_name }}</p>
            </div>
            <div class="meta-item">
              <label>Location</label>
              <p>{{ project.location || 'N/A' }}</p>
            </div>
            <div class="meta-item">
              <label>Budget</label>
              <p>Rs. {{ Number(project.budget).toLocaleString() }}</p>
            </div>
            <div class="meta-item">
              <label>Timeline</label>
              <p>{{ formatDate(project.start_date) }} - {{ project.end_date ? formatDate(project.end_date) : 'Ongoing' }}</p>
            </div>
          </div>

          <!-- CONSTRUCTION PHASE (REPLACED SLIDER) -->
          <div class="progress-wrap">
            <div class="p-header">
              <span v-if="!isEditingProgress" class="phase-title">
                Phase: <strong>{{ getPhaseName(project.progress) }}</strong> ({{ project.progress }}%)
              </span>
              <span v-else class="phase-title">Update Construction Phase</span>
              
              <div v-if="isAdmin && !isEditingProgress" class="edit-link" @click="startEditingProgress" title="Update Phase">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </div>
            </div>

            <!-- Read Mode: Progress Bar -->
            <div v-if="!isEditingProgress" class="p-bar">
              <div class="p-fill" :style="{ width: project.progress + '%', background: getProgressColor(project.progress) }"></div>
            </div>

            <!-- Edit Mode: Phase Selection Dropdown -->
            <div v-else class="edit-mode-ui">
              <div class="select-wrapper">
                <select v-model.number="editProgressValue" class="styled-input solid">
                  <option v-for="phase in constructionPhases" :key="phase.value" :value="phase.value">
                    {{ phase.name }} ({{ phase.value }}%)
                  </option>
                </select>
              </div>
              <div class="edit-actions">
                <button @click="cancelEditingProgress" class="btn-xs secondary">Cancel</button>
                <button @click="saveProgress" class="btn-xs primary" :disabled="isSaving">{{ isSaving ? 'Saving...' : 'Save Phase' }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- PROJECT TEAM -->
        <div class="content-card mt-24">
          <div class="card-title-row">
            <h3>Project Team</h3>
            <button v-if="isAdmin" @click="openTeamModal" class="btn-icon" title="Manage Team">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            </button>
          </div>
          <div class="team-list">
            <div v-if="!project.users || project.users.length === 0" class="empty-docs">
              No team members assigned yet.
            </div>
            <div v-else v-for="member in project.users" :key="member.id" class="team-member">
              <div class="m-avatar">{{ member.name.charAt(0) }}</div>
              <div class="m-info">
                <span class="m-name">{{ member.name }}</span>
                <span class="m-role">{{ member.role }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ANALYTICS CHARTS -->
        <div class="content-card mt-24">
          <h3>Project Analytics</h3>
          <div class="charts-grid">
            <div class="chart-box">
              <h4>Budget vs Actual</h4>
              <apexchart type="bar" height="250" :options="financialOptions" :series="financialSeries"></apexchart>
            </div>
            <div class="chart-box">
              <h4>Material Utilization</h4>
              <div v-if="inventorySeries.length > 0" class="pie-wrap">
                <apexchart type="donut" height="250" :options="inventoryOptions" :series="inventorySeries"></apexchart>
              </div>
              <div v-else class="empty-chart">No inventory data yet.</div>
            </div>
          </div>
        </div>

        <!-- BOQ / ESTIMATES -->
        <div class="content-card mt-24">
          <div class="card-title-row">
            <h3>Material Estimates (BOQ)</h3>
            <button v-if="isAdmin" @click="showEstimateModal = true" class="btn-icon" title="Add Estimate">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
          <div v-if="boqAnalysis" class="boq-summary">
            <div class="boq-stat">
              <label>Estimated</label>
              <span>Rs. {{ Number(boqAnalysis.total_estimated_budget).toLocaleString() }}</span>
            </div>
            <div class="boq-stat">
              <label>Actual</label>
              <span :class="{'text-danger': boqAnalysis.total_actual_cost > boqAnalysis.total_estimated_budget}">
                Rs. {{ Number(boqAnalysis.total_actual_cost).toLocaleString() }}
              </span>
            </div>
          </div>
          <div class="table-wrapper">
            <table v-if="boqAnalysis && boqAnalysis.boq_data.length > 0" class="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Est. Cost</th>
                  <th>Act. Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in boqAnalysis.boq_data" :key="idx">
                  <td>
                    <div class="mat-name">{{ item.material }}</div>
                    <span class="text-muted text-xs">{{ item.unit }}</span>
                  </td>
                  <td>{{ Number(item.est_total).toLocaleString() }}</td>
                  <td>{{ Number(item.act_total).toLocaleString() }}</td>
                  <td><span :class="['status-dot', item.status === 'Over Budget' ? 'dot-red' : 'dot-green']"></span></td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-docs">No estimates added yet.</div>
          </div>
        </div>

        <!-- DOCUMENTS CARD -->
        <div class="content-card mt-24">
          <div class="card-title-row">
            <h3>Project Documents</h3>
            <button @click="showDocModal = true" class="btn-icon" title="Upload Document">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </button>
          </div>
          <div v-if="!project.documents || project.documents.length === 0" class="empty-docs">
            No documents uploaded.
          </div>
          <div v-else class="doc-list">
            <div v-for="doc in project.documents" :key="doc.id" class="doc-item">
              <div class="doc-icon">
                <span v-if="doc.file_type === 'BOQ'">📊</span>
                <span v-else-if="doc.file_type === 'Drawing'">📐</span>
                <span v-else>📄</span>
              </div>
              <div class="doc-info">
                <span class="doc-type">{{ doc.file_type }}</span>
                <a :href="getImageUrl(doc.file_path)" target="_blank" class="doc-name">{{ doc.original_name }}</a>
                <span v-if="doc.file_type === 'BOQ'" :class="['doc-status-badge', 'status-' + doc.status]">
                  {{ doc.status === 'pending' ? 'Pending Review' : doc.status === 'approved' ? 'Approved' : 'Rejected' }}
                </span>
              </div>
              <div class="doc-actions">
                <template v-if="isAdmin && doc.file_type === 'BOQ' && doc.status === 'pending'">
                  <button @click="approveDoc(doc)" class="doc-btn approve" title="Approve">✓</button>
                  <button @click="rejectDoc(doc)" class="doc-btn reject" title="Reject">✕</button>
                </template>
                <button v-if="doc.file_type === 'BOQ' && doc.status === 'rejected'" @click="deleteDoc(doc)" class="doc-btn reject" title="Remove">🗑</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: UPDATES & LIVE CHAT -->
      <div class="updates-feed">
        <div class="feed-header">
          <h2>Site Updates & Logs</h2>
          <p>Live project feed</p>
        </div>

        <div class="chat-window" id="chat-window">
          <div v-if="!project.updates || project.updates.length === 0" class="no-updates">
            No updates posted yet.
          </div>
          <div v-for="update in project.updates" :key="update.id" class="update-bubble">
            <div class="u-avatar">{{ update.user ? update.user.name.charAt(0) : 'U' }}</div>
            <div class="u-content">
              <div class="u-meta">
                <strong>{{ update.user ? update.user.name : 'Unknown User' }}</strong>
                <span class="u-time">{{ formatTime(update.created_at) }}</span>
              </div>
              <div v-if="update.message" class="u-text">{{ update.message }}</div>
              <div v-if="update.image_path" class="u-image">
                <img :src="getImageUrl(update.image_path)" alt="Site Photo" @click="openImage(update.image_path)" />
              </div>
            </div>
          </div>
        </div>

        <div class="input-area">
          <form @submit.prevent="postUpdate">
            <div class="input-wrapper-chat">
              <textarea v-model="newMessage" placeholder="Write an update..." rows="1"></textarea>
              <div class="chat-toolbar">
                <input type="file" id="fileUpload" @change="handleFileUpload" accept="image/*" hidden />
                <label for="fileUpload" class="tool-btn" :class="{ 'has-file': selectedFile }">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <span v-if="selectedFile">Photo Attached</span>
                </label>
                <button type="submit" class="send-btn" :disabled="isPosting || (!newMessage && !selectedFile)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div v-else-if="errorMessage" class="empty-docs mt-24">
      {{ errorMessage }}
    </div>

    <!-- TEAM MODAL -->
    <div v-if="showTeamModal" class="modal-backdrop" @click.self="showTeamModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Manage Project Team</h3>
          <button @click="showTeamModal = false" class="close-btn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <form @submit.prevent="saveTeam">
          <p class="modal-hint">Select employees working on this project:</p>
          <div class="checkbox-list">
            <label v-for="user in allUsers" :key="user.id" class="user-checkbox">
              <input type="checkbox" :value="user.id" v-model="selectedUserIds">
              <span class="check-label">{{ user.name }} <small class="text-muted">({{ user.role }})</small></span>
            </label>
          </div>
          <button type="submit" class="btn primary full-width" :disabled="isSavingTeam">
            {{ isSavingTeam ? 'Updating...' : 'Save Assignments' }}
          </button>
        </form>
      </div>
    </div>

    <!-- ESTIMATE MODAL -->
    <div v-if="showEstimateModal" class="modal-backdrop" @click.self="showEstimateModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Add Material Estimate</h3>
          <button @click="showEstimateModal = false" class="close-btn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <form @submit.prevent="saveEstimate">
          <div class="form-group">
            <label>Material Name</label>
            <input type="text" v-model="estForm.material_name" class="styled-input" required placeholder="e.g. Cement, Steel" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Est. Quantity</label>
              <input type="number" v-model.number="estForm.estimated_quantity" class="styled-input" required min="1" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Unit</label>
              <input type="text" v-model="estForm.unit" class="styled-input" required placeholder="e.g. bags, kg" />
            </div>
          </div>
          <div class="form-group">
            <label>Est. Unit Price (Rs.)</label>
            <input type="number" v-model.number="estForm.estimated_unit_price" class="styled-input" required min="0" step="0.01" placeholder="0.00" />
          </div>
          <button type="submit" class="btn primary full-width" :disabled="isSavingEstimate">
            {{ isSavingEstimate ? 'Saving...' : 'Add Estimate' }}
          </button>
        </form>
      </div>
    </div>

    <!-- DOCUMENT UPLOAD MODAL -->
    <div v-if="showDocModal" class="modal-backdrop" @click.self="showDocModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Upload Document</h3>
          <button @click="showDocModal = false" class="close-btn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <form @submit.prevent="uploadDoc">
          <div class="form-group">
            <label>Document Type</label>
            <div class="select-wrapper">
              <select v-model="docForm.type" class="styled-input" required>
                <option value="BOQ">Bill of Quantities (BOQ)</option>
                <option value="Drawing">Engineering Drawing</option>
                <option value="Pre-Estimation">Pre-Estimation</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div v-if="docForm.type === 'BOQ'" class="boq-upload-note">
            BOQ files require admin review before being marked as approved.
          </div>
          <div class="form-group">
            <label>Select File (PDF, Excel, IMG)</label>
            <input type="file" @change="handleDocFile" class="styled-input" style="padding-top:12px" required />
          </div>
          <button type="submit" class="btn primary full-width" :disabled="isUploading">
            {{ isUploading ? 'Uploading...' : 'Upload File' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Image Lightbox -->
    <div v-if="zoomImage" class="lightbox" @click="zoomImage = null">
      <img :src="getImageUrl(zoomImage)" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import apexchart from "vue3-apexcharts";

const route = useRoute();
const router = useRouter();

const project = ref(null);
const newMessage = ref('');
const selectedFile = ref(null);
const isPosting = ref(false);
const zoomImage = ref(null);
const errorMessage = ref(null);
const isAdmin = ref(false);

const isEditingProgress = ref(false);
const editProgressValue = ref(0);
const isSaving = ref(false);

const showDocModal = ref(false);
const isUploading = ref(false);
const docForm = ref({ type: 'BOQ', file: null });

const boqAnalysis = ref(null);
const showEstimateModal = ref(false);
const isSavingEstimate = ref(false);
const estForm = ref({ material_name: '', estimated_quantity: null, unit: '', estimated_unit_price: null });

const showTeamModal = ref(false);
const allUsers = ref([]);
const selectedUserIds = ref([]);
const isSavingTeam = ref(false);

// ----------------------------------------------------
// CONSTRUCTION PHASES (Cumulative Percentages)
// ----------------------------------------------------
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

const getProgressColor = (p) => p >= 100 ? '#10B981' : p >= 50 ? '#A65D43' : '#64748B';

// ----------------------------------------------------
// CHART SETTINGS
// ----------------------------------------------------
const chartFont = 'Plus Jakarta Sans, sans-serif';
const financialSeries = ref([]);
const financialOptions = ref({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: chartFont },
  colors:['#64748B', '#A65D43'], 
  plotOptions: { bar: { borderRadius: 4, distributed: true, horizontal: false, columnWidth: '50%' } },
  dataLabels: { enabled: false },
  xaxis: { categories:['Estimated', 'Actual'], axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#64748B', fontSize: '12px', fontWeight: 600 } } },
  yaxis: { labels: { style: { colors: '#64748B' }, formatter: (val) => `Rs. ${val / 1000}k` } },
  grid: { show: false },
  legend: { show: false }
});

const inventorySeries = ref([]);
const inventoryOptions = ref({
  labels: ['Consumed', 'In Stock'],
  colors:['#A65D43', '#10B981'],
  legend: { position: 'bottom', labels: { colors: '#475569' } },
  dataLabels: { enabled: false },
  stroke: { show: false },
  plotOptions: { pie: { donut: { size: '65%' } } }
});

// ----------------------------------------------------
// FETCH DATA
// ----------------------------------------------------
const fetchDetails = async () => {
  try {
    const userRes = await axios.get('/user');
    isAdmin.value = userRes.data.role === 'admin';
    const res = await axios.get(`/projects/${route.params.id}`);
    project.value = res.data;
    await fetchBOQ();
    await fetchAnalytics();
    scrollToBottom();
  } catch (e) {
    if (e.response && e.response.status === 403) {
      errorMessage.value = "You don't have permission to view this project.";
    } else {
      errorMessage.value = "Project not found.";
    }
  }
};

const fetchBOQ = async () => {
  try {
    const res = await axios.get(`/projects/${route.params.id}/boq`);
    boqAnalysis.value = res.data;
  } catch (e) {}
};

const fetchAnalytics = async () => {
  try {
    const pId = route.params.id;
    const [finRes, invRes] = await Promise.all([
      axios.get(`/projects/${pId}/financial-variance`),
      axios.get(`/projects/${pId}/inventory`)
    ]);
    financialSeries.value =[{ name: 'Amount', data: [finRes.data.estimated_total, finRes.data.actual_total] }];
    let totalPurchased = 0; let totalUsed = 0;
    if (invRes.data.inventory && Array.isArray(invRes.data.inventory)) {
      invRes.data.inventory.forEach(item => {
        totalPurchased += Number(item.total_purchased);
        totalUsed += Number(item.total_used);
      });
    }
    const currentStock = Math.max(0, totalPurchased - totalUsed);
    inventorySeries.value = totalPurchased > 0 ?[totalUsed, currentStock] :[];
  } catch (e) {}
};

// ----------------------------------------------------
// PROGRESS / PHASE UPDATE
// ----------------------------------------------------
const startEditingProgress = () => { 
  let snappedVal = project.value.progress;
  // Snap legacy percentages to the nearest defined phase
  if (!constructionPhases.some(p => p.value === snappedVal)) {
      const phase = [...constructionPhases].reverse().find(p => snappedVal >= p.value);
      snappedVal = phase ? phase.value : 0;
  }
  editProgressValue.value = snappedVal; 
  isEditingProgress.value = true; 
};

const cancelEditingProgress = () => { isEditingProgress.value = false; };

const saveProgress = async () => {
  isSaving.value = true;
  try {
    await axios.put(`/projects/${project.value.id}`, { progress: editProgressValue.value });
    project.value.progress = editProgressValue.value;
    isEditingProgress.value = false;
  } catch (e) {
    alert("Failed to update phase.");
  } finally { 
    isSaving.value = false; 
  }
};

// ----------------------------------------------------
// TEAM ASSIGNMENT
// ----------------------------------------------------
const openTeamModal = async () => {
  try {
    const res = await axios.get('/users-list');
    allUsers.value = res.data;
    selectedUserIds.value = project.value.users.map(u => u.id);
    showTeamModal.value = true;
  } catch (e) {
    alert("Could not load users.");
  }
};

const saveTeam = async () => {
  isSavingTeam.value = true;
  try {
    const res = await axios.post(`/projects/${route.params.id}/assign`, { user_ids: selectedUserIds.value });
    project.value.users = res.data.users;
    showTeamModal.value = false;
  } catch (e) {
    alert("Failed to update project team.");
  } finally {
    isSavingTeam.value = false;
  }
};

// ----------------------------------------------------
// ESTIMATES & DOCUMENTS
// ----------------------------------------------------
const saveEstimate = async () => {
  isSavingEstimate.value = true;
  try {
    await axios.post(`/projects/${route.params.id}/estimates`, estForm.value);
    showEstimateModal.value = false;
    estForm.value = { material_name: '', estimated_quantity: null, unit: '', estimated_unit_price: null };
    fetchBOQ();
    fetchAnalytics();
  } catch (e) {} finally { isSavingEstimate.value = false; }
};

const handleDocFile = (e) => { docForm.value.file = e.target.files[0]; };
const uploadDoc = async () => {
  isUploading.value = true;
  const formData = new FormData();
  formData.append('type', docForm.value.type);
  formData.append('file', docForm.value.file);
  try {
    await axios.post(`/projects/${project.value.id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    showDocModal.value = false;
    docForm.value = { type: 'BOQ', file: null };
    fetchDetails();
  } catch (e) { alert("Upload failed."); } finally { isUploading.value = false; }
};

const approveDoc = async (doc) => {
  try {
    await axios.patch(`/documents/${doc.id}/approve`);
    doc.status = 'approved';
  } catch (e) { alert("Failed to approve."); }
};
const rejectDoc = async (doc) => {
  try {
    await axios.patch(`/documents/${doc.id}/reject`);
    doc.status = 'rejected';
  } catch (e) { alert("Failed to reject."); }
};
const deleteDoc = async (doc) => {
  if (!confirm(`Remove "${doc.original_name}"?`)) return;
  try {
    await axios.delete(`/documents/${doc.id}`);
    project.value.documents = project.value.documents.filter(d => d.id !== doc.id);
  } catch (e) { alert("Failed to delete."); }
};

// ----------------------------------------------------
// LIVE FEED & UTILS
// ----------------------------------------------------
const scrollToBottom = () => { nextTick(() => { const chat = document.getElementById('chat-window'); if (chat) chat.scrollTop = chat.scrollHeight; }); };
const handleFileUpload = (event) => selectedFile.value = event.target.files[0];

const postUpdate = async () => {
  isPosting.value = true;
  const formData = new FormData();
  if (newMessage.value) formData.append('message', newMessage.value);
  if (selectedFile.value) formData.append('image', selectedFile.value);
  
  try {
    const res = await axios.post(`/projects/${route.params.id}/updates`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    newMessage.value = ''; 
    selectedFile.value = null; 
    
    if (!project.value.updates) project.value.updates =[];
    project.value.updates.push(res.data);
    scrollToBottom();
  } catch (e) {
      console.error(e);
  } finally { 
      isPosting.value = false; 
  }
};

const getImageUrl = (path) => `http://127.0.0.1:8000${path}`;
const openImage = (path) => zoomImage.value = path;
const formatDate = (d) => new Date(d).toLocaleDateString();
const formatTime = (d) => new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// LIVE CHAT SETUP
onMounted(() => {
  fetchDetails();
  
  if (window.Echo) {
    window.Echo.private(`project.${route.params.id}`)
      .listen('.ProjectUpdatePosted', (e) => {
        if (!project.value.updates) project.value.updates =[];
        project.value.updates.push(e.update);
        scrollToBottom();
      });
  }
});

onUnmounted(() => {
  if (window.Echo) {
    window.Echo.leave(`project.${route.params.id}`);
  }
});
</script>

<style scoped>
/* PAGE LAYOUT - MINIMALIST & ARCHITECTURAL */
.details-page { padding: 40px 0; max-width: 1280px; margin: 0 auto; height: calc(100vh - 108px); animation: fadeIn 0.3s ease; }

.nav-back { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-secondary); font-weight: 600; margin-bottom: 24px; font-size: 0.92rem; transition: 0.2s; padding: 10px 14px; border: 1px solid var(--border); border-radius: 999px; background: var(--bg-surface); }
.nav-back:hover { color: var(--primary); border-color: color-mix(in srgb, var(--primary) 35%, var(--border) 65%); }

.content-split { display: grid; grid-template-columns: 400px 1fr; gap: 24px; height: 100%; align-items: start; }
.info-sidebar { height: 100%; overflow-y: auto; padding-right: 12px; }

/* CONTENT CARDS */
.content-card { background: var(--bg-surface); padding: 28px; border-radius: 18px; border: 1px solid var(--border); }
.mt-24 { margin-top: 24px; }
.card-header-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.content-card h1 { margin: 0; font-size: 1.75rem; color: var(--text-main); font-weight: 800; line-height: 1.15; letter-spacing: -0.04em;}

/* STATUS BADGE */
.status-badge { display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.upcoming { background: var(--bg-input); color: var(--text-secondary); }
.in-progress { background: rgba(166, 93, 67, 0.1); color: var(--primary); }
.on-hold { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
.completed { background: rgba(16, 185, 129, 0.1); color: #10B981; }

/* PROJECT META */
.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-bottom: 1px solid var(--border); padding-bottom: 24px; margin-bottom: 24px; }
.meta-item label { display: block; font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.meta-item p { margin: 0; color: var(--text-main); font-size: 1rem; font-weight: 600; }

/* =========================================
   CONSTRUCTION PHASE (PROGRESS) 
   ========================================= */
.progress-wrap { background: var(--bg-input); padding: 20px; border-radius: 14px; border: 1px solid var(--border); }
.p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.phase-title { font-size: 0.85rem; color: var(--text-secondary); }
.phase-title strong { color: var(--text-main); font-size: 1rem; margin: 0 4px;}
.p-bar { height: 8px; background: var(--border); border-radius: 6px; overflow: hidden; }
.p-fill { height: 100%; border-radius: 6px; transition: width 0.8s ease-out; }

.edit-link { cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 6px; transition: 0.2s;}
.edit-link:hover { color: var(--primary); background: var(--bg-surface); }

.edit-mode-ui { display: flex; flex-direction: column; gap: 16px; }
.edit-actions { display: flex; gap: 12px; justify-content: flex-end; }

/* SHARED CARD TITLES */
.card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.card-title-row h3 { margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700; }

/* TEAM LIST */
.team-list { display: flex; flex-direction: column; gap: 12px; }
.team-member { display: flex; align-items: center; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.team-member:last-child { border-bottom: none; padding-bottom: 0; }
.m-avatar { width: 36px; height: 36px; background: var(--primary); color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; }
.m-info { display: flex; flex-direction: column; }
.m-name { font-size: 0.95rem; font-weight: 600; color: var(--text-main); }
.m-role { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;}

/* CHARTS */
.charts-grid { display: grid; grid-template-columns: 1fr; gap: 30px; margin-top: 20px; }
.chart-box h4 { margin: 0 0 16px 0; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.empty-chart { text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 30px; border: 1px dashed var(--border); border-radius: 14px;}

/* BOQ */
.boq-summary { display: flex; gap: 30px; margin-bottom: 20px; background: var(--bg-input); padding: 16px; border-radius: 8px; border: 1px solid var(--border); }
.boq-stat { display: flex; flex-direction: column; gap: 4px;}
.boq-stat label { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); }
.boq-stat span { font-weight: 700; font-size: 1.1rem; color: var(--text-main); }
.text-danger { color: #EF4444 !important; }

/* TABLES */
.table-wrapper { width: 100%; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.data-table td { padding: 12px 0; border-bottom: 1px dashed var(--border); color: var(--text-main); font-size: 0.9rem;}
.data-table tr:last-child td { border-bottom: none; }
.mat-name { font-weight: 600; font-size: 0.9rem; display: block;}
.text-xs { font-size: 0.75rem; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.dot-red { background: #EF4444; }
.dot-green { background: #10B981; }

/* DOCUMENTS */
.doc-list { display: flex; flex-direction: column; gap: 12px; }
.doc-item { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--bg-input); border-radius: 14px; border: 1px solid var(--border); transition: 0.2s; }
.doc-item:hover { border-color: color-mix(in srgb, var(--primary) 35%, var(--border) 65%); }
.doc-icon { font-size: 1.2rem; }
.doc-info { display: flex; flex-direction: column; overflow: hidden; flex: 1; gap: 4px;}
.doc-type { font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
.doc-name { font-size: 0.9rem; font-weight: 600; color: var(--primary); text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.doc-name:hover { text-decoration: underline; }
.doc-status-badge { display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; width: fit-content; }
.status-pending  { background: #FEF3C7; color: #92400E; }
.status-approved { background: #DCFCE7; color: #15803D; }
.status-rejected { background: #FEE2E2; color: #B91C1C; }
.doc-actions { display: flex; gap: 8px; }
.doc-btn { width: 28px; height: 28px; border-radius: 6px; border: none; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
.doc-btn.approve { background: transparent; border: 1px solid #10B981; color: #10B981; }
.doc-btn.approve:hover { background: #10B981; color: white; }
.doc-btn.reject { background: transparent; border: 1px solid #EF4444; color: #EF4444; }
.doc-btn.reject:hover { background: #EF4444; color: white; }

/* FEED / CHAT */
.updates-feed { background: var(--bg-surface); border-radius: 18px; border: 1px solid var(--border); display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.feed-header { padding: 24px 28px; border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--bg-surface) 68%, var(--bg-input) 32%); }
.feed-header h2 { margin: 0 0 4px 0; font-size: 1.2rem; font-weight: 700; color: var(--text-main); }
.feed-header p { margin: 0; color: var(--text-secondary); font-size: 0.9rem; }
.chat-window { flex: 1; overflow-y: auto; padding: 30px; display: flex; flex-direction: column; gap: 24px; background-color: var(--bg-body); }
.no-updates { text-align: center; color: var(--text-muted); margin-top: 50px; font-size: 0.9rem;}
.update-bubble { display: flex; gap: 16px; max-width: 85%; animation: slideUp 0.3s ease; }
.u-avatar { width: 36px; height: 36px; background: var(--text-main); color: var(--bg-surface); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.9rem;}
.u-content { display: flex; flex-direction: column; }
.u-meta { margin-bottom: 6px; font-size: 0.85rem; display: flex; align-items: baseline; gap: 12px; }
.u-meta strong { color: var(--text-main); font-weight: 600; }
.u-time { font-size: 0.75rem; color: var(--text-muted); }
.u-text { background: var(--bg-surface); padding: 14px 16px; border-radius: 0 14px 14px 14px; margin: 0; font-size: 0.95rem; color: var(--text-main); border: 1px solid var(--border); line-height: 1.5;}
.u-image img { max-width: 280px; border-radius: 8px; cursor: zoom-in; margin-top: 10px; border: 1px solid var(--border); }
.input-area { padding: 20px 30px; background: var(--bg-surface); border-top: 1px solid var(--border); }
.input-wrapper-chat { border: 1px solid var(--border); border-radius: 14px; padding: 12px; background: var(--bg-input); transition: 0.2s;}
.input-wrapper-chat:focus-within { border-color: var(--primary); background: var(--bg-surface); }
textarea { width: 100%; border: none; outline: none; background: transparent; color: var(--text-main); font-family: inherit; font-size: 0.95rem; resize: none; margin-bottom: 12px;}
.chat-toolbar { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 12px;}
.tool-btn { font-size: 0.85rem; color: var(--text-secondary); cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: 0.2s;}
.tool-btn:hover { color: var(--primary); }
.send-btn { background: var(--primary); color: white; border: none; width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;}
.send-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(166, 93, 67, 0.2); }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; background: var(--text-muted); }

/* =========================================
   MODALS & FORMS
   ========================================= */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.42); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeIn 0.2s; padding: 20px; }
.modal-card { background: var(--bg-surface); width: 460px; padding: 32px; border-radius: 18px; box-shadow: 0 24px 50px rgba(0,0,0,0.12); border: 1px solid var(--border); max-height: 90vh; overflow-y: auto;}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.modal-header h3 { font-size: 1.3rem; font-weight: 700; margin: 0; color: var(--text-main); }
.close-btn { background: transparent; border: none; padding: 6px; border-radius: 6px; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;}
.close-btn:hover { background: var(--bg-input); color: var(--text-main); }
.modal-hint { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }

.styled-input { appearance: none; -webkit-appearance: none; width: 100%; height: 48px; padding: 12px 16px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--text-main); font-family: inherit; font-size: 1rem; transition: all 0.2s ease; box-sizing: border-box; }
.styled-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1); background: var(--bg-surface); }
.styled-input.solid { background: var(--bg-surface); }

/* SVG WRAPPERS */
.select-wrapper { position: relative; width: 100%; }
.select-wrapper::after { content: ''; position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-size: contain; pointer-events: none; }
.select-wrapper select { padding-right: 48px; cursor: pointer; }

/* CHECKBOX LIST (TEAM) */
.checkbox-list { display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto; margin-bottom: 24px; padding: 4px;}
.user-checkbox { display: flex; align-items: center; gap: 12px; padding: 12px; background: transparent; border-radius: 8px; cursor: pointer; border: 1px solid var(--border); transition: 0.2s; }
.user-checkbox:hover { border-color: var(--primary); background: var(--bg-input); }
.user-checkbox input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary); margin: 0; }
.check-label { font-size: 0.95rem; color: var(--text-main); font-weight: 600; }

/* BUTTONS */
.btn { padding: 0 24px; height: 46px; border-radius: 10px; font-weight: 700; font-size: 0.94rem; cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; letter-spacing: 0.2px; }
.btn.primary { background: var(--primary); color: white; }
.btn.primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(166, 93, 67, 0.2); }
.btn-xs { padding: 8px 16px; font-size: 0.85rem; border-radius: 6px; cursor: pointer; font-weight: 700; transition: 0.2s; border: none; }
.btn-xs.primary { background: var(--primary); color: white; }
.btn-xs.secondary { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
.btn-icon { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;}
.btn-icon:hover { border-color: var(--primary); color: var(--primary); }
.full-width { width: 100%; }

.boq-upload-note { background: #FEF3C7; color: #92400E; font-size: 0.8rem; font-weight: 600; padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #FDE68A; }
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(5px); z-index: 3000; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
.lightbox img { max-height: 90vh; max-width: 90vw; border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1024px) { .content-split { grid-template-columns: 1fr; height: auto; } .info-sidebar { padding-right: 0; } }
</style>
