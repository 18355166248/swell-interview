# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## 已确认产品约定
- 采用 docs/design/learning-reference.png 和 review-reference.png 的蓝紫色专题手册布局。
- 全部控件优先使用 Mantine 原组件；图标使用 Tabler，缺能力再评估二次封装。
- 学习、收藏、复习、设置四入口；收藏与掌握状态独立，复习先回忆再看答案。
- 共享 React 页面：Electron 桌面 + Capacitor 手机，首期本机持久化。
- 关键流程、状态转换和异常回退添加简洁中文注释。

- 工程名称为 swell-interview，项目目录为 /Users/xmly/Swell/code/swell-interview。
