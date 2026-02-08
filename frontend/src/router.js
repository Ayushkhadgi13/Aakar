import { createRouter, createWebHistory } from 'vue-router'
import Login from './components/Login.vue'
// Register component technically exists but we hide link. 
// import Register from './components/Register.vue' 
import Dashboard from './components/Dashboard.vue'
import Finance from './components/Finance.vue'
import Projects from './components/Projects.vue'
import ProjectDetails from './components/ProjectDetails.vue'
import Tasks from './components/Tasks.vue'
import Employees from './components/Employees.vue' // Import New Component

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  // { path: '/register', component: Register }, // Optionally disable route
  { 
    path: '/dashboard', 
    component: Dashboard, 
    meta: { requiresAuth: true },
    children: [
      { path: '/finance', component: Finance },
      { path: '/projects', component: Projects },
      { path: '/projects/:id', component: ProjectDetails },
      { path: '/tasks', component: Tasks },
      { path: '/employees', component: Employees } // New Route
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('token');
  if (to.matched.some(record => record.meta.requiresAuth) && !loggedIn) {
    next('/login');
  } else {
    next();
  }
});

export default router