import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../modules/Home/View.vue'
import TextConverterView from '../modules/Text/CaseConverter/View.vue'
import BibtexConverter from '../modules/Paper/BibtexConverter.vue'
import ColorSchemeView from '../modules/Paper/ColorScheme.vue'
import SettingsView from '../modules/Settings/View.vue'
import Latex2Png from '../modules/Latex/latex2png.vue'
import RemoveBg from '../modules/Media/RemoveBg.vue'
import DiffViewer from '../modules/Text/DiffViewer/View.vue'
import DiffViewerHistory from '../modules/Text/DiffViewer/History.vue'
import TextStats from '../modules/Text/TextStats/View.vue'
import TextConverterHistory from '../modules/Text/CaseConverter/History.vue'
import TextStatsHistory from '../modules/Text/TextStats/History.vue'
// 引入新增的打印机组件
import PrinterView from '../modules/Misc/Printer.vue'

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
      component: TextConverterView
    },
    {
      path: '/text/bibtex',
      name: 'bibtex-converter',
      component: BibtexConverter
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    },
    {
      path: '/latex',
      name: 'Latex',
      component: Latex2Png
    },
    {
      path: '/media/remove-bg',
      name: 'RemoveBg',
      component: RemoveBg
    },
    {
      path: '/paper/color',
      name: 'ColorScheme',
      component: ColorSchemeView
    },
    {
      path: '/misc/printer',
      name: 'Printer',
      component: PrinterView
    },
    {
      path: '/text/history',
      name: 'TextConverterHistory',
      component: TextConverterHistory
    },
    {
      path: '/text/diff',
      name: 'DiffViewer',
      component: DiffViewer
    },
    {
      path: '/text/diff/history',
      name: 'DiffViewerHistory',
      component: DiffViewerHistory
    },
    {
      path: '/text/stats',
      name: 'TextStats',
      component: TextStats
    },
    {
      path: '/text/stats/history',
      name: 'TextStatsHistory',
      component: TextStatsHistory
    },
  ]
})

export default router