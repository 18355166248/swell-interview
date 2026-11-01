# 数据与入库约定

`src/domain/model.ts` 是运行时类型依据。旧题无新元数据也可读取。`src/data/questions.json` 是 App 唯一题目入口，`src/data/interview-sources.json` 是面经来源目录。

题目原有字段必须保持：id、topic、title、difficulty、prompt、answer[]、points[]、sources[{label,url}]、origin{label,url}，code 可选。topic 只使用项目已有分类；需要新分类时先同步 model 和导航。

新增元数据：

- canonicalKey：稳定知识点键，一般与首次题目 ID 相同；换标题不换键。
- aliases[]：归一化前的其他问法，辅助后续搜索和人工去重。
- interviews[{sourceId,locator}]：指向来源目录，locator 用章节/题号或简短意译定位，不存整篇原文。
- review{status:"verified",checkedAt:"YYYY-MM-DD",scope}：本次编辑完成了答案核验；scope 写明协议/框架版本、教学范围或方案假设。它不是公司认证或自动检测结论。

来源目录是数组，每项包含：id、company、title、url、author、publishedText、publishedAt（页面无完整日期时 null）、role、evidenceLevel:"author-report"、checkedAt、note。保留作者公开署名，不存登录用户资料、账号凭证或无关个人数据。

批次：

```json
{
  "version": 1,
  "id": "DATE-nowcoder",
  "checkedAt": "YYYY-MM-DD",
  "baseSha256": "当前 questions.json 原始字节的 SHA-256",
  "changes": [
    { "action": "add", "question": { "id": "完整新增题对象，见已有实际批次" } },
    { "action": "merge", "id": "旧题 ID", "interviews": [], "appendPoints": [], "aliases": [] }
  ]
}
```

查看 `content/curation/updates/2026-11-01-nowcoder.json` 的真实示例，不照搬示意占位对象。合并脚本拒绝 ID/标题/知识点键冲突，拒绝未核验新题或缺失来源，保留全部旧 ID。人工答案纠错直接编辑对应题目并记录，不变更学习状态数据。

建议检查顺序：单帖证据定位 → 资料逐项支持关键断言 → 输入边界 → 语义重复 → 新旧状态兼容 → 脚本预演 → apply → 测试与浏览器验收。内容与脚本都在项目中，可随 Git 版本追踪。
