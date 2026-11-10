// Offline puzzle authoring. Run: node scripts/generate-tango.cjs
const fs = require('node:fs');
const path = require('node:path');
const E = require('../assets/js/tango-engine.js');
let seed = 0x741ac;
function random() {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
const puzzles = [], seen = new Set();
while (puzzles.length < 400) {
  const solution = E.solve(Array(36).fill(0), [], 1, random).solution;
  if (seen.has(solution.join(''))) continue;
  const neighbors = [];
  for (let a = 0; a < 36; a++) {
    if (a % 6 < 5) neighbors.push([a, a + 1]);
    if (a < 30) neighbors.push([a, a + 6]);
  }
  const edges = shuffle(neighbors).slice(0, 8).map(([a, b]) => [a, b, Number(solution[a] === solution[b])]);
  const givens = solution.slice();
  for (const i of shuffle(Array.from({ length: 36 }, (_, n) => n))) {
    if (givens.filter(Boolean).length <= 7) break;
    givens[i] = 0;
    if (E.solve(givens, edges).count !== 1) givens[i] = solution[i];
  }
  seen.add(solution.join(''));
  puzzles.push({ givens, edges, solution });
}
const bank = { version: 1, start: '2026-11-01', puzzles };
fs.writeFileSync(path.join(__dirname, '../assets/data/tango.json'), JSON.stringify(bank));
console.log(`Generated ${puzzles.length} unique puzzles: ${bank.start} – ${E.addDays(bank.start, puzzles.length - 1)}`);
