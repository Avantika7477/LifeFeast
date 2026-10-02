/**
 * Regenerates ../LifeQuest-Documentation.pdf from the HTML guide.
 * Uses installed Chrome or Edge (no npm packages required).
 *
 * Run (PowerShell):
 *   node generate-pdf.mjs
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'LifeQuest-Documentation.html');
const outPath = path.join(__dirname, '..', 'LifeQuest-Documentation.pdf');

const browsers = [
  process.env['ProgramFiles(x86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
  process.env.ProgramFiles + '\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  process.env['ProgramFiles(x86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
  process.env.ProgramFiles + '\\Microsoft\\Edge\\Application\\msedge.exe',
];

const browser = browsers.find((p) => p && fs.existsSync(p));
if (!browser) {
  console.error('Chrome or Edge not found. Open the HTML and Print → Save as PDF.');
  process.exit(1);
}
if (!fs.existsSync(htmlPath)) {
  console.error('Missing:', htmlPath);
  process.exit(1);
}

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
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
console.log('Created:', outPath);
console.log('Size:', Math.round(stat.size / 1024), 'KB');
