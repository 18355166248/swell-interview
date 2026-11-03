import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Group, Progress, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconCheck, IconRefresh } from '@tabler/icons-react';
import { questions, getQuestion } from '../data';
import { createReviewQueue, emptyEntry, type Mastery } from '../domain/model';
import type { StudyStore } from '../domain/useStore';
import { Answer } from '../components/Answer';
export function Review({ study }: { study: StudyStore }) {
  const [params] = useSearchParams();
  const favorites = params.get('source') === 'favorites';
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [ratings, setRatings] = useState<Record<string, Mastery>>({});
  const available = createReviewQueue(questions, study.store.progress, Number(study.store.settings.reviewSize), favorites);
  const q = getQuestion(queue[index]);
  const entry = q ? study.store.progress[q.id] ?? emptyEntry : emptyEntry;
  function start() { setQueue(available); setIndex(0); setRevealed(false); setCompleted(false); setRatings({}); }
  function advance() {
    setRevealed(false);
    if (index + 1 >= queue.length) setCompleted(true);
    else setIndex(i => i + 1);
  }
  function rate(value: Mastery) {
    if (!q || !revealed) return;
    // 必须先看过答案才能自评；稍后复习不修改原有掌握状态。
    study.rate(q.id, value);
    setRatings(previous => ({ ...previous, [q.id]: value }));
    advance();
  }
  return <Stack gap="md" className="review-page">
    {/* 头部只留标题与返回，进度与题目信息合并到一行 */}
    <Group justify="space-between" align="center" gap="sm" wrap="wrap"><Group gap={8} align="baseline"><Title order={2} className="page-title">{favorites ? '练习收藏' : '复习'}</Title><Text size="xs" c="dimmed">先回忆，再查看答案</Text></Group><Button size="compact-xs" variant="default" leftSection={<IconArrowLeft size={14} />} component={Link} to="/learn/React">题库</Button></Group>
    {completed ? <Stack align="center" py={56} gap="md"><IconCheck size={38} color="var(--mantine-primary-color-filled)" /><Title order={3}>本轮完成</Title><Text size="sm" c="dimmed" ta="center">已自评 {Object.keys(ratings).length} / {queue.length} 题，掌握 {Object.values(ratings).filter(v => v === 'mastered').length} 题。未自评的保持原状态。</Text><Group><Button size="compact-sm" onClick={start} disabled={!available.length} leftSection={<IconRefresh size={15} />}>再练一轮</Button><Button size="compact-sm" variant="default" component={Link} to="/learn/React">继续学习</Button></Group></Stack>
    : !q ? <Stack align="center" py={56} gap="md"><IconRefresh size={34} color="var(--mantine-primary-color-filled)" /><Title order={3}>{available.length ? '准备好，再巩固一次' : favorites ? '还没有收藏的题目' : '暂时没有待复习题目'}</Title><Text size="sm" c="dimmed" ta="center">{available.length ? `本轮最多练习 ${study.store.settings.reviewSize} 题，看过答案再判断掌握程度。` : favorites ? '在题库收藏感兴趣的问题，再来这里练习。' : '学习时标记“还不熟”的题目，会出现在这里。'}</Text>{available.length ? <Button size="compact-sm" onClick={start}>开始{favorites ? '练习' : '复习'}（{available.length} 题）</Button> : <Button size="compact-sm" component={Link} to="/learn/React">去学习题库</Button>}</Stack>
    : <>
      <Group wrap="nowrap" gap="sm"><Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{index + 1} / {queue.length}</Text><Progress value={(index + 1) / queue.length * 100} style={{ flex: 1 }} size="xs" aria-label="本轮进度" /></Group>
      <Title order={3} className="review-question">{q.title}</Title><Text className="answer-text" c="dimmed">{q.prompt}</Text>
      {revealed ? <Answer question={q} entry={entry} onRate={rate} onToggleFavorite={() => study.toggleFavorite(q.id)} /> : <Stack className="recall-space" justify="end" align="flex-start" gap="xs"><Button size="compact-sm" onClick={() => setRevealed(true)}>查看答案</Button><Text size="xs" c="dimmed">先尝试口述，再核对要点。</Text></Stack>}
      <Group justify="space-between" mt="auto"><Button size="compact-xs" variant="default" leftSection={<IconArrowLeft size={14} />} disabled={index === 0} onClick={() => { setIndex(i => i - 1); setRevealed(false); }}>上一题</Button><Button size="compact-xs" variant="subtle" rightSection={<IconArrowRight size={14} />} onClick={advance}>稍后复习</Button></Group>
    </>}
  </Stack>;
}
