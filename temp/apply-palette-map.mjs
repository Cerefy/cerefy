import fs from 'node:fs';
import path from 'node:path';

const COMPONENTS = 'src/components';

const LIGHT_FILES = new Set([
  'AboutContactPage.tsx',
  'FeaturesPage.tsx',
  'FirebaseAuthModal.tsx',
  'PricingPage.tsx',
  'PublicMarketingSite.tsx',
]);

const DARK_TOKENS = {
  zinc: { 950: 'dark-panel-deep', 900: 'dark-panel', 800: 'dark-panel-raised', 700: 'dark-panel-soft', 600: 'dark-border', 500: 'dark-muted', 400: 'dark-muted-strong', 300: 'dark-text-muted', 200: 'dark-text', 100: 'dark-text-bright' },
  slate: { 950: 'slate-deep', 900: 'slate-panel', 800: 'slate-panel-raised', 700: 'slate-panel-soft', 600: 'slate-border', 500: 'slate-muted', 400: 'slate-muted-strong', 300: 'slate-text-muted', 200: 'slate-text', 100: 'slate-text-bright' },
  cyan: { 700: 'cyan-signal-muted', 600: 'cyan-signal-deep', 500: 'cyan-signal', 400: 'cyan-signal-strong', 300: 'cyan-signal-soft' },
  red: { 950: 'rose-signal-ink', 900: 'rose-signal-ink-deep', 800: 'rose-signal-deep-soft', 700: 'rose-signal-muted', 600: 'rose-signal-deep', 500: 'rose-signal', 400: 'rose-signal-strong', 300: 'rose-signal-soft', 200: 'rose-signal-tint', 50: 'rose-signal-faint' },
  emerald: { 950: 'emerald-signal-ink', 700: 'emerald-signal-muted', 600: 'emerald-signal-deep', 500: 'emerald-signal', 400: 'emerald-signal-strong', 300: 'emerald-signal-soft', 200: 'emerald-signal-tint', 100: 'emerald-signal-faint-strong', 50: 'emerald-signal-faint' },
  amber: { 600: 'amber-signal-deep', 500: 'amber-signal', 400: 'amber-signal-strong', 300: 'amber-signal-soft', 200: 'amber-signal-tint', 100: 'amber-signal-faint' },
  indigo: { 950: 'indigo-signal-ink', 900: 'indigo-signal-ink-soft', 600: 'indigo-signal-deep', 500: 'indigo-signal', 400: 'indigo-signal-strong', 300: 'indigo-signal-soft', 200: 'indigo-signal-tint', 100: 'indigo-signal-faint' },
  blue: { 950: 'blue-signal-ink', 600: 'blue-signal-deep', 500: 'blue-signal', 400: 'blue-signal-strong', 200: 'blue-signal-soft' },
  teal: { 600: 'teal-signal', 500: 'teal-signal-soft' },
};

const LIGHT_TOKENS = {
  zinc: { 950: 'on-surface', 900: 'on-surface', 800: 'on-surface-muted-strong', 700: 'on-surface-variant', 600: 'on-surface-variant', 500: 'on-surface-muted', 300: 'outline-variant', 200: 'outline-soft', 100: 'surface-container-low' },
  gray: { 900: 'gray-deep', 700: 'gray-strong', 600: 'gray-soft', 500: 'gray-muted', 400: 'gray-muted-strong', 200: 'gray-panel', 100: 'gray-panel-soft', 50: 'gray-panel-faint' },
  cyan: { 700: 'cyan-signal-muted', 600: 'cyan-signal-deep', 500: 'cyan-signal', 400: 'cyan-signal-strong', 300: 'cyan-signal-soft' },
  indigo: { 900: 'indigo-signal-ink-soft', 600: 'indigo-signal-deep', 500: 'indigo-signal', 400: 'indigo-signal-strong', 300: 'indigo-signal-soft', 200: 'indigo-signal-tint', 100: 'indigo-signal-faint' },
  blue: { 600: 'blue-signal-deep', 500: 'blue-signal', 400: 'blue-signal-strong' },
  emerald: { 700: 'emerald-signal-muted', 600: 'emerald-signal-deep', 500: 'emerald-signal', 400: 'emerald-signal-strong', 200: 'emerald-signal-tint', 100: 'emerald-signal-faint-strong', 50: 'emerald-signal-faint' },
  amber: { 600: 'amber-signal-deep', 500: 'amber-signal', 400: 'amber-signal-strong' },
  red: { 700: 'rose-signal-muted', 600: 'rose-signal-deep', 500: 'rose-signal', 400: 'rose-signal-strong', 300: 'rose-signal-soft', 200: 'rose-signal-tint', 50: 'rose-signal-faint' },
};

const UTILS = '(?:bg|text|border|placeholder|ring|from|to|divide|outline|shadow|fill|stroke|accent|decoration)';
const HUES = '(?:zinc|slate|cyan|red|emerald|amber|indigo|blue|teal|gray)';
const SHADES = '(?:950|900|800|700|600|500|400|300|200|100|50)';
const COLOR_RE = new RegExp(`(?<![\\w-])(${UTILS})-(${HUES})-(${SHADES})(\\/\\d+)?(?![\\w-])`, 'g');

const WHITE_RE = /(?<![\w-])text-white(?![-\w])/g;
const BORDER_WHITE_RE = /(?<![\w-])border-white(?![-\w])/g;
const BG_WHITE_RE = /(?<![\w-])bg-white(?![-\w])/g;
const BG_BLACK_RE = /(?<![\w-])bg-black(?![-\w])/g;

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

let total = 0;
const report = {};

for (const file of walk(COMPONENTS)) {
  const base = path.basename(file);
  const light = LIGHT_FILES.has(base);
  const map = light ? LIGHT_TOKENS : DARK_TOKENS;
  let src = fs.readFileSync(file, 'utf8');
  let count = 0;

  src = src.replace(COLOR_RE, (m, util, hue, shade, alpha) => {
    const token = map[hue]?.[shade];
    if (!token) return m;
    count++;
    return `${util}-${token}${alpha ?? ''}`;
  });

  const whiteTarget = light ? 'text-surface-container-lowest' : 'text-dark-text-bright';
  const bgWhiteTarget = light ? 'bg-surface-container-lowest' : 'bg-dark-text-bright';
  const before = count;
  src = src.replace(WHITE_RE, whiteTarget);
  src = src.replace(BORDER_WHITE_RE, light ? 'border-surface-container-lowest' : 'border-dark-text-bright');
  src = src.replace(BG_WHITE_RE, bgWhiteTarget);
  src = src.replace(BG_BLACK_RE, 'bg-scrim');
  count = before + (src.match(/text-surface-container-lowest|text-dark-text-bright/g)?.length ?? 0);

  if (src !== fs.readFileSync(file, 'utf8')) {
    fs.writeFileSync(file, src, 'utf8');
    report[base] = count;
    total += count;
  }
}

console.log('Replaced tokens:', total);
console.table(Object.entries(report).sort((a, b) => b[1] - a[1]));
