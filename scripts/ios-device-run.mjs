import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
function option(name) {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} 缺少参数`);
  return value;
}
function capture(command, args) {
  const result = spawnSync(command, args, { cwd: projectRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${command} 执行失败：${result.stderr?.trim() || result.error?.message || result.status}`);
  return result.stdout;
}
function run(command, args, failure) {
  const result = spawnSync(command, args, { cwd: projectRoot, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw new Error(failure);
}
export function selectDevice(devices, target) {
  // 指定设备未连接时必须停止，不能回退到唯一的其他手机，避免装错测试机。
  const matched = devices.filter(d => !d.simulator && d.available && String(d.platform).includes('iphoneos')
    && (d.name?.toLowerCase() === target.toLowerCase() || d.identifier === target));
  if (matched.length !== 1) throw new Error(`无法唯一匹配设备“${target}”，请确认已连接、解锁并信任此 Mac。`);
  return matched[0];
}
function main() {
  if (process.platform !== 'darwin') throw new Error('iOS 真机安装需要 macOS 和完整 Xcode。');
  const localPath = resolve(projectRoot, '.ios-device.local.json');
  const local = existsSync(localPath) ? JSON.parse(readFileSync(localPath, 'utf8')) : {};
  const target = option('--device') ?? process.env.SWELL_IOS_DEVICE ?? local.device ?? 'Swell5';
  const team = option('--team') ?? process.env.APPLE_DEVELOPMENT_TEAM ?? local.team;
  if (!/^[A-Z0-9]{10}$/.test(team ?? '')) throw new Error('请通过 --team、APPLE_DEVELOPMENT_TEAM 或 .ios-device.local.json 的 team 指定签名团队。');
  capture('xcodebuild', ['-version']);
  const device = selectDevice(JSON.parse(capture('xcrun', ['xcdevice', 'list'])), target);
  console.log(`✓ 目标设备：${device.name}（${device.modelName}）`);
  console.log('✓ Release 模式：Web 资源内置，不依赖电脑开发服务');
  if (process.argv.includes('--dry-run')) { console.log('✓ 设备与构建入口检查通过'); return; }

  console.log('\n[1/4] 构建 Web 并同步 iOS 资源…');
  run('npm', ['run', 'build'], 'Web 构建失败，未执行安装。');
  run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'ios'], 'Capacitor iOS 同步失败，未执行安装。');
  const synced = JSON.parse(readFileSync(resolve(projectRoot, 'ios/App/App/capacitor.config.json'), 'utf8'));
  // 安装包必须独立启动；误带 live-reload URL 时拒绝构建，不让手机依赖开发机。
  if (synced.server?.url) throw new Error('iOS 配置仍带开发服务 URL，请移除后重新安装。');
  const derivedData = resolve(projectRoot, 'ios/App/build/device');
  console.log('\n[2/4] 构建并签名 iOS Release…');
  // 签名团队与构建号仅通过命令行传入，不修改工程文件或把个人团队写进仓库。
  run('xcodebuild', ['-workspace', 'ios/App/App.xcworkspace', '-scheme', 'App', '-configuration', 'Release',
    '-destination', `id=${device.identifier}`, '-derivedDataPath', derivedData,
    '-allowProvisioningUpdates', '-allowProvisioningDeviceRegistration',
    `DEVELOPMENT_TEAM=${team}`, 'CODE_SIGN_STYLE=Automatic', 'CODE_SIGN_IDENTITY=Apple Development',
    `CURRENT_PROJECT_VERSION=${Math.floor(Date.now() / 1000)}`, '-quiet', 'build'],
  'iOS 构建/签名失败，未执行安装，请查看上方 Xcode 日志。');
  const app = resolve(derivedData, 'Build/Products/Release-iphoneos/App.app');
  if (!existsSync(app)) throw new Error('构建结束但没有找到 App.app，未执行安装。');
  const bundle = capture('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleIdentifier', resolve(app, 'Info.plist')]).trim();
  if (bundle !== synced.appId) throw new Error('安装包标识与 Capacitor 配置不一致，停止安装。');

  console.log('\n[3/4] 覆盖安装到真机（不先卸载）…');
  run('xcrun', ['devicectl', 'device', 'install', 'app', '--device', device.identifier, app],
    '安装失败，请确认设备解锁并已开启开发者模式；构建产物已保留。');
  console.log('\n[4/4] 启动面试拾光…');
  run('xcrun', ['devicectl', 'device', 'process', 'launch', '--device', device.identifier, '--terminate-existing', bundle],
    'App 已安装，但启动失败。请解锁手机，按系统提示信任开发者后打开 App。');
  console.log(`\n✓ 已安装并启动：${bundle} → ${device.name}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(`\n✗ ${error.message}`); process.exitCode = 1; }
}
