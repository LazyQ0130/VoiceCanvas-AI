# VoiceCanvas AI

VoiceCanvas AI 是一个纯前端、纯语音控制的中文矢量绘图工具。界面采用 React、TypeScript、Vite 与 Tailwind CSS 构建为全屏语音驱动仪表盘；用户点击一次按钮开启麦克风后，即可通过中文语音指令在 Canvas 上绘制、编辑和导出作品。

## 核心亮点

- **Voice-first 交互**：绘图、撤销、重做、清屏、画笔设置和保存均可通过语音完成。
- **中文规则解析器**：支持颜色、形状、操作同义词，以及中文数字和不完整指令的默认参数。
- **复杂指令拆解**：一句“画一个房子 / 笑脸 / 太阳”可拆解为多个 Canvas 基础操作。
- **原子历史记录**：复杂图形作为一个操作组进入历史，一次撤销即可完整移除。
- **实时反馈**：展示原始识别文本、结构化指令、执行结果、响应耗时和操作日志。
- **现代前端仪表盘**：使用 React、TypeScript、Vite、Tailwind CSS、Canvas API 与 Web Speech API，保持零后端依赖。

## 如何运行

ES Module 通常需要通过本地 HTTP 服务打开，不建议直接双击 `index.html`。

```bash
npm install
npm run dev
```

然后访问 `http://localhost:8000`，允许浏览器使用麦克风。生产构建可运行 `npm run build`。

## 推荐浏览器

推荐使用最新版 **Google Chrome** 或 **Microsoft Edge**。Web Speech API 的实现和可用性由浏览器提供；Firefox、Safari 或部分网络环境可能无法使用语音识别。

## 支持的语音指令

### 基础绘图

- `画一条红色线`
- `画一条蓝色横线`
- `画一条黑色竖线`
- `从 100 100 到 300 300 画一条红色线`
- `画一个红色圆`
- `画一个半径 50 的蓝色圆`
- `在 300 200 画一个半径 60 的绿色圆`
- `画一个宽 200 高 100 的绿色矩形`
- `在 200 150 画一个红色长方形`
- `画一个黄色三角形`

### 编辑与设置

- `清空画布`、`清屏`、`擦掉`
- `撤销`、`后退一步`、`上一步`
- `重做`、`恢复`、`下一步`
- `设置颜色为红色`
- `设置线宽为 5`
- `保存图片`、`导出图片`、`下载图片`

### 复杂创作

- `画一个房子`
- `画一个笑脸`
- `画一个太阳`

颜色支持红、蓝、绿、黄、黑、白、紫、橙及其“红色 / 红的”等常见说法。形状支持圆、圆形、圆圈、矩形、长方形、方形、线、直线、横线、竖线、三角形、三角。

## 默认参数

不完整指令会自动补全：当前颜色、当前线宽、画布中心附近的位置、圆半径 50、矩形 160 × 100、线长 180、三角形大小 120。

## 常见问题

**点击开始后没有反应？**  
确认使用 Chrome 或 Edge，并通过 `http://localhost:8000` 打开项目。点击开始后，允许地址栏弹出的麦克风权限；如果之前选择过拒绝，请点击地址栏左侧的站点权限图标，将麦克风改为允许，然后刷新页面。语音识别服务还可能受网络环境影响。

**为什么坐标没有生效？**  
坐标建议清晰停顿，例如：“在 三百、二百，画一个圆”。识别结果中两个坐标需要能被区分。

**为什么响应耗时与体感不同？**  
页面展示的是收到最终识别文本后，解析和执行指令的耗时。浏览器返回语音识别结果之前的时间不受项目控制。

**清空画布后能撤销吗？**  
可以。清空也进入历史快照，可通过“撤销”恢复。

## 演示建议

1. 先展示“画一条蓝色横线”和带坐标的绿色圆，证明基础解析能力。
2. 说“画一个房子”，随后说“撤销”和“重做”，展示复杂指令的原子历史。
3. 说“设置颜色为紫色”，再说“画一个圆”，展示状态继承和默认参数。
4. 用“红的圆圈”“清屏”等同义表达展示容错。
5. 最后说“保存图片”，展示完整创作闭环。

完整讲解脚本见 [`docs/demo-script.md`](./docs/demo-script.md)。

## 自动测试

```bash
npm test
```

测试覆盖精确坐标解析、颜色/形状同义词、复杂指令识别，以及复杂操作组的一次撤销和重做。

## 两天开发范围说明

本项目优先保证本地可运行、演示稳定、架构清晰和核心交互完整。它不实现 Diffusion、ControlNet 或 LLM Agent，而是用可解释的中文规则解析器驱动 Canvas 矢量绘图。复杂指令采用预定义拆解，以低风险方式展示“AI 绘图助手”的规划体验。

## 项目结构

```text
VoiceCanvas-AI/
├── index.html
├── README.md
├── DESIGN.md
├── docs/demo-script.md
├── package.json
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── MainLayout.tsx
│   │   ├── VoiceCanvas.tsx
│   │   ├── VoiceFeedbackBar.tsx
│   │   └── ControlSidebar.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── speechController.js
│   ├── commandParser.js
│   ├── drawingEngine.js
│   ├── commandExecutor.js
│   └── historyManager.js
└── tests/commandParser.test.js
```

## 建议的 Commit 规划

1. `Init project structure`
2. `Add canvas drawing engine`
3. `Add speech recognition controller`
4. `Implement Chinese command parser`
5. `Add command executor and history manager`
6. `Support composite drawing commands`
7. `Improve UI feedback and latency tracking`
8. `Add documentation and demo script`
9. `Polish final demo and fix edge cases`

在两天课程作品周期中，可将紧密关联的步骤合并为 4 到 6 个可审查提交，避免为了数量制造无意义提交。
