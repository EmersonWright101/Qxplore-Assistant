// src/store/settings.ts
import { reactive, watch } from 'vue';
import i18n from '../locales';

export interface LLMProvider {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  enabledModels: string[];
}

interface SettingsState {
  clockStyle: 'digital' | 'analog';
  showSeconds: boolean;
  language: 'zh' | 'en';
  modelPath: string;
  llmProviders: LLMProvider[];
  activeLlmProviderId: string;
  historyMaxRecords: number;
  homeCardOrder: string[];
}

const savedSettings = localStorage.getItem('app-settings');
const defaultSettings: SettingsState = {
  clockStyle: 'digital',
  showSeconds: true,
  language: 'zh',
  modelPath: '',
  llmProviders: [],
  activeLlmProviderId: '',
  historyMaxRecords: 100,
  homeCardOrder: [],
};

let parsed: Record<string, unknown> = savedSettings ? JSON.parse(savedSettings) : {};

// Migration: old single-provider format → new multi-provider format
if ((parsed.llmEndpoint || parsed.llmApiKey) && !parsed.llmProviders) {
  const migratedProvider: LLMProvider = {
    id: 'default',
    name: 'Default',
    endpoint: (parsed.llmEndpoint as string) || '',
    apiKey: (parsed.llmApiKey as string) || '',
    enabledModels: parsed.llmModel ? [(parsed.llmModel as string)] : [],
  };
  parsed.llmProviders = [migratedProvider];
  parsed.activeLlmProviderId = 'default';
  delete parsed.llmEndpoint;
  delete parsed.llmApiKey;
  delete parsed.llmModel;
}

export const settings = reactive<SettingsState>({ ...defaultSettings, ...parsed } as SettingsState);

watch(settings, (newSettings) => {
  localStorage.setItem('app-settings', JSON.stringify(newSettings));
  if (i18n.global.locale.value !== newSettings.language) {
    i18n.global.locale.value = newSettings.language;
  }
});
