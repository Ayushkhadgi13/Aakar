import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    component: () => import('./components/Login.vue')
  },
  {
    path: '/dashboard',
    component: () => import('./components/Dashboard.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '/finance',         component: () => import('./components/Finance.vue') },
      { path: '/vendors',         component: () => import('./components/Vendors.vue') },
      { path: '/reports/monthly', component: () => import('./components/MonthlyReports.vue') },
      { path: '/projects',        component: () => import('./components/Projects.vue') },
      { path: '/projects/:id',    component: () => import('./components/ProjectDetails.vue') },
      { path: '/tasks',           component: () => import('./components/Tasks.vue') },
      { path: '/employees',       component: () => import('./components/Employees.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('token')
  if (to.matched.some(record => record.meta.requiresAuth) && !loggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
