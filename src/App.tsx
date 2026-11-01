import { useEffect, useRef, useState } from 'react';
import { HashRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ActionIcon, Alert, AppShell, Box, Button, Divider, Drawer, Group, MantineProvider, NavLink, ScrollArea, Stack, Text, TextInput, ThemeIcon, Title, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { IconBook, IconBookmark, IconRefresh, IconSettings, IconFolder, IconFileText, IconSearch, IconChevronRight, IconX } from '@tabler/icons-react';
import { useHotkeys } from '@mantine/hooks';
import { topics } from './domain/model';
import { useStore, type StudyStore } from './domain/useStore';
import { Library } from './pages/Library';
import { Review } from './pages/Review';
import { Settings } from './pages/Settings';
import { questions } from './data';
const destinations = [
  { label: '学习题库', path: '/learn/React', root: '/learn', icon: IconBook },
  { label: '我的收藏', path: '/favorites', root: '/favorites', icon: IconBookmark },
  { label: '复习', path: '/review', root: '/review', icon: IconRefresh },
  { label: '设置', path: '/settings', root: '/settings', icon: IconSettings },
];
function Shell({ study }: { study: StudyStore }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useHotkeys([['mod+k', () => setSearchOpen(true)]]);
  // 路由用 hash，确保 Electron file:// 与移动原生壳无需服务器重写规则。
  useEffect(() => { setDrawer(false); window.scrollTo(0, 0); }, [location.pathname]);
  const topic = decodeURIComponent(location.pathname.split('/')[2] ?? 'React');
  const isLibrary = location.pathname.startsWith('/learn');
  const matches = search.trim() ? questions.filter(q => `${q.title} ${q.topic} ${q.prompt}`.toLowerCase().includes(search.toLowerCase())).slice(0, 10) : [];
  const navigation = <>
    <Group gap="sm" className="brand"><ThemeIcon variant="transparent" size={34}><IconBook size={31} stroke={1.8} /></ThemeIcon><Title order={3}>面试拾光</Title></Group>
    <Button className="search-trigger" variant="default" justify="space-between" leftSection={<IconSearch size={17} />} rightSection={<Text size="xs" c="dimmed">⌘ K</Text>} onClick={() => setSearchOpen(true)}>搜索知识点</Button>
    <Stack gap={5} mt="xl">{destinations.map(d => <NavLink key={d.root} component={Link} to={d.path} label={d.label} leftSection={<d.icon size={21} stroke={1.65} />} active={location.pathname.startsWith(d.root)} className="primary-nav" />)}</Stack>
    <Divider my="xl" />
    <Stack gap="lg">{topics.map(section => <Box key={section.group}><Group gap="sm" mb="xs" px="md"><IconFolder size={20} stroke={1.6} /><Text size="sm" fw={500}>{section.group}</Text></Group><Stack gap={3}>{section.items.map(item => <NavLink key={item} component={Link} to={`/learn/${item}`} label={item} leftSection={<IconFileText size={19} stroke={1.6} />} active={isLibrary && topic === item} className="topic-nav" />)}</Stack></Box>)}</Stack>
  </>;
  return <AppShell navbar={{ width: 296, breakpoint: 'sm', collapsed: { mobile: true } }} padding={0}>
    <AppShell.Navbar visibleFrom="sm" className="sidebar"><ScrollArea h="100%" scrollbarSize={4}><Box p="md">{navigation}</Box></ScrollArea></AppShell.Navbar>
    <AppShell.Main><Box hiddenFrom="sm" className="mobile-header"><Group justify="space-between"><Group gap="xs"><ThemeIcon variant="transparent"><IconBook size={25} /></ThemeIcon><Text fw={700}>面试拾光</Text></Group><Button size="compact-sm" variant="subtle" onClick={() => setDrawer(true)}>专题目录</Button></Group></Box>
      <Box className="page-content" style={{ '--reading-size': `${study.store.settings.fontSize}px` } as React.CSSProperties}>
        {study.error ? <Alert title="记录暂未保存" color="orange" mb="lg">{study.error}</Alert> : null}
        <Routes><Route path="/learn/:topic" element={<Library key={location.pathname} study={study} />} /><Route path="/favorites" element={<Library key="favorites" study={study} favorites />} /><Route path="/review" element={<Review key={location.search} study={study} />} /><Route path="/settings" element={<Settings study={study} />} /><Route path="*" element={<Navigate to="/learn/React" replace />} /></Routes>
      </Box>
      <Box hiddenFrom="sm" className="mobile-tabs"><Group gap={2} grow>{destinations.map(d => <Button key={d.root} component={Link} to={d.path} variant={location.pathname.startsWith(d.root) ? 'light' : 'subtle'} color={location.pathname.startsWith(d.root) ? undefined : 'gray'} className="mobile-tab"><Stack gap={3} align="center"><d.icon size={20} /><Text size="xs">{d.label === '学习题库' ? '学习' : d.label === '我的收藏' ? '收藏' : d.label}</Text></Stack></Button>)}</Group></Box>
    </AppShell.Main>
    <Drawer opened={drawer} onClose={() => setDrawer(false)} title="专题目录" size={296}><Box>{navigation}</Box></Drawer>
    <Drawer opened={searchOpen} onClose={() => setSearchOpen(false)} title="搜索知识点" position="right" size="md" onTransitionEnd={() => input.current?.focus()}>
      <TextInput ref={input} placeholder="输入题目、分类或知识点" aria-label="全局搜索" value={search} onChange={e => setSearch(e.currentTarget.value)} leftSection={<IconSearch size={17} />} rightSection={search ? <ActionIcon variant="subtle" aria-label="清空搜索" onClick={() => setSearch('')}><IconX size={15} /></ActionIcon> : null} />
      <Stack gap="xs" mt="lg">{matches.map(q => <NavLink component="button" type="button" key={q.id} label={q.title} description={q.topic} rightSection={<IconChevronRight size={16} />} onClick={() => { navigate(`/learn/${q.topic}?question=${q.id}`); setSearchOpen(false); }} />)}{search && !matches.length ? <Text c="dimmed" ta="center" py="xl">没有找到题目，换个关键词试试。</Text> : !search ? <Text c="dimmed" size="sm">试试搜索“闭包”“React”或“缓存”。</Text> : null}</Stack>
    </Drawer>
  </AppShell>;
}
export function App() {
  const study = useStore();
  const theme = createTheme({ primaryColor: study.store.settings.color, primaryShade: 6, defaultRadius: 'sm', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif', headings: { fontWeight: '700' }, black: '#1b2438', cursorType: 'pointer' });
  return <MantineProvider theme={theme} forceColorScheme={study.store.settings.scheme === 'auto' ? undefined : study.store.settings.scheme} defaultColorScheme="auto"><Notifications position="bottom-right" /><HashRouter><Shell study={study} /></HashRouter></MantineProvider>;
}
