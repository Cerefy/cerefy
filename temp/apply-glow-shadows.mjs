import fs from 'node:fs';
import path from 'node:path';

const MAP = {
  'shadow-[0_0_20px_rgba(0,216,246,0.15)]': 'shadow-glow-cyan',
  'shadow-[0_0_8px_rgba(16,185,129,0.5)]': 'shadow-glow-emerald-xs',
  'shadow-[0_0_15px_rgba(79,70,229,0.2)]': 'shadow-glow-indigo',
  'shadow-[0_0_15px_rgba(79,70,229,0.3)]': 'shadow-glow-indigo-sm',
  'shadow-[0_0_15px_rgba(16,185,129,0.2)]': 'shadow-glow-emerald',
  'shadow-[0_0_10px_rgba(79,70,229,0.3)]': 'shadow-glow-indigo-tiny',
  'shadow-[0_0_10px_rgba(6,182,212,0.3)]': 'shadow-glow-cyan-soft',
  'shadow-[0_0_15px_rgba(0,216,246,0.1)]': 'shadow-glow-cyan-sm',
  'shadow-[0_0_15px_rgba(79,70,229,0.5)]': 'shadow-glow-indigo-xs',
  'shadow-[0_0_8px_rgba(245,158,11,0.5)]': 'shadow-glow-amber-xs',
  'shadow-[0_0_8px_rgba(239,68,68,0.2)]': 'shadow-glow-rose-soft',
  'shadow-[0_0_8px_rgba(34,197,94,0.4)]': 'shadow-glow-green-xs',
  'shadow-[0_0_8px_rgba(16,185,129,0.2)]': 'shadow-glow-emerald-soft',
  'shadow-[0_0_8px_rgba(16,185,129,0.3)]': 'shadow-glow-emerald-sm',
  'shadow-[0_0_15px_rgba(79,70,229,0.15)]': 'shadow-glow-indigo-soft',
  'shadow-[0_0_8px_rgba(239,68,68,0.3)]': 'shadow-glow-rose-sm',
  'shadow-[0_0_8px_rgba(37,99,235,0.5)]': 'shadow-glow-blue-xs',
  'shadow-[0_0_8px_rgba(244,63,94,0.5)]': 'shadow-glow-rose-hot-xs',
};

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
for (const file of walk('src/components')) {
  let src = fs.readFileSync(file, 'utf8');
  let n = 0;
  for (const [k, v] of Object.entries(MAP)) {
    const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const cnt = (src.match(re) || []).length;
    if (cnt) { n += cnt; src = src.replace(re, v); }
  }
  if (n) { fs.writeFileSync(file, src, 'utf8'); report[path.basename(file)] = n; total += n; }
}
console.log('Replaced arbitrary shadows:', total);
console.table(Object.entries(report).sort((a, b) => b[1] - a[1]));
