<template>
  <div class="flex h-screen w-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-700 overflow-hidden">

    <aside
      class="flex flex-col bg-slate-50/90 backdrop-blur-xl overflow-hidden flex-shrink-0"
      :class="[isSidebarOpen ? '' : 'w-20', !isResizing && 'transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]']"
      :style="isSidebarOpen ? { width: sidebarWidth + 'px' } : {}"
    >
      <div
        class="px-4 py-4 mb-2 select-none draggable-region"
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

      <nav class="flex-1 px-3 overflow-y-auto pt-2">
        <TransitionGroup tag="div" name="drag-list">
          <div
            v-for="group in orderedMenuGroups"
            :key="group.id"
            class="space-y-1 mb-3"
          >
            <button
              :data-group-id="group.id"
              @click="handleGroupClick(group.id)"
              @pointerdown="onGroupPointerDown($event, group.id)"
              @dragstart.prevent
              class="w-full flex items-center px-3 py-2 rounded-md text-slate-700 hover:bg-slate-200/60 transition-colors group select-none"
              :class="[
                isSidebarOpen ? 'justify-between' : 'justify-center',
                dragState.active && dragState.type === 'group' && dragState.id === group.id ? 'opacity-30 scale-95' : ''
              ]"
              style="transition: opacity 0.15s, transform 0.15s"
            >
              <div class="flex items-center gap-2">
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
              <div v-show="isSidebarOpen && !collapsedGroups[group.id]" class="overflow-hidden pb-2">
                <TransitionGroup tag="div" name="drag-list" class="space-y-1">
                  <div
                    v-for="item in group.children"
                    :key="item.path"
                    :data-child-path="item.path"
                    :data-child-group="group.id"
                    @pointerdown.stop="onChildPointerDown($event, group.id, item.path)"
                    @dragstart.prevent
                  >
                    <router-link
                      :to="item.path"
                      draggable="false"
                      class="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 group select-none"
                      :class="[
                        isSidebarOpen ? 'ml-7' : 'justify-center',
                        route.path === item.path
                          ? `${group.activeClass} shadow-sm font-medium`
                          : 'text-slate-500 hover:bg-slate-100',
                        dragState.active && dragState.type === 'child' && dragState.id === item.path ? 'opacity-30 scale-95' : ''
                      ]"
                      style="transition: opacity 0.15s, transform 0.15s"
                    >
                      <component
                        :is="item.icon"
                        class="w-4 h-4"
                        :class="route.path !== item.path ? 'opacity-70 group-hover:opacity-100' : ''"
                      />
                      <span
                        class="text-sm transition-all duration-200 overflow-hidden whitespace-nowrap flex-1"
                        :class="isSidebarOpen ? 'w-full opacity-100' : 'w-0 opacity-0'"
                      >{{ item.label }}</span>
                    </router-link>
                  </div>
                </TransitionGroup>
              </div>
            </Transition>
          </div>
        </TransitionGroup>
      </nav>

      <div
        class="p-3 mt-auto border-t border-gray-200/50"
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

    <!-- Resize handle -->
    <div
      class="relative flex-shrink-0 w-1 group cursor-col-resize select-none z-40"
      @pointerdown.prevent="startResize"
    >
      <div
        class="absolute inset-y-0 left-0 w-px transition-colors duration-150"
        :class="isResizing ? 'bg-blue-400' : 'bg-gray-200 group-hover:bg-blue-400'"
      ></div>
      <div class="absolute inset-y-0 -left-1 -right-1"></div>
    </div>

    <main class="flex-1 flex flex-col min-w-0 bg-white relative">
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

  <!-- Drag ghost: follows cursor, rendered outside the sidebar -->
  <Teleport to="body">
    <div
      v-if="dragState.active"
      class="fixed pointer-events-none z-[9999] flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl rounded-lg text-sm font-medium text-slate-700 select-none"
      :style="{
        left: dragState.ghostX + 16 + 'px',
        top: dragState.ghostY - 16 + 'px',
        transform: 'rotate(2deg)',
      }"
    >
      <span>{{ dragState.ghostLabel }}</span>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  Settings, PanelLeft, ChevronRight, FileText, FunctionSquare,
  Command, Type, Sigma, Film, Eraser, Printer, Layers, BookMarked, GraduationCap, Palette, GitCompare, BarChart2, Table2, ArrowLeftRight, QrCode
} from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
// 🟢 引入全局 Store
import { updateStore, checkForUpdates, initUpdateStore } from './store/updateStore';
import { settings } from './store/settings';

const { t } = useI18n();
const route = useRoute();
const isSidebarOpen = ref(true);
const sidebarWidth = ref(parseInt(localStorage.getItem('sidebar-width') || '256'));
const isResizing = ref(false);

let resizeStartX = 0;
let resizeStartWidth = 0;

function startResize(e: PointerEvent) {
  if (!isSidebarOpen.value) return;
  isResizing.value = true;
  resizeStartX = e.clientX;
  resizeStartWidth = sidebarWidth.value;
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
  document.addEventListener('pointermove', onResize);
  document.addEventListener('pointerup', stopResize, { once: true });
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';
}

function onResize(e: PointerEvent) {
  const newWidth = Math.max(180, Math.min(480, resizeStartWidth + e.clientX - resizeStartX));
  sidebarWidth.value = newWidth;
}

function stopResize() {
  isResizing.value = false;
  document.removeEventListener('pointermove', onResize);
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  localStorage.setItem('sidebar-width', String(sidebarWidth.value));
}

onUnmounted(() => {
  document.removeEventListener('pointermove', onResize);
  document.removeEventListener('pointerup', stopResize);
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointermove', onDragThresholdMove);
  document.removeEventListener('keydown', onKeyDown);
});

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
      { path: '/paper/format-converter', label: t('sidebar.format_converter') || '格式转换', icon: ArrowLeftRight },
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
      { path: '/misc/printer', label: t('sidebar.printer') || '打印', icon: Printer },
      { path: '/misc/qrcode', label: t('sidebar.qr_code') || '二维码', icon: QrCode },
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

// ── Drag threshold (distinguishes click from drag) ───────────────────────────
let dragPendingType: 'group' | 'child' | null = null;
let dragPendingId = '';
let dragPendingGroupId = '';
let dragPendingStartX = 0;
let dragPendingStartY = 0;
const DRAG_THRESHOLD = 5;

function onGroupPointerDown(e: PointerEvent, groupId: string) {
  if (!isSidebarOpen.value || e.button !== 0) return;
  dragPendingType = 'group';
  dragPendingId = groupId;
  dragPendingGroupId = '';
  dragPendingStartX = e.clientX;
  dragPendingStartY = e.clientY;
  document.addEventListener('pointermove', onDragThresholdMove);
  document.addEventListener('pointerup', onDragThresholdCancel, { once: true });
}

function onChildPointerDown(e: PointerEvent, groupId: string, path: string) {
  if (!isSidebarOpen.value || e.button !== 0) return;
  dragPendingType = 'child';
  dragPendingId = path;
  dragPendingGroupId = groupId;
  dragPendingStartX = e.clientX;
  dragPendingStartY = e.clientY;
  document.addEventListener('pointermove', onDragThresholdMove);
  document.addEventListener('pointerup', onDragThresholdCancel, { once: true });
}

function onDragThresholdMove(e: PointerEvent) {
  if (!dragPendingType) return;
  const dx = e.clientX - dragPendingStartX;
  const dy = e.clientY - dragPendingStartY;
  if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
    document.removeEventListener('pointermove', onDragThresholdMove);
    document.removeEventListener('pointerup', onDragThresholdCancel);
    const type = dragPendingType;
    const id = dragPendingId;
    const gid = dragPendingGroupId;
    dragPendingType = null;
    if (type === 'group') startGroupDrag(e, id);
    else startChildDrag(e, gid, id);
  }
}

function onDragThresholdCancel() {
  document.removeEventListener('pointermove', onDragThresholdMove);
  dragPendingType = null;
}

// ── Pointer-based drag state ─────────────────────────────────────────────────
const dragState = reactive({
  active: false,
  type: null as 'group' | 'child' | null,
  id: '',          // groupId or childPath
  fromGroupId: '', // for child drags
  ghostX: 0,
  ghostY: 0,
  ghostLabel: '',
});

// Live ordering during drag (animates items shifting in real-time)
const liveGroupOrder = ref<string[] | null>(null);
const liveChildOrder = ref<{ groupId: string; order: string[] } | null>(null);

// ── Ordered menu groups ──────────────────────────────────────────────────────
const orderedMenuGroups = computed(() => {
  const base = menuGroups.value;
  const groupOrder = liveGroupOrder.value ?? settings.sidebarGroupOrder;

  let ordered = base;
  if (groupOrder && groupOrder.length > 0) {
    ordered = [...base].sort((a, b) => {
      const ai = groupOrder.indexOf(a.id);
      const bi = groupOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  return ordered.map(group => {
    let childOrder: string[] | undefined;
    if (liveChildOrder.value?.groupId === group.id) {
      childOrder = liveChildOrder.value.order;
    } else {
      childOrder = settings.sidebarChildOrder?.[group.id];
    }
    if (!childOrder || childOrder.length === 0) return group;
    const orderedChildren = [...group.children].sort((a, b) => {
      const ai = childOrder!.indexOf(a.path);
      const bi = childOrder!.indexOf(b.path);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return { ...group, children: orderedChildren };
  });
});

// ── Drag helpers ─────────────────────────────────────────────────────────────
function reorder(arr: string[], fromIdx: number, toIdx: number): string[] {
  const result = [...arr];
  const [item] = result.splice(fromIdx, 1);
  result.splice(Math.max(0, toIdx), 0, item);
  return result;
}

function swallowNextClick(e: MouseEvent) {
  e.stopPropagation();
  e.preventDefault();
}

function startGroupDrag(e: PointerEvent, groupId: string) {
  if (!isSidebarOpen.value) return;
  e.preventDefault();
  document.addEventListener('click', swallowNextClick, { capture: true, once: true });
  const group = orderedMenuGroups.value.find(g => g.id === groupId);
  dragState.active = true;
  dragState.type = 'group';
  dragState.id = groupId;
  dragState.ghostX = e.clientX;
  dragState.ghostY = e.clientY;
  dragState.ghostLabel = group?.label || '';
  liveGroupOrder.value = orderedMenuGroups.value.map(g => g.id);
  document.addEventListener('pointermove', onDragMove);
  document.addEventListener('pointerup', onDragEnd, { once: true });
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'grabbing';
}

function startChildDrag(e: PointerEvent, groupId: string, path: string) {
  if (!isSidebarOpen.value) return;
  e.preventDefault();
  document.addEventListener('click', swallowNextClick, { capture: true, once: true });
  const group = orderedMenuGroups.value.find(g => g.id === groupId);
  const child = group?.children.find(c => c.path === path);
  dragState.active = true;
  dragState.type = 'child';
  dragState.id = path;
  dragState.fromGroupId = groupId;
  dragState.ghostX = e.clientX;
  dragState.ghostY = e.clientY;
  dragState.ghostLabel = child?.label || '';
  liveChildOrder.value = { groupId, order: group?.children.map(c => c.path) || [] };
  document.addEventListener('pointermove', onDragMove);
  document.addEventListener('pointerup', onDragEnd, { once: true });
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'grabbing';
}

function onDragMove(e: PointerEvent) {
  dragState.ghostX = e.clientX;
  dragState.ghostY = e.clientY;
  if (dragState.type === 'group') updateGroupPreview(e);
  else if (dragState.type === 'child') updateChildPreview(e);
}

function updateGroupPreview(e: PointerEvent) {
  const els = document.querySelectorAll<HTMLElement>('[data-group-id]');
  for (const el of els) {
    const rect = el.getBoundingClientRect();
    if (e.clientY < rect.top || e.clientY > rect.bottom) continue;
    const targetId = el.dataset.groupId!;
    if (targetId === dragState.id) continue;
    const current = liveGroupOrder.value!;
    const fromIdx = current.indexOf(dragState.id);
    const toIdx = current.indexOf(targetId);
    let insertIdx = e.clientY < rect.top + rect.height / 2 ? toIdx : toIdx + 1;
    if (fromIdx < insertIdx) insertIdx--;
    if (insertIdx !== fromIdx) liveGroupOrder.value = reorder(current, fromIdx, insertIdx);
    break;
  }
}

function updateChildPreview(e: PointerEvent) {
  const els = document.querySelectorAll<HTMLElement>(`[data-child-group="${dragState.fromGroupId}"]`);
  for (const el of els) {
    const rect = el.getBoundingClientRect();
    if (e.clientY < rect.top || e.clientY > rect.bottom) continue;
    const targetPath = el.dataset.childPath!;
    if (targetPath === dragState.id) continue;
    const current = liveChildOrder.value!.order;
    const fromIdx = current.indexOf(dragState.id);
    const toIdx = current.indexOf(targetPath);
    let insertIdx = e.clientY < rect.top + rect.height / 2 ? toIdx : toIdx + 1;
    if (fromIdx < insertIdx) insertIdx--;
    if (insertIdx !== fromIdx) {
      liveChildOrder.value = { groupId: dragState.fromGroupId, order: reorder(current, fromIdx, insertIdx) };
    }
    break;
  }
}

function onDragEnd() {
  if (dragState.type === 'group' && liveGroupOrder.value) {
    settings.sidebarGroupOrder = liveGroupOrder.value;
  } else if (dragState.type === 'child' && liveChildOrder.value) {
    settings.sidebarChildOrder = { ...settings.sidebarChildOrder, [liveChildOrder.value.groupId]: liveChildOrder.value.order };
  }
  cleanupDrag();
}

function cancelDrag() {
  cleanupDrag();
}

function cleanupDrag() {
  document.removeEventListener('pointermove', onDragMove);
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  dragState.active = false;
  dragState.type = null;
  dragState.id = '';
  dragState.fromGroupId = '';
  dragState.ghostLabel = '';
  liveGroupOrder.value = null;
  liveChildOrder.value = null;
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && dragState.active) {
    document.removeEventListener('pointerup', onDragEnd);
    cancelDrag();
  }
}

const currentRouteName = computed(() => {
  switch (route.path) {
    case '/text': return t('sidebar.case_converter') || '大小写转换';
    case '/text/history': return t('sidebar.case_converter') || '大小写转换';
    case '/text/stats/history': return t('sidebar.text_stats') || '文本统计';
    case '/text/diff': return t('sidebar.diff_viewer') || '文本对比';
    case '/text/diff/history': return t('sidebar.diff_viewer') || '文本对比';
    case '/text/stats': return t('sidebar.text_stats') || '文本统计';
    case '/text/bibtex': return t('sidebar.bibtex_converter') || 'BibTeX 转换';
    case '/paper/format-converter': return t('sidebar.format_converter') || '格式转换';
    case '/paper/format-converter/history': return t('sidebar.format_converter') || '格式转换';
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
  document.addEventListener('keydown', onKeyDown);
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

/* FLIP animation for drag-reorder */
.drag-list-move {
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}
</style>