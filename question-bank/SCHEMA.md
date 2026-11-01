# 数据协议 v1

所有文件为 UTF-8 JSON。`manifest.json` 包含 version: 1、sources（来源文件相对路径）、topics（{topic,file} 数组）。依次读取 topics 的题目数组后连接即可；路径以题库目录为根，禁止目录外引用。每个文件仅收录对应 topic，ID 全库唯一。

题目必填字段：

| 字段 | 含义 |
|---|---|
| id | 稳定的小写英文/数字/连字符 ID，收藏和学习状态的关联键 |
| topic | HTML、CSS、JavaScript、React、Vue、TypeScript、工程化、网络与浏览器之一 |
| title / prompt | 简明题名 / 明确场景与前提的问题 |
| difficulty | 基础或进阶 |
| answer / points | 非空字符串数组：核心答案 / 延伸边界与追问 |
| sources | 答案参考链接数组，每项 {label,url}，使用 HTTPS |
| origin | 选题出处 {label,url} |

可选 code 为教学代码字符串。新增面经题要求 canonicalKey（稳定知识点键）、interviews（{sourceId,locator} 原帖定位）、review（{status:"verified",checkedAt:"YYYY-MM-DD",scope}）。aliases 为不同问法字符串数组。旧题无新元数据也可以加载。verified 仅表示编辑完成资料核对，不表示形式证明或公司认证。

`interviews.sourceId` 对应 `sources/interviews.json`。该目录每项含 id、company、title、url、author、publishedText、publishedAt（页面未显示完整日期时 null）、role、evidenceLevel:"author-report"、checkedAt、note。不存登录凭证或当前浏览器用户信息。

`curation/updates/` 批次有 version:1、id、checkedAt、baseSha256、changes。add 携完整 question；merge 携旧 id 和 interviews/appendPoints/aliases，不重命名或覆盖原答案。基线由维护脚本按 manifest、分类文件与来源文件的相对路径和原始字节组合生成，不直接对单个 JSON 求摘要。

`--export` 产生独立 JSON：{version:1,topics:[分类名],questions:[完整题目],interviewSources:[完整来源]}。接收方可沿用稳定 ID 和来源关联，不必依赖 App TypeScript 类型或 Vite 插件。

历史第一批批次采用原单文件 SHA-256，保留为审计资料，迁移后不能重新应用；第二批起采用目录组合基线。已应用批次也不可直接重复执行，应以当前基线创建新的增量批次。
