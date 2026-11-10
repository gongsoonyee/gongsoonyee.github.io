const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../assets/js/grid-puzzle-engine.js');

test('v1 published puzzles have stable versioned snapshots', () => {
  const crypto = require('node:crypto');
  const snapshots = [
    ['shikaku', '2026-11-10', '1b25ffe84b53015c22c5233927ce9d16fb39619d2975b563b3a6d90b26d1b400'],
    ['shikaku', '2028-02-29', '6bf0e705cfd1e67375a0fa24ca192b434a3aafa164d4b30a8b561033d04df127'],
    ['zip', '2026-11-10', 'cd9b37f668d00c3eba85e87f55dcc843a455074935e9d9e76170234faf8cf144'],
    ['zip', '2028-02-29', '6a3f282658d9ddaed2cde61fab4295ff0ead604e3fff45296919b79c619e7f77']
  ];
  for (const [game, date, hash] of snapshots) {
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(E.generate(game, date))).digest('hex'), hash);
  }
});

const dates = Array.from({ length: 180 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i * 7)).toISOString().slice(0, 10));
const adjacent = (a, b) => Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) + Math.abs(a % 6 - b % 6) === 1;
const neighbors = Array.from({ length: 36 }, (_, a) => Array.from({ length: 36 }, (_, b) => b).filter(b => adjacent(a, b)));
const cellsOf = ([r, c, h, w]) => Array.from({ length: h * w }, (_, i) => (r + Math.floor(i / w)) * 6 + c + i % w);

// Independent exact-cover enumeration using sets and all possible rectangles;
// this does not call the production solver, rectangle validator or cell helper.
function independentShikaku(puzzle) {
  const candidates = puzzle.clues.map(() => []);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    for (let h = 1; r + h <= 6; h++) for (let w = 1; c + w <= 6; w++) {
      const cells = cellsOf([r, c, h, w]);
      const contained = puzzle.clues.map((clue, i) => cells.includes(clue.cell) ? i : -1).filter(i => i >= 0);
      if (contained.length === 1 && cells.length === puzzle.clues[contained[0]].area) candidates[contained[0]].push(cells);
    }
  }
  let count = 0;
  function choose(remaining, occupied) {
    if (count >= 2) return;
    if (!remaining.length) { if (occupied.size === 36) count++; return; }
    const choices = remaining.map(i => ({ i, options: candidates[i].filter(cells => cells.every(c => !occupied.has(c))) })).sort((a, b) => a.options.length - b.options.length);
    const choice = choices[0];
    for (const cells of choice.options) choose(remaining.filter(i => i !== choice.i), new Set([...occupied, ...cells]));
  }
  choose(candidates.map((_, i) => i), new Set());
  return count;
}

// A separate prefix enumerator verifies Hamiltonian paths from the ordered clues.
// It deliberately omits the production counter's forced-move pruning.
function independentZip(puzzle) {
  const clues = puzzle.clues.slice().sort((a, b) => a.number - b.number);
  const label = new Map(clues.map(c => [c.cell, c.number]));
  const end = clues.at(-1).cell;
  let count = 0, nodes = 0;
  const distance = (a, b) => Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) + Math.abs(a % 6 - b % 6);
  function extend(path, visited, expected) {
    if (count >= 2) return;
    if (++nodes > 1000000) throw new Error('Independent test search exceeded its explicit budget');
    const current = path.at(-1), remaining = 36 - path.length;
    if (!remaining) { if (current === end && expected === clues.length + 1) count++; return; }
    if (expected > clues.length) return;
    let minimum = distance(current, clues[expected - 1].cell);
    for (let i = expected; i < clues.length; i++) minimum += distance(clues[i - 1].cell, clues[i].cell);
    if (minimum > remaining) return;
    for (let cell = 0; cell < 36; cell++) {
      if (visited.has(cell)) continue;
      const connections = neighbors[cell].filter(n => !visited.has(n) || n === current).length;
      if (connections < (cell === end ? 1 : 2)) return;
    }
    for (const cell of neighbors[current]) {
      if (visited.has(cell) || (label.has(cell) && label.get(cell) !== expected) || (cell === end && remaining !== 1)) continue;
      extend([...path, cell], new Set([...visited, cell]), expected + Number(label.has(cell)));
    }
  }
  extend([clues[0].cell], new Set([clues[0].cell]), 2);
  return count;
}

test('date-generated puzzles are deterministic without random or current-time inputs', () => {
  const originalRandom = Math.random, originalNow = Date.now;
  try {
    Math.random = () => { throw new Error('Nondeterministic random input'); };
    Date.now = () => { throw new Error('Wall-clock input'); };
    for (const game of ['shikaku', 'zip']) {
      const a = E.generate(game, '2026-11-10'), b = E.generate(game, '2026-11-10');
      assert.deepEqual(a, b);
      assert.notStrictEqual(a, b);
      assert.equal(a.version, 'v1');
      assert.equal(a.size, 6);
      assert.equal(a.game, game);
      assert.equal(a.date, '2026-11-10');
      assert.notDeepEqual(a.clues, E.generate(game, '2026-11-11').clues);
    }
  } finally { Math.random = originalRandom; Date.now = originalNow; }
  for (const date of ['2026-02-29', '2026-13-01', '2026-00-01', '2026-01-32', '2026-1-1', '', null]) assert.throws(() => E.generate('zip', date));
  assert.doesNotThrow(() => E.generate('shikaku', '2028-02-29'));
  assert.throws(() => E.generate('unknown', '2026-11-10'));
});

test('broad date sweep produces valid distinct boards and proved unique solutions', () => {
  for (const game of ['shikaku', 'zip']) {
    const boards = new Set();
    for (const date of dates) {
      const puzzle = E.generate(game, date);
      boards.add(JSON.stringify(puzzle.clues));
      if (game === 'shikaku') {
        const covered = puzzle.solution.flatMap(cellsOf);
        assert.equal(covered.length, 36);
        assert.equal(new Set(covered).size, 36);
        for (const rect of puzzle.solution) {
          const cells = cellsOf(rect), clues = puzzle.clues.filter(c => cells.includes(c.cell));
          assert.equal(clues.length, 1);
          assert.equal(clues[0].area, cells.length);
        }
        assert(E.completeShikaku(puzzle.solution, puzzle));
        assert.equal(E.countShikaku(puzzle).count, 1);
      } else {
        assert.equal(puzzle.solution.length, 36);
        assert.equal(new Set(puzzle.solution).size, 36);
        assert(puzzle.solution.every(c => Number.isInteger(c) && c >= 0 && c < 36));
        assert(puzzle.solution.every((c, i) => !i || adjacent(c, puzzle.solution[i - 1])));
        const cluePositions = puzzle.clues.map(c => puzzle.solution.indexOf(c.cell));
        assert.equal(cluePositions[0], 0);
        assert.equal(cluePositions.at(-1), 35);
        assert(cluePositions.every((position, i) => !i || position > cluePositions[i - 1]));
        assert(E.completeZip(puzzle.solution, puzzle));
        const counted = E.countZip(puzzle);
        assert.equal(counted.exhausted, false);
        assert.equal(counted.count, 1);
        assert.deepEqual(counted.solution, puzzle.solution);
      }
    }
    assert.equal(boards.size, dates.length, game + ' repeated an exact board in the test range');
  }
});

test('independent counters prove uniqueness across calendar boundaries and sampled dates', () => {
  for (const date of ['2026-11-10', '2026-12-31', '2027-01-01', '2028-02-29', ...dates.filter((_, i) => i % 9 === 0)]) {
    assert.equal(independentShikaku(E.generate('shikaku', date)), 1, date + ' Shikaku');
    assert.equal(independentZip(E.generate('zip', date)), 1, date + ' Zip');
  }
});

test('rectangle validation, full coverage and fallback constructions are checked without using stored answers', () => {
  for (const vertical of [false, true]) {
    const solution = Array.from({ length: 6 }, (_, i) => vertical ? [0, i, 6, 1] : [i, 0, 1, 6]);
    const puzzle = { size: 6, clues: solution.map(rect => ({ cell: rect[0] * 6 + rect[1], area: 6 })) };
    assert.equal(independentShikaku(puzzle), 1);
    assert.equal(E.countShikaku(puzzle).count, 1);
    assert(E.completeShikaku(solution, puzzle));
    assert(!E.completeShikaku(solution.slice(1), puzzle));
    assert(!E.completeShikaku([...solution, solution[0]], puzzle));
  }
  const puzzle = { size: 6, clues: Array.from({ length: 6 }, (_, i) => ({ cell: i * 6, area: 6 })) };
  for (const rect of [[0, 0, 0, 6], [-1, 0, 1, 6], [0, 0, 1, 7], [0, 0, 1, 5], [0, 0, 2, 3], null]) assert.equal(E.validateRect(rect, puzzle).ok, false);
  assert.equal(E.validateRect([0, 0, 1, 6], puzzle).ok, true);
  assert.deepEqual(E.rectCells([1, 2, 2, 2]), [8, 9, 14, 15]);
  assert.deepEqual(E.rectCells([0, 0, -1, 2]), []);
});

test('Zip accepts valid prefixes, rejects illegal moves and exposes a budget cutoff explicitly', () => {
  const path = Array.from({ length: 36 }, (_, i) => Math.floor(i / 6) * 6 + (Math.floor(i / 6) % 2 ? 5 - i % 6 : i % 6));
  const puzzle = { size: 6, clues: path.map((cell, i) => ({ cell, number: i + 1 })) };
  assert(E.validZipPath([], puzzle));
  for (let length = 1; length <= 36; length++) assert(E.validZipPath(path.slice(0, length), puzzle));
  assert(E.completeZip(path, puzzle));
  assert(!E.completeZip(path.slice(0, 35), puzzle));
  for (const invalid of [[1], [0, 1, 0], [0, 7], [0, 6], [0, -1], [0, NaN], Array(37).fill(0)]) assert(!E.validZipPath(invalid, puzzle));
  const unique = E.countZip(puzzle);
  assert.equal(unique.count, 1);
  assert.equal(unique.exhausted, false);
  assert.equal(independentZip(puzzle), 1);
  const limited = E.countZip(puzzle, 2, 0);
  assert.equal(limited.exhausted, true);
  assert.equal(limited.count, 0);
  assert.equal(E.countZip({ size: 6, clues: [{ cell: 0, number: 1 }, { cell: 35, number: 2 }] }).count, 0);
  assert.equal(E.countZip({ size: 6, clues: [{ cell: 0, number: 1 }, { cell: 1, number: 3 }] }).count, 0);
});
