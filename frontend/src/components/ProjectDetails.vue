<template>
  <div class="details-page">
    <!-- Back Button -->
    <div class="nav-back" @click="$router.push('/projects')">
      <span>← Back to Projects</span>
    </div>

    <!-- MAIN CONTENT -->
    <div v-if="project" class="content-split">
      <!-- LEFT: PROJECT INFO & DOCUMENTS -->
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

          <!-- EDITABLE PROGRESS SECTION (Admin Only Edit) -->
          <div class="progress-wrap">
            <div class="p-header">
              <span>Overall Completion</span>
              <!-- Hide edit link if not admin -->
              <div v-if="isAdmin && !isEditingProgress" class="edit-link" @click="startEditingProgress">
                {{ project.progress }}% <span class="icon">✏️</span>
              </div>
              <div v-else-if="!isAdmin" class="no-edit">
                {{ project.progress }}%
              </div>
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

const route = useRoute();
const project = ref(null);
const newMessage = ref('');
const selectedFile = ref(null);
const isPosting = ref(false);
const zoomImage = ref(null);
const errorMessage = ref(null);
const isAdmin = ref(false); // Check role

// Editing Progress
const isEditingProgress = ref(false);
const editProgressValue = ref(0);
const isSaving = ref(false);

// Document Upload
const showDocModal = ref(false);
const isUploading = ref(false);
const docForm = ref({ type: 'BOQ', file: null });

const fetchDetails = async () => {
  try {
    const userRes = await axios.get('/user');
    isAdmin.value = userRes.data.role === 'admin';

    const res = await axios.get(`/projects/${route.params.id}`);
    project.value = res.data;
    scrollToBottom();
  } catch (e) {
    errorMessage.value = "Project not found.";
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
    fetchDetails(); // Reload docs
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
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1024px) { .content-split { grid-template-columns: 1fr; } .info-sidebar { display: none; } }
</style>