<template>
  <div class="auth-wrapper">
 
    
    <div class="auth-card">
      <div class="card-header">
        <h1>AAKAR</h1>
        <p>CONSTRUCTION</p>
      </div>

      <h2>Create Account</h2>
      
      <form @submit.prevent="handleRegister">
        <div class="input-group">
          <label>Full Name</label>
          <input type="text" v-model="name" required placeholder="John Doe">
        </div>

        <div class="input-group">
          <label>Email Address</label>
          <input type="email" v-model="email" required placeholder="email@example.com">
        </div>

        <div class="input-group">
          <label>Password</label>
          <input type="password" v-model="password" required placeholder="Choose a secure password (min 8 chars)">
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Creating...' : 'REGISTER' }}
        </button>
      </form>

      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

      <div class="card-footer">
        <p>Already a member? <router-link to="/login">Log In Here</router-link></p>
      </div>
    </div>

    <!-- CUSTOM SUCCESS POPUP MODAL -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-content">
        <div class="icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="40px" height="40px">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
        <h3>Success!</h3>
        <p>Your account has been created successfully.</p>
        <button @click="redirectToLogin" class="btn-modal">Go to Login</button>
      </div>
    </div>
    <!-- END MODAL -->

  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const name = ref('');
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const showSuccessModal = ref(false);
const router = useRouter();

const handleRegister = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await axios.post('/register', {
      name: name.value,
      email: email.value,
      password: password.value
    });

    showSuccessModal.value = true;

  } catch (err) {
    if (err.response) {
      errorMessage.value = err.response.data.message || 'Registration failed.';
    } else {
      errorMessage.value = 'Server error. Please check backend connection.';
    }
  } finally {
    isLoading.value = false;
  }
};

const redirectToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
/* --- MAIN PAGE STYLES --- */
.auth-wrapper {
  position: relative;
  height: 100vh;
  width: 100%;
  /* NEW BACKGROUND: Clean Professional Gray Gradient */
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Removed .overlay class */

.auth-card {
  position: relative;
  z-index: 2;
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  /* Soft shadow for depth */
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
  border-top: 5px solid #f39c12;
}

.card-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 2px;
}
.card-header p {
  margin: 0;
  color: #f39c12;
  font-weight: bold;
  letter-spacing: 4px;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

h2 {
  color: #444;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.input-group {
  margin-bottom: 1.2rem;
  text-align: left;
}
label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.3rem;
  font-weight: 600;
}
input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.3s;
}
input:focus {
  outline: none;
  border-color: #f39c12;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background-color: #f39c12;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
  text-transform: uppercase;
}
.btn-primary:hover {
  background-color: #d35400;
}
.btn-primary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.error-msg {
  color: red;
  margin-top: 10px;
  font-size: 0.9rem;
}

.card-footer {
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: #666;
}

/* --- POPUP MODAL STYLES --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  padding: 2.5rem;
  border-radius: 15px;
  text-align: center;
  width: 90%;
  max-width: 350px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.2);
  animation: slideUp 0.3s ease;
}

.icon-circle {
  width: 70px;
  height: 70px;
  background-color: #27ae60;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 5px 15px rgba(39, 174, 96, 0.4);
}

.modal-content h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

.modal-content p {
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.btn-modal {
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  transition: background 0.3s;
}

.btn-modal:hover {
  background-color: #219150;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>