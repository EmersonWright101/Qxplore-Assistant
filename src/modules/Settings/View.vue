<template>
  <div class="max-w-3xl mx-auto p-8 space-y-8">
    <h2 class="text-2xl font-bold text-slate-800">{{ t('settings.title') }}</h2>

    <!-- Appearance -->
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

    <!-- AI Model Path -->
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

    <!-- LLM Providers -->
    <div class="space-y-3">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{{ t('settings.llm.title') }}</h3>

      <div class="bg-white border border-gray-200 rounded-xl shadow-sm">

        <!-- Tab bar -->
        <div class="px-3 pt-3 pb-0 flex items-center border-b border-gray-100 rounded-t-xl">
          <!-- Tabs -->
          <div class="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
            <button
              v-for="p in settings.llmProviders"
              :key="p.id"
              @click="selectProvider(p.id)"
              class="px-3 py-2 text-sm rounded-t-lg whitespace-nowrap transition-all border-b-2 -mb-px shrink-0"
              :class="settings.activeLlmProviderId === p.id
                ? 'text-violet-700 font-medium border-violet-500 bg-violet-50/50'
                : 'text-slate-500 hover:text-slate-700 border-transparent hover:border-slate-200'"
            >
              {{ p.name || t('settings.llm.unnamed_provider') }}
            </button>
          </div>

          <!-- Add provider button (outside scroll area so dropdown overlays freely) -->
          <div class="relative shrink-0 ml-1 pb-px">
            <button
              @click="showAddMenu = !showAddMenu"
              class="flex items-center gap-1 px-2.5 py-1.5 mb-1 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-dashed border-slate-200 hover:border-slate-300"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>{{ t('settings.llm.add_provider') }}</span>
            </button>

            <!-- Transparent backdrop to close menu on outside click -->
            <div
              v-if="showAddMenu"
              class="fixed inset-0 z-10"
              @click="showAddMenu = false"
            ></div>
            <!-- Preset dropdown -->
            <div
              v-if="showAddMenu"
              class="absolute top-full right-0 mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 min-w-[160px]"
            >
              <button
                v-for="preset in PRESETS"
                :key="preset.name"
                @click="addProvider(preset)"
                class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
              >
                {{ preset.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Active provider panel -->
        <div v-if="activeProvider" class="divide-y divide-gray-100">

          <!-- Name + delete -->
          <div class="p-4 flex items-center gap-3">
            <div class="p-2 bg-slate-100 text-slate-500 rounded-lg shrink-0">
              <Building2 class="w-4 h-4" />
            </div>
            <input
              v-model="activeProvider.name"
              type="text"
              :placeholder="t('settings.llm.provider_name_placeholder')"
              class="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-violet-300 focus:border-violet-300"
            />
            <button
              @click="deleteProvider(activeProvider.id)"
              class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              :title="t('settings.llm.delete_provider')"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Endpoint -->
          <div class="p-4 space-y-2">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-violet-50 text-violet-600 rounded-lg">
                <Globe class="w-5 h-5" />
              </div>
              <div class="flex flex-col flex-1">
                <span class="font-medium text-slate-700">{{ t('settings.llm.endpoint') }}</span>
                <span class="text-xs text-slate-400">{{ t('settings.llm.endpoint_desc') }}</span>
              </div>
              <!-- Test button + result -->
              <div class="flex items-center gap-2 shrink-0">
                <Transition name="fade" mode="out-in">
                  <span
                    v-if="testState === 'ok'"
                    key="ok"
                    class="flex items-center gap-1 text-xs text-emerald-600 font-medium"
                  >
                    <Check class="w-3.5 h-3.5" />
                    {{ t('settings.llm.test_ok') }}
                    <span class="text-slate-400 font-normal">{{ testMsg }}</span>
                  </span>
                  <span
                    v-else-if="testState === 'fail'"
                    key="fail"
                    class="flex items-center gap-1 text-xs text-red-500 font-medium"
                  >
                    <X class="w-3.5 h-3.5" />
                    {{ t('settings.llm.test_fail') }}
                    <span class="text-slate-400 font-normal truncate max-w-[120px]" :title="testMsg">{{ testMsg }}</span>
                  </span>
                </Transition>
                <button
                  @click="testConnection"
                  :disabled="testState === 'testing' || !activeProvider.endpoint"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="testState === 'testing' ? 'bg-slate-100 text-slate-500' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'"
                >
                  <RefreshCw class="w-3.5 h-3.5" :class="testState === 'testing' ? 'animate-spin' : ''" />
                  {{ testState === 'testing' ? t('settings.llm.testing') : t('settings.llm.test_connection') }}
                </button>
              </div>
            </div>
            <input
              v-model="activeProvider.endpoint"
              type="text"
              :placeholder="t('settings.llm.endpoint_placeholder')"
              class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-violet-300 focus:border-violet-300 font-mono"
            />
          </div>

          <!-- API Key -->
          <div class="p-4 space-y-2">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <KeyRound class="w-5 h-5" />
              </div>
              <span class="font-medium text-slate-700">{{ t('settings.llm.api_key') }}</span>
            </div>
            <div class="relative">
              <input
                v-model="activeProvider.apiKey"
                :type="showApiKey[activeProvider.id] ? 'text' : 'password'"
                :placeholder="t('settings.llm.api_key_placeholder')"
                class="w-full px-3 py-2 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-300 focus:border-amber-300 font-mono"
              />
              <button
                @click="toggleApiKeyVisibility(activeProvider.id)"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <Eye v-if="!showApiKey[activeProvider.id]" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Models -->
          <div class="p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-sky-50 text-sky-600 rounded-lg">
                  <BrainCircuit class="w-5 h-5" />
                </div>
                <span class="font-medium text-slate-700">{{ t('settings.llm.models') }}</span>
              </div>
              <button
                @click="fetchModels"
                :disabled="fetchingModels || !activeProvider.endpoint"
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :class="fetchingModels ? 'bg-slate-100 text-slate-500' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'"
              >
                <RefreshCw class="w-3.5 h-3.5" :class="fetchingModels ? 'animate-spin' : ''" />
                {{ fetchingModels ? t('settings.llm.fetching') : t('settings.llm.fetch_models') }}
              </button>
            </div>

            <!-- Fetch error -->
            <div v-if="fetchError" class="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              {{ t('settings.llm.fetch_error') }} {{ fetchError }}
            </div>

            <!-- Fetched models list: searchable + grouped -->
            <div v-if="fetchedModelList.length" class="space-y-1.5">
              <div class="flex items-center gap-2">
                <p class="text-xs font-medium text-slate-500 flex-1">
                  {{ t('settings.llm.available_models') }} ({{ fetchedModelList.length }})
                </p>
              </div>
              <input
                v-model="modelSearch"
                type="text"
                :placeholder="t('settings.llm.model_search_placeholder')"
                class="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-sky-300 focus:border-sky-300"
              />
              <div class="max-h-56 overflow-y-auto rounded-lg border border-slate-100">
                <template v-if="groupedFilteredModels.length">
                  <div v-for="{ group, models: gModels } in groupedFilteredModels" :key="group">
                    <!-- Group header -->
                    <div class="sticky top-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <span>{{ group }}</span>
                      <span class="font-normal normal-case tracking-normal">{{ gModels.length }}</span>
                    </div>
                    <!-- Model rows -->
                    <button
                      v-for="m in gModels"
                      :key="m"
                      @click="toggleFetchedModel(m)"
                      class="w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono transition-colors text-left border-b border-slate-50 last:border-0"
                      :class="activeProvider.enabledModels.includes(m)
                        ? 'bg-sky-50/60 text-sky-700 hover:bg-sky-100/60'
                        : 'text-slate-600 hover:bg-slate-50'"
                    >
                      <span class="truncate">{{ m }}</span>
                      <Check v-if="activeProvider.enabledModels.includes(m)" class="w-3.5 h-3.5 text-sky-500 shrink-0 ml-2" />
                      <Plus v-else class="w-3.5 h-3.5 text-slate-300 shrink-0 ml-2" />
                    </button>
                  </div>
                </template>
                <div v-else class="px-3 py-5 text-xs text-slate-400 text-center">
                  {{ t('settings.llm.no_search_results') }}
                </div>
              </div>
            </div>

            <!-- Custom model input -->
            <div class="flex gap-2">
              <input
                v-model="newModelInput"
                @keydown.enter="addCustomModel"
                type="text"
                :placeholder="t('settings.llm.model_placeholder')"
                class="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-sky-300 focus:border-sky-300 font-mono"
              />
              <button
                @click="addCustomModel"
                :disabled="!newModelInput.trim()"
                class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus class="w-4 h-4" />
                {{ t('settings.llm.add_model') }}
              </button>
            </div>

            <!-- Enabled model pills -->
            <div v-if="activeProvider.enabledModels.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="m in activeProvider.enabledModels"
                :key="m"
                class="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-sky-50 text-sky-700 text-xs rounded-full border border-sky-100"
              >
                {{ m }}
                <button
                  @click="removeModel(m)"
                  class="w-4 h-4 flex items-center justify-center text-sky-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X class="w-2.5 h-2.5" />
                </button>
              </span>
            </div>
            <p v-else class="text-xs text-slate-400 italic">{{ t('settings.llm.no_models_hint') }}</p>
          </div>

        </div>

        <!-- Empty state -->
        <div v-else class="p-10 flex flex-col items-center gap-3 text-slate-400">
          <BrainCircuit class="w-8 h-8 opacity-40" />
          <p class="text-sm font-medium">{{ t('settings.llm.no_providers') }}</p>
          <p class="text-xs text-center max-w-xs">{{ t('settings.llm.no_providers_hint') }}</p>
        </div>

      </div>
    </div>

    <!-- General -->
    <div class="space-y-3">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{{ t('settings.general.title') }}</h3>

      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        <div class="p-4 flex items-center justify-between border-b border-gray-100">
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

        <!-- History max records -->
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <HistoryIcon class="w-5 h-5" />
            </div>
            <div class="flex flex-col">
              <span class="font-medium text-slate-700">{{ t('settings.general.history_max_records') }}</span>
              <span class="text-xs text-slate-400">{{ t('settings.general.history_max_records_desc') }}</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click="settings.historyMaxRecords = Math.max(10, (settings.historyMaxRecords ?? 100) - 10)"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors text-base font-medium"
            >−</button>
            <input
              type="number"
              v-model.number="settings.historyMaxRecords"
              min="10"
              max="2000"
              class="w-16 text-center text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg py-1 outline-none focus:ring-1 focus:ring-teal-300 focus:border-teal-300"
            />
            <button
              @click="settings.historyMaxRecords = Math.min(2000, (settings.historyMaxRecords ?? 100) + 10)"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors text-base font-medium"
            >+</button>
          </div>
        </div>

      </div>
    </div>

    <!-- Update -->
    <div class="space-y-3">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
        {{ t('settings.update.title') }}
      </h3>

      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg transition-colors duration-500"
              :class="[
                updateStore.hasUpdate ? 'bg-blue-50 text-blue-600' : '',
                updateStore.showLatestFeedback ? 'bg-green-50 text-green-600' : '',
                !updateStore.hasUpdate && !updateStore.showLatestFeedback ? 'bg-slate-100 text-slate-600' : ''
              ]"
            >
              <Download v-if="updateStore.hasUpdate" class="w-5 h-5" />
              <CheckCircle2 v-else-if="updateStore.showLatestFeedback" class="w-5 h-5 animate-pulse-once" />
              <Zap v-else class="w-5 h-5" />
            </div>

            <div class="flex flex-col">
              <span class="font-medium text-slate-700">{{ t('settings.update.software_name') }}</span>
              <span class="text-xs text-slate-400 transition-colors duration-300" :class="{ 'text-green-600 font-medium': updateStore.showLatestFeedback }">
                {{ t('settings.update.current_version') }}: v{{ updateStore.version }}
                <span v-if="updateStore.hasUpdate" class="text-blue-600 font-bold ml-1">
                  ({{ t('settings.update.new_version') }}: v{{ updateStore.newVersion }})
                </span>
                <span v-if="updateStore.showLatestFeedback" class="ml-1">
                  ({{ t('settings.update.is_latest') || 'Latest' }})
                </span>
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 min-w-[140px] justify-end">
            <Transition name="fade" mode="out-in">

              <div
                v-if="updateStore.state === 'checking' || updateStore.state === 'downloading'"
                class="flex items-center gap-3 px-2"
                key="busy"
              >
                <span class="text-xs text-slate-500 font-medium whitespace-nowrap">
                  {{ updateStore.state === 'downloading'
                      ? `${updateStore.downloadProgress}%`
                      : t('settings.update.status_checking')
                  }}
                </span>
                <RefreshCw class="w-4 h-4 text-blue-500 animate-spin" />
              </div>

              <button
                v-else-if="updateStore.hasUpdate"
                @click="startUpdate"
                class="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
                key="has-update"
              >
                <Download class="w-4 h-4" />
                <span>{{ t('settings.update.btn_update_now') }}</span>
              </button>

              <div
                v-else-if="updateStore.showLatestFeedback"
                class="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 border border-green-100 rounded-lg"
                key="latest"
              >
                <CheckCircle2 class="w-4 h-4" />
                <span class="text-sm font-medium">{{ t('settings.update.latest_status') || 'Up to date' }}</span>
              </div>

              <button
                v-else
                @click="checkForUpdates(true)"
                class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors hover:border-slate-300"
                key="idle"
              >
                {{ t('settings.update.btn_check') }}
              </button>

            </Transition>
          </div>
        </div>

        <div v-if="updateStore.state === 'downloading'" class="h-1 w-full bg-slate-100">
          <div
            class="h-full bg-blue-500 transition-all duration-300 ease-out"
            :style="{ width: `${updateStore.downloadProgress}%` }"
          ></div>
        </div>

        <div v-if="updateStore.errorMsg" class="px-4 py-2 bg-red-50 text-red-600 text-xs border-t border-red-100">
          {{ updateStore.errorMsg }}
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Clock, Timer, Globe, HardDrive, X,
  RefreshCw, Download, Zap, CheckCircle2,
  KeyRound, BrainCircuit, Plus, Trash2, Building2,
  Eye, EyeOff, Check, History as HistoryIcon
} from 'lucide-vue-next';
import { open } from '@tauri-apps/plugin-dialog';

import { settings, type LLMProvider } from '../../store/settings';
import { updateStore, checkForUpdates, startUpdate, initUpdateStore } from '../../store/updateStore';

const { t } = useI18n();

// --------------------------------------------------
// LLM Provider Management
// --------------------------------------------------
const showAddMenu = ref(false);
const newModelInput = ref('');
const modelSearch = ref('');
const fetchingModels = ref(false);
const fetchError = ref('');
const fetchedModelList = ref<string[]>([]);
const showApiKey = reactive<Record<string, boolean>>({});

type TestState = 'idle' | 'testing' | 'ok' | 'fail';
const testState = ref<TestState>('idle');
const testMsg = ref('');
let testResetTimer: ReturnType<typeof setTimeout> | null = null;

const testConnection = async () => {
  if (!activeProvider.value?.endpoint) return;
  testState.value = 'testing';
  testMsg.value = '';
  if (testResetTimer) clearTimeout(testResetTimer);
  try {
    const headers: Record<string, string> = {};
    if (activeProvider.value.apiKey) headers['Authorization'] = `Bearer ${activeProvider.value.apiKey}`;
    const resp = await fetch(`${activeProvider.value.endpoint}/models`, { headers });
    if (resp.ok) {
      testState.value = 'ok';
      testMsg.value = `HTTP ${resp.status}`;
    } else {
      testState.value = 'fail';
      testMsg.value = `HTTP ${resp.status}`;
    }
  } catch (e: unknown) {
    testState.value = 'fail';
    testMsg.value = e instanceof Error ? e.message : String(e);
  }
  testResetTimer = setTimeout(() => { testState.value = 'idle'; testMsg.value = ''; }, 5000);
};

// Group models by prefix (e.g. "openai/gpt-4o" → group "openai")
// Falls back to well-known prefixes for providers that don't use slash notation
const groupModels = (models: string[]): { group: string; models: string[] }[] => {
  const map = new Map<string, string[]>();
  for (const m of models) {
    const slash = m.indexOf('/');
    let key: string;
    if (slash !== -1) {
      key = m.slice(0, slash);
    } else if (/^(gpt-|o1|o3|o4)/.test(m)) {
      key = 'openai';
    } else if (m.startsWith('claude-')) {
      key = 'anthropic';
    } else if (m.startsWith('gemini-')) {
      key = 'google';
    } else if (/^(llama|meta-)/.test(m)) {
      key = 'meta';
    } else if (/^(mistral|mixtral)/.test(m)) {
      key = 'mistral';
    } else if (m.startsWith('deepseek-')) {
      key = 'deepseek';
    } else if (/^(qwen|qwq)/.test(m)) {
      key = 'qwen';
    } else {
      key = 'other';
    }
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([group, models]) => ({ group, models }));
};

const groupedFilteredModels = computed(() => {
  const q = modelSearch.value.toLowerCase().trim();
  const source = q
    ? fetchedModelList.value.filter(m => m.toLowerCase().includes(q))
    : fetchedModelList.value;
  return groupModels(source);
});

const PRESETS = [
  { name: 'OpenAI',    endpoint: 'https://api.openai.com/v1' },
  { name: 'DeepSeek',  endpoint: 'https://api.deepseek.com/v1' },
  { name: 'Anthropic', endpoint: 'https://api.anthropic.com/v1' },
  { name: 'Groq',      endpoint: 'https://api.groq.com/openai/v1' },
  { name: 'Ollama',    endpoint: 'http://localhost:11434/v1' },
  { name: t('settings.llm.custom'), endpoint: '' },
];

const activeProvider = computed<LLMProvider | null>(() =>
  settings.llmProviders.find(p => p.id === settings.activeLlmProviderId) ?? null
);

const selectProvider = (id: string) => {
  settings.activeLlmProviderId = id;
  fetchedModelList.value = [];
  fetchError.value = '';
  modelSearch.value = '';
  testState.value = 'idle';
  testMsg.value = '';
};

const addProvider = (preset: { name: string; endpoint: string }) => {
  const id = Date.now().toString();
  settings.llmProviders.push({ id, name: preset.name, endpoint: preset.endpoint, apiKey: '', enabledModels: [] });
  settings.activeLlmProviderId = id;
  showAddMenu.value = false;
  fetchedModelList.value = [];
  fetchError.value = '';
  modelSearch.value = '';
};

const deleteProvider = (id: string) => {
  const idx = settings.llmProviders.findIndex(p => p.id === id);
  if (idx === -1) return;
  settings.llmProviders.splice(idx, 1);
  if (settings.activeLlmProviderId === id) {
    settings.activeLlmProviderId = settings.llmProviders[0]?.id ?? '';
  }
  fetchedModelList.value = [];
};

const toggleApiKeyVisibility = (id: string) => {
  showApiKey[id] = !showApiKey[id];
};

const fetchModels = async () => {
  if (!activeProvider.value?.endpoint) return;
  fetchingModels.value = true;
  fetchError.value = '';
  fetchedModelList.value = [];
  modelSearch.value = '';
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (activeProvider.value.apiKey) headers['Authorization'] = `Bearer ${activeProvider.value.apiKey}`;
    const resp = await fetch(`${activeProvider.value.endpoint}/models`, { headers });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    fetchedModelList.value = ((data.data ?? data.models ?? []) as Array<{ id?: string; name?: string }>)
      .map(m => m.id ?? m.name ?? '')
      .filter(Boolean)
      .sort();
  } catch (e: unknown) {
    fetchError.value = e instanceof Error ? e.message : String(e);
  } finally {
    fetchingModels.value = false;
  }
};

const toggleFetchedModel = (modelId: string) => {
  if (!activeProvider.value) return;
  const idx = activeProvider.value.enabledModels.indexOf(modelId);
  if (idx === -1) activeProvider.value.enabledModels.push(modelId);
  else activeProvider.value.enabledModels.splice(idx, 1);
};

const addCustomModel = () => {
  const name = newModelInput.value.trim();
  if (!activeProvider.value || !name) return;
  if (!activeProvider.value.enabledModels.includes(name)) {
    activeProvider.value.enabledModels.push(name);
  }
  newModelInput.value = '';
};

const removeModel = (modelId: string) => {
  if (!activeProvider.value) return;
  const idx = activeProvider.value.enabledModels.indexOf(modelId);
  if (idx !== -1) activeProvider.value.enabledModels.splice(idx, 1);
};

// --------------------------------------------------
// Model folder selection
// --------------------------------------------------
const selectModelFolder = async () => {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
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
// Init update store
// --------------------------------------------------
onMounted(() => {
  initUpdateStore();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

@keyframes pulse-once {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.animate-pulse-once {
  animation: pulse-once 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}
</style>
