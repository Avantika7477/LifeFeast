/**
 * Builds ../LifeQuest-Interview-Guide.pdf from LifeQuest-Interview-Guide.html.
 * Run: node documentation/generate-interview-pdf.mjs
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'LifeQuest-Interview-Guide.html');
const outPath = path.join(__dirname, '..', 'LifeQuest-Interview-Guide.pdf');

const win = (root, ...parts) => (root ? path.join(root, ...parts) : null);

const candidates = [
  process.env.CHROME_PATH,
  process.env.EDGE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  win(process.env['ProgramFiles(x86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
  win(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  win(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  win(process.env.ProgramFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/microsoft-edge',
].filter(Boolean);

const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  console.error('Chrome or Edge not found. Set CHROME_PATH.');
  process.exit(1);
}
if (!fs.existsSync(htmlPath)) {
  console.error('Missing:', htmlPath);
  process.exit(1);
}

const result = spawnSync(
  browser,
  ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', `--print-to-pdf=${outPath}`, pathToFileURL(htmlPath).href],
  { encoding: 'utf8' }
);

if (result.status !== 0 && !fs.existsSync(outPath)) {
  console.error(result.stderr || result.stdout || 'Print failed');
  process.exit(1);
}

const stat = fs.statSync(outPath);
console.log('Using:', browser);
console.log('Created:', outPath);
console.log('Size:', Math.round(stat.size / 1024), 'KB');
