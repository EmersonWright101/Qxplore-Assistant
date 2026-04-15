import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../modules/Home/View.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/text',
      name: 'text-converter',
      component: () => import('../modules/Text/CaseConverter/View.vue'),
    },
    {
      path: '/text/history',
      name: 'TextConverterHistory',
      component: () => import('../modules/Text/CaseConverter/History.vue'),
    },
    {
      path: '/text/diff',
      name: 'DiffViewer',
      component: () => import('../modules/Text/DiffViewer/View.vue'),
    },
    {
      path: '/text/diff/history',
      name: 'DiffViewerHistory',
      component: () => import('../modules/Text/DiffViewer/History.vue'),
    },
    {
      path: '/text/stats',
      name: 'TextStats',
      component: () => import('../modules/Text/TextStats/View.vue'),
    },
    {
      path: '/text/stats/history',
      name: 'TextStatsHistory',
      component: () => import('../modules/Text/TextStats/History.vue'),
    },
    {
      path: '/text/bibtex',
      name: 'bibtex-converter',
      component: () => import('../modules/Paper/BibtexConverter/View.vue'),
    },
    {
      path: '/text/bibtex/history',
      name: 'BibtexConverterHistory',
      component: () => import('../modules/Paper/BibtexConverter/History.vue'),
    },
    {
      path: '/paper/color',
      name: 'ColorScheme',
      component: () => import('../modules/Paper/ColorScheme/View.vue'),
    },
    {
      path: '/paper/format-converter',
      name: 'LatexConverter',
      component: () => import('../modules/Paper/LatexConverter/View.vue'),
    },
    {
      path: '/paper/format-converter/history',
      name: 'LatexConverterHistory',
      component: () => import('../modules/Paper/LatexConverter/History.vue'),
    },
    {
      path: '/latex',
      name: 'Latex',
      component: () => import('../modules/Latex/Latex2Png/View.vue'),
    },
    {
      path: '/latex/history',
      name: 'Latex2PngHistory',
      component: () => import('../modules/Latex/Latex2Png/History.vue'),
    },
    {
      path: '/latex/table',
      name: 'TableGenerator',
      component: () => import('../modules/Latex/TableGenerator/View.vue'),
    },
    {
      path: '/latex/table/history',
      name: 'TableGeneratorHistory',
      component: () => import('../modules/Latex/TableGenerator/History.vue'),
    },
    {
      path: '/media/remove-bg',
      name: 'RemoveBg',
      component: () => import('../modules/Media/RemoveBg/View.vue'),
    },
    {
      path: '/media/remove-bg/history',
      name: 'RemoveBgHistory',
      component: () => import('../modules/Media/RemoveBg/History.vue'),
    },
    {
      path: '/misc/printer',
      name: 'Printer',
      component: () => import('../modules/Misc/Printer/View.vue'),
    },
    {
      path: '/misc/qrcode',
      name: 'QrCode',
      component: () => import('../modules/Misc/QrCode/View.vue'),
    },
    {
      path: '/misc/qrcode/history',
      name: 'QrCodeHistory',
      component: () => import('../modules/Misc/QrCode/History.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../modules/Settings/View.vue'),
    },
  ],
})

export default router
