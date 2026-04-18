<template>
  <div class="details-page">
    <div class="nav-back" @click="$router.push('/projects')">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      <span>Back to Projects</span>
    </div>

    <div v-if="project" class="page-stack">
      <section class="overview-card">
        <div class="overview-main">
          <div>
            <span class="eyebrow">Project detail</span>
            <div class="title-row">
              <h1>{{ project.name }}</h1>
              <span :class="['status-badge', project.status.toLowerCase().replace(' ', '-')]">{{ project.status }}</span>
            </div>
            <p class="overview-copy">{{ project.client_name }} · {{ project.location || 'No location added' }}</p>
          </div>
          <div class="meta-strip">
            <div class="meta-pill">
              <span>Budget</span>
              <strong>Rs. {{ Number(project.budget || 0).toLocaleString() }}</strong>
            </div>
            <div class="meta-pill">
              <span>Team</span>
              <strong>{{ project.users?.length || 0 }} members</strong>
            </div>
            <div class="meta-pill">
              <span>Timeline</span>
              <strong>{{ formatDate(project.start_date) }} - {{ project.end_date ? formatDate(project.end_date) : 'Ongoing' }}</strong>
            </div>
          </div>
        </div>

        <div class="progress-shell">
          <div class="progress-top">
            <div>
              <span class="progress-label">Construction Phase</span>
              <strong>{{ getPhaseName(project.progress) }} ({{ project.progress }}%)</strong>
            </div>
            <button v-if="isAdmin && !isEditingProgress" class="btn ghost mini" @click="startEditingProgress">Update</button>
          </div>
          <div v-if="!isEditingProgress" class="progress-bar">
            <div class="progress-fill" :style="{ width: `${project.progress}%` }"></div>
          </div>
          <div v-else class="progress-editor">
            <div class="select-wrapper">
              <select v-model.number="editProgressValue" class="styled-input">
                <option v-for="phase in constructionPhases" :key="phase.value" :value="phase.value">
                  {{ phase.name }} ({{ phase.value }}%)
                </option>
              </select>
            </div>
            <div class="editor-actions">
              <button class="btn ghost mini" @click="cancelEditingProgress">Cancel</button>
              <button class="btn primary mini" @click="saveProgress" :disabled="isSavingProgress">
                {{ isSavingProgress ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div class="content-grid">
        <section class="content-card">
          <div class="tab-row">
            <button v-for="tab in tabs" :key="tab" :class="['tab-btn', { active: activeTab === tab }]" @click="activeTab = tab">
              {{ tab }}
            </button>
          </div>

          <div v-if="activeTab === 'Overview'" class="tab-panel">
            <div class="summary-grid">
              <div class="summary-card">
                <span class="summary-label">Estimated Budget</span>
                <strong>Rs. {{ Number(boqAnalysis?.total_estimated_budget || 0).toLocaleString() }}</strong>
              </div>
              <div class="summary-card">
                <span class="summary-label">Actual Material Cost</span>
                <strong>Rs. {{ Number(boqAnalysis?.total_actual_cost || 0).toLocaleString() }}</strong>
              </div>
              <div class="summary-card">
                <span class="summary-label">Variance</span>
                <strong :class="{ danger: Number(financialVariance?.variance_amount || 0) < 0 }">
                  Rs. {{ Number(financialVariance?.variance_amount || 0).toLocaleString() }}
                </strong>
              </div>
            </div>

            <div class="chart-grid">
              <div class="chart-card">
                <h3>Budget vs Actual</h3>
                <apexchart type="bar" height="280" :options="financialOptions" :series="financialSeries"></apexchart>
              </div>
              <div class="chart-card">
                <h3>Inventory Snapshot</h3>
                <apexchart v-if="inventorySeries.length" type="donut" height="280" :options="inventoryOptions" :series="inventorySeries"></apexchart>
                <div v-else class="empty-state">No inventory data yet.</div>
              </div>
            </div>

            <div class="table-shell">
              <div class="panel-header">
                <div>
                  <h3>BOQ Estimate Records</h3>
                  <p>Latest estimate list currently saved for this project.</p>
                </div>
                <button v-if="isAdmin" class="btn primary mini" @click="showEstimateModal = true">Add Estimate</button>
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!project.estimates?.length">
                    <td colspan="4" class="empty-cell">No estimates added yet.</td>
                  </tr>
                  <tr v-for="estimate in project.estimates" :key="estimate.id">
                    <td>{{ estimate.material_name }}</td>
                    <td>{{ estimate.estimated_quantity }}</td>
                    <td>{{ estimate.unit }}</td>
                    <td>Rs. {{ Number(estimate.estimated_unit_price || 0).toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="activeTab === 'Materials'" class="tab-panel">
            <MaterialComparison ref="comparisonRef" :project-id="route.params.id" />
          </div>

          <div v-if="activeTab === 'Team'" class="tab-panel">
            <div class="panel-header">
              <div>
                <h3>Project Members</h3>
                <p>Only these members can receive tasks for this project.</p>
              </div>
              <button v-if="isAdmin" class="btn primary mini" @click="openTeamModal">Add Members</button>
            </div>

            <div class="member-list">
              <div v-if="!project.users?.length" class="empty-state">No team members assigned yet.</div>
              <div v-for="member in project.users" :key="member.id" class="member-row">
                <div class="member-main">
                  <div class="avatar">{{ member.name.charAt(0) }}</div>
                  <div>
                    <strong>{{ member.name }}</strong>
                    <span>{{ member.role }}</span>
                  </div>
                </div>
                <button v-if="isAdmin" class="btn ghost mini" @click="removeMember(member.id)">Remove</button>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'Documents'" class="tab-panel">
            <div class="panel-header">
              <div>
                <h3>Project Documents</h3>
                <p>Latest versions are shown first, with history available per document chain.</p>
              </div>
              <button class="btn primary mini" @click="showDocModal = true">Upload Document</button>
            </div>

            <div class="doc-list">
              <div v-if="!latestDocuments.length" class="empty-state">No documents uploaded.</div>
              <div v-for="doc in latestDocuments" :key="doc.id" class="doc-item">
                <div class="doc-meta">
                  <strong>{{ doc.original_name }}</strong>
                  <span>{{ doc.file_type }} · Version {{ doc.version }} · {{ doc.parsed_status || 'n/a' }}</span>
                </div>
                <div class="doc-actions">
                  <a class="btn ghost mini" :href="getImageUrl(doc.file_path)" target="_blank">Open</a>
                  <button class="btn ghost mini" @click="openVersionHistory(doc)">History</button>
                  <button v-if="isAdmin && doc.file_type === 'BOQ' && doc.status === 'pending'" class="btn primary mini" @click="approveDoc(doc)">Approve</button>
                  <button v-if="isAdmin && doc.file_type === 'BOQ' && doc.status === 'pending'" class="btn danger mini" @click="rejectDoc(doc)">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="updates-card">
          <div class="panel-header">
            <div>
              <h3>Site Updates & Logs</h3>
              <p>Live feed from the project team.</p>
            </div>
          </div>

          <div class="chat-window" id="chat-window">
            <div v-if="!project.updates?.length" class="empty-state">No updates posted yet.</div>
            <div v-for="update in project.updates" :key="update.id" class="update-bubble">
              <div class="avatar">{{ update.user?.name?.charAt(0) || 'U' }}</div>
              <div class="update-card">
                <div class="update-top">
                  <strong>{{ update.user?.name || 'Unknown User' }}</strong>
                  <span>{{ formatTime(update.created_at) }}</span>
                </div>
                <p v-if="update.message">{{ update.message }}</p>
                <img v-if="update.image_path" :src="getImageUrl(update.image_path)" alt="Update" @click="zoomImage = update.image_path" />
              </div>
            </div>
          </div>

          <form class="update-form" @submit.prevent="postUpdate">
            <textarea v-model="newMessage" rows="2" placeholder="Write an update..."></textarea>
            <div class="form-toolbar">
              <label class="btn ghost mini">
                Attach Photo
                <input type="file" hidden accept="image/*" @change="handleFileUpload" />
              </label>
              <button type="submit" class="btn primary mini" :disabled="isPosting || (!newMessage && !selectedFile)">
                {{ isPosting ? 'Posting...' : 'Post Update' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>

    <div v-if="showEstimateModal" class="modal-backdrop" @click.self="showEstimateModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Add Material Estimate</h3>
          <button @click="showEstimateModal = false" class="close-btn">×</button>
        </div>
        <form @submit.prevent="saveEstimate">
          <div class="form-group">
            <label>Material Name</label>
            <input v-model="estForm.material_name" type="text" class="styled-input" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Estimated Quantity</label>
              <input v-model.number="estForm.estimated_quantity" type="number" class="styled-input" min="0" required />
            </div>
            <div class="form-group">
              <label>Unit</label>
              <input v-model="estForm.unit" type="text" class="styled-input" required />
            </div>
          </div>
          <div class="form-group">
            <label>Estimated Unit Price</label>
            <input v-model.number="estForm.estimated_unit_price" type="number" class="styled-input" min="0" step="0.01" required />
          </div>
          <button type="submit" class="btn primary full-width" :disabled="isSavingEstimate">
            {{ isSavingEstimate ? 'Saving...' : 'Add Estimate' }}
          </button>
        </form>
      </div>
    </div>

    <div v-if="showDocModal" class="modal-backdrop" @click.self="showDocModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Upload Document</h3>
          <button @click="showDocModal = false" class="close-btn">×</button>
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
          <div class="form-group">
            <label>Select File</label>
            <input type="file" class="styled-input" @change="handleDocFile" required />
          </div>
          <button type="submit" class="btn primary full-width" :disabled="isUploading">
            {{ isUploading ? 'Uploading...' : 'Upload File' }}
          </button>
        </form>
      </div>
    </div>

    <div v-if="showTeamModal" class="modal-backdrop" @click.self="showTeamModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Add Project Members</h3>
          <button @click="showTeamModal = false" class="close-btn">×</button>
        </div>
        <form @submit.prevent="saveTeamMembers">
          <div class="checkbox-list">
            <label v-for="user in availableUsers" :key="user.id" class="checkbox-row">
              <input type="checkbox" :value="user.id" v-model="selectedUserIds" />
              <span>{{ user.name }} <small>({{ user.role }})</small></span>
            </label>
          </div>
          <button type="submit" class="btn primary full-width" :disabled="isSavingTeam">
            {{ isSavingTeam ? 'Saving...' : 'Add Selected Members' }}
          </button>
        </form>
      </div>
    </div>

    <div v-if="showHistoryModal" class="modal-backdrop" @click.self="showHistoryModal = false">
      <div class="modal-card wide">
        <div class="modal-header">
          <h3>Version History</h3>
          <button @click="showHistoryModal = false" class="close-btn">×</button>
        </div>
        <div class="history-list">
          <div v-for="doc in versionHistory" :key="doc.id" class="history-row">
            <div>
              <strong>{{ doc.original_name }}</strong>
              <span>{{ doc.file_type }} · Version {{ doc.version }} · {{ doc.status }} · {{ doc.parsed_status || 'n/a' }}</span>
            </div>
            <a class="btn ghost mini" :href="getImageUrl(doc.file_path)" target="_blank">Open</a>
          </div>
        </div>
      </div>
    </div>

    <div v-if="zoomImage" class="lightbox" @click="zoomImage = null">
      <img :src="getImageUrl(zoomImage)" />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import apexchart from 'vue3-apexcharts';
import MaterialComparison from './MaterialComparison.vue';
import { useAuth } from '../useAuth';

const route = useRoute();
const { user, loadUser } = useAuth();

const project = ref(null);
const boqAnalysis = ref(null);
const financialVariance = ref(null);
const inventoryData = ref(null);
const comparisonRef = ref(null);

const newMessage = ref('');
const selectedFile = ref(null);
const isPosting = ref(false);
const zoomImage = ref(null);

const showEstimateModal = ref(false);
const showDocModal = ref(false);
const showTeamModal = ref(false);
const showHistoryModal = ref(false);
const isSavingEstimate = ref(false);
const isUploading = ref(false);
const isSavingTeam = ref(false);
const isSavingProgress = ref(false);
const activeTab = ref('Overview');
const tabs = ['Overview', 'Materials', 'Team', 'Documents'];

const isEditingProgress = ref(false);
const editProgressValue = ref(0);

const availableUsers = ref([]);
const selectedUserIds = ref([]);
const versionHistory = ref([]);

const estForm = ref({ material_name: '', estimated_quantity: null, unit: '', estimated_unit_price: null });
const docForm = ref({ type: 'BOQ', file: null });

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
  { name: 'Finishing', value: 100 },
];

const isAdmin = computed(() => user.value?.role === 'admin');

const latestDocuments = computed(() => {
  if (!project.value?.documents) return [];
  const grouped = new Map();

  project.value.documents.forEach((doc) => {
    const key = `${doc.file_type}-${doc.parent_document_id || doc.id}`;
    const current = grouped.get(key);
    if (!current || Number(doc.version) > Number(current.version)) {
      grouped.set(key, doc);
    }
  });

  return Array.from(grouped.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
});

const financialSeries = computed(() => [
  {
    name: 'Amount',
    data: [
      Number(boqAnalysis.value?.total_estimated_budget || 0),
      Number(boqAnalysis.value?.total_actual_cost || 0),
    ],
  },
]);

const financialOptions = {
  chart: { toolbar: { show: false }, fontFamily: 'Plus Jakarta Sans' },
  colors: ['#a65d43'],
  dataLabels: { enabled: false },
  xaxis: { categories: ['Estimated', 'Actual'], labels: { style: { colors: '#64748B' } } },
  yaxis: { labels: { style: { colors: '#64748B' } } },
  grid: { borderColor: 'rgba(100, 116, 139, 0.12)' },
};

const inventorySeries = computed(() => {
  if (!inventoryData.value?.inventory?.length) return [];
  return inventoryData.value.inventory.map((item) => Number(item.current_stock || 0));
});

const inventoryOptions = computed(() => ({
  labels: inventoryData.value?.inventory?.map((item) => item.material_name) || [],
  colors: ['#a65d43', '#1f7a8c', '#84a98c', '#f59e0b', '#64748b'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: false },
}));

const getPhaseName = (progressValue) => {
  const phase = [...constructionPhases].reverse().find((item) => progressValue >= item.value);
  return phase ? phase.name : 'Unknown';
};

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : 'N/A');
const formatTime = (date) => new Date(date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const getImageUrl = (path) => `http://127.0.0.1:8000${path}`;

const fetchDetails = async () => {
  await loadUser();
  const response = await axios.get(`/projects/${route.params.id}`);
  project.value = response.data;
};

const fetchAnalytics = async () => {
  const [boqRes, varianceRes, inventoryRes] = await Promise.all([
    axios.get(`/projects/${route.params.id}/boq`),
    axios.get(`/projects/${route.params.id}/financial-variance`),
    axios.get(`/projects/${route.params.id}/inventory`),
  ]);

  boqAnalysis.value = boqRes.data;
  financialVariance.value = varianceRes.data;
  inventoryData.value = inventoryRes.data;
};

const refreshPage = async () => {
  await Promise.all([fetchDetails(), fetchAnalytics()]);
  if (comparisonRef.value?.fetchComparison) {
    comparisonRef.value.fetchComparison();
  }
};

const startEditingProgress = () => {
  editProgressValue.value = project.value.progress || 0;
  isEditingProgress.value = true;
};

const cancelEditingProgress = () => {
  isEditingProgress.value = false;
};

const saveProgress = async () => {
  isSavingProgress.value = true;
  try {
    await axios.put(`/projects/${route.params.id}`, { progress: editProgressValue.value });
    project.value.progress = editProgressValue.value;
    isEditingProgress.value = false;
  } catch (error) {
    alert('Failed to update phase.');
  } finally {
    isSavingProgress.value = false;
  }
};

const saveEstimate = async () => {
  isSavingEstimate.value = true;
  try {
    await axios.post(`/projects/${route.params.id}/estimates`, estForm.value);
    estForm.value = { material_name: '', estimated_quantity: null, unit: '', estimated_unit_price: null };
    showEstimateModal.value = false;
    await refreshPage();
  } catch (error) {
    alert('Failed to save estimate.');
  } finally {
    isSavingEstimate.value = false;
  }
};

const handleDocFile = (event) => {
  docForm.value.file = event.target.files[0];
};

const uploadDoc = async () => {
  const formData = new FormData();
  formData.append('type', docForm.value.type);
  formData.append('file', docForm.value.file);

  isUploading.value = true;
  try {
    await axios.post(`/projects/${route.params.id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    showDocModal.value = false;
    docForm.value = { type: 'BOQ', file: null };
    await refreshPage();
  } catch (error) {
    alert(error.response?.data?.message || 'Upload failed.');
  } finally {
    isUploading.value = false;
  }
};

const approveDoc = async (doc) => {
  await axios.patch(`/documents/${doc.id}/approve`);
  await refreshPage();
};

const rejectDoc = async (doc) => {
  await axios.patch(`/documents/${doc.id}/reject`);
  await refreshPage();
};

const openVersionHistory = (doc) => {
  const rootId = doc.parent_document_id || doc.id;
  versionHistory.value = (project.value.documents || [])
    .filter((item) => (item.parent_document_id || item.id) === rootId && item.file_type === doc.file_type)
    .sort((a, b) => Number(b.version) - Number(a.version));
  showHistoryModal.value = true;
};

const openTeamModal = async () => {
  const [usersRes, membersRes] = await Promise.all([
    axios.get('/users-list'),
    axios.get(`/projects/${route.params.id}/members`),
  ]);

  const memberIds = membersRes.data.map((member) => member.id);
  availableUsers.value = usersRes.data.filter((candidate) => !memberIds.includes(candidate.id));
  selectedUserIds.value = [];
  showTeamModal.value = true;
};

const saveTeamMembers = async () => {
  isSavingTeam.value = true;
  try {
    await axios.post(`/projects/${route.params.id}/members`, { user_ids: selectedUserIds.value });
    showTeamModal.value = false;
    await refreshPage();
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to add members.');
  } finally {
    isSavingTeam.value = false;
  }
};

const removeMember = async (userId) => {
  if (!confirm('Remove this member from the project?')) return;
  await axios.delete(`/projects/${route.params.id}/members/${userId}`);
  await refreshPage();
};

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0];
};

const scrollToBottom = () => {
  nextTick(() => {
    const chat = document.getElementById('chat-window');
    if (chat) chat.scrollTop = chat.scrollHeight;
  });
};

const postUpdate = async () => {
  const formData = new FormData();
  if (newMessage.value) formData.append('message', newMessage.value);
  if (selectedFile.value) formData.append('image', selectedFile.value);

  isPosting.value = true;
  try {
    const response = await axios.post(`/projects/${route.params.id}/updates`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!project.value.updates) project.value.updates = [];
    project.value.updates.push(response.data);
    newMessage.value = '';
    selectedFile.value = null;
    scrollToBottom();
  } catch (error) {
    alert('Failed to post update.');
  } finally {
    isPosting.value = false;
  }
};

onMounted(async () => {
  await refreshPage();
  scrollToBottom();

  if (window.Echo) {
    window.Echo.private(`project.${route.params.id}`)
      .listen('.ProjectUpdatePosted', (event) => {
        if (!project.value.updates) project.value.updates = [];
        project.value.updates.push(event.update);
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
.details-page { padding: 40px 0; max-width: 1280px; margin: 0 auto; animation: fadeIn 0.3s ease; }
.nav-back { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-secondary); font-weight: 600; margin-bottom: 24px; font-size: 0.92rem; transition: 0.2s; padding: 10px 14px; border: 1px solid var(--border); border-radius: 999px; background: var(--bg-surface); }
.page-stack { display: flex; flex-direction: column; gap: 24px; }
.overview-card,
.content-card,
.updates-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 20px; }
.overview-card { padding: 28px; display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
.eyebrow { display: inline-block; margin-bottom: 12px; color: var(--primary); font-size: 0.74rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.title-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.title-row h1 { margin: 0; font-size: 2rem; color: var(--text-main); letter-spacing: -0.04em; }
.overview-copy { margin: 10px 0 0; color: var(--text-secondary); }
.meta-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-top: 22px; }
.meta-pill,
.summary-card { padding: 16px; border-radius: 16px; background: var(--bg-input); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }
.meta-pill span,
.summary-label { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); font-weight: 700; }
.meta-pill strong,
.summary-card strong { color: var(--text-main); font-size: 1rem; }
.summary-card strong.danger { color: #dc2626; }

.progress-shell { border: 1px solid var(--border); border-radius: 18px; padding: 20px; background: var(--bg-input); }
.progress-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.progress-label { display: block; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 6px; }
.progress-top strong { color: var(--text-main); }
.progress-bar { height: 10px; border-radius: 999px; background: rgba(100, 116, 139, 0.14); overflow: hidden; }
.progress-fill { height: 100%; background: var(--primary); border-radius: 999px; }
.progress-editor { display: flex; flex-direction: column; gap: 12px; }
.editor-actions { display: flex; justify-content: flex-end; gap: 10px; }

.content-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px; align-items: start; }
.content-card { padding: 24px; }
.updates-card { padding: 24px; display: flex; flex-direction: column; gap: 18px; min-height: 760px; }
.tab-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 22px; }
.tab-btn { border: 1px solid var(--border); background: var(--bg-input); color: var(--text-secondary); padding: 10px 14px; border-radius: 999px; font-weight: 700; cursor: pointer; }
.tab-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
.tab-panel { display: flex; flex-direction: column; gap: 20px; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; }
.chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.chart-card,
.table-shell { border: 1px solid var(--border); border-radius: 18px; background: var(--bg-surface); overflow: hidden; }
.chart-card { padding: 20px; }
.chart-card h3,
.panel-header h3 { margin: 0 0 6px; color: var(--text-main); font-size: 1.05rem; }
.panel-header { padding: 20px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.panel-header p { margin: 0; color: var(--text-secondary); font-size: 0.88rem; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: color-mix(in srgb, var(--bg-surface) 72%, var(--bg-input) 28%); color: var(--text-secondary); padding: 16px 22px; text-align: left; font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
.data-table td { padding: 16px 22px; border-bottom: 1px solid var(--border); color: var(--text-body); }
.data-table tr:last-child td { border-bottom: none; }
.empty-cell,
.empty-state { text-align: center; color: var(--text-muted); padding: 24px; }

.member-list,
.doc-list,
.history-list { display: flex; flex-direction: column; gap: 12px; }
.member-row,
.doc-item,
.history-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px; border: 1px solid var(--border); border-radius: 16px; background: var(--bg-input); }
.member-main,
.doc-meta { display: flex; align-items: center; gap: 12px; }
.member-main strong,
.doc-meta strong { display: block; color: var(--text-main); }
.member-main span,
.doc-meta span,
.history-row span { display: block; color: var(--text-secondary); font-size: 0.82rem; margin-top: 4px; }
.doc-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.avatar { width: 38px; height: 38px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; }

.chat-window { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding-right: 6px; }
.update-bubble { display: flex; gap: 12px; }
.update-card { flex: 1; border: 1px solid var(--border); border-radius: 16px; padding: 14px 16px; background: var(--bg-input); }
.update-top { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.update-top strong { color: var(--text-main); }
.update-top span { color: var(--text-muted); font-size: 0.78rem; }
.update-card p { margin: 0; color: var(--text-body); line-height: 1.6; }
.update-card img { width: 100%; max-width: 280px; margin-top: 12px; border-radius: 12px; cursor: zoom-in; border: 1px solid var(--border); }
.update-form { border: 1px solid var(--border); border-radius: 18px; padding: 14px; background: var(--bg-input); }
.update-form textarea { width: 100%; border: none; resize: none; outline: none; background: transparent; color: var(--text-main); font-family: inherit; }
.form-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; border-top: 1px dashed var(--border); padding-top: 12px; margin-top: 12px; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.42); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
.modal-card { background: var(--bg-surface); width: 460px; padding: 28px; border-radius: 20px; box-shadow: 0 24px 50px rgba(0,0,0,0.12); border: 1px solid var(--border); max-height: 90vh; overflow-y: auto; }
.modal-card.wide { width: 720px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-header h3 { font-size: 1.2rem; font-weight: 800; margin: 0; color: var(--text-main); }
.close-btn { background: transparent; border: none; color: var(--text-secondary); font-size: 1.6rem; cursor: pointer; }
.checkbox-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.checkbox-row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; }
.checkbox-row small { color: var(--text-secondary); }
.form-group { margin-bottom: 18px; display: flex; flex-direction: column; gap: 8px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group label { font-size: 0.82rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.08em; }
.styled-input { width: 100%; min-height: 48px; padding: 12px 16px; background: transparent; border: 1px solid var(--border); border-radius: 10px; color: var(--text-main); font-size: 0.96rem; box-sizing: border-box; }
.styled-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1); background: var(--bg-surface); }
.select-wrapper { position: relative; }
.select-wrapper::after { content: ''; position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-size: contain; pointer-events: none; }
.select-wrapper select { padding-right: 48px; }

.btn { padding: 0 18px; height: 42px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: 0.2s; }
.btn.primary { background: var(--primary); color: white; }
.btn.ghost { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
.btn.danger { background: #fee2e2; color: #b91c1c; }
.btn.mini { height: 36px; padding: 0 12px; font-size: 0.82rem; }
.full-width { width: 100%; }

.status-badge { display: inline-flex; padding: 6px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.upcoming { background: var(--bg-input); color: var(--text-secondary); }
.in-progress { background: rgba(166, 93, 67, 0.12); color: var(--primary); }
.on-hold { background: rgba(239, 68, 68, 0.12); color: #dc2626; }
.completed { background: rgba(16, 185, 129, 0.12); color: #059669; }

.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 3000; cursor: zoom-out; }
.lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 16px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 1080px) {
  .overview-card,
  .content-grid,
  .chart-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .details-page { padding: 24px 0; }
  .content-card,
  .updates-card,
  .overview-card { padding: 20px; }
  .form-row { grid-template-columns: 1fr; }
  .member-row,
  .doc-item,
  .history-row,
  .panel-header,
  .progress-top,
  .form-toolbar { flex-direction: column; align-items: stretch; }
}
</style>
