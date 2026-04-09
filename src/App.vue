<template>
  <div class="flex h-screen w-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-700 overflow-hidden">
    
    <aside 
      class="flex flex-col border-r border-gray-200 bg-slate-50/90 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden"
      :class="isSidebarOpen ? 'w-64' : 'w-20'"
    >
      <div 
        class="px-4 py-4 mb-2 select-none draggable-region"
        :class="isSidebarOpen ? 'min-w-[256px]' : 'min-w-0'"
      >
        <router-link 
          to="/" 
          class="flex items-center gap-2 group cursor-pointer transition-all"
          :class="isSidebarOpen ? '' : 'justify-center'"
        >
          <div class="p-2 bg-indigo-600 rounded-xl shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105">
             <Command class="w-5 h-5 text-white" />
          </div>
          <div 
            class="flex flex-col transition-all duration-200 overflow-hidden"
            :class="isSidebarOpen ? 'w-full opacity-100' : 'w-0 opacity-0'"
          >
            <span class="text-base font-bold text-slate-800 leading-tight tracking-wide whitespace-nowrap">{{ t('sidebar.my_assistant') }}</span>
            <span class="text-[10px] text-slate-400 uppercase font-medium tracking-wider whitespace-nowrap">{{ t('sidebar.toolbox') }}</span>
          </div>
        </router-link>
      </div>

      <nav 
        class="flex-1 px-3 space-y-1 overflow-y-auto pt-2"
        :class="isSidebarOpen ? 'min-w-[256px]' : 'min-w-0'"
      >
        
        <div v-for="group in menuGroups" :key="group.id" class="space-y-1 mb-3">
          <button 
            @click="handleGroupClick(group.id)"
            class="w-full flex items-center px-3 py-2 rounded-md text-slate-700 hover:bg-slate-200/60 transition-colors group select-none"
            :class="isSidebarOpen ? 'justify-between' : 'justify-center'"
          >
            <div class="flex items-center gap-1">
              <div class="p-1.5 rounded-md transition-colors" :class="group.bgColor">
                <component 
                  :is="group.icon" 
                  class="w-4 h-4 transition-colors"
                  :class="group.iconColor"
                />
              </div>
              <span 
                class="text-sm font-bold transition-all duration-200 overflow-hidden whitespace-nowrap"
                :class="isSidebarOpen ? 'w-full opacity-100 ml-1' : 'w-0 opacity-0'"
              >{{ group.label }}</span>
            </div>
            <ChevronRight 
              v-if="isSidebarOpen"
              class="w-4 h-4 text-slate-400 transition-transform duration-200"
              :class="{ 'rotate-90': !collapsedGroups[group.id] }"
            />
          </button>

          <Transition name="expand">
            <div v-show="isSidebarOpen && !collapsedGroups[group.id]" class="space-y-1 overflow-hidden pb-2">
              <router-link 
                v-for="item in group.children"
                :key="item.path"
                :to="item.path" 
                class="flex items-center gap-1 px-3 py-2 rounded-md transition-all duration-200 group"
                :class="[
                  isSidebarOpen ? 'ml-7' : 'justify-center',
                  route.path === item.path
                    ? `${group.activeClass} shadow-sm font-medium`
                    : 'text-slate-500 hover:bg-slate-100'
                ]"
              >
                <component 
                  :is="item.icon" 
                  class="w-4 h-4" 
                  :class="route.path !== item.path ? 'opacity-70 group-hover:opacity-100' : ''"
                />
                <span 
                  class="text-sm transition-all duration-200 overflow-hidden whitespace-nowrap"
                  :class="isSidebarOpen ? 'w-full opacity-100' : 'w-0 opacity-0'"
                >{{ item.label }}</span>
              </router-link>
            </div>
          </Transition>
        </div>

      </nav>

      <div 
        class="p-3 mt-auto border-t border-gray-200/50"
        :class="isSidebarOpen ? 'min-w-[256px]' : 'min-w-0'"
      >
        <router-link 
          to="/settings" 
          class="flex items-center gap-3 px-3 py-2 w-full rounded-md text-slate-600 hover:bg-slate-200/50 transition-colors relative overflow-hidden"
          :class="isSidebarOpen ? '' : 'justify-center'"
          active-class="bg-gray-100 text-slate-900 font-medium"
        >
          <div 
            v-if="updateStore.state === 'downloading'"
            class="absolute left-0 bottom-0 h-0.5 bg-blue-500 transition-all duration-300 z-10"
            :style="{ width: `${updateStore.downloadProgress}%` }"
          ></div>

          <div class="relative">
            <Settings class="w-5 h-5 text-slate-500" />
            
            <span 
              v-if="updateStore.hasUpdate && updateStore.state !== 'downloading'" 
              class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"
            ></span>

            <span 
              v-if="updateStore.state === 'downloading'"
              class="absolute -top-1 -right-1 flex h-3 w-3"
            >
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>
          
          <div 
            class="flex flex-col transition-all duration-200 overflow-hidden"
            :class="isSidebarOpen ? 'w-full opacity-100' : 'w-0 opacity-0'"
          >
            <span class="text-sm whitespace-nowrap">{{ t('sidebar.settings') }}</span>
            <span v-if="updateStore.state === 'downloading'" class="text-[10px] text-blue-600 font-bold leading-none whitespace-nowrap">
              Downloading {{ updateStore.downloadProgress }}%
            </span>
          </div>
        </router-link>
      </div>

    </aside>

    <main class="flex-1 flex flex-col min-w-0 bg-white relative transition-all duration-300">
      <header 
        class="h-12 flex items-center px-4 z-50 transition-all duration-300"
        :class="route.path === '/' 
          ? 'absolute top-0 left-0 w-full bg-transparent' 
          : 'sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100'"
      >
        <button 
          @click="toggleSidebar"
          class="p-2 rounded-md transition-colors"
          :class="route.path === '/' 
            ? 'text-slate-500 hover:bg-white/60 hover:text-slate-800' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'"
          title="Toggle Sidebar"
        >
          <PanelLeft class="w-5 h-5" />
        </button>

        <h1 v-if="route.path !== '/'" class="ml-4 text-base font-semibold text-slate-800 select-none">
          {{ currentRouteName }}
        </h1>
      </header>

      <div class="flex-1 overflow-y-auto relative">
        <router-view v-slot="{ Component }">
          <transition name="scale-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  Settings, PanelLeft, ChevronRight, FileText, FunctionSquare,
  Command, Type, Sigma, Film, Eraser, Printer, Layers, BookMarked, GraduationCap, Palette, GitCompare, BarChart2, Table2
} from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
// 🟢 引入全局 Store
import { updateStore, checkForUpdates, initUpdateStore } from './store/updateStore';

const { t } = useI18n();
const route = useRoute();
const isSidebarOpen = ref(true);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const menuGroups = computed(() => [
  {
    id: 'text',
    label: t('sidebar.text_manipulation') || '文本处理',
    icon: FileText,
    iconColor: 'text-blue-600 group-hover:text-blue-700',
    bgColor: 'bg-blue-50 group-hover:bg-blue-100/80',
    activeClass: 'bg-blue-50 text-blue-700',
    children: [
      { path: '/text', label: t('sidebar.case_converter') || '大小写转换', icon: Type },
      { path: '/text/diff', label: t('sidebar.diff_viewer') || '文本对比', icon: GitCompare },
      { path: '/text/stats', label: t('sidebar.text_stats') || '文本统计', icon: BarChart2 },
    ]
  },
  {
    id: 'paper',
    label: t('sidebar.paper_tools') || '论文工具',
    icon: GraduationCap,
    iconColor: 'text-rose-600 group-hover:text-rose-700',
    bgColor: 'bg-rose-50 group-hover:bg-rose-100/80',
    activeClass: 'bg-rose-50 text-rose-700',
    children: [
      { path: '/text/bibtex', label: t('sidebar.bibtex_converter') || 'BibTeX 转换', icon: BookMarked },
      { path: '/paper/color', label: t('sidebar.color_scheme') || '论文配色', icon: Palette },
    ]
  },
  {
    id: 'math',
    label: t('sidebar.mathematical_tools') || '数学工具',
    icon: FunctionSquare, 
    iconColor: 'text-emerald-600 group-hover:text-emerald-700',
    bgColor: 'bg-emerald-50 group-hover:bg-emerald-100/80',
    activeClass: 'bg-emerald-50 text-emerald-700',
    children: [
      { path: '/latex', label: t('sidebar.latex2png') || 'LaTeX转图片', icon: Sigma },
      { path: '/latex/table', label: t('sidebar.table_generator') || '表格生成器', icon: Table2 },
    ]
  },
  {
    id: 'media',
    label: t('sidebar.media_processing') || '媒体处理',
    icon: Film,
    iconColor: 'text-purple-600 group-hover:text-purple-700',
    bgColor: 'bg-purple-50 group-hover:bg-purple-100/80',
    activeClass: 'bg-purple-50 text-purple-700',
    children: [
      { path: '/media/remove-bg', label: t('sidebar.remove_bg') || '移除背景', icon: Eraser },
    ]
  },
  {
    id: 'misc',
    label: t('sidebar.misc') || '杂项',
    icon: Layers,
    iconColor: 'text-orange-600 group-hover:text-orange-700',
    bgColor: 'bg-orange-50 group-hover:bg-orange-100/80',
    activeClass: 'bg-orange-50 text-orange-700',
    children: [
      { path: '/misc/printer', label: t('sidebar.printer') || '打印', icon: Printer }
    ]
  }
]);

const collapsedGroups = reactive<Record<string, boolean>>({
  text: false,
  paper: false,
  math: false,
  media: false,
  misc: false,
});

const toggleGroup = (id: string) => {
  collapsedGroups[id] = !collapsedGroups[id];
};

const handleGroupClick = (id: string) => {
  if (isSidebarOpen.value) {
    toggleGroup(id);
  } else {
    isSidebarOpen.value = true;
  }
};

const currentRouteName = computed(() => {
  switch (route.path) {
    case '/text': return t('sidebar.case_converter') || '大小写转换';
    case '/text/history': return t('sidebar.case_converter') || '大小写转换';
    case '/text/stats/history': return t('sidebar.text_stats') || '文本统计';
    case '/text/diff': return t('sidebar.diff_viewer') || '文本对比';
    case '/text/diff/history': return t('sidebar.diff_viewer') || '文本对比';
    case '/text/stats': return t('sidebar.text_stats') || '文本统计';
    case '/text/bibtex': return t('sidebar.bibtex_converter') || 'BibTeX 转换';
    case '/paper/color': return t('sidebar.color_scheme') || '论文配色';
    case '/async': return t('sidebar.network_test') || '网络测试';
    case '/settings': return t('sidebar.settings') || '设置';
    case '/latex': return t('sidebar.latex2png') || 'LaTeX转图片';
    case '/latex/table': return t('sidebar.table_generator') || '表格生成器';
    case '/latex/table/history': return t('sidebar.table_generator') || '表格生成器';
    case '/media/remove-bg': return t('sidebar.remove_bg') || '移除背景';
    case '/misc/printer': return t('sidebar.printer') || '打印';
    default: return '';
  }
});

onMounted(() => {
  initUpdateStore();
  // 30秒后静默检查更新
  setTimeout(async () => {
    // 使用全局 store 检查，如果是空闲状态才检查
    if (updateStore.state === 'idle') {
      await checkForUpdates(false);
    }
  }, 30000);
});
</script>

<style>
/* 样式保持不变 */
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}

.scale-fade-enter-from,
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease-in-out;
  max-height: 200px;
  opacity: 1;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-5px);
}
</style>