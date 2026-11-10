(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Game2048Engine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SIZE = 4;
  const MAX_TILE = 2 ** 30;
  const DIRECTIONS = ['up', 'down', 'left', 'right'];
  function validBoard(board) {
    return Array.isArray(board) && board.length === 16 && Array.from(board).every(value =>
      Number.isInteger(value) && (value === 0 || (value >= 2 && value <= MAX_TILE && Number.isInteger(Math.log2(value)))));
  }
  function assertBoard(board) {
    if (!validBoard(board)) throw new TypeError('Invalid 2048 board');
  }
  function lineCells(direction, line) {
    return Array.from({ length: SIZE }, (_, step) => {
      if (direction === 'left') return line * SIZE + step;
      if (direction === 'right') return line * SIZE + SIZE - 1 - step;
      if (direction === 'up') return step * SIZE + line;
      return (SIZE - 1 - step) * SIZE + line;
    });
  }
  function slide(board, direction) {
    assertBoard(board);
    if (!DIRECTIONS.includes(direction)) throw new TypeError('Invalid 2048 direction');
    const result = Array(16).fill(0), merged = [];
    let score = 0;
    for (let line = 0; line < SIZE; line++) {
      const ids = lineCells(direction, line);
      const values = ids.map(id => board[id]).filter(Boolean);
      let destination = 0;
      for (let source = 0; source < values.length; source++) {
        let value = values[source];
        if (source + 1 < values.length && value === values[source + 1]) {
          value *= 2;
          if (value > MAX_TILE) throw new RangeError('2048 tile limit reached');
          score += value; merged.push(ids[destination]); source++;
        }
        result[ids[destination++]] = value;
      }
    }
    return { board: result, moved: result.some((value, i) => value !== board[i]), score, merged };
  }
  function sample(random) {
    if (typeof random !== 'function') throw new TypeError('Invalid random source');
    const value = random();
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Random sample must be in [0, 1)');
    return value;
  }
  function spawn(board, random = Math.random) {
    assertBoard(board);
    if (typeof random !== 'function') throw new TypeError('Invalid random source');
    const result = board.slice();
    const empty = result.map((value, i) => value === 0 ? i : -1).filter(i => i >= 0);
    if (!empty.length) return result;
    const cell = empty[Math.floor(sample(random) * empty.length)];
    result[cell] = sample(random) < 0.9 ? 2 : 4;
    return result;
  }
  function start(random = Math.random) {
    return spawn(spawn(Array(16).fill(0), random), random);
  }
  function canMove(board) {
    if (!validBoard(board)) return false;
    if (board.includes(0)) return true;
    return board.some((value, i) => (i % SIZE < SIZE - 1 && value === board[i + 1]) || (i < 12 && value === board[i + SIZE]));
  }
  function hasWon(board) {
    return validBoard(board) && board.some(value => value >= 2048);
  }
  return { validBoard, slide, spawn, start, canMove, hasWon };
});
