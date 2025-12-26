<template>
  <div class="split-container">
    <!-- LEFT SIDE: LOGIN FORM -->
    <div class="left-side">
      <div class="brand-header">
        <img src="/logo.png" alt="Aakar Logo" class="brand-logo" />
        <div class="brand-text">
          <h1>AAKAR</h1>
          <p>CONSTRUCTION</p>
        </div>
      </div>

      <div class="login-box">
        <h2>Login</h2>
        <p class="welcome-msg">Welcome back! Access your project management portal.</p>

        <form @submit.prevent="handleLogin">
          <div class="input-group">
            <label>EMAIL ADDRESS</label>
            <input type="email" v-model="email" required placeholder="name@aakar.com">
          </div>

          <div class="input-group">
            <label>PASSWORD</label>
            <input type="password" v-model="password" required placeholder="••••••••">
          </div>

          <button type="submit" class="btn-submit" :disabled="isLoading">
            <span v-if="!isLoading">SIGN IN</span>
            <div v-else class="spinner"></div>
          </button>
        </form>

        <div v-if="error" class="error-box">{{ error }}</div>

        <div class="footer-links">
          <span>New to Aakar?</span>
          <router-link to="/register">Create an account</router-link>
        </div>
      </div>
    </div>

    <!-- RIGHT SIDE: CONSTRUCTION SILHOUETTE -->
    <div class="right-side">
      <div class="overlay-graphic">
        <div class="abstract-shape"></div>
        <!-- This is the silhouette image you provided -->
        <img src="/construction-bg.jpg" alt="Construction Illustration" class="silhouette-img" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;
  try {
    const response = await axios.post('/login', { email: email.value, password: password.value });
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('userName', response.data.user.name);
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    router.push('/dashboard');
  } catch (err) {
    error.value = 'Invalid login credentials. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.split-container { display: flex; height: 100vh; width: 100vw; background: #fff; overflow: hidden; }

/* Left Section Styles */
.left-side { width: 40%; display: flex; flex-direction: column; justify-content: center; padding: 0 8%; position: relative; }
.brand-header { position: absolute; top: 40px; display: flex; align-items: center; gap: 15px; }
.brand-logo { height: 50px; }
.brand-text h1 { margin: 0; font-size: 1.4rem; color: #2c3e50; letter-spacing: 2px; }
.brand-text p { margin: 0; font-size: 0.7rem; color: #A65D43; letter-spacing: 4px; font-weight: bold; }

.login-box { width: 100%; max-width: 380px; }
.login-box h2 { font-size: 2.5rem; color: #2c3e50; margin-bottom: 10px; }
.welcome-msg { color: #888; margin-bottom: 40px; font-size: 0.95rem; }

.input-group { margin-bottom: 25px; }
.input-group label { display: block; font-size: 0.75rem; font-weight: 800; color: #555; margin-bottom: 8px; letter-spacing: 1px; }
.input-group input { 
  width: 100%; padding: 12px 0; border: none; border-bottom: 2px solid #eee; 
  font-size: 1rem; transition: 0.3s; outline: none;
}
.input-group input:focus { border-color: #A65D43; }

.btn-submit { 
  width: 100%; padding: 15px; background: #2c3e50; color: white; border: none; 
  border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s; margin-top: 20px;
}
.btn-submit:hover { background: #1a252f; transform: translateY(-2px); }

.error-box { color: #e74c3c; font-size: 0.85rem; margin-top: 15px; font-weight: 600; }
.footer-links { margin-top: 40px; font-size: 0.9rem; color: #777; }
.footer-links a { color: #A65D43; text-decoration: none; font-weight: bold; margin-left: 8px; }

/* Right Section Styles */
.right-side { width: 60%; background-color: #f7f7f7; position: relative; display: flex; align-items: flex-end; justify-content: center; }
.overlay-graphic { position: relative; width: 100%; height: 100%; display: flex; align-items: flex-end; }

/* Abstract shape matching the illustration style */
.abstract-shape {
  position: absolute; width: 80%; height: 70%; background: #A65D43; 
  opacity: 0.05; border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
  top: 10%; right: 5%; z-index: 1; filter: blur(50px);
}

.silhouette-img { width: 100%; height: auto; object-fit: contain; z-index: 2; opacity: 0.9; }

.spinner {
  width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white;
  border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) { .left-side { width: 100%; padding: 0 10%; } .right-side { display: none; } }
</style>