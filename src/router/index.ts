import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    component: () => import('@/views/HomePage.vue')
  },
  {
    path: '/identificacao',
    component: () => import('@/views/IdentificacaoPage.vue')
  },
  {
    path: '/sala-espera',
    component: () => import('@/views/SalaEsperaPage.vue')
  },
  {
    path: '/jogo',
    component: () => import('@/views/JogoPage.vue')
  },
  {
    path: '/resultado',
    component: () => import('@/views/ResultadoPage.vue')
  },
  {
    path: '/historico',
    component: () => import('@/views/HistoricoPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
