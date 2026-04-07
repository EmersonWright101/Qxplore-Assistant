import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../modules/Home/View.vue'
import TextConverterView from '../modules/Text/CaseConverter/View.vue'
import BibtexConverter from '../modules/Paper/BibtexConverter/View.vue'
import BibtexConverterHistory from '../modules/Paper/BibtexConverter/History.vue'
import ColorSchemeView from '../modules/Paper/ColorScheme/View.vue'
import SettingsView from '../modules/Settings/View.vue'
import Latex2Png from '../modules/Latex/Latex2Png/View.vue'
import Latex2PngHistory from '../modules/Latex/Latex2Png/History.vue'
import RemoveBg from '../modules/Media/RemoveBg/View.vue'
import RemoveBgHistory from '../modules/Media/RemoveBg/History.vue'
import DiffViewer from '../modules/Text/DiffViewer/View.vue'
import DiffViewerHistory from '../modules/Text/DiffViewer/History.vue'
import TextStats from '../modules/Text/TextStats/View.vue'
import TextConverterHistory from '../modules/Text/CaseConverter/History.vue'
import TextStatsHistory from '../modules/Text/TextStats/History.vue'
import PrinterView from '../modules/Misc/Printer/View.vue'

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
      path: '/text/bibtex/history',
      name: 'BibtexConverterHistory',
      component: BibtexConverterHistory
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
      path: '/latex/history',
      name: 'Latex2PngHistory',
      component: Latex2PngHistory
    },
    {
      path: '/media/remove-bg',
      name: 'RemoveBg',
      component: RemoveBg
    },
    {
      path: '/media/remove-bg/history',
      name: 'RemoveBgHistory',
      component: RemoveBgHistory
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