import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function compile() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.electron.json'], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Electron 编译失败：${code}`)));
  });
}
await compile();
const server = await createServer({ server: { host: '127.0.0.1', port: 5174, strictPort: true } });
await server.listen();
const child = spawn(require('electron'), ['.'], { stdio: 'inherit', env: { ...process.env, INTERVIEW_DEV_URL: 'http://127.0.0.1:5174/' } });
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  if (child.exitCode === null) child.kill();
  await server.close();
}
child.on('error', async error => { console.error(error); process.exitCode = 1; await close(); });
child.on('exit', async code => { process.exitCode = code ?? 0; await close(); });
process.once('SIGINT', close);
process.once('SIGTERM', close);
