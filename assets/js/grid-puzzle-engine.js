(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GridPuzzleEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SIZE = 6, TOTAL = 36, VERSION = 'v1';
  const neighbors = Array.from({ length: TOTAL }, (_, cell) => {
    const r = Math.floor(cell / SIZE), c = cell % SIZE;
    return [r ? cell - SIZE : -1, c < SIZE - 1 ? cell + 1 : -1,
      r < SIZE - 1 ? cell + SIZE : -1, c ? cell - 1 : -1].filter(v => v >= 0);
  });
  const distance = (a, b) => Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)) + Math.abs(a % SIZE - b % SIZE);
  function validDate(date) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const stamp = Date.parse(date + 'T00:00:00Z');
    return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === date;
  }
  function randomFor(game, date) {
    let seed = 2166136261;
    for (const char of game + ':' + VERSION + ':' + date) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
    return function () {
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffled(items, random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function rectCells(rect, size = SIZE) {
    if (!Array.isArray(rect) || rect.length !== 4 || !rect.every(Number.isInteger) || !Number.isInteger(size) || size <= 0) return [];
    const [r, c, h, w] = rect;
    if (r < 0 || c < 0 || h <= 0 || w <= 0 || r + h > size || c + w > size) return [];
    const cells = [];
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) cells.push(y * size + x);
    return cells;
  }
  function validClues(puzzle, field) {
    return puzzle && puzzle.size === SIZE && Array.isArray(puzzle.clues) && puzzle.clues.length > 0 &&
      puzzle.clues.every(c => c && Number.isInteger(c.cell) && c.cell >= 0 && c.cell < TOTAL && Number.isInteger(c[field]) && c[field] > 0 && c[field] <= TOTAL) &&
      new Set(puzzle.clues.map(c => c.cell)).size === puzzle.clues.length;
  }
  function validateRect(rect, puzzle) {
    const cells = rectCells(rect, puzzle && puzzle.size);
    if (!cells.length || !validClues(puzzle, 'area')) return { ok: false, message: '보드 안에서 직사각형을 선택해 주세요.' };
    const inside = puzzle.clues.filter(c => cells.includes(c.cell));
    if (inside.length !== 1) return { ok: false, message: '직사각형마다 숫자가 하나씩 있어야 해요.' };
    if (inside[0].area !== cells.length) return { ok: false, message: '숫자와 직사각형의 칸 수를 맞춰 주세요.' };
    return { ok: true, message: '' };
  }
  function completeShikaku(rects, puzzle) {
    if (!Array.isArray(rects) || !validClues(puzzle, 'area')) return false;
    const covered = new Set();
    for (const rect of rects) {
      if (!validateRect(rect, puzzle).ok) return false;
      for (const cell of rectCells(rect)) { if (covered.has(cell)) return false; covered.add(cell); }
    }
    return covered.size === TOTAL;
  }
  function countShikaku(puzzle, limit = 2) {
    if (!validClues(puzzle, 'area') || puzzle.clues.reduce((sum, c) => sum + c.area, 0) !== TOTAL) return { count: 0, solution: null };
    const candidates = puzzle.clues.map(clue => {
      const list = [], row = Math.floor(clue.cell / SIZE), col = clue.cell % SIZE;
      for (let h = 1; h <= SIZE; h++) {
        const w = clue.area / h;
        if (!Number.isInteger(w) || w < 1 || w > SIZE) continue;
        for (let r = Math.max(0, row - h + 1); r <= Math.min(row, SIZE - h); r++) {
          for (let c = Math.max(0, col - w + 1); c <= Math.min(col, SIZE - w); c++) {
            const rect = [r, c, h, w], cells = rectCells(rect);
            if (puzzle.clues.some(other => other !== clue && cells.includes(other.cell))) continue;
            list.push({ rect, mask: cells.reduce((mask, i) => mask | 1n << BigInt(i), 0n) });
          }
        }
      }
      return list;
    });
    let count = 0, solution = null;
    const chosen = new Array(candidates.length).fill(false), rectangles = [];
    function visit(used, depth) {
      if (count >= limit) return;
      if (depth === candidates.length) { count++; if (!solution) solution = rectangles.map(r => r.slice()); return; }
      let target = -1, options = null;
      for (let i = 0; i < candidates.length; i++) {
        if (chosen[i]) continue;
        const available = candidates[i].filter(c => !(c.mask & used));
        if (!available.length) return;
        if (!options || available.length < options.length) { options = available; target = i; }
      }
      chosen[target] = true;
      for (const option of options) {
        rectangles.push(option.rect); visit(used | option.mask, depth + 1); rectangles.pop();
        if (count >= limit) break;
      }
      chosen[target] = false;
    }
    visit(0n, 0);
    return { count, solution };
  }
  function zipClues(puzzle) {
    if (!validClues(puzzle, 'number') || puzzle.clues.length < 2) return null;
    const clues = puzzle.clues.slice().sort((a, b) => a.number - b.number);
    return clues.every((c, i) => c.number === i + 1) ? clues : null;
  }
  function validZipPath(path, puzzle) {
    const clues = zipClues(puzzle);
    if (!clues || !Array.isArray(path) || path.length > TOTAL) return false;
    const labels = new Map(clues.map(c => [c.cell, c.number])), seen = new Set();
    let next = 1;
    for (let i = 0; i < path.length; i++) {
      const cell = path[i];
      if (!Number.isInteger(cell) || cell < 0 || cell >= TOTAL || seen.has(cell) || (i && !neighbors[path[i - 1]].includes(cell))) return false;
      if (i === 0 && cell !== clues[0].cell) return false;
      if (labels.has(cell)) { if (labels.get(cell) !== next) return false; next++; }
      if (cell === clues[clues.length - 1].cell && i !== TOTAL - 1) return false;
      seen.add(cell);
    }
    return true;
  }
  function completeZip(path, puzzle) { return Array.isArray(path) && path.length === TOTAL && validZipPath(path, puzzle); }
  // exhausted=true means the explicit node budget was reached, NOT a uniqueness proof.
  function countZip(puzzle, limit = 2, nodeBudget = 500000) {
    const clues = zipClues(puzzle);
    if (!clues) return { count: 0, solution: null, exhausted: false, nodes: 0 };
    const labels = new Int8Array(TOTAL);
    clues.forEach(c => { labels[c.cell] = c.number; });
    const start = clues[0].cell, end = clues[clues.length - 1].cell;
    if ((Math.floor(start / SIZE) + start % SIZE + Math.floor(end / SIZE) + end % SIZE) % 2 !== 1) return { count: 0, solution: null, exhausted: false, nodes: 0 };
    const tailDistance = new Int16Array(clues.length + 1);
    for (let i = clues.length - 2; i >= 0; i--) tailDistance[i] = tailDistance[i + 1] + distance(clues[i].cell, clues[i + 1].cell);
    const used = new Uint8Array(TOTAL), path = [start];
    used[start] = 1;
    let count = 0, solution = null, alternative = null, exhausted = false, nodes = 0;
    function visit(current, next) {
      if (count >= limit || exhausted) return;
      if (++nodes > nodeBudget) { exhausted = true; return; }
      const remaining = TOTAL - path.length;
      if (!remaining) {
        if (current === end && next === clues.length + 1) { count++; if (!solution) solution = path.slice(); else if (!alternative) alternative = path.slice(); }
        return;
      }
      if (next > clues.length || distance(current, clues[next - 1].cell) + tailDistance[next - 1] > remaining) return;
      // Every unvisited non-end cell needs two eventual path edges. A cell adjacent
      // to current with exactly two available neighbors forces the next move.
      let forced = -1;
      for (let cell = 0; cell < TOTAL; cell++) {
        if (used[cell]) continue;
        let degree = 0, touchesCurrent = false;
        for (const n of neighbors[cell]) if (!used[n] || n === current) { degree++; if (n === current) touchesCurrent = true; }
        if (degree < (cell === end ? 1 : 2)) return;
        if (cell !== end && degree === 2 && touchesCurrent) { if (forced >= 0 && forced !== cell) return; forced = cell; }
      }
      // All still-unvisited cells must be connected after leaving current.
      if ((path.length & 3) === 0 && remaining > 2) {
        const first = used.findIndex(v => !v), seen = new Uint8Array(TOTAL), queue = [first];
        seen[first] = 1;
        for (let i = 0; i < queue.length; i++) for (const n of neighbors[queue[i]]) if (!used[n] && !seen[n]) { seen[n] = 1; queue.push(n); }
        if (queue.length !== remaining) return;
      }
      let moves = neighbors[current].filter(n => !used[n] && (!labels[n] || labels[n] === next) && (n !== end || remaining === 1));
      if (forced >= 0) moves = moves.filter(n => n === forced);
      for (const cell of moves) {
        used[cell] = 1; path.push(cell); visit(cell, next + Number(labels[cell] > 0)); path.pop(); used[cell] = 0;
        if (count >= limit || exhausted) break;
      }
    }
    visit(start, 2);
    return { count, solution, alternative, exhausted, nodes };
  }
  function generateShikaku(date, random) {
    for (let attempt = 0; attempt < 96; attempt++) {
      const rects = [[0, 0, SIZE, SIZE]], target = 8 + Math.floor(random() * 4);
      while (rects.length < target) {
        const choices = [];
        rects.forEach(([r, c, h, w], index) => {
          for (let cut = 1; cut < h; cut++) if (cut * w >= 2 && (h - cut) * w >= 2) choices.push([index, 0, cut]);
          for (let cut = 1; cut < w; cut++) if (cut * h >= 2 && (w - cut) * h >= 2) choices.push([index, 1, cut]);
        });
        if (!choices.length) break;
        const [index, axis, cut] = choices[Math.floor(random() * choices.length)];
        const [r, c, h, w] = rects.splice(index, 1)[0];
        if (axis) rects.push([r, c, h, cut], [r, c + cut, h, w - cut]);
        else rects.push([r, c, cut, w], [r + cut, c, h - cut, w]);
      }
      const clues = rects.map(rect => { const cells = rectCells(rect); return { cell: cells[Math.floor(random() * cells.length)], area: cells.length }; }).sort((a, b) => a.cell - b.cell);
      const puzzle = { game: 'shikaku', version: VERSION, date, size: SIZE, clues, solution: rects };
      if (countShikaku(puzzle).count === 1) return puzzle;
    }
    // Guaranteed unique fallback: each 1×6 strip has its clue in the first column;
    // any taller rectangle would contain a second clue. Rotate the construction.
    const vertical = random() < .5;
    const solution = Array.from({ length: SIZE }, (_, i) => vertical ? [0, i, SIZE, 1] : [i, 0, 1, SIZE]);
    const clues = solution.map(rect => ({ cell: rect[0] * SIZE + rect[1], area: SIZE }));
    const puzzle = { game: 'shikaku', version: VERSION, date, size: SIZE, clues, solution };
    if (countShikaku(puzzle).count !== 1) throw new Error('Shikaku generation failed');
    return puzzle;
  }
  function generateZip(date, random) {
    let path = Array.from({ length: TOTAL }, (_, i) => Math.floor(i / SIZE) * SIZE + (Math.floor(i / SIZE) % 2 ? SIZE - 1 - i % SIZE : i % SIZE));
    for (let i = 0; i < 96; i++) {
      if (random() < .5) path.reverse();
      const choices = neighbors[path[0]].map(cell => path.indexOf(cell)).filter(index => index > 1);
      if (choices.length) {
        const index = choices[Math.floor(random() * choices.length)];
        path = path.slice(0, index).reverse().concat(path.slice(index));
      }
    }
    const checkpoints = new Set([0, TOTAL - 1]);
    for (let i = 3; i < TOTAL - 1; i += 3) checkpoints.add(i);
    const priority = shuffled(Array.from({ length: TOTAL - 2 }, (_, i) => i + 1).filter(i => !checkpoints.has(i)), random);
    for (let attempt = 0; attempt < TOTAL; attempt++) {
      const clues = [...checkpoints].sort((a, b) => a - b).map((index, i) => ({ cell: path[index], number: i + 1 }));
      const puzzle = { game: 'zip', version: VERSION, date, size: SIZE, clues, solution: path.slice() };
      const result = countZip(puzzle, 2, 6000);
      if (!result.exhausted && result.count === 1) return puzzle;
      const other = [result.solution, result.alternative].find(candidate => candidate && candidate.some((cell, i) => cell !== path[i]));
      let added = false;
      if (other) {
        const positions = new Int8Array(TOTAL);
        other.forEach((cell, index) => { positions[cell] = index; });
        const ordered = [...checkpoints].sort((a, b) => a - b);
        // Prefer one clue that moves a cell to the wrong checkpoint segment in
        // the alternative. If both paths use the same segment cells, two clues
        // exposing an inverted pair eliminate that alternative instead.
        for (const index of priority) {
          if (checkpoints.has(index)) continue;
          const next = ordered.findIndex(bound => bound > index);
          if (positions[path[index]] < positions[path[ordered[next - 1]]] || positions[path[index]] > positions[path[ordered[next]]]) {
            checkpoints.add(index); added = true; break;
          }
        }
        if (!added) {
          for (const a of priority) {
            if (checkpoints.has(a)) continue;
            const b = priority.find(index => index > a && !checkpoints.has(index) && positions[path[a]] > positions[path[index]]);
            if (b !== undefined) { checkpoints.add(a); checkpoints.add(b); added = true; break; }
          }
        }
      }
      if (!added) {
        const ordered = [...checkpoints].sort((a, b) => a - b);
        let widest = [0, 0];
        for (let i = 1; i < ordered.length; i++) if (ordered[i] - ordered[i - 1] > widest[1] - widest[0]) widest = [ordered[i - 1], ordered[i]];
        if (widest[1] - widest[0] <= 1) break;
        checkpoints.add(Math.floor((widest[0] + widest[1]) / 2));
      }
    }
    throw new Error('Zip generation failed');
  }
  function generate(game, date) {
    if (!validDate(date)) throw new Error('Invalid puzzle date');
    if (game !== 'shikaku' && game !== 'zip') throw new Error('Unknown puzzle game');
    const random = randomFor(game, date);
    return game === 'shikaku' ? generateShikaku(date, random) : generateZip(date, random);
  }
  return { generate, rectCells, validateRect, completeShikaku, validZipPath, completeZip, countShikaku, countZip };
});
