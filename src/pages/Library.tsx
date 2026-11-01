import { useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Accordion, Anchor, Badge, Breadcrumbs, Button, Group, NativeSelect, SegmentedControl, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBookmark, IconBookmarkFilled, IconSearch, IconArrowLeft, IconArrowRight, IconPlayerPlay } from '@tabler/icons-react';
import { questions } from '../data';
import { emptyEntry, type Mastery } from '../domain/model';
import type { StudyStore } from '../domain/useStore';
import { Answer } from '../components/Answer';

export function Library({ study, favorites = false }: { study: StudyStore; favorites?: boolean }) {
  const { topic = 'React' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const query = params.get('q') ?? '';
  const [filter, setFilter] = useState('all');
  const [difficulty, setDifficulty] = useState('全部难度');
  const [favoriteTopic, setFavoriteTopic] = useState('全部分类');
  const scope = favorites ? questions.filter(q => study.store.progress[q.id]?.favorite && (favoriteTopic === '全部分类' || q.topic === favoriteTopic)) : questions.filter(q => q.topic === topic);
  const visible = scope.filter(q => (!query || `${q.title} ${q.prompt} ${q.topic}`.toLowerCase().includes(query.toLowerCase())) && (difficulty === '全部难度' || q.difficulty === difficulty) && (filter === 'all' || (study.store.progress[q.id]?.mastery ?? 'unseen') === filter));
  const defaultOpen = !favorites && topic === 'React' ? 'react-effect' : '';
  const open = params.get('question') ?? defaultOpen;
  const current = visible.find(q => q.id === open);
  const index = visible.findIndex(q => q.id === open);
  function setQuery(value: string) { const next = new URLSearchParams(params); if (value) next.set('q', value); else next.delete('q'); setParams(next, { replace: true }); }
  function select(id: string | null) { const next = new URLSearchParams(params); next.set('question', id ?? ''); setParams(next); }
  function rate(id: string, value: Mastery) { study.rate(id, value); notifications.show({ title: value === 'review' ? '已加入待复习' : '已标记为掌握', message: value === 'review' ? '可以在复习页再次练习这道题。' : '后续仍可在题库中随时回看。' }); }
  return <Stack gap="lg">
    <Breadcrumbs><Anchor component={Link} to="/learn/React" c="dimmed" size="sm">学习题库</Anchor><Text size="sm">{favorites ? '我的收藏' : topic}</Text></Breadcrumbs>
    <Group justify="space-between" align="flex-start"><Stack gap={8}><Title order={1}>{favorites ? '我的收藏' : `${topic} 核心专题`}</Title><Text c="dimmed">{favorites ? '把值得回看的问题，留在这里。' : '从原理到场景，串联常见面试问题。'}</Text></Stack>
      {favorites ? <Button leftSection={<IconPlayerPlay size={16} />} variant="light" disabled={scope.length === 0} onClick={() => navigate('/review?source=favorites')}>练习收藏</Button> : current ? <Button variant="default" leftSection={study.store.progress[current.id]?.favorite ? <IconBookmarkFilled size={18} /> : <IconBookmark size={18} />} onClick={() => study.toggleFavorite(current.id)}>{study.store.progress[current.id]?.favorite ? '已收藏' : '收藏'}</Button> : null}
    </Group>
    <Stack gap="md">
      <SegmentedControl color={study.store.settings.color} aria-label="学习状态" value={filter} onChange={setFilter} data={[{ label: '全部', value: 'all' }, { label: '未学习', value: 'unseen' }, { label: '待复习', value: 'review' }, { label: '已掌握', value: 'mastered' }]} className="status-filter" />
      {favorites ? <Group gap="sm" wrap="nowrap" align="end"><TextInput aria-label="搜索题目" placeholder="搜索题目、知识点" value={query} onChange={e => setQuery(e.currentTarget.value)} leftSection={<IconSearch size={16} />} style={{ flex: 1, minWidth: 0 }} />
        {favorites ? <NativeSelect aria-label="分类" value={favoriteTopic} onChange={e => setFavoriteTopic(e.currentTarget.value)} data={['全部分类', ...new Set(questions.map(q => q.topic))]} className="category-select" /> : null}
        <NativeSelect aria-label="难度" value={difficulty} onChange={e => setDifficulty(e.currentTarget.value)} data={['全部难度', '基础', '进阶']} className="difficulty-select" />
      </Group> : null}
    </Stack>
    {visible.length ? <Accordion value={visible.some(q => q.id === open) ? open : null} onChange={select} variant="separated" radius="sm" className="question-accordion">
      {visible.map(q => { const entry = study.store.progress[q.id] ?? emptyEntry; return <Accordion.Item value={q.id} key={q.id}>
        <Accordion.Control><Group justify="space-between" wrap="nowrap" gap="xs"><Text fw={600}>{q.title}</Text><Badge variant="light" color={entry.mastery === 'review' ? 'orange' : entry.mastery === 'mastered' ? 'teal' : 'gray'} size="xs" className="question-badge">{entry.mastery === 'review' ? '待复习' : entry.mastery === 'mastered' ? '已掌握' : q.difficulty}</Badge></Group></Accordion.Control>
        <Accordion.Panel><Stack gap="lg">{favorites ? <Group justify="flex-end"><Button size="compact-xs" variant="subtle" leftSection={entry.favorite ? <IconBookmarkFilled size={15} /> : <IconBookmark size={15} />} onClick={() => study.toggleFavorite(q.id)}>{entry.favorite ? '取消收藏' : '收藏此题'}</Button></Group> : null}<Answer question={q} mastery={entry.mastery} onRate={v => rate(q.id, v)} /></Stack></Accordion.Panel>
      </Accordion.Item>; })}
    </Accordion> : <Stack align="center" gap="sm" py={70}><IconBookmark size={36} color="var(--mantine-color-dimmed)" /><Title order={3}>{favorites && !scope.length ? '还没有收藏的题目' : '没有符合条件的题目'}</Title><Text c="dimmed" ta="center">{favorites && !scope.length ? '在题目旁点击收藏，方便下次继续学习。' : '试试其他关键词，或调整筛选条件。'}</Text>{favorites && !scope.length ? <Button component={Link} to="/learn/React" mt="sm">去题库看看</Button> : <Button variant="light" onClick={() => { setFilter('all'); setDifficulty('全部难度'); setQuery(''); }}>清除筛选</Button>}</Stack>}
    {visible.length > 0 ? <Group justify="space-between"><Button variant="default" leftSection={<IconArrowLeft size={16} />} disabled={index <= 0} onClick={() => select(visible[index - 1].id)}>上一题</Button><Text size="xs" c="dimmed">{index >= 0 ? `${index + 1} / ${visible.length}` : `共 ${visible.length} 道题`}</Text><Button variant="default" rightSection={<IconArrowRight size={16} />} disabled={index >= visible.length - 1} onClick={() => select(visible[index + 1].id)}>下一题</Button></Group> : null}
  </Stack>;
}
