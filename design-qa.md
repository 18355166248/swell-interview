# 视觉与交互验收

final result: passed

## 对照资料

- Source visual truth: `docs/design/learning-reference.png`（1487 × 1058），`docs/design/review-reference.png`。
- Implementation: `docs/design/learning-desktop-final.jpg`（浏览器）、`docs/design/learning-mobile-final.jpg`（浏览器）。
- Full-view comparison: `docs/design/learning-comparison-final.png`。
- Focused-region comparison: `docs/design/learning-detail-comparison-final.png`，包含展开题目、代码、资料、自评及上一题/下一题。
- Native Electron capture: `docs/design/electron-desktop.png`（2766 × 1744，2×，实际内容视口 1383 × 872）；它用于桌面启动检查，不与 1440 × 1024 源图作精确尺寸对照。

## 视口、密度与状态

桌面 CSS 视口 1440 × 1024，手机 CSS 视口 390 × 844，两个视口 scrollWidth 均等于 innerWidth。当前浏览器受宿主 130% 缩放影响（devicePixelRatio ≈ 1.3），原始截图将完整视口缩到画布左上角，右下有额外留白。对照图裁去该额外白边后，归一化回 CSS 视口尺寸；保留原始 JPG 与 normalized PNG，归一化会损失部分锐度，真实字体清晰度另以原生 Electron 截图及 DOM 字号辅助确认。源图归一化到 1440 × 1024。

主对照状态为 React 专题、useEffect 展开、延伸要点收起、浅色蓝紫主题。最终截图保留了交互测试后的“已收藏 / 已掌握”状态，源图为未收藏 / 未自评；这是有效业务状态差异，不是视觉错误。源图的窗口交通灯不属于 Web 应用内容，Electron 使用系统窗口框架。

## 比较历史与修正

1. [P1，已修正] 根节点 color-scheme 与浅色主题不一致，侧栏变暗、文字对比不足。改为跟随 Mantine 的主题变量；浅色和深色均重新验证。
2. [P2，已修正] 较长答案和额外筛选行挤出底部导航。全局搜索承担题库搜索，收藏页保留精确筛选；额外说明收进 Mantine Accordion 的“延伸要点”，调整页面节奏；最终对照可见第三题和上一题/下一题。
3. [P2，已修正] 手机操作通知遮挡底部导航。通知上移到导航上方，并重新验证手机页面切换。
4. [P2，已修正] 手机隐藏侧栏仍存在于可访问树，抽屉打开后出现重复目录。通过 Mantine visibleFrom 隐藏桌面侧栏，手机抽屉与底栏保留独立可用导航。
5. [P2，已修正] 代码区缺少高亮与复制。改用 Mantine CodeHighlight 官方扩展和 highlight.js adapter，补齐复制、代码背景和深色主题适配。
6. [P2，已修正] 全局搜索结果缺少键盘按钮语义。通过 Mantine NavLink 的 component="button" 实现，已用键盘跳转至 Promise 题目。

## 五项视觉检查

- 字体：系统中文字体栈，标题 38px、正文默认 16px；手机标题 29px，正文支持 14/16/18px。标题、正文、资料和辅助提示层级清楚，无关键截断。
- 间距与布局：桌面约 296px 侧栏，专题列表和阅读区结构与确认稿一致；同一视口展开答案后能看到自评与题目导航。手机单列、底栏固定、正文留底部空间，长答案可滚动。
- 颜色：以 Mantine indigo 主题、浅蓝紫选中态、白色正文和浅灰代码底为主。浅色/深色切换工作正常。状态徽标的语义色使用组件库默认主题。
- 图像与图标：确认稿没有必须生成的插画；图标全部使用 Tabler 库，代码区使用组件库自带复制图标。没有以手绘 SVG 或 CSS 图形替代图标。
- 内容：页面标题、四入口、专题结构、学习自评和复习行为与确认方案一致。答案按官方文档语义整理，React 的依赖比较、StrictMode 和竞态说明保留在延伸要点中。

## 实际交互验证

- 学习专题切换、题目展开、上一题/下一题。
- 收藏后进入收藏页；刷新后收藏仍存在。
- 标记“还不熟”后进入复习；默认隐藏答案；查看答案后自评，进入本轮结果；已掌握题从下一轮待复习移除但仍保留收藏。
- 手机专题抽屉、底部四入口、长答案滚动和复习流程。
- 收藏关键词无结果 → 空态 → 清除筛选恢复。
- 全局搜索 Promise → 定位并展开对应题目；结果可用键盘触发。
- 设置深色/浅色切换，修改每轮题数并刷新，设置保留。
- 依赖热安装期间旧标签曾产生一次 Vite 缓存引发的 invalid-hook-call；完整刷新及干净新标签加载后未复现。最终新标签控制台 error / warn 均为空。

## 构建与验证边界

- TypeScript 检查通过；5 项学习状态测试通过；4 项静态运行时检查通过。
- Web 与 Electron 主进程构建通过；真实 Electron 加载本地构建，标题、React 专题和布局检查通过，renderer errors=[]。
- iOS Pods 安装 / 同步完成，Android / iOS 均同步最新 Web 资源。
- 原生手机安装包和真机交互未验收；Android 当前缺 Java Runtime。上述浏览器手机检查不能替代原生设备验收。

## 剩余细节

[P3] 保留库默认的图标、按钮尺寸和扁平色块，未仿制生成图中的渐变、书本标志填充及个别装饰细节，符合“优先组件库”的约束。最终正文用准确答案摘要、折叠延伸说明和来源链接替换了生成图的示意文字。后续可继续微调排版，但没有剩余阻断主流程的 P0/P1/P2。
