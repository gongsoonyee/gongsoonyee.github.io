const { test } = require('node:test');
const assert = require('node:assert/strict');
const bank = require('../assets/data/tango.json');
const E = require('../assets/js/tango-engine.js');

// Independent cell-by-cell counter: does not call the production solver or validator.
function countSolutions(puzzle) {
  const b = puzzle.givens.slice();
  let count = 0;
  function legal(i, value) {
    const r = Math.floor(i / 6), c = i % 6;
    for (const ids of [Array.from({ length: 6 }, (_, x) => r * 6 + x), Array.from({ length: 6 }, (_, x) => x * 6 + c)]) {
      const vals = ids.map(j => j === i ? value : b[j]);
      if (vals.filter(v => v === value).length > 3) return false;
      for (let x = 0; x < 4; x++) if (vals[x] && vals[x] === vals[x + 1] && vals[x] === vals[x + 2]) return false;
    }
    return puzzle.edges.every(([a, z, same]) => {
      const av = a === i ? value : b[a], zv = z === i ? value : b[z];
      return !av || !zv || ((av === zv) === Boolean(same));
    });
  }
  function visit() {
    if (count >= 2) return;
    let target = -1, choices;
    for (let i = 0; i < 36; i++) {
      if (b[i]) continue;
      const options = [1, 2].filter(v => legal(i, v));
      if (!options.length) return;
      if (!choices || options.length < choices.length) { choices = options; target = i; }
      if (options.length === 1) break;
    }
    if (target === -1) { count++; return; }
    for (const value of choices) { b[target] = value; visit(); b[target] = 0; }
  }
  visit();
  return count;
}

test('KST date changes exactly at 15:00 UTC, regardless of host timezone', () => {
  assert.equal(E.dayKey(new Date('2026-11-09T14:59:59.999Z')), '2026-11-09');
  assert.equal(E.dayKey(new Date('2026-11-09T15:00:00.000Z')), '2026-11-10');
  assert.equal(E.dayKey(new Date('2026-12-31T15:00:00Z')), '2027-01-01');
  assert.equal(E.addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(E.validDate('2027-02-29'), false);
  assert.equal(E.validDate('2028-02-29'), true);
  assert.equal(E.validDate('2026-13-01'), false);
});

test('published legacy archive has valid distinct solutions and exactly one solution each', () => {
  assert.equal(bank.puzzles.length, 10);
  assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify(bank)).digest('hex'), 'add3213913ba10fb16250ac5945a1b0c96094f9d94492e29f43f53219bf91242');
  const seen = new Set();
  for (const [index, p] of bank.puzzles.entries()) {
    assert.equal(p.givens.length, 36);
    assert.equal(p.solution.length, 36);
    assert(p.givens.every((v, i) => v === 0 || v === p.solution[i]));
    for (const axis of [0, 1]) for (let n = 0; n < 6; n++) {
      const line = Array.from({ length: 6 }, (_, x) => p.solution[axis ? x * 6 + n : n * 6 + x]);
      assert.equal(line.filter(v => v === 1).length, 3);
      assert.equal(line.filter(v => v === 2).length, 3);
      for (let x = 0; x < 4; x++) assert(!(line[x] === line[x + 1] && line[x] === line[x + 2]));
    }
    for (const [a, b, same] of p.edges) {
      assert(a >= 0 && b < 36);
      assert((b - a === 1 && Math.floor(a / 6) === Math.floor(b / 6)) || b - a === 6);
      assert.equal(Number(p.solution[a] === p.solution[b]), same);
    }
    assert(!seen.has(p.solution.join('')), `repeated solution at ${index}`);
    seen.add(p.solution.join(''));
    assert.equal(countSolutions(p), 1, `non-unique puzzle at ${index}`);
    assert(E.complete(p.solution, p.edges));
  }
});

test('date-generated Tango is deterministic, unique-solution, and not limited to the old bank', () => {
  const crypto = require('node:crypto');
  const golden = {
    '2026-11-11': '249e8e5ab2a67d06021c79d6d35db4349caf9ef083c8604db4d2f9b5c624e3d6',
    '2040-02-29': 'c1e9b0f8b0022622a90991352230da17b1dbf45883bbf0017184947292cdb1ad'
  };
  for (const [date, hash] of Object.entries(golden)) {
    const puzzle = E.generate(date);
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(puzzle)).digest('hex'), hash);
    assert.equal(puzzle.version, 'daily-v1');
    assert.equal(countSolutions(puzzle), 1);
  }
  assert.throws(() => E.generate('2027-02-29'), /Invalid/);
  let previous;
  for (let day = 0; day < 366; day++) {
    const date = E.addDays('2026-11-11', day);
    const puzzle = E.generate(date);
    assert.deepEqual(puzzle, E.generate(date));
    assert.equal(countSolutions(puzzle), 1, date);
    assert(E.complete(puzzle.solution, puzzle.edges), date);
    const signature = JSON.stringify([puzzle.givens, puzzle.edges]);
    assert.notEqual(signature, previous, date);
    previous = signature;
  }
});

test('conflict feedback catches triples, excess symbols and edge contradictions', () => {
  const b = Array(36).fill(0);
  b[0] = b[1] = b[2] = 1;
  assert.deepEqual(E.conflicts(b, []), [0, 1, 2]);
  b.fill(0); b[0] = b[6] = b[18] = b[30] = 2;
  assert.equal(E.conflicts(b, []).length, 4);
  b.fill(0); b[0] = 1; b[1] = 2;
  assert.deepEqual(E.conflicts(b, [[0, 1, 1]]), [0, 1]);
  assert.deepEqual(E.conflicts(b, [[0, 1, 0]]), []);
  assert.equal(E.complete(Array(36).fill(0), []), false);
});
