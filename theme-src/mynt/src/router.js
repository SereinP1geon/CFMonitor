/* SPDX-License-Identifier: GPL-3.0-or-later */
import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('./views/DashboardView.vue')
    },
    {
      path: '/server/:id',
      name: 'ServerDetail',
      component: () => import('./views/ServerDetailView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0, behavior: 'smooth' }
  }
})
