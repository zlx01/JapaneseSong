import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/example',
      name: 'example',
      component: () => import('../views/ExampleView.vue'),
    },
    {
      path: '/example/:songId',
      name: 'example-song',
      component: () => import('../views/ExampleView.vue'),
    },
  ],
})

export default router
