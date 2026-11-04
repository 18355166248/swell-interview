# 2026-11-04 Agent 工程二面题库整理

本批完成：新增 17 题（Agent 工程 16 + JavaScript 1），运行时题库 58 → 75 题。使用 swell-interview-curation，未设置定时任务。

## 来源

用户在对话中直接提供的一份 Agent 工程二面口述记录（含 18 个问题，第 1 题「自我介绍」不入库），**未提供公开原帖链接，未标注公司**。按用户当次确认，来源记为「用户提供 · 未标注公司」，`url` 使用 `example.com` 保留域名作占位并在 note 中说明：该地址不代表真实页面，后续拿到真实原帖只需修改 `sources/interviews.json` 中的这一条，题目 ID 不变。

| sourceId | 署名与日期 | 使用范围 |
|---|---|---|
| user-agent-round2 | 用户本人提供；2026-11-04 提供，未显示面试时间 | 第 2–18 题，16 题归入 Agent 工程，算法题归入 JavaScript |

因无公开原帖，本批**不主张**任何公司归属、考察频率或时效性；`evidenceLevel` 仍为 `author-report`（作者口述）。

## 结构改动

题库原先只有八个前端分类。Agent 工程题在语义上不属于 HTML/CSS/JavaScript/框架/工程化/网络任一分类，强塞会污染现有分类并让搜索结果失真，因此新增第九个分类：

- `question-bank/manifest.json` 增加 `Agent 工程 → topics/agent/questions.json`
- `question-bank/tools/curate.py` 的 `TOPICS` 集合与 manifest 完整性问题文案（「八个分类」→「全部分类」）
- `question-bank/SCHEMA.md` 的 topic 枚举
- `src/domain/model.ts` 增加分组 `AI Agent → ['Agent 工程']`，侧栏与移动端抽屉自动出现

分类文件为唯一数据源，`src/data` 不留副本；App 通过 manifest 动态加载，新增分类无需改页面逻辑。

## 新增清单

| 编号 | 分类 | ID | 主题 |
|---|---|---|---|
| 2 | Agent 工程 | agent-pipeline | 全链路各环节的输入输出与失败出口 |
| 3 | Agent 工程 | agent-loop | Loop 设计与多元终止条件 |
| 4 | Agent 工程 | agent-tool-call-validation | 参数/权限校验、沙箱、结果回灌 |
| 5 | Agent 工程 | agent-loop-detection | 死循环与重复调用的指纹检测 |
| 6 | Agent 工程 | agent-context-compaction | 上下文压缩与关键约束保留 |
| 7 | Agent 工程 | agent-multi-agent-orchestration | 拆分、黑板共享、冲突仲裁 |
| 8 | Agent 工程 | agent-concurrent-write-conflict | 并发写冲突与锁粒度、fencing token |
| 9 | Agent 工程 | agent-checkpoint-recovery | checkpoint 字段、存放与幂等恢复 |
| 10 | Agent 工程 | agent-human-in-the-loop | 审批挂起、驳回续跑、超时兜底 |
| 11 | Agent 工程 | agent-tool-result-truncation | 结果截断、重试、熔断、幂等 |
| 12 | Agent 工程 | agent-function-calling-vs-mcp | FC 与 MCP 定位、工具规模治理 |
| 13 | Agent 工程 | agent-rag-trigger | 检索时机、query 改写、rerank |
| 14 | Agent 工程 | agent-prompt-injection-defense | 注入防护、危险调用拦截、脱敏 |
| 15 | Agent 工程 | agent-online-evaluation | 指标口径与埋点维度 |
| 16 | Agent 工程 | agent-badcase-attribution | 分层消融归因与回归集 |
| 17 | Agent 工程 | agent-streaming-tool-events | 流式事件协议与断线重连 |
| 18 | JavaScript | js-json-list-to-tree | 手撕：扁平列表按 parent_id 还原树 |

## 核验与纠偏

答案按当前官方资料归纳，不搬运任何网友答案。参考链接均已实测可访问（HTTP 200），逐题 sources 指向 MCP 规范、Anthropic Tool use/Context editing、JSON Schema、LangGraph persistence 与 durable execution、Temporal、OWASP LLM Top 10、WHATWG SSE、AWS 重试与退避、Google SRE 过载处理、Martin Fowler CircuitBreaker、IETF Idempotency-Key 草案、PostgreSQL 显式锁、git-merge、Firecracker、Cohere Rerank、Elasticsearch RRF、Anthropic Contextual Retrieval 与 Dual LLM 模式。OpenAI 官方文档站对本机返回 403（反爬），故改用其公开仓库与 Agents SDK 文档，不写无法核实的路径。

几处刻意的口径选择：

- **终止条件**不写成「max_turns 就够用」，强调多元信号与「正常完成 / 预算耗尽 / 阻塞」三种结局，避免把跑满轮数当成功。
- **重复调用检测**要求区分「同工具不同参数」的正常多步执行，只有「同参数 + 同状态」才判重；指纹必须含工具版本与环境，否则重启后误判。
- **上下文压缩**明确摘要是有损的，必须保留原文指针；关键约束走 pinned facts 独立通道，不参与摘要。
- **并发改文件**指出分布式锁过期不等于旧持有者停止写入，必须用 fencing token；并说明文件系统锁跨机不可靠。
- **checkpoint** 强调只存对话历史不足以避免重复副作用，需要「意图-结果」事件日志做去重。
- **HITL 超时**默认拒绝或只读降级，不默认放行，并提示 TOCTOU（批准 A 执行 B）。
- **注入防护**明确系统提示只能降低概率，控制要落在能力最小化与确定性校验上。
- **评测**指出「HTTP 200 ≠ 任务成功」，并给出幸存者偏差等常见坑。
- 手撕题给出 O(n) 两遍实现，显式处理孤儿与**环**（两遍法下环会让子树静默消失），并说明深链递归爆栈、节点克隆的内存代价。

## 跳过项

- 第 1 题「自我介绍」不是知识点，不入库。
- 未把「多 Agent」与「并发改文件」合并：前者是编排与仲裁，后者是存储层并发控制，失败模式与验证方式不同。
- 未把「Function Calling 与 MCP」与「工具检索」拆成两题：两者在同一追问链上（协议定位 → 规模治理），拆开会丢失因果。
- 用户感受里「二面往工程缝捅」属于面试体验，不作为题目依据。

## 验证

- `curate.py` 预检：58 → 75，新增 17，相似度提示为空；`--apply` 后再次校验 75 题基线一致。
- `npm run typecheck`、`npm test`（5 项学习状态 + 示例边界 + 15 项维护流程）、`npm run build`、`npm run test:sites` 全部通过。
- 桌面端实测：侧栏出现「AI Agent」分组与「Agent 工程」入口；分类页显示 16 题并按面试顺序呈现；展开后答案 3 段正文 + 延伸要点 + 来源与核对 + 收藏/还不熟/掌握，来源链接可点；`JavaScript` 分类 15 题，手撕题代码块 28 行正常渲染并可复制。
- 搜索「checkpoint」命中「Agent 执行到一半服务重启，checkpoint 存什么、放哪、怎么恢复现场？」。

## 未决

- 来源缺公开原帖：拿到真实链接后更新 `user-agent-round2` 一条即可，题目 ID 与学习记录不受影响。
- OpenAI 官方文档站的反爬限制导致无法直连核对，若后续需要引用其具体字段，应在可访问环境复读原文。
