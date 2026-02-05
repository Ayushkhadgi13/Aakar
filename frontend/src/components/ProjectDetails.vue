<template>
  <div class="details-page">
    <!-- Back Button -->
    <div class="nav-back" @click="$router.push('/projects')">
      <span>← Back to Projects</span>
    </div>

    <!-- MAIN CONTENT -->
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
        <div class="chat-window" id="chat-window">
          <div v-if="!project.updates || project.updates.length === 0" class="no-updates">
            <p>No updates posted yet. Be the first to report progress.</p>
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

    <!-- ERROR STATE -->
    <div v-else-if="errorMessage" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>Failed to load project</h3>
      <p>{{ errorMessage }}</p>
      <button @click="fetchDetails" class="retry-btn">Retry</button>
    </div>

    <!-- LOADING STATE -->
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

const fetchDetails = async () => {
  errorMessage.value = null;
  try {
    const res = await axios.get(`/projects/${route.params.id}`);
    project.value = res.data;
    scrollToBottom();
  } catch (e) {
    if (e.response && e.response.status === 404) {
      errorMessage.value = "Project not found.";
    } else {
      errorMessage.value = "Server Error. Please try again.";
    }
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    const chat = document.getElementById('chat-window');
    if (chat) chat.scrollTop = chat.scrollHeight;
  });
};

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0];
};

const postUpdate = async () => {
  isPosting.value = true;
  const formData = new FormData();
  if (newMessage.value) formData.append('message', newMessage.value);
  if (selectedFile.value) {
    formData.append('image', selectedFile.value);
  }

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
.details-page { 
  padding: 0 0 40px 0; 
  max-width: 1400px; 
  margin: 0 auto; 
  height: calc(100vh - 100px); /* Fit within view */
  animation: fadeIn 0.4s ease;
}

.nav-back { 
  display: inline-flex; 
  align-items: center; 
  gap: 8px;
  cursor: pointer; 
  color: var(--text-secondary); 
  font-weight: 600; 
  margin-bottom: 20px; 
  padding: 8px 16px; 
  border-radius: 10px; 
  transition: 0.2s; 
}
.nav-back:hover { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }

.content-split { 
  display: grid; 
  grid-template-columns: 380px 1fr; 
  gap: 30px; 
  height: 100%; 
  align-items: start; 
}

/* --- LEFT SIDEBAR (Info) --- */
.info-sidebar { 
  height: 100%; 
  overflow-y: auto; 
  padding-right: 5px; 
}

.info-card { 
  background: white; 
  padding: 35px; 
  border-radius: 24px; 
  border: 1px solid var(--border-color); 
  box-shadow: var(--shadow-sm); 
}

.info-card h1 { 
  margin: 0 0 15px; 
  font-size: 1.8rem; 
  color: var(--text-main); 
  font-weight: 800; 
  line-height: 1.2; 
}

.status-badge { 
  display: inline-block; 
  background: var(--text-main); 
  color: white; 
  padding: 6px 14px; 
  border-radius: 20px; 
  font-size: 0.8rem; 
  font-weight: 700; 
  text-transform: uppercase; 
  letter-spacing: 1px;
}

.meta-group { margin-top: 25px; border-bottom: 1px solid #f3f4f6; padding-bottom: 15px; }
.meta-group:last-child { border-bottom: none; }
.meta-group label { display: block; font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.meta-group p { margin: 0; color: var(--text-main); font-size: 1.05rem; font-weight: 600; }

.progress-wrap { margin-top: 30px; background: #F9FAFB; padding: 20px; border-radius: 16px; border: 1px solid var(--border-color); }
.p-header { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; color: var(--text-main); }
.p-bar { height: 10px; background: #E5E7EB; border-radius: 10px; overflow: hidden; }
.p-fill { height: 100%; border-radius: 10px; transition: width 1s ease-out; }

/* --- RIGHT SIDE (Chat) --- */
.updates-feed { 
  background: white; 
  border-radius: 24px; 
  border: 1px solid var(--border-color); 
  display: flex; 
  flex-direction: column; 
  height: 100%; 
  box-shadow: var(--shadow-md); 
  overflow: hidden; 
}

.feed-header { 
  padding: 20px 30px; 
  border-bottom: 1px solid var(--border-color); 
  background: rgba(255,255,255,0.8); 
  backdrop-filter: blur(10px);
  z-index: 10;
}
.feed-header h2 { margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--text-main); }
.feed-header p { margin: 2px 0 0; color: var(--text-secondary); font-size: 0.85rem; }

/* Chat Window */
.chat-window { 
  flex: 1; 
  overflow-y: auto; 
  padding: 30px; 
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
  background-color: #F8FAFC; 
  background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
  background-size: 20px 20px;
}

.no-updates { text-align: center; color: var(--text-secondary); font-style: italic; margin-top: 50px; }

/* Chat Bubbles */
.update-bubble { 
  display: flex; 
  gap: 15px; 
  max-width: 85%; 
  animation: slideUp 0.3s ease;
}

.u-avatar { 
  width: 40px; height: 40px; 
  background: var(--text-main); 
  color: white; 
  border-radius: 12px; 
  display: flex; align-items: center; justify-content: center; 
  font-weight: 700; font-size: 1rem; 
  box-shadow: var(--shadow-sm); 
  flex-shrink: 0;
}

.u-content { display: flex; flex-direction: column; }

.u-meta { margin-bottom: 4px; font-size: 0.8rem; display: flex; align-items: baseline; gap: 8px; }
.u-meta strong { color: var(--text-main); font-weight: 700; }
.u-role { font-size: 0.7rem; color: var(--primary); background: rgba(166, 93, 67, 0.1); padding: 2px 6px; border-radius: 6px; font-weight: 600; }
.u-time { font-size: 0.75rem; color: #94a3b8; margin-left: auto; }

.u-text { 
  background: white; 
  padding: 14px 18px; 
  border-radius: 0 16px 16px 16px; 
  margin: 0; 
  font-size: 0.95rem; 
  color: var(--text-main); 
  line-height: 1.6; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
  border: 1px solid #E2E8F0;
  white-space: pre-wrap;
}

/* Image Attachment */
.u-image { margin-top: 10px; }
.u-image img { 
  max-width: 280px; 
  border-radius: 16px; 
  cursor: zoom-in; 
  border: 2px solid white; 
  box-shadow: var(--shadow-md); 
  transition: transform 0.2s;
}
.u-image img:hover { transform: scale(1.02); }

/* Input Area */
.input-area { 
  padding: 20px 30px; 
  background: white; 
  border-top: 1px solid var(--border-color); 
}

.input-wrapper { 
  border: 2px solid var(--border-color); 
  border-radius: 16px; 
  padding: 8px; 
  transition: all 0.2s; 
  background: #F9FAFB;
}
.input-wrapper:focus-within { 
  border-color: var(--primary); 
  background: white; 
  box-shadow: 0 4px 12px rgba(166, 93, 67, 0.1); 
}

textarea { 
  width: 100%; 
  border: none; 
  outline: none; 
  padding: 10px 15px; 
  font-family: inherit; 
  font-size: 0.95rem; 
  resize: none; 
  background: transparent; 
  color: var(--text-main);
  box-sizing: border-box;
}

.toolbar { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 5px 10px; 
  margin-top: 5px; 
}

.tool-btn { 
  font-size: 0.9rem; 
  color: var(--text-secondary); 
  cursor: pointer; 
  font-weight: 600; 
  transition: 0.2s; 
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
}
.tool-btn:hover { background: #f3f4f6; color: var(--text-main); }
.tool-btn.has-file { color: var(--primary); background: rgba(166, 93, 67, 0.1); }

.send-btn { 
  background: var(--text-main); 
  color: white; 
  border: none; 
  padding: 10px 24px; 
  border-radius: 10px; 
  font-weight: 700; 
  cursor: pointer; 
  font-size: 0.9rem; 
  transition: 0.2s;
}
.send-btn:hover { background: black; transform: translateY(-1px); }
.send-btn:disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; transform: none; }

/* LIGHTBOX & LOADERS */
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); z-index: 3000; display: flex; align-items: center; justify-content: center; cursor: zoom-out; animation: fadeIn 0.2s; }
.lightbox img { max-height: 90vh; max-width: 90vw; border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }

.loader, .error-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 100px; text-align: center; }
.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
.error-icon { font-size: 40px; margin-bottom: 10px; }
.retry-btn { margin-top: 15px; padding: 8px 20px; background: var(--text-main); color: white; border: none; border-radius: 8px; cursor: pointer; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }

/* Mobile */
@media (max-width: 1024px) {
  .content-split { grid-template-columns: 1fr; }
  .info-sidebar { display: none; }
}
</style>