<template>
  <div class="max-w-3xl mx-auto p-8 space-y-8">
    <h2 class="text-2xl font-bold text-slate-800">{{ t('settings.title') }}</h2>

    <div class="space-y-3">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{{ t('settings.appearance.title') }}</h3>
      
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        
        <div class="p-4 flex items-center justify-between border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Clock class="w-5 h-5" />
            </div>
            <span class="font-medium text-slate-700">{{ t('settings.appearance.clock_style') }}</span>
          </div>
          
          <div class="bg-slate-100 p-1 rounded-lg flex text-sm">
            <button 
              @click="settings.clockStyle = 'digital'"
              class="px-3 py-1.5 rounded-md transition-all"
              :class="settings.clockStyle === 'digital' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'"
            >
              {{ t('settings.appearance.digital') }}
            </button>
            <button 
              @click="settings.clockStyle = 'analog'"
              class="px-3 py-1.5 rounded-md transition-all"
              :class="settings.clockStyle === 'analog' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'"
            >
              {{ t('settings.appearance.analog') }}
            </button>
          </div>
        </div>

        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Timer class="w-5 h-5" />
            </div>
            <span class="font-medium text-slate-700">{{ t('settings.appearance.show_seconds') }}</span>
          </div>
          
          <button 
            @click="settings.showSeconds = !settings.showSeconds"
            class="w-12 h-7 rounded-full transition-colors duration-300 relative focus:outline-none"
            :class="settings.showSeconds ? 'bg-green-500' : 'bg-slate-200'"
          >
            <div 
              class="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300"
              :class="settings.showSeconds ? 'translate-x-5' : 'translate-x-0'"
            ></div>
          </button>
        </div>

      </div>
    </div>

    <div class="space-y-3">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{{ t('settings.ai.title') }}</h3>
      
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        
        <div class="p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <HardDrive class="w-5 h-5" />
              </div>
              <div class="flex flex-col">
                <span class="font-medium text-slate-700">{{ t('settings.ai.model_path') }}</span>
                <span class="text-xs text-slate-400">{{ t('settings.ai.model_path_desc') }}</span>
              </div>
            </div>
            
            <button 
              @click="selectModelFolder"
              class="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              {{ settings.modelPath ? t('settings.ai.change_folder') : t('settings.ai.select_folder') }}
            </button>
          </div>

          <div class="relative group">
            <div class="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono break-all flex items-center justify-between gap-2">
              <span v-if="settings.modelPath">{{ settings.modelPath }}</span>
              <span v-else class="text-slate-400 italic">{{ t('settings.ai.not_configured') }}</span>
              
              <button 
                v-if="settings.modelPath"
                @click="settings.modelPath = ''"
                class="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                :title="t('settings.ai.reset_default')"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
            <p v-if="settings.modelPath" class="mt-2 text-[10px] text-slate-400">
              {{ t('settings.ai.path_hint') }} <code class="bg-slate-100 px-1 rounded">removebg/</code>
            </p>
          </div>
        </div>

      </div>
    </div>

    <div class="space-y-3">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{{ t('settings.general.title') }}</h3>
      
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Globe class="w-5 h-5" />
            </div>
            <span class="font-medium text-slate-700">{{ t('settings.general.language') }}</span>
          </div>
          
          <select 
            v-model="settings.language"
            class="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
          >
            <option value="zh">中文 (简体)</option>
            <option value="en">English</option>
          </select>
        </div>

      </div>
    </div>

    <div class="space-y-3">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
        {{ t('settings.update.title') }}
      </h3>
      
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg transition-colors"
              :class="hasUpdate ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600'"
            >
              <Download v-if="hasUpdate" class="w-5 h-5" />
              <Zap v-else class="w-5 h-5" />
            </div>
            
            <div class="flex flex-col">
              <span class="font-medium text-slate-700">{{ t('settings.update.software_name') }}</span>
              <span class="text-xs text-slate-400">
                {{ t('settings.update.current_version') }}: v{{ appVersion }}
                <span v-if="hasUpdate" class="text-green-600 font-bold ml-1">
                  ({{ t('settings.update.new_version') }}: v{{ updateManifest?.version }})
                </span>
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            
            <div v-if="updateState === 'checking' || updateState === 'downloading'" class="flex items-center gap-3">
              <span class="text-xs text-slate-500 font-medium">
                {{ updateState === 'downloading' 
                    ? `${t('settings.update.status_downloading')} ${downloadProgress}%` 
                    : t('settings.update.status_checking') 
                }}
              </span>
              <RefreshCw class="w-4 h-4 text-blue-500 animate-spin" />
            </div>

            <button 
              v-else-if="hasUpdate"
              @click="startUpdate"
              class="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Download class="w-4 h-4" />
              <span>{{ t('settings.update.btn_update_now') }}</span>
            </button>

            <button 
              v-else
              @click="checkForUpdates(true)" 
              class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              {{ t('settings.update.btn_check') }}
            </button>

          </div>
        </div>

        <div v-if="updateState === 'downloading'" class="h-1 w-full bg-slate-100">
          <div 
            class="h-full bg-green-500 transition-all duration-300 ease-out"
            :style="{ width: `${downloadProgress}%` }"
          ></div>
        </div>
        
        <div v-if="errorMsg" class="px-4 py-2 bg-red-50 text-red-600 text-xs border-t border-red-100">
          {{ errorMsg }}
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import { Clock, Timer, Globe, HardDrive, X, RefreshCw, Download, Zap } from 'lucide-vue-next';
import { settings } from '../../store/settings';
import { open } from '@tauri-apps/plugin-dialog';
import { getVersion } from '@tauri-apps/api/app';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const { t } = useI18n();

// --------------------------------------------------
// 逻辑：模型文件夹选择
// --------------------------------------------------
const selectModelFolder = async () => {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      // 🟢 修改：settings.ai.select_dialog_title
      title: t('settings.ai.select_dialog_title')
    });

    if (selected && typeof selected === 'string') {
      settings.modelPath = selected;
    }
  } catch (err) {
    console.error('无法打开文件夹选择器:', err);
  }
};

// --------------------------------------------------
// 逻辑：自动更新
// --------------------------------------------------
const appVersion = ref('');
const updateState = ref<'idle' | 'checking' | 'available' | 'downloading' | 'error'>('idle');
const hasUpdate = ref(false);
const updateManifest = ref<any>(null);
const downloadProgress = ref(0);
const errorMsg = ref('');

onMounted(async () => {
  try {
    appVersion.value = await getVersion();
    checkForUpdates(false);
  } catch (e) {
    console.error('Failed to get app version', e);
  }
});

const checkForUpdates = async (manual: boolean) => {
  if (updateState.value === 'downloading') return;
  
  if (manual) updateState.value = 'checking';
  errorMsg.value = '';

  try {
    const update = await check();
    
    if (update?.available) {
      hasUpdate.value = true;
      updateManifest.value = update;
      updateState.value = 'available';
    } else {
      hasUpdate.value = false;
      updateState.value = 'idle';
    }
  } catch (err) {
    console.error(err);
    updateState.value = 'idle';
    if (manual) {
      // 🟢 修改：settings.update.error_check
      errorMsg.value = t('settings.update.error_check'); 
    }
  }
};

const startUpdate = async () => {
  if (!updateManifest.value) return;

  updateState.value = 'downloading';
  downloadProgress.value = 0;
  errorMsg.value = '';

  try {
    await updateManifest.value.downloadAndInstall((event: any) => {
      if (event.event === 'Progress') {
        if (downloadProgress.value < 90) {
            downloadProgress.value += 10;
        }
      } else if (event.event === 'Finished') {
        downloadProgress.value = 100;
      }
    });

    await relaunch();
  } catch (err: any) {
    console.error(err);
    updateState.value = 'error';
    // 🟢 修改：settings.update.error_install
    errorMsg.value = `${t('settings.update.error_install')}: ${err.message || err}`;
  }
};
</script>