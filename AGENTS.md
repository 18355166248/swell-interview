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

## 题库维护
- 更新面经题库时使用 `.agents/skills/swell-interview-curation/SKILL.md`。
- 公司归属必须关联具体原帖；题源与答案核验来源分开；同知识点保留原 ID。
- 当前不创建定时更新任务，用户只要求先做好可复用 skill。
- 入库先跑 `npm run curation:check`，缺少核验的候选保留在当次整理记录，不进入 App 题库。

- 面试题、题源、整理记录与离线维护工具统一放在 `question-bank/`；按知识分类维护唯一题目，禁止在 src/data 留一份副本。公司用 interviews 关联，迁移时复制整个 question-bank 即可。

## iOS 真机安装
- 参考 swell-note 的内置资源 Release 流程，使用 `npm run ios` 构建、同步、签名、安装并启动到 Swell5；`npm run ios:check` 仅检查入口与设备。
- 签名团队放在本机忽略文件 `.ios-device.local.json` 或环境变量，不写入工程/仓库；目标手机匹配失败就停止，不自动回退其他设备。
