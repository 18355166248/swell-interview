import { Group, NativeSelect, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import type { StudyStore } from '../domain/useStore';
import type { Settings as Preferences } from '../domain/model';
export function Settings({ study }: { study: StudyStore }) {
  const { settings } = study.store;
  return <Stack gap="md">
    <Title order={2} className="page-title">设置</Title>
    <Stack gap={0} maw={640} mt="sm" className="settings-list">
      {/* 每项只保留名称与控件，说明文字去掉，减少噪音 */}
      <Group justify="space-between" align="center" wrap="wrap" gap="sm" className="settings-row"><Text fw={500}>主题颜色</Text><SegmentedControl size="xs" aria-label="主题颜色" value={settings.color} data={[{ label: '蓝紫', value: 'indigo' }, { label: '晴蓝', value: 'blue' }, { label: '鸢紫', value: 'violet' }]} onChange={v => study.setSettings({ color: v as Preferences['color'] })} /></Group>
      <Group justify="space-between" align="center" wrap="wrap" gap="sm" className="settings-row"><Text fw={500}>显示模式</Text><SegmentedControl size="xs" aria-label="显示模式" value={settings.scheme} data={[{ label: '浅色', value: 'light' }, { label: '深色', value: 'dark' }, { label: '跟随系统', value: 'auto' }]} onChange={v => study.setSettings({ scheme: v as Preferences['scheme'] })} /></Group>
      <Group justify="space-between" align="center" wrap="wrap" gap="sm" className="settings-row"><Text fw={500}>阅读字号</Text><SegmentedControl size="xs" aria-label="阅读字号" value={String(settings.fontSize)} data={[{ label: '小', value: '14' }, { label: '标准', value: '16' }, { label: '大', value: '18' }]} onChange={v => study.setSettings({ fontSize: Number(v) })} /></Group>
      <Group justify="space-between" align="center" wrap="wrap" gap="sm" className="settings-row"><Text fw={500}>每轮复习题数</Text><NativeSelect size="xs" aria-label="每轮复习题数" value={settings.reviewSize} data={[{ label: '5 题', value: '5' }, { label: '10 题', value: '10' }, { label: '20 题', value: '20' }]} onChange={e => study.setSettings({ reviewSize: e.currentTarget.value })} w={120} /></Group>
      <Stack gap={4} className="settings-note"><Text fw={500}>学习记录</Text><Text size="xs" c="dimmed">收藏、掌握状态和偏好保存在本机，不跨设备同步。面试拾光 0.1.0</Text></Stack>
    </Stack>
  </Stack>;
}
