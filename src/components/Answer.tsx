import { Accordion, Anchor, Button, Divider, Group, List, Stack, Text } from '@mantine/core';
import { CodeHighlight, CodeHighlightAdapterProvider, createHighlightJsAdapter } from '@mantine/code-highlight';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import { IconExternalLink, IconCheck, IconRefresh } from '@tabler/icons-react';
import type { Question, Mastery } from '../domain/model';
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
const adapter = createHighlightJsAdapter(hljs);
export function Answer({ question: q, mastery, onRate }: { question: Question; mastery: Mastery; onRate: (value: Mastery) => void }) {
  return <Stack gap="md" className="answer">
    {q.answer.map(p => <Text key={p} className="answer-text">{p}</Text>)}
    {q.code ? <CodeHighlightAdapterProvider adapter={adapter}><CodeHighlight code={q.code} language={q.topic === 'TypeScript' ? 'typescript' : 'javascript'} copyLabel="复制代码" copiedLabel="已复制" radius="sm" className="code-block" /></CodeHighlightAdapterProvider> : null}
    <Accordion variant="default" className="extended-points"><Accordion.Item value="points"><Accordion.Control>延伸要点</Accordion.Control><Accordion.Panel><List spacing="xs" className="answer-text">{q.points.map(p => <List.Item key={p}>{p}</List.Item>)}</List></Accordion.Panel></Accordion.Item></Accordion>
    <Stack gap={6}><Group gap="xs"><Text size="sm" c="dimmed">参考资料</Text>{q.sources.map(s => <Anchor key={s.url} href={s.url} target="_blank" rel="noreferrer" size="sm">{s.label} <IconExternalLink size={13} /></Anchor>)}</Group>
    <Anchor href={q.origin.url} target="_blank" rel="noreferrer" size="xs" c="dimmed">{q.origin.label}</Anchor></Stack>
    <Divider />
    <Group justify="space-between" gap="md"><Text fw={600}>这道题掌握得怎么样？</Text><Group gap="sm">
      <Button variant={mastery === 'review' ? 'light' : 'default'} leftSection={<IconRefresh size={16} />} onClick={() => onRate('review')}>还不熟</Button>
      <Button variant={mastery === 'mastered' ? 'light' : 'filled'} leftSection={<IconCheck size={16} />} onClick={() => onRate('mastered')}>{mastery === 'mastered' ? '已掌握 ✓' : '已掌握'}</Button>
    </Group></Group>
    <Text size="xs" c="dimmed">选择“还不熟”后，可在复习页再次练习。</Text>
  </Stack>;
}
