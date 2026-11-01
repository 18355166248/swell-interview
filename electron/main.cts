import { app, BrowserWindow, shell, session } from 'electron';
import { join } from 'node:path';
let mainWindow: BrowserWindow | null = null;
function openExternal(url: string) {
  // 题目资料只允许 HTTPS 外链，交给系统浏览器；不向外部页面开放桌面运行环境。
  try { if (new URL(url).protocol === 'https:') void shell.openExternal(url); } catch { /* 无效链接直接忽略 */ }
}
async function createWindow() {
  const win = new BrowserWindow({ width: 1440, height: 1024, minWidth: 380, minHeight: 640, title: '面试拾光', backgroundColor: '#ffffff', webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
  mainWindow = win;
  win.webContents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (event, url) => { event.preventDefault(); openExternal(url); });
  win.on('closed', () => { if (mainWindow === win) mainWindow = null; });
  const devUrl = process.env.INTERVIEW_DEV_URL;
  // 开发环境仅加载本地 Vite；生产始终加载随应用构建的页面。
  if (devUrl && /^http:\/\/127\.0\.0\.1:\d+\/$/.test(devUrl)) await win.loadURL(devUrl);
  else await win.loadFile(join(__dirname, '../dist/client/index.html'));
}
app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  await createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) void createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
