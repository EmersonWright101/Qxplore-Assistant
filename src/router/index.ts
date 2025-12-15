import  { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../modules/Home/View.vue'
import TextConverterView from '../modules/TextConverter/View.vue'
import SettingsView from '../modules/Settings/View.vue'
import Latex2Png from '../modules/Latex/latex2png.vue'
import RemoveBg from '../modules/Image/RemoveBg.vue'

const router = createRouter({
  // 4. 配置路由模式
  history: createWebHistory(),
  
  // 5. 定义路由表（核心部分）
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/text',      // 浏览器地址栏显示 /text 时
      name: 'text-converter',
      component: TextConverterView // 显示这个组件
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
      path: '/image/remove-bg',
      name: 'RemoveBg',
      component: RemoveBg
    },
  ]
})

export default router