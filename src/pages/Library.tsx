import { useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Accordion, Badge, Button, Group, NativeSelect, SegmentedControl, Stack, Text, TextInput, ThemeIcon, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBookmark, IconSearch, IconArrowLeft, IconArrowRight, IconPlayerPlay } from '@tabler/icons-react';
import { questions, getQuestionSearchText } from '../data';
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
  const visible = scope.filter(q => (!query || getQuestionSearchText(q).includes(query.toLowerCase())) && (difficulty === '全部难度' || q.difficulty === difficulty) && (filter === 'all' || (study.store.progress[q.id]?.mastery ?? 'unseen') === filter));
  // 默认展开一道题，进页面就能直接读，不用先点开列表。
  const defaultOpen = !favorites && topic === 'React' ? 'react-effect' : '';
  const open = params.get('question') ?? defaultOpen;
  const index = visible.findIndex(q => q.id === open);
  function setQuery(value: string) { const next = new URLSearchParams(params); if (value) next.set('q', value); else next.delete('q'); setParams(next, { replace: true }); }
  function select(id: string | null) { const next = new URLSearchParams(params); next.set('question', id ?? ''); setParams(next); }
  function rate(id: string, value: Mastery) {
    study.rate(id, value);
    // 反馈只留一句话，避免提示抢走阅读注意力。
    notifications.show({ message: value === 'review' ? '已加入待复习' : '已标记为掌握', withCloseButton: false, autoClose: 1600 });
  }
  return <Stack gap="sm">
    {/* 头部压成一行：标题 + 题数 + 状态筛选，移动端自动换行 */}
    <Group justify="space-between" align="center" gap="sm" wrap="wrap" className="page-head">
      <Group gap={8} align="baseline" wrap="nowrap"><Title order={2} className="page-title">{favorites ? '我的收藏' : topic}</Title><Text className="page-count">{visible.length} 题</Text></Group>
      <Group gap="xs" align="center" wrap="nowrap">
        <SegmentedControl size="xs" color={study.store.settings.color} aria-label="学习状态" value={filter} onChange={setFilter} className="status-filter" data={[{ label: '全部', value: 'all' }, { label: '未学习', value: 'unseen' }, { label: '待复习', value: 'review' }, { label: '已掌握', value: 'mastered' }]} />
        {favorites ? <Button size="compact-xs" variant="light" leftSection={<IconPlayerPlay size={14} />} disabled={scope.length === 0} onClick={() => navigate('/review?source=favorites')}>练习</Button> : null}
      </Group>
    </Group>
    {favorites ? <Group gap="xs" wrap="nowrap" align="end" className="favorites-filters"><TextInput size="xs" aria-label="搜索题目" placeholder="搜索题目、知识点" value={query} onChange={e => setQuery(e.currentTarget.value)} leftSection={<IconSearch size={14} />} style={{ flex: 1, minWidth: 0 }} />
      <NativeSelect size="xs" aria-label="分类" value={favoriteTopic} onChange={e => setFavoriteTopic(e.currentTarget.value)} data={['全部分类', ...new Set(questions.map(q => q.topic))]} className="category-select" />
      <NativeSelect size="xs" aria-label="难度" value={difficulty} onChange={e => setDifficulty(e.currentTarget.value)} data={['全部难度', '基础', '进阶']} className="difficulty-select" />
    </Group> : null}
    {visible.length ? <Accordion value={visible.some(q => q.id === open) ? open : null} onChange={select} variant="separated" radius="sm" chevronPosition="left" className="question-accordion">
      {visible.map(q => {
        const entry = study.store.progress[q.id] ?? emptyEntry;
        return <Accordion.Item value={q.id} key={q.id}>
          {/* 题目行只留标题与状态：难度用弱化纯文本，待复习/已掌握才用徽标 */}
          <Accordion.Control><Group justify="space-between" wrap="nowrap" gap="xs"><Text fw={500} className="question-title">{q.title}</Text>{entry.mastery === 'review' ? <Badge variant="light" color="orange" size="xs" className="question-badge">待复习</Badge> : entry.mastery === 'mastered' ? <Badge variant="light" color="teal" size="xs" className="question-badge">已掌握</Badge> : <Text size="xs" c="dimmed" className="question-badge">{q.difficulty}</Text>}</Group></Accordion.Control>
          <Accordion.Panel><Answer question={q} entry={entry} onRate={v => rate(q.id, v)} onToggleFavorite={() => study.toggleFavorite(q.id)} /></Accordion.Panel>
        </Accordion.Item>;
      })}
    </Accordion> : <Stack align="center" gap="md" className="empty-state"><ThemeIcon size={54} radius="xl"><IconBookmark size={22} /></ThemeIcon><Text size="sm" c="dimmed" ta="center">{favorites && !scope.length ? '还没有收藏的题目，在题目里点收藏即可留在这里。' : '没有符合条件的题目。'}</Text>{favorites && !scope.length ? <Button size="compact-sm" component={Link} to="/learn/React">去题库看看</Button> : <Button size="compact-sm" variant="light" onClick={() => { setFilter('all'); setDifficulty('全部难度'); setQuery(''); }}>清除筛选</Button>}</Stack>}
    {visible.length > 0 ? <Group justify="space-between" className="question-pager"><Button size="compact-sm" variant="default" leftSection={<IconArrowLeft size={14} />} disabled={index <= 0} onClick={() => select(visible[index - 1].id)}>上一题</Button><Text size="xs" c="dimmed">{index >= 0 ? `${index + 1} / ${visible.length}` : `共 ${visible.length} 道题`}</Text><Button size="compact-sm" variant="default" rightSection={<IconArrowRight size={14} />} disabled={index >= visible.length - 1} onClick={() => select(visible[index + 1].id)}>下一题</Button></Group> : null}
  </Stack>;
}
