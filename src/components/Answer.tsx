import { Accordion, Anchor, Badge, Button, Group, List, Stack, Text } from '@mantine/core';
import { CodeHighlight, CodeHighlightAdapterProvider, createHighlightJsAdapter } from '@mantine/code-highlight';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import { IconBookmark, IconBookmarkFilled, IconCheck, IconExternalLink, IconRefresh } from '@tabler/icons-react';
import { getQuestionEvidence } from '../data';
import type { Question, Mastery, ProgressEntry } from '../domain/model';
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
const adapter = createHighlightJsAdapter(hljs);
export function Answer({ question: q, entry, onRate, onToggleFavorite }: { question: Question; entry: ProgressEntry; onRate: (value: Mastery) => void; onToggleFavorite?: () => void }) {
  const evidence = getQuestionEvidence(q);
  return <Stack gap={14} className="answer">
    {q.answer.map(p => <Text key={p} className="answer-text">{p}</Text>)}
    {q.code ? <CodeHighlightAdapterProvider adapter={adapter}><CodeHighlight code={q.code} language={q.topic === 'TypeScript' ? 'typescript' : 'javascript'} copyLabel="复制代码" copiedLabel="已复制" radius="sm" className="code-block" /></CodeHighlightAdapterProvider> : null}
    {/* 延伸要点与来源核对收进同一个折叠区、默认收起：正文读完才需要，不占阅读空间 */}
    <Accordion variant="default" className="answer-extras">
      <Accordion.Item value="points"><Accordion.Control>延伸要点</Accordion.Control><Accordion.Panel><List spacing="xs" className="answer-text">{q.points.map(p => <List.Item key={p}>{p}</List.Item>)}</List></Accordion.Panel></Accordion.Item>
      <Accordion.Item value="sources"><Accordion.Control>来源与核对</Accordion.Control><Accordion.Panel><Stack gap={8}>
        <Group gap="xs" wrap="wrap"><Text size="xs" c="dimmed">参考资料</Text>{q.sources.map(s => <Anchor key={s.url} href={s.url} target="_blank" rel="noreferrer" size="xs">{s.label} <IconExternalLink size={12} /></Anchor>)}</Group>
        <Group gap="xs" wrap="wrap"><Text size="xs" c="dimmed">原帖</Text><Anchor href={q.origin.url} target="_blank" rel="noreferrer" size="xs">{q.origin.label}</Anchor></Group>
        {evidence.map(e => <Stack key={`${e.sourceId}:${e.locator}`} gap={2}>
          <Group gap="xs" wrap="wrap"><Badge color="gray" variant="light" size="xs">{e.source.company}</Badge><Anchor href={e.source.url} target="_blank" rel="noreferrer" size="xs">{e.source.title}</Anchor></Group>
          <Text size="xs" c="dimmed">{e.source.publishedText} · {e.locator}</Text>
        </Stack>)}
        {q.review ? <Text size="xs" c="dimmed">答案核对：{q.review.checkedAt} · {q.review.scope}</Text> : null}
      </Stack></Accordion.Panel></Accordion.Item>
    </Accordion>
    {/* 收藏与自评合并为一行紧凑操作，去掉问句与解释文案 */}
    <Group justify="space-between" gap="xs" className="answer-actions">
      {onToggleFavorite ? <Button size="compact-sm" variant="subtle" color="gray" leftSection={entry.favorite ? <IconBookmarkFilled size={14} /> : <IconBookmark size={14} />} onClick={onToggleFavorite}>{entry.favorite ? '已收藏' : '收藏'}</Button> : <span />}
      <Group gap={6}>
        <Button size="compact-sm" variant={entry.mastery === 'review' ? 'light' : 'default'} leftSection={<IconRefresh size={14} />} onClick={() => onRate('review')}>还不熟</Button>
        <Button size="compact-sm" variant={entry.mastery === 'mastered' ? 'light' : 'default'} leftSection={<IconCheck size={14} />} onClick={() => onRate('mastered')}>{entry.mastery === 'mastered' ? '已掌握' : '掌握'}</Button>
      </Group>
    </Group>
  </Stack>;
}
