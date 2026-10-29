/**
 * Regenerates ../LifeQuest-Documentation.pdf from the HTML guide.
 * Uses installed Chrome, Edge, Chromium, or Brave (no npm packages required).
 *
 * Run from repo root:  npm run pdf
 * Or:                  node documentation/generate-pdf.mjs
 *
 * Override browser with CHROME_PATH or EDGE_PATH.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'LifeQuest-Documentation.html');
const outPath = path.join(__dirname, '..', 'LifeQuest-Documentation.pdf');

const win = (root, ...parts) => (root ? path.join(root, ...parts) : null);

const candidates = [
  process.env.CHROME_PATH,
  process.env.EDGE_PATH,
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  // Windows
  win(process.env['ProgramFiles(x86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
  win(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  win(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  win(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  win(process.env.ProgramFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
  '/usr/bin/microsoft-edge-stable',
].filter(Boolean);

function findOnPath() {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  for (const name of [
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    'microsoft-edge',
    'msedge',
    'chrome',
  ]) {
    const result = spawnSync(cmd, [name], { encoding: 'utf8' });
    const found = (result.stdout || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line && fs.existsSync(line));
    if (found) return found;
  }
  return null;
}

const browser = candidates.find((p) => fs.existsSync(p)) || findOnPath();
if (!browser) {
  console.error('Chrome or Edge not found. Set CHROME_PATH, or open the HTML and Print → Save as PDF.');
  process.exit(1);
}
if (!fs.existsSync(htmlPath)) {
  console.error('Missing:', htmlPath);
  process.exit(1);
}

const fileUrl = pathToFileURL(htmlPath).href;
const result = spawnSync(
  browser,
  ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', `--print-to-pdf=${outPath}`, fileUrl],
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
