import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true }
    },
    {
      path: '/',
      component: () => import('@/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'tasks', name: 'tasks', component: () => import('@/views/TasksView.vue') },
        { path: 'submissions', name: 'submissions', component: () => import('@/views/SubmissionsView.vue') },
        { path: 'instances', name: 'instances', component: () => import('@/views/InstancesView.vue') },
        { path: 'instances/:id', name: 'instance-detail', component: () => import('@/views/InstanceDetailView.vue') },
        { path: 'workflows', name: 'workflows', component: () => import('@/views/WorkflowsView.vue') },
        { path: 'workflows/new', name: 'workflow-new', component: () => import('@/views/WorkflowEditorView.vue'), meta: { adminOnly: true } },
        { path: 'workflows/:id/edit', name: 'workflow-edit', component: () => import('@/views/WorkflowEditorView.vue'), meta: { adminOnly: true } },
        { path: 'submit/:definitionId', name: 'submit', component: () => import('@/views/SubmitView.vue') },
        { path: 'notifications', name: 'notifications', component: () => import('@/views/NotificationsView.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue') }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.guest && auth.isAuthenticated) return { name: 'dashboard' }
  if (to.meta.adminOnly && !auth.isAdmin) return { name: 'dashboard' }
})

export default router
