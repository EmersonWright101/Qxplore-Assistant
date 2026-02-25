# Qxplore-Assistant

[![Tauri v2](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=white)](https://tauri.app/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5+-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Qxplore-Assistant is a sophisticated, lightweight desktop utility suite designed for developers and power users. Built with the latest **Tauri v2** framework and **Vue 3**, it provides a high-performance, cross-platform experience with a minimal footprint.

## ✨ Key Features

- **🏠 Smart Dashboard**: Personal workspace with dynamic greetings and a customizable clock (Digital/Analog).
- **📝 Text Manipulation**: Precision text converter supporting multiple cases:
  - UPPERCASE / lowercase
  - Title Case / Uncapitalize
  - CamelCase / camelCase / snake_case
- **🖼️ AI Image Processing**: 
  - **Local Background Removal**: AI-powered image segmentation processed entirely on your machine for maximum privacy.
  - **Flexible Models**: Choose between *High Precision (Medium)* and *Fast Mode (Small)*.
  - **GPU Acceleration**: Hardware-accelerated processing where available.
- **🧪 LaTeX to PNG**: Professional-grade math formula renderer with real-time preview and PNG export capabilities.
- **⚙️ Advanced Configuration**:
  - **AI Model Management**: Custom path configuration for AI model weights.
  - **Window Persistence**: Remembers your window size and position for a consistent experience.
  - **Multi-language Support**: Seamless switching between **English** and **简体中文**.
  - **Auto-Updater**: Integrated system to stay current with the latest features and security patches.

## 🛠️ Technical Highlights

- **Backend**: Rust-based [Tauri v2](https://tauri.app/) for system-level performance and security.
- **Frontend**: [Vue 3](https://vuejs.org/) with [TypeScript](https://www.typescriptlang.org/) for a robust and reactive UI.
- **Styling**: Modern aesthetics powered by [Tailwind CSS](https://tailwindcss.com/) and [Lucide](https://lucide.dev/) icons.
- **Localization**: Full i18n support using `vue-i18n`.
- **Image AI**: Powered by `@imgly/background-removal` for high-quality, local processing.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Rust & Cargo](https://www.rust-lang.org/learn/get-started)
- [Tauri Prerequisites](https://tauri.app/v2/guides/getting-started/prerequisites)

### Installation & Development

1. **Clone & Install**:
   ```bash
   git clone https://github.com/EmersonWright101/Qxplore-Assistant.git
   cd Qxplore-Assistant
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run tauri dev
   ```

3. **Build Production App**:
   ```bash
   npm run tauri build
   ```
   *The built artifacts will be located in `src-tauri/target/release/bundle/`.*

## 📄 License

This project is private and for personal use.

---

*Enhancing productivity through elegant engineering.*
