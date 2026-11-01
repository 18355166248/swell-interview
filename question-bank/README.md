# 前端面试题库

这是 App 实际读取的独立内容目录。迁移时复制整个 `question-bank/`，不依赖 React、Electron、Node.js 包或当前项目的绝对路径。学习记录存储在 App 的 localStorage 中，不属于题库迁移内容；题目 ID 保持稳定即可继续关联。

```text
question-bank/
  manifest.json                   版本、分类名称与文件路径
  topics/
    html/questions.json           HTML、资源提示、DOM 事件
    css/questions.json            布局、响应式、层叠
    javascript/questions.json     语言机制、异步、手写题
    react/questions.json          React 与 Next.js 边界
    vue/questions.json            Vue
    typescript/questions.json     类型系统
    engineering/questions.json    构建、性能、Hybrid
    network-browser/questions.json 网络、浏览器、安全
  sources/interviews.json          原帖证据与作者自述
  curation/                       整理报告、可审查批次
  tools/curate.py                  Python 3.9+ 标准库校验/更新/导出
  SCHEMA.md                       无框架依赖的数据字段约定
```

每题按知识点只存一次；公司通过 interviews → sourceId 关联。字节、阿里、腾讯的同题不会被复制成三份。答案参考资料在 sources 字段，面经是选题证据，不是公司认证答案。未显示年份的来源保存原始日期，不推定当年。

在这个目录运行，路径可随意移动：

```bash
python3 tools/curate.py
python3 tools/curate.py --export ../interview-bank.json
```

导出的 JSON 含 version、topics、questions、interviewSources，便于其他程序导入。它是按需生成的快照，不维护第二份题库。运行 App 不需要 Python；维护工具使用 Python 标准库即可。

新增或合并前，按 skill 阅读原帖、用官方资料核验、人工做语义去重；校验输出的 baseSha256 用作新批次基线。然后：

```bash
python3 tools/curate.py --batch curation/updates/DATE-nowcoder-NN.json
python3 tools/curate.py --batch curation/updates/DATE-nowcoder-NN.json --apply
```

脚本检查结构和重复，不证明答案正确。分类、manifest 和来源文件都参与基线摘要，变化后需重做预演。同知识点保留 ID；合并仅追加证据、别名与追问。答案纠错直接编辑对应分类题目并记录理由。

多文件更新采用逐文件替换，并在写入前保存 `.pending-update.json` 恢复记录。异常会尝试回退；进程意外中断时，后续检查拒绝继续，执行 `python3 tools/curate.py --recover` 恢复到批次前。文件若已被他人修改，自动恢复会停止，保留日志人工核对，不覆盖外部修改。它不是数据库事务；更新期间应避免其他编辑器同时改题库。

数据字段见 [SCHEMA.md](SCHEMA.md)。当前维护记录见 [第二批报告](curation/2026-11-01-nowcoder-02.md)。本库是自行整理的学习材料，保留资料和原帖链接，不声称原始帖子版权归本项目或提供公司官方题库认证。
