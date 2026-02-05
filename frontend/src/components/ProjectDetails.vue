<template>
  <div class="details-page">
    <!-- Back Button -->
    <div class="nav-back" @click="$router.push('/projects')">
      <span>← Back to Projects</span>
    </div>

    <div v-if="project" class="content-split">
      <!-- LEFT: PROJECT INFO -->
      <div class="info-sidebar">
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

          <div class="progress-wrap">
            <div class="p-header">
              <span>Overall Completion</span>
              <span>{{ project.progress }}%</span>
            </div>
            <div class="p-bar">
              <div class="p-fill" :style="{ width: project.progress + '%', background: '#A65D43' }"></div>
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

        <!-- Chat History -->
        <div class="chat-window">
          <div v-if="project.updates.length === 0" class="no-updates">
            <p>No updates posted yet. Be the first to report progress.</p>
          </div>

          <div v-for="update in project.updates" :key="update.id" class="update-bubble">
            <div class="u-avatar">{{ update.user.name.charAt(0) }}</div>
            <div class="u-content">
              <div class="u-meta">
                <strong>{{ update.user.name }}</strong>
                <span class="u-role">({{ update.user.role }})</span>
                <span class="u-time">{{ formatTime(update.created_at) }}</span>
              </div>
              
              <p v-if="update.message" class="u-text">{{ update.message }}</p>
              
              <!-- Image Attachment -->
              <div v-if="update.image_path" class="u-image">
                <img :src="getImageUrl(update.image_path)" alt="Site Photo" @click="openImage(update.image_path)" />
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="input-area">
          <form @submit.prevent="postUpdate">
            <div class="input-wrapper">
              <textarea 
                v-model="newMessage" 
                placeholder="Write site update, issues, or logs..."
                rows="2"
              ></textarea>
              
              <div class="toolbar">
                <!-- File Input Hidden, Triggered by Label -->
                <input type="file" id="fileUpload" @change="handleFileUpload" accept="image/*" hidden />
                <label for="fileUpload" class="tool-btn" :class="{ 'has-file': selectedFile }">
                  📷 {{ selectedFile ? 'Photo Selected' : 'Add Photo' }}
                </label>
                
                <button type="submit" class="send-btn" :disabled="isPosting || (!newMessage && !selectedFile)">
                  {{ isPosting ? 'Sending...' : 'Post Update' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loader">
      <div class="spinner"></div>
    </div>

    <!-- Image Modal -->
    <div v-if="zoomImage" class="lightbox" @click="zoomImage = null">
      <img :src="getImageUrl(zoomImage)" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const project = ref(null);
const newMessage = ref('');
const selectedFile = ref(null);
const isPosting = ref(false);
const zoomImage = ref(null);

const fetchDetails = async () => {
  try {
    const res = await axios.get(`/projects/${route.params.id}`);
    project.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0];
};

const postUpdate = async () => {
  isPosting.value = true;
  const formData = new FormData();
  formData.append('message', newMessage.value);
  if (selectedFile.value) {
    formData.append('image', selectedFile.value);
  }

  try {
    await axios.post(`/projects/${route.params.id}/updates`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    newMessage.value = '';
    selectedFile.value = null;
    fetchDetails(); // Refresh chat
  } catch (e) {
    alert("Failed to post update");
  } finally {
    isPosting.value = false;
  }
};

const getImageUrl = (path) => {
  return `http://127.0.0.1:8000${path}`;
};

const openImage = (path) => {
  zoomImage.value = path;
};

const formatDate = (d) => new Date(d).toLocaleDateString();
const formatTime = (d) => new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

onMounted(fetchDetails);
</script>

<style scoped>
.details-page { padding: 30px; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; max-width: 1400px; margin: 0 auto; }

.nav-back { cursor: pointer; color: #64748b; font-weight: 600; margin-bottom: 20px; display: inline-block; font-size: 14px; }
.nav-back:hover { color: #A65D43; text-decoration: underline; }

.content-split { display: grid; grid-template-columns: 350px 1fr; gap: 30px; align-items: start; }

/* INFO SIDEBAR */
.info-card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; position: sticky; top: 90px; }
.info-card h1 { margin: 0 0 10px; font-size: 22px; color: #1e293b; font-weight: 800; }
.status-badge { background: #fff7ed; color: #f59e0b; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }

.meta-group { margin-top: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
.meta-group:last-child { border-bottom: none; }
.meta-group label { display: block; font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
.meta-group p { margin: 0; color: #334155; font-size: 14px; font-weight: 500; }

.progress-wrap { margin-top: 25px; background: #f8fafc; padding: 15px; border-radius: 12px; }
.p-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
.p-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.p-fill { height: 100%; transition: width 0.5s; }

/* UPDATES FEED */
.updates-feed { background: white; border-radius: 20px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; height: 85vh; }
.feed-header { padding: 25px; border-bottom: 1px solid #f1f5f9; }
.feed-header h2 { margin: 0; font-size: 18px; font-weight: 700; color: #1e293b; }
.feed-header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }

/* CHAT AREA */
.chat-window { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 25px; background: #fdfdfd; }
.no-updates { text-align: center; color: #94a3b8; font-style: italic; margin-top: 50px; }

.update-bubble { display: flex; gap: 15px; }
.u-avatar { width: 40px; height: 40px; background: #2c3e50; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
.u-content { max-width: 80%; }
.u-meta { margin-bottom: 6px; font-size: 13px; }
.u-meta strong { color: #1e293b; margin-right: 5px; }
.u-role { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; margin-right: 8px; }
.u-time { font-size: 11px; color: #94a3b8; }

.u-text { background: white; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 0 12px 12px 12px; margin: 0; font-size: 14px; color: #334155; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
.u-image { margin-top: 10px; }
.u-image img { max-width: 250px; border-radius: 12px; cursor: zoom-in; border: 1px solid #cbd5e1; transition: 0.2s; }
.u-image img:hover { transform: scale(1.02); }

/* INPUT AREA */
.input-area { padding: 20px; border-top: 1px solid #f1f5f9; background: white; border-radius: 0 0 20px 20px; }
.input-wrapper { border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 5px; transition: border-color 0.2s; }
.input-wrapper:focus-within { border-color: #A65D43; }
textarea { width: 100%; border: none; outline: none; padding: 10px; font-family: inherit; font-size: 14px; resize: none; border-radius: 8px; }

.toolbar { display: flex; justify-content: space-between; align-items: center; padding: 5px 10px; background: #f8fafc; border-radius: 8px; margin-top: 5px; }
.tool-btn { font-size: 13px; color: #64748b; cursor: pointer; font-weight: 600; transition: 0.2s; }
.tool-btn:hover { color: #1e293b; }
.tool-btn.has-file { color: #A65D43; }

.send-btn { background: #A65D43; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; }
.send-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

/* LIGHTBOX */
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 3000; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
.lightbox img { max-height: 90vh; max-width: 90vw; border-radius: 4px; }

.loader { display: flex; justify-content: center; padding-top: 100px; }
.spinner { border: 4px solid #f3f3f3; border-top: 4px solid #A65D43; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

@media (max-width: 1024px) {
  .content-split { grid-template-columns: 1fr; }
  .info-card { position: static; }
}
</style>