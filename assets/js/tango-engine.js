(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TangoEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SIZE = 6;
  const DAY = 86400000;
  function dayKey(now = new Date()) {
    return new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
  }
  function addDays(key, days) {
    return new Date(Date.parse(key + 'T00:00:00Z') + days * DAY).toISOString().slice(0, 10);
  }
  function validDate(key) {
    return /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(Date.parse(key + 'T00:00:00Z')) && addDays(key, 0) === key;
  }
  function conflicts(board, edges) {
    const bad = new Set();
    for (let axis = 0; axis < 2; axis++) {
      for (let line = 0; line < SIZE; line++) {
        const ids = Array.from({ length: SIZE }, (_, i) => axis ? i * SIZE + line : line * SIZE + i);
        for (const value of [1, 2]) {
          const chosen = ids.filter(i => board[i] === value);
          if (chosen.length > 3) chosen.forEach(i => bad.add(i));
        }
        for (let i = 0; i < 4; i++) {
          if (board[ids[i]] && board[ids[i]] === board[ids[i + 1]] && board[ids[i]] === board[ids[i + 2]]) {
            ids.slice(i, i + 3).forEach(id => bad.add(id));
          }
        }
      }
    }
    for (const [a, b, same] of edges) {
      if (board[a] && board[b] && (board[a] === board[b]) !== Boolean(same)) {
        bad.add(a); bad.add(b);
      }
    }
    return [...bad];
  }
  function complete(board, edges) {
    return board.length === 36 && board.every(v => v === 1 || v === 2) && !conflicts(board, edges).length;
  }
  const rows = [];
  for (let mask = 0; mask < 64; mask++) {
    const row = Array.from({ length: 6 }, (_, i) => (mask >> i & 1) + 1);
    if (row.filter(v => v === 1).length === 3 && !row.some((v, i) => i < 4 && v === row[i + 1] && v === row[i + 2])) rows.push(row);
  }
  // Counts up to limit; a count of 1 proves uniqueness when limit >= 2.
  function solve(givens, edges, limit = 2, random) {
    let count = 0, first = null;
    const board = Array(36).fill(0);
    const columnOnes = Array(6).fill(0);
    function visit(r) {
      if (count >= limit) return;
      if (r === 6) { count++; if (!first) first = board.slice(); return; }
      const candidates = rows.slice();
      if (random) for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      for (const row of candidates) {
        if (row.some((v, c) => givens[r * 6 + c] && givens[r * 6 + c] !== v)) continue;
        if (row.some((v, c) => {
          const ones = columnOnes[c] + Number(v === 1);
          return ones > 3 || r + 1 - ones > 3 || (r >= 2 && v === board[(r - 1) * 6 + c] && v === board[(r - 2) * 6 + c]);
        })) continue;
        for (let c = 0; c < 6; c++) board[r * 6 + c] = row[c];
        if (edges.every(([a, b, same]) => !board[a] || !board[b] || ((board[a] === board[b]) === Boolean(same)))) {
          for (let c = 0; c < 6; c++) columnOnes[c] += Number(row[c] === 1);
          visit(r + 1);
          for (let c = 0; c < 6; c++) columnOnes[c] -= Number(row[c] === 1);
        }
        for (let c = 0; c < 6; c++) board[r * 6 + c] = 0;
        if (count >= limit) break;
      }
    }
    visit(0);
    return { count, solution: first };
  }
  return { SIZE, dayKey, addDays, validDate, conflicts, complete, solve };
});
