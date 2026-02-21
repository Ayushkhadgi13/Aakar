<template>
  <div class="details-page">
    <!-- Back Button -->
    <div class="nav-back" @click="$router.push('/projects')">
      <span>← Back to Projects</span>
    </div>

    <!-- MAIN CONTENT -->
    <div v-if="project" class="content-split">
      <!-- LEFT: PROJECT INFO & ANALYTICS & DOCUMENTS -->
      <div class="info-sidebar">
        <!-- Info Card -->
        <div class="info-card">
          <h1>{{ project.name }}</h1>
          <span class="status-badge">{{ project.status }}</span>
          
          <div class="meta-group">
            <label>Client</label>
            <p>{{ project.client_name }}</p>
          </div>
          <div class="meta-group">
            <label>Location</label>
            <p>{{ project.location }}</p>
          </div>
          <div class="meta-group">
            <label>Budget</label>
            <p>Rs. {{ Number(project.budget).toLocaleString() }}</p>
          </div>
          <div class="meta-group">
            <label>Timeline</label>
            <p>{{ formatDate(project.start_date) }} - {{ project.end_date ? formatDate(project.end_date) : 'Ongoing' }}</p>
          </div>

          <!-- PROGRESS SECTION -->
          <div class="progress-wrap">
            <div class="p-header">
              <span>Overall Completion</span>
              <div v-if="isAdmin && !isEditingProgress" class="edit-link" @click="startEditingProgress">
                {{ project.progress }}% <span class="icon">✏️</span>
              </div>
              <div v-else-if="!isAdmin" class="no-edit">{{ project.progress }}%</div>
              <span v-else>{{ editProgressValue }}%</span>
            </div>

            <div v-if="!isEditingProgress" class="p-bar">
              <div class="p-fill" :style="{ width: project.progress + '%', background: 'var(--primary)' }"></div>
            </div>

            <div v-else class="edit-mode-ui">
              <input type="range" v-model.number="editProgressValue" min="0" max="100" class="range-slider" />
              <div class="edit-actions">
                <button @click="saveProgress" class="btn-xs save" :disabled="isSaving">{{ isSaving ? '...' : 'Save' }}</button>
                <button @click="cancelEditingProgress" class="btn-xs cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <!-- NEW: ANALYTICS CHARTS SECTION -->
        <div class="info-card mt-20">
          <h3>Project Analytics</h3>
          <div class="charts-grid">
            <!-- Financial Variance Chart -->
            <div class="chart-box">
              <h4>Budget vs Actual</h4>
              <apexchart type="bar" height="250" :options="financialOptions" :series="financialSeries"></apexchart>
            </div>
            
            <!-- Inventory Utilization Chart -->
            <div class="chart-box">
              <h4>Material Utilization</h4>
              <div v-if="inventorySeries.length > 0" class="pie-wrap">
                <apexchart type="donut" height="250" :options="inventoryOptions" :series="inventorySeries"></apexchart>
              </div>
              <div v-else class="empty-chart">No inventory data</div>
            </div>
          </div>
        </div>

        <!-- BOQ / ESTIMATES SECTION -->
        <div class="info-card mt-20">
          <div class="card-title-row">
            <h3>Material Estimates (BOQ)</h3>
            <button v-if="isAdmin" @click="showEstimateModal = true" class="add-doc-btn" title="Add Estimate">+</button>
          </div>

          <!-- Summary Stats -->
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

          <!-- Detailed Table -->
          <div class="table-responsive">
            <table v-if="boqAnalysis && boqAnalysis.boq_data.length > 0" class="boq-table">
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
                    <small>{{ item.unit }}</small>
                  </td>
                  <td>{{ Number(item.est_total).toLocaleString() }}</td>
                  <td>{{ Number(item.act_total).toLocaleString() }}</td>
                  <td>
                    <span :class="['status-dot', item.status === 'Over Budget' ? 'dot-red' : 'dot-green']"></span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-docs">No estimates added yet.</div>
          </div>
        </div>

        <!-- DOCUMENTS CARD -->
        <div class="info-card mt-20">
          <div class="card-title-row">
            <h3>Project Documents</h3>
            <button @click="showDocModal = true" class="add-doc-btn" title="Upload Document">+</button>
          </div>
          
          <div v-if="!project.documents || project.documents.length === 0" class="empty-docs">
            No documents uploaded.
          </div>

          <div v-else class="doc-list">
            <div v-for="doc in project.documents" :key="doc.id" class="doc-item">
              <div class="doc-icon">
                <span v-if="doc.file_type === 'BOQ'">📊</span>
                <span v-else-if="doc.file_type === 'Drawing'">📐</span>
                <span v-else>📁</span>
              </div>
              <div class="doc-info">
                <span class="doc-type">{{ doc.file_type }}</span>
                <a :href="getImageUrl(doc.file_path)" target="_blank" class="doc-name">{{ doc.original_name }}</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: UPDATES & CHAT -->
      <div class="updates-feed">
        <div class="feed-header">
          <h2>Site Updates & Logs</h2>
          <p>Real-time progress reporting</p>
        </div>

        <div class="chat-window" id="chat-window">
          <div v-if="!project.updates || project.updates.length === 0" class="no-updates">
            <p>No updates posted yet.</p>
          </div>

          <div v-for="update in project.updates" :key="update.id" class="update-bubble">
            <div class="u-avatar">{{ update.user ? update.user.name.charAt(0) : 'U' }}</div>
            <div class="u-content">
              <div class="u-meta">
                <strong>{{ update.user ? update.user.name : 'Unknown User' }}</strong>
                <span v-if="update.user" class="u-role">({{ update.user.role }})</span>
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
            <div class="input-wrapper">
              <textarea v-model="newMessage" placeholder="Write update..." rows="2"></textarea>
              <div class="toolbar">
                <input type="file" id="fileUpload" @change="handleFileUpload" accept="image/*" hidden />
                <label for="fileUpload" class="tool-btn" :class="{ 'has-file': selectedFile }">
                  📷 {{ selectedFile ? 'Photo Selected' : 'Add Photo' }}
                </label>
                <button type="submit" class="send-btn" :disabled="isPosting || (!newMessage && !selectedFile)">
                  {{ isPosting ? 'Sending...' : 'Post' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ESTIMATE MODAL -->
    <div v-if="showEstimateModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Add Material Estimate</h3>
          <button @click="showEstimateModal = false" class="close-btn">×</button>
        </div>
        <form @submit.prevent="saveEstimate">
          <div class="form-group">
            <label>Material Name</label>
            <input type="text" v-model="estForm.material_name" required placeholder="e.g. Cement, Steel" />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Est. Quantity</label>
              <input type="number" v-model.number="estForm.estimated_quantity" required min="1" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Unit</label>
              <input type="text" v-model="estForm.unit" required placeholder="e.g. bags, kg" />
            </div>
          </div>

          <div class="form-group">
            <label>Est. Unit Price (Rs.)</label>
            <input type="number" v-model.number="estForm.estimated_unit_price" required min="0" step="0.01" placeholder="0.00" />
          </div>
          <button type="submit" class="btn-save full-width" :disabled="isSavingEstimate">
            {{ isSavingEstimate ? 'Saving...' : 'Add Estimate' }}
          </button>
        </form>
      </div>
    </div>

    <!-- DOCUMENT UPLOAD MODAL -->
    <div v-if="showDocModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Upload Document</h3>
          <button @click="showDocModal = false" class="close-btn">×</button>
        </div>
        <form @submit.prevent="uploadDoc">
          <div class="form-group">
            <label>Document Type</label>
            <select v-model="docForm.type" required>
              <option value="BOQ">Bill of Quantities (BOQ)</option>
              <option value="Drawing">Engineering Drawing</option>
              <option value="Pre-Estimation">Pre-Estimation</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Select File (PDF, Excel, IMG)</label>
            <input type="file" @change="handleDocFile" required />
          </div>
          <button type="submit" class="btn-save full-width" :disabled="isUploading">
            {{ isUploading ? 'Uploading...' : 'Upload' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="zoomImage" class="lightbox" @click="zoomImage = null">
      <img :src="getImageUrl(zoomImage)" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import apexchart from "vue3-apexcharts"; // Import ApexCharts

const route = useRoute();
const project = ref(null);
const newMessage = ref('');
const selectedFile = ref(null);
const isPosting = ref(false);
const zoomImage = ref(null);
const errorMessage = ref(null);
const isAdmin = ref(false); 

// Editing Progress
const isEditingProgress = ref(false);
const editProgressValue = ref(0);
const isSaving = ref(false);

// Document Upload
const showDocModal = ref(false);
const isUploading = ref(false);
const docForm = ref({ type: 'BOQ', file: null });

// BOQ Logic
const boqAnalysis = ref(null);
const showEstimateModal = ref(false);
const isSavingEstimate = ref(false);
const estForm = ref({ material_name: '', estimated_quantity: null, unit: '', estimated_unit_price: null });

// --- CHARTS STATE ---
const financialSeries = ref([]);
const financialOptions = ref({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Plus Jakarta Sans, sans-serif' },
  colors: ['#10B981', '#EF4444'], // Green for Budget, Red for Actual
  plotOptions: { bar: { borderRadius: 4, distributed: true, horizontal: false } },
  dataLabels: { enabled: false },
  xaxis: { categories: ['Estimated', 'Actual'], labels: { style: { colors: '#64748B' } } },
  yaxis: { labels: { formatter: (val) => `Rs. ${val/1000}k` } },
  grid: { borderColor: '#E2E8F0' },
  legend: { show: false }
});

const inventorySeries = ref([]);
const inventoryOptions = ref({
  labels: ['Consumed', 'In Stock'],
  colors: ['#A65D43', '#10B981'], // Primary for Consumed, Green for Stock
  legend: { position: 'bottom' },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '65%' } } }
});
// --------------------

const fetchDetails = async () => {
  try {
    const userRes = await axios.get('/user');
    isAdmin.value = userRes.data.role === 'admin';

    const res = await axios.get(`/projects/${route.params.id}`);
    project.value = res.data;
    
    // Fetch BOQ Analysis
    await fetchBOQ();
    // Fetch Charts Data
    await fetchAnalytics();
    
    scrollToBottom();
  } catch (e) {
    errorMessage.value = "Project not found.";
  }
};

const fetchBOQ = async () => {
  try {
    const res = await axios.get(`/projects/${route.params.id}/boq`);
    boqAnalysis.value = res.data;
  } catch (e) {
    console.error("Failed to fetch BOQ", e);
  }
};

const fetchAnalytics = async () => {
  try {
    const pId = route.params.id;
    // Parallel calls for faster loading
    const [finRes, invRes] = await Promise.all([
      axios.get(`/projects/${pId}/financial-variance`),
      axios.get(`/projects/${pId}/inventory`)
    ]);

    // 1. Setup Financial Bar Chart
    financialSeries.value = [{
      name: 'Amount',
      data: [finRes.data.estimated_total, finRes.data.actual_total]
    }];

    // 2. Setup Inventory Pie Chart
    // Summing quantities across all materials for a "Global Utilization" view
    let totalPurchased = 0;
    let totalUsed = 0;
    
    if (invRes.data.inventory && Array.isArray(invRes.data.inventory)) {
      invRes.data.inventory.forEach(item => {
        totalPurchased += Number(item.total_purchased);
        totalUsed += Number(item.total_used);
      });
    }

    const currentStock = Math.max(0, totalPurchased - totalUsed);
    
    if (totalPurchased > 0) {
      inventorySeries.value = [totalUsed, currentStock];
    } else {
      inventorySeries.value = []; // Shows "No data" state
    }

  } catch (e) {
    console.error("Analytics fetch failed", e);
  }
};

const saveEstimate = async () => {
  isSavingEstimate.value = true;
  try {
    await axios.post(`/projects/${route.params.id}/estimates`, estForm.value);
    showEstimateModal.value = false;
    estForm.value = { material_name: '', estimated_quantity: null, unit: '', estimated_unit_price: null };
    fetchBOQ(); 
    fetchAnalytics(); // Refresh charts
  } catch (e) {
    alert("Failed to save estimate.");
  } finally {
    isSavingEstimate.value = false;
  }
};

const startEditingProgress = () => {
  editProgressValue.value = project.value.progress;
  isEditingProgress.value = true;
};

const cancelEditingProgress = () => {
  isEditingProgress.value = false;
};

const saveProgress = async () => {
  isSaving.value = true;
  try {
    await axios.put(`/projects/${project.value.id}`, { progress: editProgressValue.value });
    project.value.progress = editProgressValue.value;
    isEditingProgress.value = false;
  } catch (e) { 
    alert("Failed to save progress."); 
  } finally { 
    isSaving.value = false; 
  }
};

const handleDocFile = (e) => {
  docForm.value.file = e.target.files[0];
};

const uploadDoc = async () => {
  isUploading.value = true;
  const formData = new FormData();
  formData.append('type', docForm.value.type);
  formData.append('file', docForm.value.file);

  try {
    await axios.post(`/projects/${project.value.id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    showDocModal.value = false;
    docForm.value.file = null;
    fetchDetails();
  } catch (e) {
    alert("Upload failed. Ensure file is under 20MB.");
  } finally {
    isUploading.value = false;
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    const chat = document.getElementById('chat-window');
    if (chat) chat.scrollTop = chat.scrollHeight;
  });
};

const handleFileUpload = (event) => selectedFile.value = event.target.files[0];

const postUpdate = async () => {
  isPosting.value = true;
  const formData = new FormData();
  if (newMessage.value) formData.append('message', newMessage.value);
  if (selectedFile.value) formData.append('image', selectedFile.value);

  try {
    await axios.post(`/projects/${route.params.id}/updates`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    newMessage.value = '';
    selectedFile.value = null;
    fetchDetails();
  } catch (e) { 
    alert("Failed to post update."); 
  } finally { 
    isPosting.value = false; 
  }
};

const getImageUrl = (path) => `http://127.0.0.1:8000${path}`;
const openImage = (path) => zoomImage.value = path;
const formatDate = (d) => new Date(d).toLocaleDateString();
const formatTime = (d) => new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

onMounted(fetchDetails);
</script>

<style scoped>
.details-page { padding: 0 0 40px 0; max-width: 1400px; margin: 0 auto; height: calc(100vh - 100px); animation: fadeIn 0.4s ease; }
.nav-back { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-secondary); font-weight: 600; margin-bottom: 20px; padding: 8px 16px; border-radius: 10px; transition: 0.2s; }
.nav-back:hover { background: var(--bg-surface); color: var(--primary); box-shadow: var(--shadow-sm); }
.content-split { display: grid; grid-template-columns: 380px 1fr; gap: 30px; height: 100%; align-items: start; }
.info-sidebar { height: 100%; overflow-y: auto; padding-right: 5px; }
.info-card { background: var(--bg-surface); padding: 35px; border-radius: 24px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.mt-20 { margin-top: 20px; }
.info-card h1 { margin: 0 0 15px; font-size: 1.8rem; color: var(--text-main); font-weight: 800; line-height: 1.2; }
.status-badge { display: inline-block; background: var(--text-main); color: var(--bg-surface); padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
.meta-group { margin-top: 25px; border-bottom: 1px solid var(--border); padding-bottom: 15px; }
.meta-group:last-child { border-bottom: none; }
.meta-group label { display: block; font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
.meta-group p { margin: 0; color: var(--text-main); font-size: 1.05rem; font-weight: 600; }
.progress-wrap { margin-top: 30px; background: var(--bg-input); padding: 20px; border-radius: 16px; border: 1px solid var(--border); }
.p-header { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; color: var(--text-main); }
.p-bar { height: 10px; background: var(--border); border-radius: 10px; overflow: hidden; }
.p-fill { height: 100%; border-radius: 10px; transition: width 1s ease-out; }
.edit-link { cursor: pointer; display: flex; align-items: center; gap: 5px; color: var(--primary); }
.no-edit { color: var(--text-secondary); }
.edit-mode-ui { display: flex; flex-direction: column; gap: 10px; }
.range-slider { width: 100%; accent-color: var(--primary); }
.edit-actions { display: flex; gap: 10px; justify-content: flex-end; }
.btn-xs { padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; border: none; }
.save { background: var(--primary); color: white; }
.cancel { background: var(--bg-surface); color: var(--text-body); border: 1px solid var(--border); }
.card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.card-title-row h3 { margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 800; }
.add-doc-btn { background: var(--bg-input); border: 1px solid var(--border); color: var(--text-main); width: 30px; height: 30px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.add-doc-btn:hover { background: var(--primary); color: white; border-color: var(--primary); }
.doc-list { display: flex; flex-direction: column; gap: 10px; }
.doc-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-input); border-radius: 12px; border: 1px solid var(--border); transition: 0.2s; }
.doc-item:hover { border-color: var(--primary); transform: translateX(2px); }
.doc-icon { font-size: 1.2rem; }
.doc-info { display: flex; flex-direction: column; overflow: hidden; }
.doc-type { font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
.doc-name { font-size: 0.9rem; font-weight: 600; color: var(--primary); text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.doc-name:hover { text-decoration: underline; }
.empty-docs { font-style: italic; color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 10px; }
.updates-feed { background: var(--bg-surface); border-radius: 24px; border: 1px solid var(--border); display: flex; flex-direction: column; height: 100%; box-shadow: var(--shadow-md); overflow: hidden; }
.feed-header { padding: 20px 30px; border-bottom: 1px solid var(--border); background: var(--bg-nav); backdrop-filter: blur(10px); z-index: 10; }
.feed-header h2 { margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--text-main); }
.feed-header p { margin: 2px 0 0; color: var(--text-secondary); font-size: 0.85rem; }
.chat-window { flex: 1; overflow-y: auto; padding: 30px; display: flex; flex-direction: column; gap: 20px; background-color: var(--bg-chat); }
.no-updates { text-align: center; color: var(--text-secondary); margin-top: 50px; }
.update-bubble { display: flex; gap: 15px; max-width: 85%; animation: slideUp 0.3s ease; }
.u-avatar { width: 40px; height: 40px; background: var(--text-main); color: var(--bg-surface); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.u-content { display: flex; flex-direction: column; }
.u-meta { margin-bottom: 4px; font-size: 0.8rem; display: flex; align-items: baseline; gap: 8px; }
.u-meta strong { color: var(--text-main); font-weight: 700; }
.u-role { font-size: 0.7rem; color: var(--primary); background: rgba(166, 93, 67, 0.1); padding: 2px 6px; border-radius: 6px; font-weight: 600; }
.u-time { font-size: 0.75rem; color: var(--text-muted); margin-left: auto; }
.u-text { background: var(--bg-surface); padding: 14px 18px; border-radius: 0 16px 16px 16px; margin: 0; font-size: 0.95rem; color: var(--text-main); border: 1px solid var(--border); }
.u-image img { max-width: 280px; border-radius: 16px; cursor: zoom-in; margin-top: 10px; box-shadow: var(--shadow-md); }
.input-area { padding: 20px 30px; background: var(--bg-surface); border-top: 1px solid var(--border); }
.input-wrapper { border: 2px solid var(--border); border-radius: 16px; padding: 8px; background: var(--bg-input); }
textarea { width: 100%; border: none; outline: none; padding: 10px 15px; background: transparent; color: var(--text-main); font-family: inherit; }
.toolbar { display: flex; justify-content: space-between; align-items: center; padding: 5px 10px; margin-top: 5px; }
.tool-btn { font-size: 0.9rem; color: var(--text-secondary); cursor: pointer; font-weight: 600; display: flex; gap: 6px; padding: 6px 12px; border-radius: 8px; }
.tool-btn:hover { background: var(--border); color: var(--text-main); }
.send-btn { background: var(--text-main); color: var(--bg-surface); border: none; padding: 10px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-card { background: var(--bg-surface); padding: 35px; border-radius: 24px; width: 450px; border: 1px solid var(--border); box-shadow: var(--shadow-lg); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { color: var(--text-main); margin: 0; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: var(--text-secondary); }
input, select { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-input); color: var(--text-main); }
.btn-save { background: var(--text-main); color: var(--bg-surface); padding: 15px; width: 100%; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; margin-top: 10px; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); }
.full-width { width: 100%; }
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); z-index: 3000; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
.lightbox img { max-height: 90vh; max-width: 90vw; border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }

/* BOQ Styles */
.boq-summary { display: flex; gap: 20px; margin-bottom: 15px; background: var(--bg-input); padding: 15px; border-radius: 12px; border: 1px solid var(--border); }
.boq-stat { display: flex; flex-direction: column; }
.boq-stat label { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); }
.boq-stat span { font-weight: 800; font-size: 1.1rem; color: var(--text-main); }
.text-danger { color: var(--danger-text) !important; }
.table-responsive { overflow-x: auto; }
.boq-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.boq-table th { text-align: left; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.boq-table td { padding: 10px 0; border-bottom: 1px solid var(--border); color: var(--text-main); }
.mat-name { font-weight: 700; font-size: 0.9rem; }
.status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
.dot-red { background: var(--danger-text); }
.dot-green { background: var(--success-text); }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }

/* Chart Styles */
.charts-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 15px; }
.chart-box { background: var(--bg-input); border-radius: 16px; padding: 15px; border: 1px solid var(--border); }
.chart-box h4 { margin: 0 0 15px 0; font-size: 0.9rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.pie-wrap { display: flex; justify-content: center; }
.empty-chart { text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 30px; font-style: italic; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1024px) { .content-split { grid-template-columns: 1fr; } .info-sidebar { display: none; } }
</style>