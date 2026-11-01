import { Divider, Group, NativeSelect, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import type { StudyStore } from '../domain/useStore';
import type { Settings as Preferences } from '../domain/model';
export function Settings({ study }: { study: StudyStore }) {
  const { settings } = study.store;
  return <Stack gap="xl">
    <Text size="sm" c="dimmed">偏好 / 设置</Text><Stack gap={8}><Title order={1}>设置</Title><Text c="dimmed">让学习保持舒适，按自己的节奏来。</Text></Stack>
    <Stack gap="xl" maw={760} mt="md">
      <Group justify="space-between"><Stack gap={4}><Text fw={600}>主题颜色</Text><Text c="dimmed" size="sm">应用于选中状态与主要操作</Text></Stack><SegmentedControl aria-label="主题颜色" value={settings.color} data={[{ label: '蓝紫', value: 'indigo' }, { label: '晴蓝', value: 'blue' }, { label: '鸢紫', value: 'violet' }]} onChange={v => study.setSettings({ color: v as Preferences['color'] })} /></Group><Divider />
      <Group justify="space-between"><Stack gap={4}><Text fw={600}>显示模式</Text><Text c="dimmed" size="sm">选择适合当前环境的外观</Text></Stack><SegmentedControl aria-label="显示模式" value={settings.scheme} data={[{ label: '浅色', value: 'light' }, { label: '深色', value: 'dark' }, { label: '跟随系统', value: 'auto' }]} onChange={v => study.setSettings({ scheme: v as Preferences['scheme'] })} /></Group><Divider />
      <Group justify="space-between"><Stack gap={4}><Text fw={600}>阅读字号</Text><Text c="dimmed" size="sm">调整题目正文与参考答案</Text></Stack><SegmentedControl aria-label="阅读字号" value={String(settings.fontSize)} data={[{ label: '小', value: '14' }, { label: '标准', value: '16' }, { label: '大', value: '18' }]} onChange={v => study.setSettings({ fontSize: Number(v) })} /></Group><Divider />
      <Group justify="space-between"><Stack gap={4}><Text fw={600}>每轮复习题数</Text><Text c="dimmed" size="sm">从下一轮开始生效</Text></Stack><NativeSelect aria-label="每轮复习题数" value={settings.reviewSize} data={[{ label: '5 题', value: '5' }, { label: '10 题', value: '10' }, { label: '20 题', value: '20' }]} onChange={e => study.setSettings({ reviewSize: e.currentTarget.value })} w={130} /></Group><Divider />
      <Stack gap={8}><Text fw={600}>学习记录</Text><Text size="sm" c="dimmed">收藏、掌握状态和偏好自动保存在本机。不同设备的记录暂不互通。</Text><Text size="sm" c="dimmed">面试拾光 · 0.1.0</Text></Stack>
    </Stack>
  </Stack>;
}
