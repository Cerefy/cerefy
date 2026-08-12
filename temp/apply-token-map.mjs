// temp/apply-token-map.mjs
// Replaces arbitrary Tailwind hex values with design tokens in shipped components.
// Mapping is exact-value based: each hex -> token name. Handles bg/text/border/
// from/to/ring/divide and variant prefixes (hover:, focus:, etc.).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const HEX_TO_TOKEN = {
  '1b1b1b': 'on-surface',
  '5e5e5f': 'primary',
  '5e5e5d': 'secondary',
  '5e6141': 'tertiary',
  '747879': 'outline',
  'c4c7c8': 'outline-variant',
  'e5e5e5': 'outline-soft',
  'e2e2e2': 'surface-container-highest',
  'e8e8e8': 'surface-container-high',
  'eeeeee': 'surface-container',
  'eaeaea': 'surface-container-mist',
  'f3f3f3': 'surface-container-low',
  'f9f9f9': 'surface',
  'f8f9fa': 'surface-soft',
  'ffffff': 'surface-container-lowest',
  '08080a': 'dark-surface',
  '18181b': 'dark-surface-raised',
  '27272a': 'dark-surface-hover',
  '2b2b2b': 'dark-surface-strong',
  '080e38': 'brand-navy',
  '888888': 'on-surface-muted',
  '666666': 'on-surface-muted-strong',
  '2563eb': 'electric-cobalt',
  '9333ea': 'cyber-purple',
  '10b981': 'emerald-signal',
  'f59e0b': 'amber-signal',
  'f43f5e': 'rose-signal',
};

// Build a regex matching arbitrary-[hex] preceded by a known utility prefix.
// Handles: `bg-[#..]`, `text-[#..]`, `border-[#..]`, `from-[#..]`, `to-[#..]`,
// `ring-[#..]`, `divide-[#..]`, and any variant chain like `hover:bg-[#..]`,
// `focus:border-[#..]`, `md:bg-[#..]`, `selection:bg-[#..]`, `[animation-duration:30s]` (skip).
const UTIL = '(?:bg|text|border|border-t|border-b|border-s|border-e|border-l|border-r|from|to|via|ring|ring-offset|divide|fill|stroke|decoration|outline|accent|shadow|caret)';
// variant chain: letters, digits, dashes, underscores, colons but must end before utility
const VAR = '(?:[a-zA-Z0-9_-]+:)*';
const RE = new RegExp(`(${VAR}${UTIL})-\\[#([0-9a-fA-F]{3,8})\\]`, 'g');

function replacer(match, prefix, hex) {
  const t = HEX_TO_TOKEN[hex.toLowerCase()];
  if (!t) return match; // leave unknown values untouched
  return `${prefix}-${t}`;
}

const ROOT = join(process.cwd(), 'src', 'components');
const files = [];
function walk(dir) {
  for (const ent of readdirSync(dir)) {
    const p = join(dir, ent);
    if (statSync(p).isDirectory()) walk(p);
    else if (extname(p) === '.tsx') files.push(p);
  }
}
walk(ROOT);

let changed = 0;
let total = 0;
const unknown = new Set();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  let count = 0;
  const out = src.replace(RE, (m, prefix, hex) => {
    const t = HEX_TO_TOKEN[hex.toLowerCase()];
    if (!t) { unknown.add(hex.toLowerCase()); return m; }
    count++;
    return `${prefix}-${t}`;
  });
  if (count > 0) {
    writeFileSync(f, out);
    changed++;
    total += count;
    console.log(`${String(count).padStart(4)}  ${f.replace(ROOT + '\\', '')}`);
  }
}
console.log(`\nReplaced ${total} arbitrary-hex usages across ${changed} files.`);
console.log(`Unknown hexes left untouched: ${[...unknown].join(', ') || '(none)'}`);
