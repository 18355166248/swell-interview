# swell-interview · 面试拾光

前端面试学习应用的首期工程，采用已确认的蓝紫色专题手册布局。

## 已实现

- 学习题库：8 个分类、19 道样题、全局搜索与结果定位、学习状态筛选、上一题/下一题。
- 题目阅读：折叠答案、延伸要点、代码高亮及复制、参考资料外链。
- 收藏：独立于掌握状态，支持分类/难度/关键词筛选和收藏练习。
- 复习：待复习列表 → 开始本轮 → 先回忆 → 查看答案 → 自评 → 本轮结果。
- 设置：三种主题色、浅色/深色/跟随系统、14/16/18 字号、每轮 5/10/20 题。
- 本机持久化：收藏、掌握程度、设置自动保存。读取或写入失败有可见提示，损坏数据不会被静默覆盖。
- 桌面使用 Electron，iOS/Android 使用 Capacitor，复用同一份 React 页面与业务代码。

## 运行

需要 Node.js 20.19+（当前验证环境为 20.20）。首次安装执行 `npm ci`。

```bash
npm run dev              # Web 开发预览
npm run dev:desktop      # Electron + Vite，页面改动热更新
npm run desktop          # 构建后以 Electron 加载本机静态页面
```

项目目录：`/Users/xmly/Swell/code/swell-interview`。

```bash
npm run typecheck
npm test
npm run build:desktop
npm run test:sites
```

## 手机原生工程

`ios/`、`android/` 已生成。Node 20 环境采用 Capacitor 7；原生工具链升级时再统一评估 Capacitor 升级。

```bash
npm run mobile:sync      # 构建共享页面，再同步两端依赖与资源
npm run mobile:ios       # 打开 Xcode 工程
npm run mobile:android   # 打开 Android Studio 工程
```

iOS 原生依赖已完成 pod install；未完成 iOS 安装包构建及真机验收。Android 原生工程与页面资源同步成功，但当前机器没有可用 Java Runtime，尚未编译 Android 安装包。后续需配置 JDK 21 / Android SDK 并在 Android Studio 同步 Gradle。iOS 签名和实际设备验证在后续阶段完成。

初期各容器使用各自的 localStorage，Web、Electron、手机之间不会同步记录。卸载或清理应用数据会丢失本机记录；云同步和导入导出尚未实现。

## 结构

```text
src/
  App.tsx                 Mantine 主题、路由、桌面侧栏、手机导航
  pages/                  学习、收藏、复习、设置
  components/Answer.tsx   业务答案区，组合 Mantine 原组件
  domain/                 数据协议、掌握状态、复习队列、本机存储
  data/questions.json     结构化样题及题源、答案参考链接
electron/main.cts         隔离的桌面窗口，HTTPS 资料交给系统浏览器
capacitor.config.ts       iOS / Android 共用构建资源配置
ios/、android/            原生宿主工程
docs/design/              选定设计稿、真实截图、视觉对照证据
```

渲染层不依赖 Electron/Node API；首期不需要 IPC 或 preload 桥接。采用 HashRouter 和相对资源路径，使桌面 file:// 与手机壳直接加载同一产物。所有输入、导航、抽屉、提示、折叠面板与代码展示均优先使用 Mantine；图标使用 Tabler。CSS 只处理主题和布局。

## 题库来源与后续整理

首批样题根据公开题单选题，答案为项目内整理的简要说明，每题保留官方文档链接用于进一步校对：

- https://github.com/Advanced-Frontend/Daily-Interview-Question
- https://github.com/sudheerj/javascript-interview-questions
- https://www.frontendinterviewhandbook.com/
- React、Vue、TypeScript、MDN、Vite、webpack 官方文档，具体链接见题目数据。

也已参考个人 sevenBlok 的分类与 React 问题组织方式，未批量复制其历史答案。当前样题不代表统计意义上的“大厂高频”，没有未经证实的公司标签。扩充题库时需要按来源核对面经记录、去重、确认技术版本，保留出处并检查引用许可。

数据状态为：`unseen` 未自评 → `review` 还不熟 / `mastered` 已掌握；查看答案本身不会自动判定掌握。收藏是独立布尔字段。复习取固定题目快照，标记掌握后从下次待复习中移除，但不改变本轮题序；稍后复习不更改掌握状态。

## 本阶段范围

这是可运行的前期框架，包含最小学习闭环。尚未实现账号、云同步、间隔重复算法、AI 模拟面试、批量题目采集、桌面安装包/签名/自动更新及应用商店发布。UI 浏览器验证与 Electron 启动检查的记录见 `design-qa.md`。
