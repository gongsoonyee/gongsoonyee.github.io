(function () {
  'use strict';
  const root = document.getElementById('grid-game');
  if (!root) return;
  const E = window.GridPuzzleEngine;
  const game = root.dataset.game;
  const isShikaku = game === 'shikaku';
  const el = id => document.getElementById('game-' + id);
  const START = '2026-11-01';
  const memory = new Map();
  const clone = value => JSON.parse(JSON.stringify(value));
  const dayKey = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  let today = dayKey(), selected, puzzle, state = [], hints = 0, history = [], cells = [], anchor = null, preview = [];
  let busy = false, dayChanged = false, drag = null, skipClick = false;
  function validDate(date) {
    return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date + 'T00:00:00Z')) && new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) === date;
  }
  function available(date) { return validDate(date) && date >= START && date <= today; }
  function initialState() { return isShikaku ? [] : [puzzle.clues.find(c => c.number === 1).cell]; }
  function done() { return isShikaku ? E.completeShikaku(state, puzzle) : E.completeZip(state, puzzle); }
  function key() { return 'gongsoonyee:' + game + ':v1:' + selected; }
  function fingerprint() { return JSON.stringify(puzzle.clues); }
  function warnStorage() { el('storage-warning').hidden = false; }
  function showNotice(message) { el('notice').textContent = message; el('notice').hidden = !message; }
  function rectCells(rect) { return E.rectCells(rect, puzzle.size); }
  function validState(value) {
    if (!Array.isArray(value)) return false;
    if (!isShikaku) return value.length > 0 && E.validZipPath(value, puzzle);
    const covered = new Set();
    for (const rect of value) {
      if (!Array.isArray(rect) || rect.length !== 4 || !rect.every(Number.isInteger) || !E.validateRect(rect, puzzle).ok) return false;
      for (const id of rectCells(rect)) { if (covered.has(id)) return false; covered.add(id); }
    }
    return true;
  }
  function persist() {
    const record = { version: 1, fingerprint: fingerprint(), state: clone(state), hints };
    memory.set(selected, record);
    try { localStorage.setItem(key(), JSON.stringify(record)); } catch (_) { warnStorage(); }
  }
  function restore() {
    state = initialState(); hints = 0; history = []; anchor = null; preview = []; drag = null;
    let record = memory.get(selected);
    try {
      const raw = record ? null : localStorage.getItem(key());
      if (raw) {
        try { record = JSON.parse(raw); } catch (_) { showNotice('저장된 기록을 읽을 수 없어 이 날짜의 퍼즐을 새로 열었어요.'); }
      }
    } catch (_) { warnStorage(); record = memory.get(selected); }
    if (record) {
      if (record.version === 1 && record.fingerprint === fingerprint() && Number.isSafeInteger(record.hints) && record.hints >= 0 && validState(record.state)) {
        state = clone(record.state); hints = record.hints;
      } else showNotice('저장된 기록을 읽을 수 없어 이 날짜의 퍼즐을 새로 열었어요.');
    }
  }
  function remember() {
    history.push({ state: clone(state), hints });
    if (history.length > 300) history.shift();
    el('reset-confirm').hidden = true;
  }
  function position(id) { return (Math.floor(id / 6) + 1) + '행 ' + (id % 6 + 1) + '열'; }
  function rectangle(a, b) { return [Math.min(Math.floor(a / 6), Math.floor(b / 6)), Math.min(a % 6, b % 6), Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) + 1, Math.abs(a % 6 - b % 6) + 1]; }
  function addRect(rect) {
    const check = E.validateRect(rect, puzzle);
    anchor = null; preview = [];
    if (!check.ok) { render(check.message || '숫자 하나와 같은 칸 수의 직사각형을 만들어 주세요.'); return; }
    const used = new Set(state.flatMap(rectCells));
    if (rectCells(rect).some(id => used.has(id))) { render('기존 영역과 겹쳐요. 지우려는 영역을 먼저 눌러 주세요.'); return; }
    remember(); state.push(rect); persist(); render();
  }
  function visitZip(id) {
    const existing = state.indexOf(id);
    if (existing >= 0) {
      if (existing === state.length - 1) return;
      remember(); state = state.slice(0, existing + 1); persist(); render('선택한 칸까지 되돌아왔어요.'); return;
    }
    const next = state.concat(id);
    if (!E.validZipPath(next, puzzle)) { render('이웃한 빈칸으로 이동하고, 숫자는 순서대로 지나가 주세요.'); return; }
    remember(); state = next; persist(); render();
  }
  function choose(id) {
    if (done()) return;
    if (!isShikaku) { visitZip(id); return; }
    if (anchor === null) {
      const existing = state.findIndex(rect => rectCells(rect).includes(id));
      if (existing >= 0) { remember(); state.splice(existing, 1); persist(); render('영역을 지웠어요.'); }
      else { anchor = id; preview = [id]; render('반대쪽 모서리를 선택해 주세요.'); }
    } else addRect(rectangle(anchor, id));
  }
  function cellAt(event) {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const button = target && target.closest('#game-board button[data-cell]');
    return button ? Number(button.dataset.cell) : null;
  }
  function makeBoard() {
    const board = el('board'); board.replaceChildren(); cells = [];
    for (let id = 0; id < 36; id++) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'tango-cell grid-cell'; button.dataset.cell = String(id);
      button.addEventListener('click', event => {
        if (skipClick && event.detail !== 0) { skipClick = false; return; }
        choose(id);
      });
      button.addEventListener('keydown', event => {
        const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -6, ArrowDown: 6 }[event.key];
        if (!delta) return;
        event.preventDefault();
        const target = id + delta;
        if (target >= 0 && target < 36 && (Math.abs(delta) === 6 || Math.floor(target / 6) === Math.floor(id / 6))) cells[target].focus();
      });
      board.append(button); cells.push(button);
    }
    board.onpointerdown = event => {
      if (event.button !== 0 || done()) return;
      const id = cellAt(event); if (id === null) return;
      skipClick = false;
      drag = { start: id, at: id, moved: false, pointer: event.pointerId };
      board.setPointerCapture(event.pointerId);
    };
    board.onpointermove = event => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const id = cellAt(event); if (id === null || id === drag.at) return;
      if (!drag.moved && !isShikaku) visitZip(drag.start);
      drag.moved = true; drag.at = id;
      if (isShikaku) { preview = rectCells(rectangle(drag.start, id)); render('손을 떼면 영역을 만들어요.'); }
      else visitZip(id);
    };
    board.onpointerup = event => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const finished = drag; drag = null;
      if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
      skipClick = true;
      if (finished.moved) { if (isShikaku) addRect(rectangle(finished.start, finished.at)); }
      else choose(finished.start);
    };
    board.onpointercancel = () => { drag = null; preview = []; anchor = null; render('선택을 취소했어요.'); };
  }
  function render(message) {
    const finished = done(), owners = Array(36).fill(-1);
    if (isShikaku) state.forEach((rect, index) => rectCells(rect).forEach(id => { owners[id] = index; }));
    const clueMap = new Map(puzzle.clues.map(clue => [clue.cell, isShikaku ? clue.area : clue.number]));
    cells.forEach((cell, id) => {
      cell.replaceChildren(); cell.style.boxShadow = '';
      cell.classList.toggle('is-preview', preview.includes(id));
      cell.classList.toggle('is-anchor', anchor === id);
      cell.classList.toggle('is-region', owners[id] >= 0);
      cell.classList.toggle('is-region-alt', owners[id] >= 0 && owners[id] % 2 === 1);
      cell.classList.toggle('is-visited', !isShikaku && state.includes(id));
      cell.classList.toggle('is-endpoint', !isShikaku && state[state.length - 1] === id);
      let label = position(id);
      if (clueMap.has(id)) {
        const clue = document.createElement('span'); clue.className = 'grid-clue'; clue.textContent = String(clueMap.get(id)); cell.append(clue);
        label += isShikaku ? ', 넓이 ' + clueMap.get(id) + ' 단서' : ', 숫자 ' + clueMap.get(id);
      }
      if (isShikaku && owners[id] >= 0) {
        const [top, left, height, width] = state[owners[id]], row = Math.floor(id / 6), col = id % 6;
        const borders = [];
        if (row === top) borders.push('inset 0 2px #586454');
        if (row === top + height - 1) borders.push('inset 0 -2px #586454');
        if (col === left) borders.push('inset 2px 0 #586454');
        if (col === left + width - 1) borders.push('inset -2px 0 #586454');
        cell.style.boxShadow = borders.join(',');
        label += ', 영역 ' + (owners[id] + 1) + ', 누르면 영역 삭제';
        if (row === top && col === left) { const badge = document.createElement('span'); badge.className = 'grid-region-label'; badge.textContent = 'R' + (owners[id] + 1); cell.append(badge); }
      }
      if (!isShikaku && state.includes(id)) label += ', 경로 ' + (state.indexOf(id) + 1) + '번째 칸';
      if (anchor === id) label += ', 시작 모서리 선택됨';
      cell.setAttribute('aria-label', label); cell.setAttribute('aria-disabled', String(finished));
    });
    const svg = el('path'); svg.replaceChildren();
    if (!isShikaku && state.length) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      line.setAttribute('points', state.map(id => ((id % 6) * 100 + 50) + ',' + (Math.floor(id / 6) * 100 + 50)).join(' ')); svg.append(line);
      const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const id = state[state.length - 1]; head.setAttribute('cx', (id % 6) * 100 + 50); head.setAttribute('cy', Math.floor(id / 6) * 100 + 50); head.setAttribute('r', '10'); svg.append(head);
    }
    const filled = isShikaku ? owners.filter(v => v >= 0).length : state.length;
    el('progress').textContent = filled + ' / 36'; el('hints').textContent = String(hints);
    el('undo').disabled = !history.length; el('hint').disabled = finished;
    el('reset').disabled = JSON.stringify(state) === JSON.stringify(initialState()) && hints === 0;
    el('status').textContent = finished ? '완성했어요! 오늘의 퍼즐을 풀었네요.' : message || (isShikaku ? '숫자를 품은 직사각형을 만들어 보세요.' : '빈칸을 남기지 않고 길을 이어 보세요.');
    root.classList.toggle('is-complete', finished);
  }
  function dateRange() {
    el('date').min = START; el('date').max = today; el('today').hidden = selected === today;
    el('day-label').textContent = selected === today ? '오늘의 퍼즐' : '지난 퍼즐';
    el('new-day').hidden = !dayChanged || selected === today;
  }
  function openDate(date, push, notice) {
    if (!available(date)) return;
    const generated = E.generate(game, date);
    selected = date; puzzle = generated; showNotice(notice || ''); restore();
    el('date').value = date; el('date-title').dateTime = date; el('date-title').textContent = date.replaceAll('-', '. ');
    el('reset-confirm').hidden = true; dateRange(); makeBoard(); render();
    if (push) { const url = new URL(location.href); url.searchParams.set('date', date); window.history.pushState(null, '', url); }
  }
  function fromURL() {
    const requested = new URL(location.href).searchParams.get('date');
    openDate(requested && available(requested) ? requested : today, false, requested && !available(requested) ? '열린 날짜의 퍼즐을 선택해 주세요. 오늘의 퍼즐을 열었어요.' : '');
  }
  async function load() {
    if (busy) return; busy = true; el('loading').hidden = false; el('error').hidden = true;
    try {
      if (!E) throw new Error('Missing puzzle engine');
      today = dayKey();
      if (today < START) { el('loading').textContent = '첫 퍼즐은 ' + START + ' 한국 시간 자정에 열려요.'; return; }
      await new Promise(resolve => window.requestAnimationFrame(resolve));
      fromURL(); el('play').hidden = false; el('loading').hidden = true;
    } catch (_) { el('loading').hidden = true; el('play').hidden = true; el('error').hidden = false; }
    finally { busy = false; }
  }
  function safeOpen(date, push) {
    try { openDate(date, push); } catch (_) { el('play').hidden = true; el('error').hidden = false; }
  }
  function goToday() { today = dayKey(); dayChanged = false; safeOpen(today, true); }
  el('retry').addEventListener('click', () => { if (!E) window.location.reload(); else load(); });
  el('today').addEventListener('click', goToday); el('new-today').addEventListener('click', goToday);
  el('date').addEventListener('change', () => { const date = el('date').value; if (available(date)) safeOpen(date, true); else { el('date').value = selected; showNotice('열린 날짜를 선택해 주세요. 미래 날짜는 아직 플레이할 수 없어요.'); } });
  el('undo').addEventListener('click', () => {
    if (!history.length) return; const previous = history.pop(); state = previous.state; hints = previous.hints; anchor = null; preview = []; el('reset-confirm').hidden = true; persist(); render('한 수 되돌렸어요.');
  });
  el('hint').addEventListener('click', () => {
    if (done()) return; remember(); anchor = null; preview = [];
    if (isShikaku) {
      const target = puzzle.solution.find(rect => !state.some(placed => JSON.stringify(placed) === JSON.stringify(rect)));
      const wanted = new Set(rectCells(target));
      state = state.filter(rect => !rectCells(rect).some(id => wanted.has(id))); state.push(target.slice());
    } else {
      let length = 0; while (length < state.length && state[length] === puzzle.solution[length]) length++;
      state = puzzle.solution.slice(0, Math.min(length + 1, puzzle.solution.length));
    }
    hints++; persist(); render(isShikaku ? '정답 영역 하나를 알려드렸어요.' : '정답 방향으로 경로를 한 칸 이어드렸어요.');
  });
  el('reset').addEventListener('click', () => { el('reset-confirm').hidden = false; el('reset-cancel').focus(); });
  el('reset-cancel').addEventListener('click', () => { el('reset-confirm').hidden = true; el('reset').focus(); });
  el('reset-yes').addEventListener('click', () => {
    state = initialState(); hints = 0; history = []; anchor = null; preview = [];
    el('reset-confirm').hidden = true; persist(); render('처음 상태로 돌아왔어요.');
    cells[0].focus({ preventScroll: true });
    el('board').scrollIntoView({ block: 'center' });
  });
  window.addEventListener('popstate', () => { if (puzzle) { try { fromURL(); } catch (_) { el('error').hidden = false; } } });
  function checkDay() { const next = dayKey(); if (next !== today) { today = next; dayChanged = true; if (selected) dateRange(); } }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDay(); }); window.setInterval(checkDay, 30000);
  load();
})();
