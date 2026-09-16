// 临时产物自检（不变式 7）：每个页面 JSON 的 usingComponents 必须覆盖 WXML 用到的自定义组件
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('dist/build/mp-weixin');
const BUILTIN = new Set([
  'view', 'text', 'image', 'button', 'input', 'textarea', 'form', 'label', 'slot', 'block',
  'swiper', 'swiper-item', 'scroll-view', 'rich-text', 'web-view', 'navigator', 'movable-area',
  'movable-view', 'cover-view', 'cover-image', 'canvas', 'video', 'audio', 'camera', 'map',
  'open-data', 'ad', 'official-account', 'page-meta', 'navigation-bar', 'match-media', 'progress',
  'icon', 'switch', 'slider', 'picker', 'picker-view', 'picker-view-column', 'checkbox',
  'checkbox-group', 'radio', 'radio-group', 'editor', 'keyboard-accessory', 'page-container',
  'root-portal', 'functional-page-navigator', 'live-player', 'live-pusher', 'voip-room',
  'template', 'import', 'include', 'wxs', 'share-element', 'root-portal',
]);

const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
let failed = 0;

for (const page of appJson.pages) {
  const base = path.join(ROOT, page);
  const wxmlFile = `${base}.wxml`;
  const jsonFile = `${base}.json`;
  if (!fs.existsSync(wxmlFile)) {
    console.log(`MISSING WXML: ${page}`);
    failed += 1;
    continue;
  }
  const wxml = fs.readFileSync(wxmlFile, 'utf8');
  const using = fs.existsSync(jsonFile)
    ? Object.keys(JSON.parse(fs.readFileSync(jsonFile, 'utf8')).usingComponents || {})
    : [];
  const tags = new Set();
  for (const m of wxml.matchAll(/<([a-zA-Z][\w-]*)/g)) {
    const tag = m[1];
    if (!BUILTIN.has(tag)) tags.add(tag);
  }
  const missing = [...tags].filter((t) => !using.includes(t));
  if (missing.length) {
    console.log(`FAIL ${page}: missing usingComponents -> ${missing.join(', ')} (used: ${[...tags].join(', ')})`);
    failed += 1;
  } else {
    console.log(`OK   ${page} (usingComponents: ${using.join(', ') || '-'})`);
  }
}

console.log(failed === 0 ? 'ALL PAGES OK' : `PAGES FAILED: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
