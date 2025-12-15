// src/store/settings.ts
import { reactive, watch } from 'vue';
import i18n from '../locales'; // 引入 i18n 实例

interface SettingsState {
  clockStyle: 'digital' | 'analog';
  showSeconds: boolean;
  language: 'zh' | 'en';
  modelPath: string;
}

const savedSettings = localStorage.getItem('app-settings');
const defaultSettings: SettingsState = {
  clockStyle: 'digital',
  showSeconds: true,
  language: 'zh',
  modelPath: '',
};

export const settings = reactive<SettingsState>(
  savedSettings ? JSON.parse(savedSettings) : defaultSettings
);

// 🟢 监听设置变化
watch(settings, (newSettings) => {
  // 1. 保存到本地存储
  localStorage.setItem('app-settings', JSON.stringify(newSettings));
  
  // 2. 同步更新 vue-i18n 的语言
  // 注意：在 Composition API 模式下，locale 是一个 ref，所以要用 .value
  if (i18n.global.locale.value !== newSettings.language) {
    i18n.global.locale.value = newSettings.language;
  }
});