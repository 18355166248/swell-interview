# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## 已确认产品约定
- 采用 docs/design/learning-reference.png 和 review-reference.png 的蓝紫色专题手册布局。
- 全部控件优先使用 Mantine 原组件；图标使用 Tabler，缺能力再评估二次封装。
- 学习、收藏、复习、设置四入口；收藏与掌握状态独立，复习先回忆再看答案。
- 页面以「读面试题」为唯一主线：桌面与手机首屏都要让题目尽早出现（首题起始位置桌面约 8%、手机约 13% 视口）；面包屑、副标题、说明性文案一律不加。
- 题目展开区只保留答案正文与代码；「延伸要点」「来源与核对」收进同一个默认收起的折叠区；收藏与自评合并为一行紧凑操作，不再单独占标题区。
- 触控目标不小于 34px；次要操作可以小，但不能点不准。
- 视觉层统一走 `src/styles.css` 顶部的设计令牌（画布/卡片/描边/三级墨色/圆角/阴影），不要在组件里散写颜色；正文与次要文字的对比度按 WCAG AA（≥4.5:1）校验，浅色深色两套都要过。
- 主色系的浅底（侧栏选中、底部 tab、浅色按钮）由 `color-mix` 从当前主题色淡化生成，换主题色时自动跟随；不使用整块实心主色的大色块，选中态用「细主色条 + 极浅底纹」表达。
- 题目以卡片承载（12px 圆角 + 1px 描边 + 极轻投影），题目之间留 8px 间隙。
- 状态筛选（全部/未学习/待复习/已掌握）用无框的下划线 tab：不加轨道背景、不加描边、不用药丸，选中只靠「墨色加深 + 2px 主色下划线」表达；标签字重保持不变，避免切换时宽度抖动。
- 手机端全部贴边元素都要吃 `env(safe-area-inset-*)`：顶部跟随状态栏/灵动岛，底部让开 Home 指示条。固定头部、底部 tab、抽屉浮层（侧边栏与搜索面板）、列表底部留白四处必须一起检查，新增贴边浮层时同样处理；`index.html` 的 `viewport-fit=cover` 不能去掉。
- 共享 React 页面：Electron 桌面 + Capacitor 手机，首期本机持久化。
- 关键流程、状态转换和异常回退添加简洁中文注释。

- 工程名称为 swell-interview，项目目录为 /Users/xmly/Swell/code/swell-interview。

## 题库维护
- 更新面经题库时使用 `.agents/skills/swell-interview-curation/SKILL.md`。
- 公司归属必须关联具体原帖；题源与答案核验来源分开；同知识点保留原 ID。
- 当前不创建定时更新任务，用户只要求先做好可复用 skill。
- 入库先跑 `npm run curation:check`，缺少核验的候选保留在当次整理记录，不进入 App 题库。

- 题库分类为 HTML、CSS、JavaScript、React、Vue、TypeScript、工程化、网络与浏览器、Agent 工程；新增分类要同时改 manifest、`curate.py` 的 TOPICS、SCHEMA.md 与 `src/domain/model.ts` 的分组，四处缺一不可。
- 面试题、题源、整理记录与离线维护工具统一放在 `question-bank/`；按知识分类维护唯一题目，禁止在 src/data 留一份副本。公司用 interviews 关联，迁移时复制整个 question-bank 即可。

## iOS 真机安装
- 参考 swell-note 的内置资源 Release 流程，使用 `npm run ios` 构建、同步、签名、安装并启动到 Swell5；`npm run ios:check` 仅检查入口与设备。
- 签名团队放在本机忽略文件 `.ios-device.local.json` 或环境变量，不写入工程/仓库；目标手机匹配失败就停止，不自动回退其他设备。
