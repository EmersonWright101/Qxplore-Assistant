import { reactive, shallowRef } from 'vue';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import type { Update } from '@tauri-apps/plugin-updater';
import { getVersion } from '@tauri-apps/api/app';

// 定义状态
export const updateStore = reactive({
  state: 'idle' as 'idle' | 'checking' | 'available' | 'downloading' | 'error',
  hasUpdate: false,
  version: '', // 当前应用版本
  newVersion: '', // 新版本号
  downloadProgress: 0,
  errorMsg: '',
  // 专门用于 UI 提示“已是最新”的临时状态
  showLatestFeedback: false, 
});

// 使用 shallowRef 存储 Update 对象，避免 "private member" 报错
const updateManifest = shallowRef<Update | null>(null);

// 初始化版本号
export const initUpdateStore = async () => {
  try {
    updateStore.version = await getVersion();
  } catch (e) {
    console.error(e);
  }
};

// 检查更新
export const checkForUpdates = async (manual: boolean) => {
  if (updateStore.state === 'downloading') return;

  if (manual) {
    updateStore.state = 'checking';
    updateStore.showLatestFeedback = false;
  }
  updateStore.errorMsg = '';

  try {
    const update = await check();

    if (update?.available) {
      updateStore.hasUpdate = true;
      updateStore.newVersion = update.version;
      updateManifest.value = update; // 存入 shallowRef
      updateStore.state = 'available';
    } else {
      updateStore.hasUpdate = false;
      updateStore.state = 'idle';
      
      if (manual) {
        updateStore.showLatestFeedback = true;
        setTimeout(() => {
          updateStore.showLatestFeedback = false;
        }, 3000);
      }
    }
  } catch (err: any) {
    console.error(err);
    updateStore.state = 'idle';
    if (manual) {
      updateStore.errorMsg = 'Check failed: ' + (err.message || err);
    }
  }
};

// 开始更新
export const startUpdate = async () => {
  if (!updateManifest.value) return;

  updateStore.state = 'downloading';
  updateStore.downloadProgress = 0;
  updateStore.errorMsg = '';

  try {
    let downloadedBytes = 0;
    let totalBytes = 0;
    let lastPercentage = 0; // 🟢 新增：记录上一次更新的百分比

    await updateManifest.value.downloadAndInstall((event: any) => {
      if (event.event === 'Started') {
        totalBytes = event.data.contentLength || 0;
      } 
      else if (event.event === 'Progress') {
        downloadedBytes += event.data.chunkLength;

        if (totalBytes > 0) {
          const currentPercentage = Math.floor((downloadedBytes / totalBytes) * 100);
          
          // 🟢 优化：只有当进度发生了 1% 的变化时，才通知 Vue 更新 UI
          // 这样可以避免每秒几百次的重绘，节省 CPU，让下载流更顺畅
          if (currentPercentage > lastPercentage) {
            updateStore.downloadProgress = currentPercentage;
            lastPercentage = currentPercentage;
          }
        } else {
          // 无法获取总大小时的假进度逻辑
          if (updateStore.downloadProgress < 90) {
             // 降低假进度的频率
             if (Math.random() > 0.8) {
                updateStore.downloadProgress += 1;
             }
          }
        }
      } 
      else if (event.event === 'Finished') {
        updateStore.downloadProgress = 100;
      }
    });

    updateStore.downloadProgress = 100;
    await relaunch();

  } catch (err: any) {
    // ... 错误处理不变
  }
};