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
    home: 'Home',
    text_manipulation: 'Text Manipulation',
    mathematical_tools: 'Mathematical Tools',
    case_converter: 'Case Converter',
    network_test: 'Network Test',
    settings: 'Settings', // ✅ 保持这个字符串不变，供侧边栏使用
    my_assistant: 'My Assistant',
    start_work: 'Start Work',
    good_morning: 'Good Morning',
    good_afternoon: 'Good Afternoon',
    good_evening: 'Good Evening',
    good_night: 'Good Night',
    home_subtitle: '"Your personal workspace for efficiency."',
    appearance: 'Appearance',
    general: 'General',
    clock_style: 'Clock Style',
    digital: 'Digital',
    analog: 'Analog',
    show_seconds: 'Show Seconds',
    language: 'Language',
    toolbox: 'Toolbox',
    latex2png: 'LaTex to PNG',
    copy_source_code: 'Copy Source Code',
    source_code_copied: 'Source Code Copied',
    waiting_input: 'Waiting User Input',
    download_png: 'Download PNG',
    realtime_preview: 'Realtime Preview',
    saved: 'Saved',
    latex_source_code: 'LaTex Source Code',
    latex_input_prompt: "Please input your LaTex code here.....",
    clear: 'Clear',
    resolution: 'Resolution',
    convertion_result: 'Convertion Result',
    source_text: "Source Text",
    text_converter_prompt: "Please input your text here, e.g., Hello World......",
    copied: 'Copied',
    copy_result: 'Copy Result',
    uppercase: 'Uppercase',
    lowercase: 'Lowercase',
    titleCase: 'Title Case',
    snake_case: 'Snake Case',
    UpperCamelCase: 'Upper Camel Case',
    lowerCamelCase: 'Lower Camel Case',
    uncapitalize: 'Uncapitalize',
    image_processing: 'Image Processing',
    remove_bg: "Remove Background",
    use_gpu: "GPU Accel",
    // ===== AI =====
    ai_config: "AI Configuration",
    model_path: "Model Weight Path",
    model_path_desc: "Root directory for all AI model files",
    change_folder: "Change Folder",
    select_folder: "Select Folder",
    model_not_configured: "Not configured (Using default built-in model)",
    reset_default: "Reset to Default",
    model_path_hint: "* Program will look for subfolders like",
    select_model_folder_title: "Select Model Root Directory",
    
    support_paste: "Support {binding}, drag and drop, or click to upload",
    model: "Model",
    model_medium: "High Precision (Medium)",
    model_small: "Fast Mode (Small)",
    export_scale: "Export Scale",
    original_image: "Original Image",
    click_paste_prompt: "Click or Paste Image",
    drop_to_upload: "Release to Upload",
    processing_result: "Result",
    processing: "Removing Background...",
    no_content: "No Content",
    re_remove_bg: "Remove Again",
    start_remove_bg: "Start Removal",
    download: "Download",
    failed: "Failed",
    
    err_upload_image: "Please upload an image file",
    err_process_failed: "Processing failed",
    err_worker_error: "Critical process error",
    
    high_precision: "High Precision",
    fast_mode: "Fast Mode",

    // ✅ 新增 Update 模块 (独立于 settings)
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
    }
  },
  zh: {
    home: '首页',
    text_manipulation: '文本处理',
    mathematical_tools: '数学工具',
    case_converter: '大小写转换',
    network_test: '网络并发',
    settings: '偏好设置', // ✅ 保持这个字符串不变
    my_assistant: '我的助手',
    start_work: '开始工作',
    good_morning: '早上好',
    good_afternoon: '下午好',
    good_evening: '晚上好',
    good_night: '晚安',
    home_subtitle: '“专属于你的高效工作台。”',
    appearance: '外观',
    general: '通用',
    clock_style: '时钟风格',
    digital: '数字时钟',
    analog: '模拟表盘',
    show_seconds: '显示秒针',
    language: '语言 / Language',
    toolbox: '工具箱',
    latex2png: 'LaTex转PNG',
    copy_source_code: '复制源码',
    source_code_copied: '已复制',
    waiting_input: '等待输入',
    download_png: '下载 PNG',
    realtime_preview: '实时预览',
    saved: '已保存',
    latex_source_code: 'LaTex 源码',
    latex_input_prompt: '在此输入 LaTeX 公式......',
    clear: '清空',
    resolution: '分辨率',
    convertion_result: '转换结果',
    source_text: '源文本',
    text_converter_prompt: '在此输入文本，例如：Hello World......',
    copied: '已复制',
    copy_result: '复制结果',
    uppercase: '全大写',
    lowercase: '全小写',
    titleCase: '首字母大写',
    snake_case: '蛇形',
    UpperCamelCase: '大驼峰',
    lowerCamelCase: '小驼峰',
    uncapitalize: '首字母小写',
    image_processing: "图像处理",
    remove_bg: "背景消除",
    use_gpu: "GPU 加速",

    // ===== AI =====
    ai_config: "AI 配置",
    model_path: "模型权重路径",
    model_path_desc: "所有 AI 功能的模型文件存放根目录",
    change_folder: "更改文件夹",
    select_folder: "选择文件夹",
    model_not_configured: "未配置 (将使用默认内置模型)",
    reset_default: "重置为默认",
    model_path_hint: "* 程序将在该目录下寻找",
    select_model_folder_title: "选择模型权重根目录",
    
    support_paste: "支持 {binding} 粘贴、拖拽或点击上传图片",
    model: "模型",
    model_medium: "高精度 (Medium)",
    model_small: "极速版 (Small)",
    export_scale: "导出缩放",
    original_image: "原始图片",
    click_paste_prompt: "点击或粘贴图片",
    drop_to_upload: "释放以上传",
    processing_result: "处理结果",
    processing: "正在消除背景...",
    no_content: "无内容",
    re_remove_bg: "重新消除背景",
    start_remove_bg: "开始消除背景",
    download: "下载",
    failed: "失败",
    
    err_upload_image: "请上传图片文件",
    err_process_failed: "处理失败",
    err_worker_error: "处理进程发生严重错误",

    high_precision: "高精度",
    fast_mode: "极速版",

    // ✅ 新增 Update 模块 (独立于 settings)
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
      error_install: "安装失败"
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