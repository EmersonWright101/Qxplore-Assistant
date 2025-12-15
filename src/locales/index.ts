import { createI18n } from 'vue-i18n';

// 🟢 手动读取本地存储的语言设置
const getUserLocale = () => {
  const saved = localStorage.getItem('app-settings');
  if (saved) {
    try {
      return JSON.parse(saved).language || 'zh';
    } catch (e) {
      return 'zh';
    }
  }
  return 'zh';
};

const messages = {
  en: {
    // 侧边栏导航
    sidebar: {
      home: 'Home',
      text_manipulation: 'Text Manipulation',
      mathematical_tools: 'Mathematical Tools',
      case_converter: 'Case Converter',
      network_test: 'Network Test',
      settings: 'Settings',
      my_assistant: 'My Assistant',
      toolbox: 'Toolbox',
      latex2png: 'LaTex to PNG',
      image_processing: 'Image Processing',
      remove_bg: "Remove Background",
    },
    // 通用操作 (多个页面共用的词)
    common: {
      clear: 'Clear',
      download: 'Download',
      save: 'Save',
      saved: 'Saved',
      failed: 'Failed',
      copy: 'Copy',
      copied: 'Copied',
      waiting_input: 'Waiting User Input',
      loading: 'Loading...',
      no_content: 'No Content',
      resolution: 'Resolution',
    },
    // 首页
    home: {
      start_work: 'Start Work',
      subtitle: '"Your personal workspace for efficiency."',
      greeting: {
        morning: 'Good Morning',
        afternoon: 'Good Afternoon',
        evening: 'Good Evening',
        night: 'Good Night',
      }
    },
    // 设置页面
    settings: {
      title: 'Settings',
      appearance: {
        title: 'Appearance',
        clock_style: 'Clock Style',
        digital: 'Digital',
        analog: 'Analog',
        show_seconds: 'Show Seconds',
      },
      general: {
        title: 'General',
        language: 'Language',
      },
      ai: {
        title: "AI Configuration",
        model_path: "Model Weight Path",
        model_path_desc: "Root directory for all AI model files",
        change_folder: "Change Folder",
        select_folder: "Select Folder",
        not_configured: "Not configured (Using default built-in model)",
        reset_default: "Reset to Default",
        path_hint: "* Program will look for subfolders like",
        select_dialog_title: "Select Model Root Directory",
      },
      update: {
        title: "About & Update",
        software_name: "Software Update",
        current_version: "Current",
        new_version: "New",
        status_checking: "Checking...",
        status_downloading: "Downloading",
        status_restarting: "Restarting...",
        btn_update_now: "Update Now",
        btn_check: "Check for Updates",
        error_check: "Check failed",
        error_install: "Install failed",
        latest_status: "Up to date",
        is_latest: "Latest",
      }
    },
    // LaTeX 工具
    latex: {
      source_code: 'LaTex Source Code',
      input_prompt: "Please input your LaTex code here.....",
      realtime_preview: 'Realtime Preview',
      copy_source: 'Copy Source Code',
      source_copied: 'Source Code Copied',
      download_png: 'Download PNG',
    },
    // 文本工具
    text: {
      source: "Source Text",
      input_prompt: "Please input your text here, e.g., Hello World......",
      result: 'Convertion Result',
      copy_result: 'Copy Result',
      modes: {
        uppercase: 'Uppercase',
        lowercase: 'Lowercase',
        titleCase: 'Title Case',
        snake_case: 'Snake Case',
        UpperCamelCase: 'Upper Camel Case',
        lowerCamelCase: 'Lower Camel Case',
        uncapitalize: 'Uncapitalize',
      }
    },
    // 图片处理工具
    image: {
      support_paste: "Support {binding}, drag and drop, or click to upload",
      model: "Model",
      model_medium: "High Precision (Medium)",
      model_small: "Fast Mode (Small)",
      use_gpu: "GPU Accel",
      export_scale: "Export Scale",
      original: "Original Image",
      click_paste_prompt: "Click or Paste Image",
      drop_to_upload: "Release to Upload",
      processing_result: "Result",
      processing: "Removing Background...",
      re_remove: "Remove Again",
      start_remove: "Start Removal",
      high_precision: "High Precision",
      fast_mode: "Fast Mode",
      errors: {
        upload_image: "Please upload an image file",
        process_failed: "Processing failed",
        worker_error: "Critical process error",
      }
    }
  },
  zh: {
    // 侧边栏导航
    sidebar: {
      home: '首页',
      text_manipulation: '文本处理',
      mathematical_tools: '数学工具',
      case_converter: '大小写转换',
      network_test: '网络并发',
      settings: '偏好设置',
      my_assistant: '我的助手',
      toolbox: '工具箱',
      latex2png: 'LaTex转PNG',
      image_processing: "图像处理",
      remove_bg: "背景消除",
    },
    // 通用操作
    common: {
      clear: '清空',
      download: '下载',
      save: '保存',
      saved: '已保存',
      failed: '失败',
      copy: '复制',
      copied: '已复制',
      waiting_input: '等待输入',
      loading: '加载中...',
      no_content: '无内容',
      resolution: '分辨率',
    },
    // 首页
    home: {
      start_work: '开始工作',
      subtitle: '“专属于你的高效工作台。”',
      greeting: {
        morning: '早上好',
        afternoon: '下午好',
        evening: '晚上好',
        night: '晚安',
      }
    },
    // 设置页面
    settings: {
      title: '偏好设置',
      appearance: {
        title: '外观',
        clock_style: '时钟风格',
        digital: '数字时钟',
        analog: '模拟表盘',
        show_seconds: '显示秒针',
      },
      general: {
        title: '通用',
        language: '语言 / Language',
      },
      ai: {
        title: "AI 配置",
        model_path: "模型权重路径",
        model_path_desc: "所有 AI 功能的模型文件存放根目录",
        change_folder: "更改文件夹",
        select_folder: "选择文件夹",
        not_configured: "未配置 (将使用默认内置模型)",
        reset_default: "重置为默认",
        path_hint: "* 程序将在该目录下寻找",
        select_dialog_title: "选择模型权重根目录",
      },
      update: {
        title: "关于与更新",
        software_name: "软件更新",
        current_version: "当前版本",
        new_version: "发现新版本",
        status_checking: "正在检查...",
        status_downloading: "正在下载",
        status_restarting: "正在重启...",
        btn_update_now: "立即更新",
        btn_check: "检查更新",
        error_check: "检查失败，请检查网络",
        error_install: "安装失败",
        latest_status: "已是最新",
        is_latest: "最新版"
      }
    },
    // LaTeX 工具
    latex: {
      source_code: 'LaTex 源码',
      input_prompt: '在此输入 LaTeX 公式......',
      realtime_preview: '实时预览',
      copy_source: '复制源码',
      source_copied: '已复制',
      download_png: '下载 PNG',
    },
    // 文本工具
    text: {
      source: '源文本',
      input_prompt: '在此输入文本，例如：Hello World......',
      result: '转换结果',
      copy_result: '复制结果',
      modes: {
        uppercase: '全大写',
        lowercase: '全小写',
        titleCase: '首字母大写',
        snake_case: '蛇形',
        UpperCamelCase: '大驼峰',
        lowerCamelCase: '小驼峰',
        uncapitalize: '首字母小写',
      }
    },
    // 图片处理工具
    image: {
      support_paste: "支持 {binding} 粘贴、拖拽或点击上传图片",
      model: "模型",
      model_medium: "高精度 (Medium)",
      model_small: "极速版 (Small)",
      use_gpu: "GPU 加速",
      export_scale: "导出缩放",
      original: "原始图片",
      click_paste_prompt: "点击或粘贴图片",
      drop_to_upload: "释放以上传",
      processing_result: "处理结果",
      processing: "正在消除背景...",
      re_remove: "重新消除背景",
      start_remove: "开始消除背景",
      high_precision: "高精度",
      fast_mode: "极速版",
      errors: {
        upload_image: "请上传图片文件",
        process_failed: "处理失败",
        worker_error: "处理进程发生严重错误",
      }
    }
  }
};

const i18n = createI18n({
  legacy: false, 
  locale: getUserLocale(),
  globalInjection: true,
  messages,
});

export default i18n;