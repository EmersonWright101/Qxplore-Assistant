<template>
  <div class="flex h-screen w-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-700 overflow-hidden">
    
    <aside 
      class="flex flex-col border-r border-gray-200 bg-slate-50/90 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden whitespace-nowrap"
      :class="isSidebarOpen ? 'w-64 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0 border-r-0'"
    >
      <div class="px-4 py-4 mb-2 select-none draggable-region min-w-[256px]">
        <router-link to="/" class="flex items-center gap-2 group cursor-pointer">
          <div class="p-2 bg-indigo-600 rounded-xl shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105">
             <Command class="w-5 h-5 text-white" />
          </div>
          <div class="flex flex-col">
            <span class="text-base font-bold text-slate-800 leading-tight tracking-wide">{{ t('sidebar.my_assistant') }}</span>
            <span class="text-[10px] text-slate-400 uppercase font-medium tracking-wider">{{ t('sidebar.toolbox') }}</span>
          </div>
        </router-link>
      </div>

      <nav class="flex-1 px-3 space-y-1 overflow-y-auto min-w-[256px] pt-2">
        
        <div v-for="group in menuGroups" :key="group.id" class="space-y-1 mb-3">
          <button 
            @click="toggleGroup(group.id)"
            class="w-full flex items-center justify-between px-3 py-2 rounded-md text-slate-700 hover:bg-slate-200/60 transition-colors group select-none"
          >
            <div class="flex items-center gap-1">
              <div class="p-1.5 rounded-md transition-colors" :class="group.bgColor">
                <component 
                  :is="group.icon" 
                  class="w-4 h-4 transition-colors"
                  :class="group.iconColor"
                />
              </div>
              <span class="text-sm font-bold">{{ group.label }}</span>
            </div>
            <ChevronRight 
              class="w-4 h-4 text-slate-400 transition-transform duration-200"
              :class="{ 'rotate-90': !collapsedGroups[group.id] }"
            />
          </button>

          <Transition name="expand">
            <div v-show="!collapsedGroups[group.id]" class="space-y-1 overflow-hidden pb-2">
              <router-link 
                v-for="item in group.children"
                :key="item.path"
                :to="item.path" 
                class="flex items-center gap-1 px-3 py-2 rounded-md transition-all duration-200 group ml-7"
                active-class="bg-blue-50 text-blue-700 shadow-sm font-medium" 
                :class="route.path !== item.path ? 'text-slate-500 hover:bg-slate-100' : ''"
              >
                <component 
                  :is="item.icon" 
                  class="w-4 h-4" 
                  :class="route.path !== item.path ? 'opacity-70 group-hover:opacity-100' : ''"
                />
                <span class="text-sm">{{ item.label }}</span>
              </router-link>
            </div>
          </Transition>
        </div>

      </nav>

      <div class="p-3 mt-auto border-t border-gray-200/50 min-w-[256px]">
        <router-link 
          to="/settings" 
          class="flex items-center gap-3 px-3 py-2 w-full rounded-md text-slate-600 hover:bg-slate-200/50 transition-colors"
          active-class="bg-gray-100 text-slate-900 font-medium"
        >
          <Settings class="w-5 h-5 text-slate-500" />
          <span class="text-sm">{{ t('sidebar.settings') }}</span>
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
  Settings, 
  PanelLeft, 
  ChevronRight, 
  FileText, 
  FunctionSquare,
  Command,
  Type,
  Sigma,
  Image as ImageIcon,
  Eraser
} from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

const { t } = useI18n();
const route = useRoute();
const isSidebarOpen = ref(true);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// 🟢 修改：全部使用 sidebar.* 作为 key
const menuGroups = computed(() => [
  {
    id: 'text',
    label: t('sidebar.text_manipulation'),
    icon: FileText,
    iconColor: 'text-blue-600 group-hover:text-blue-700',
    bgColor: 'bg-blue-50 group-hover:bg-blue-100/80',
    children: [
      { path: '/text', label: t('sidebar.case_converter'), icon: Type }
    ]
  },
  {
    id: 'math',
    label: t('sidebar.mathematical_tools'),
    icon: FunctionSquare, 
    iconColor: 'text-emerald-600 group-hover:text-emerald-700',
    bgColor: 'bg-emerald-50 group-hover:bg-emerald-100/80',
    children: [
      { path: '/latex', label: t('sidebar.latex2png'), icon: Sigma }
    ]
  },
  {
    id: 'image',
    label: t('sidebar.image_processing'),
    icon: ImageIcon,
    iconColor: 'text-purple-600 group-hover:text-purple-700',
    bgColor: 'bg-purple-50 group-hover:bg-purple-100/80',
    children: [
      { path: '/image/remove-bg', label: t('sidebar.remove_bg'), icon: Eraser }
    ]
  }
]);

const collapsedGroups = reactive<Record<string, boolean>>({
  text: false,
  math: false,
  image: false,
});

const toggleGroup = (id: string) => {
  collapsedGroups[id] = !collapsedGroups[id];
};

// 🟢 修改：头部标题映射也改为 sidebar.*
const currentRouteName = computed(() => {
  switch (route.path) {
    case '/text': return t('sidebar.case_converter');
    case '/async': return t('sidebar.network_test');
    case '/settings': return t('sidebar.settings');
    case '/latex': return t('sidebar.latex2png');
    case '/image/remove-bg': return t('sidebar.remove_bg');
    default: return '';
  }
});

onMounted(() => {
  setTimeout(async () => {
    await backgroundUpdateCheck();
  }, 60000);
});

const backgroundUpdateCheck = async () => {
  try {
    const update = await check();
    
    if (update?.available) {
      // 🟢 修改：更新弹窗文案使用 settings.update.*
      // 注意：i18n 文件中 settings.update 下是嵌套的
      const yes = await ask(
        `${t('settings.update.new_version')}: v${update.version}`, 
        {
          title: t('settings.update.title'),
          kind: 'info',
          okLabel: t('settings.update.btn_update_now'),
          cancelLabel: 'Cancel' // i18n中没有通用的Cancel，保留英文或使用 'Later'
        }
      );

      if (yes) {
        await update.downloadAndInstall();
        await relaunch();
      }
    }
  } catch (error) {
    console.error('Auto update check failed:', error);
  }
};
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