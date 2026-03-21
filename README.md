<div align="center">

# 道

### DaoMark · 道韵笔记

**The Way of Markdown — Where simplicity meets the art of writing.**

*大道至简 — 以至简之道，书写万千。*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri-ffc131?logo=tauri)](https://tauri.app)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-blue)]()

[English](#philosophy) · [中文](#设计哲学)

</div>

---

## Philosophy

> *"The Dao that can be told is not the eternal Dao."*
> — Laozi, Chapter 1

DaoMark is a Markdown editor born from a single belief: **the greatest beauty lies in simplicity**.

In a world of bloated editors with hundreds of features, DaoMark takes the opposite path. Like water that flows to the lowest point yet shapes mountains, DaoMark does less — and achieves more. Every pixel, every interaction, every line of code serves one purpose: to let your words breathe.

### Design Principles

| Principle | Essence |
|-----------|---------|
| **Wu Wei (无为)** | The interface disappears. You see only your writing. |
| **Liubai (留白)** | Generous whitespace — emptiness is not nothing, it is possibility. |
| **Shuimo (水墨)** | Ink-wash color palette. Warm paper tones, deep ink text, nature-inspired accents. |
| **Zhi Jian (至简)** | Every feature must justify its existence. If it can be removed, it should be. |

### Features

- ⚡ **Live Preview** — See your Markdown rendered in real-time (120ms debounce)
- 🎨 **Syntax Highlighting** — Code blocks with elegant color themes
- 🌓 **Light & Dark Themes** — Ink-wash aesthetics in both modes
- 🌍 **i18n** — Full Chinese & English internationalization
- ⌨️ **macOS Shortcuts** — ⌘B, ⌘I, ⌘K, ⌘S, and more
- 📂 **File Operations** — Open, Save, Save As, Export HTML
- 📊 **Smart Status Bar** — Word count, line count, cursor position
- 🔄 **Scroll Sync** — Editor and preview scroll together
- ↹ **Smart Editing** — Auto-pair brackets, auto-continue lists, Tab indent
- 🖱️ **Resizable Panes** — Drag to adjust editor/preview ratio
- 👁️ **Three View Modes** — Split / Editor only / Preview only

### Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Vite + Vanilla JS | Zero framework. Pure simplicity. |
| Markdown | marked.js | Fast, lightweight, extensible. |
| Highlighting | highlight.js | Elegant code coloring. |
| Typography | LXGW WenKai (霞鹜文楷) | Calligraphic beauty. |
| Native | **Tauri** | Rust-powered. ~5MB binary. The Dao of desktop apps. |

---

## 设计哲学

> *「道可道，非常道。」*
> — 老子《道德经》第一章

DaoMark 源于一个信念：**大道至简**。

当世间编辑器竞相堆砌功能，DaoMark 反其道而行——如水就下而能穿石，做减法，成大器。每一像素、每一交互、每一行代码，皆为一个目标：让文字自由呼吸。

### 设计四则

| 原则 | 释义 |
|------|------|
| **无为** | 界面隐于无形，唯文字跃然。 |
| **留白** | 大方留白——空非空，乃万象之始。 |
| **水墨** | 宣纸暖调、墨色深浅、山水点睛。 |
| **至简** | 每个功能须自证存在之必要，可去则去。 |

---

## Quick Start / 快速开始

### Web Development / Web 开发

```bash
# Clone
git clone https://github.com/RalphBigBear/daomark.git
cd daomark

# Install dependencies / 安装依赖
npm install

# Start dev server / 启动开发服务器
npm run dev
# → http://localhost:1420
```

### Native Build with Tauri / Tauri 原生构建

> Prerequisites / 前置要求: [Rust](https://rustup.rs), [Node.js](https://nodejs.org) ≥ 18

```bash
# Install Tauri CLI / 安装 Tauri CLI
npm install

# Development with native window / 原生窗口开发
npm run tauri:dev

# Build production binary / 构建生产可执行文件
npm run tauri:build
```

**Build outputs / 构建产物:**

| Platform | Format | Location |
|----------|--------|----------|
| macOS | `.app` / `.dmg` | `src-tauri/target/release/bundle/macos/` |
| Linux | `.AppImage` / `.deb` | `src-tauri/target/release/bundle/` |
| Windows | `.msi` / `.exe` | `src-tauri/target/release/bundle/` |

---

## Project Structure / 项目结构

```
daomark/
├── index.html                  # App shell / 应用骨架
├── package.json                # Dependencies / 依赖配置
├── vite.config.js              # Vite config / 构建配置
├── src/
│   ├── main.js                 # Entry / 入口
│   ├── editor.js               # Editor core / 编辑器核心
│   ├── toolbar.js              # Toolbar & shortcuts / 工具栏
│   ├── file-ops.js             # File operations / 文件操作
│   ├── theme.js                # Theme manager / 主题管理
│   ├── i18n.js                 # Internationalization / 国际化
│   ├── utils.js                # Utilities / 工具函数
│   ├── locales/
│   │   ├── zh.json             # 中文
│   │   └── en.json             # English
│   └── styles/
│       └── index.css           # Design system / 设计系统
└── src-tauri/
    ├── Cargo.toml              # Rust dependencies
    ├── tauri.conf.json         # Tauri config
    └── src/
        └── main.rs             # Rust entry
```

---

## Shortcuts / 快捷键

| Shortcut | Action |
|----------|--------|
| `⌘B` | Bold / 加粗 |
| `⌘I` | Italic / 斜体 |
| `⌘K` | Link / 链接 |
| `⌘E` | Inline code / 行内代码 |
| `⌘⇧K` | Code block / 代码块 |
| `⌘⇧X` | Strikethrough / 删除线 |
| `⌘S` | Save / 保存 |
| `⌘⇧S` | Save as / 另存为 |
| `⌘N` | New / 新建 |
| `⌘O` | Open / 打开 |
| `Tab` | Indent / 缩进 |
| `⇧Tab` | Outdent / 反缩进 |

---

## Contributing / 参与贡献

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md).

欢迎贡献！请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## License / 许可

[MIT](./LICENSE) — Free as the Dao. 自由如道。

---

<div align="center">

*大道至简*

*The greatest truths are the simplest.*

</div>
