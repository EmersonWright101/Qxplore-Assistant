<template>
  <div class="w-full max-w-6xl mx-auto space-y-8 pb-10 p-8">
    
    <div class="space-y-3">
      <div class="flex items-center justify-between ml-1">
        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {{ t('latex_source_code') }}
        </label>
        <button 
          v-if="inputLatex"
          @click="inputLatex = ''"
          class="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50 flex items-center gap-1"
        >
          <XCircle class="w-3.5 h-3.5" />
          <span>{{ t('clear') }}</span>
        </button>
      </div>
      
      <div class="relative group">
        <textarea 
          v-model="inputLatex" 
          class="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[150px] text-slate-700 font-mono text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y shadow-sm"
          :placeholder="t('latex_input_prompt')"
        ></textarea>
      </div>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between ml-1 h-8">
        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {{ t('realtime_preview') }}
        </label>
        
        <div class="flex items-center gap-2">
          
          <Transition name="fade">
            <div v-if="inputLatex" class="flex items-center gap-2 mr-2 px-3 py-1 bg-slate-50 rounded-md border border-slate-100">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ t('resolution') }}</span>
              <input 
                type="range" 
                v-model.number="resolution" 
                min="1" 
                max="10" 
                step="1"
                class="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600"
              >
              <span class="text-xs font-mono font-medium text-slate-600 w-6 text-right">{{ resolution }}x</span>
            </div>
          </Transition>

          <Transition name="fade">
            <button 
              v-if="inputLatex"
              @click="copySource"
              class="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-200 active:scale-95 border border-transparent"
              :class="copiedSource ? 'text-green-600 bg-green-50 border-green-100' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 hover:border-blue-100'"
            >
              <component :is="copiedSource ? Check : Clipboard" class="w-3.5 h-3.5" />
              <span>{{ copiedSource ? t('source_code_copied') : t('copy_source_code') }}</span>
            </button>
          </Transition>

          <Transition name="fade">
            <button 
              v-if="inputLatex"
              @click="downloadPng"
              :disabled="isDownloading"
              class="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-200 border border-transparent"
              :class="[
                downloadSuccess ? 'text-green-600 bg-green-50 border-green-100' : 'text-slate-500 hover:text-purple-600 hover:bg-purple-50/80 hover:border-purple-100',
                isDownloading ? 'opacity-50 cursor-wait' : 'active:scale-95'
              ]"
              title="保存透明背景 PNG"
            >
              <component :is="downloadSuccess ? Check : Download" v-if="!isDownloading" class="w-3.5 h-3.5" />
              <svg v-else class="animate-spin h-3.5 w-3.5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ downloadText }}</span>
            </button>
          </Transition>
        </div>
      </div>

      <div class="relative group">
        <div class="w-full bg-white border border-slate-200 rounded-xl min-h-[120px] shadow-sm flex flex-col justify-center items-center overflow-x-auto p-8">
          
          <Transition name="slide-fade" mode="out-in">
            <div 
              v-if="inputLatex" 
              ref="previewRef"
              :key="inputLatex" 
              class="latex-output select-none inline-block text-slate-900 p-0" 
              v-html="previewHtml"
            ></div>
            
            <span v-else class="text-slate-300 italic text-sm select-none">{{ t('waiting_input') }} ...</span>
          </Transition>

        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Clipboard, Check, XCircle, Download } from 'lucide-vue-next'; 
import { toPng } from 'html-to-image';
import { useI18n } from 'vue-i18n';

// 状态定义
const { t } = useI18n();

const inputLatex = ref<string>('');
const resolution = ref<number>(5); // 1. 新增：分辨率状态变量
const copiedSource = ref(false);
const previewRef = ref<HTMLElement | null>(null);

const isDownloading = ref(false);
const downloadSuccess = ref(false);

const downloadText = computed(() => {
  if (downloadSuccess.value) return t('saved');
  if (isDownloading.value) return '生成中...'; // 如果您有 'generating' 的翻译key，建议替换
  return t('download_png');
});

const previewHtml = computed(() => {
  if (!inputLatex.value) return '';
  try {
    return katex.renderToString(inputLatex.value, {
      throwOnError: false,
      displayMode: true,
      output: 'html',
    });
  } catch (error) {
    return `<span class="text-red-500 font-mono text-sm">语法错误: ${(error as Error).message}</span>`;
  }
});

const copySource = () => {
  if (!inputLatex.value || copiedSource.value) return;
  navigator.clipboard.writeText(inputLatex.value);
  copiedSource.value = true;
  setTimeout(() => copiedSource.value = false, 2000);
};

const downloadPng = async () => {
  if (!previewRef.value || isDownloading.value) return;

  isDownloading.value = true;

  try {
    const dataUrl = await toPng(previewRef.value, {
      backgroundColor: 'rgba(0,0,0,0)', 
      pixelRatio: resolution.value, // 2. 修改：使用动态分辨率
      skipAutoScale: true,
      cacheBust: true,
    });

    const link = document.createElement('a');
    // 3. 修改：文件名带上分辨率信息
    const filename = `latex_formula_${resolution.value}x_${Date.now()}.png`;
    
    link.download = filename;
    link.href = dataUrl;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    downloadSuccess.value = true;
    setTimeout(() => downloadSuccess.value = false, 2000);

  } catch (err) {
    console.error('Download Failed:', err);
    alert('PNG 生成失败: ' + (err as Error).message);
  } finally {
    isDownloading.value = false;
  }
};
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(5px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.katex) {
  font-size: 1.5em;
}

:deep(.latex-output .katex-display) {
  margin: 0 !important;
}

.cursor-wait {
  cursor: wait;
}

/* 4. 新增：滑块样式优化 */
input[type=range] {
  -webkit-appearance: none; 
  background: transparent; 
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 14px;
  width: 14px;
  border-radius: 50%;
  background: #3b82f6; /* blue-500 */
  margin-top: -5px; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: background 0.2s;
}

input[type=range]::-webkit-slider-thumb:hover {
  background: #2563eb; /* blue-600 */
}

input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: #e2e8f0; /* slate-200 */
  border-radius: 2px;
}
</style>