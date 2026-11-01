const { app, BrowserWindow } = require('electron');
const { join } = require('node:path');
const { writeFileSync } = require('node:fs');
app.setPath('userData', join(__dirname, '../.smoke-user-data'));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1440, height: 1024, show: false, webPreferences: { sandbox: true, nodeIntegration: false, contextIsolation: true } });
  const errors = [];
  win.webContents.on('console-message', (_event, level, message) => { if (level === 3) errors.push(message); });
  win.webContents.on('render-process-gone', (_e, details) => { console.error(details); app.exit(1); });
  await win.loadFile(join(__dirname, '../dist/client/index.html'));
  // 在真实 Electron 中校验打包相对资源和 hash 路由，不以 Web 构建通过代替桌面启动。
  const result = await win.webContents.executeJavaScript(`new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const heading = document.querySelector('h1');
      if (heading) return resolve({ title: document.title, heading: heading.textContent, width: innerWidth, scrollWidth: document.documentElement.scrollWidth });
      if (++attempts > 100) return reject(new Error('应用未渲染'));
      setTimeout(check, 50);
    }; check();
  })`);
  const shot = await win.webContents.capturePage();
  writeFileSync(join(__dirname, '../docs/design/electron-desktop.png'), shot.toPNG());
  console.log(JSON.stringify({ ...result, errors }));
  app.exit(errors.length ? 1 : 0);
}).catch(error => { console.error(error); app.exit(1); });
