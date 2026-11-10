(function () {
  'use strict';
  const root = document.getElementById('tango');
  if (!root) return;
  const E = window.TangoEngine;
  const el = id => document.getElementById('tango-' + id);
  const sun = '<svg class="tango-sun" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="7" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 2v3M16 27v3M2 16h3M27 16h3M6.1 6.1l2.1 2.1M23.8 23.8l2.1 2.1M6.1 25.9l2.1-2.1M23.8 8.2l2.1-2.1"/></g></svg>';
  const moon = '<svg class="tango-moon" viewBox="0 0 32 32" aria-hidden="true"><path d="M24.9 21.2A11.5 11.5 0 0 1 10.8 7.1 11.5 11.5 0 1 0 24.9 21.2Z" fill="currentColor"/></svg>';
  let bank, end, selected, puzzle, board, hints = 0, history = [], cells = [], today = E ? E.dayKey() : '';
  let busy = false, dayChanged = false;
  const sessionProgress = new Map();
  const names = ['빈칸', '해', '달'];
  function warnStorage() { el('storage-warning').hidden = false; }
  function storageKey() { return 'gongsoonyee:tango:v1:' + selected; }
  function persist() {
    const saved = { version: 1, board: board.slice(), hints };
    sessionProgress.set(selected, saved);
    try { localStorage.setItem(storageKey(), JSON.stringify(saved)); }
    catch (_) { warnStorage(); }
  }
  function isBoard(value) {
    return Array.isArray(value) && value.length === 36 && value.every((v, i) => Number.isInteger(v) && v >= 0 && v <= 2 && (!puzzle.givens[i] || v === puzzle.givens[i]));
  }
  function restore() {
    board = puzzle.givens.slice(); hints = 0; history = [];
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) {
        let saved;
        try { saved = JSON.parse(raw); } catch (_) { saved = null; }
        if (saved && saved.version === 1 && isBoard(saved.board) && Number.isInteger(saved.hints) && saved.hints >= 0) {
          board = saved.board.slice(); hints = saved.hints;
        } else {
          el('date-notice').textContent = '저장된 기록을 읽을 수 없어 이 날짜의 퍼즐을 새로 열었어요.';
          el('date-notice').hidden = false;
        }
      }
    } catch (_) {
      warnStorage();
      const saved = sessionProgress.get(selected);
      if (saved && isBoard(saved.board)) { board = saved.board.slice(); hints = saved.hints; }
    }
  }
  function maximumDate() { return today < end ? today : end; }
  function available(date) { return E.validDate(date) && date >= bank.start && date <= maximumDate(); }
  function refreshDateRange() {
    el('date').min = bank.start; el('date').max = maximumDate();
    el('today').hidden = selected === today || today < bank.start || today > end;
    el('day-label').textContent = selected === today ? '오늘의 퍼즐' : '지난 퍼즐';
    el('new-day').hidden = !dayChanged || selected === today || today < bank.start || today > end;
  }
  function showDateNotice(message) {
    el('date-notice').textContent = message;
    el('date-notice').hidden = !message;
  }
  function position(index) { return (Math.floor(index / 6) + 1) + '행 ' + (index % 6 + 1) + '열'; }
  function makeBoard() {
    const grid = el('board'); grid.replaceChildren(); cells = [];
    for (let i = 0; i < 36; i++) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'tango-cell'; button.dataset.cell = String(i);
      button.addEventListener('click', () => {
        if (puzzle.givens[i] || E.complete(board, puzzle.edges)) return;
        remember(); board[i] = (board[i] + 1) % 3; persist(); render();
      });
      button.addEventListener('keydown', event => {
        const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -6, ArrowDown: 6 };
        if (!(event.key in offsets)) return;
        event.preventDefault();
        const delta = offsets[event.key];
        let target = i + delta;
        while (target >= 0 && target < 36) {
          if (!cells[target].disabled) { cells[target].focus(); break; }
          target += delta;
        }
      });
      cells.push(button); grid.append(button);
    }
    const edges = el('edges'); edges.replaceChildren();
    for (const [a, b, same] of puzzle.edges) {
      const mark = document.createElement('span'); mark.className = 'tango-edge'; mark.textContent = same ? '=' : '×';
      mark.style.left = (((a % 6 + b % 6) / 2 + .5) * 100 / 6) + '%';
      mark.style.top = (((Math.floor(a / 6) + Math.floor(b / 6)) / 2 + .5) * 100 / 6) + '%';
      edges.append(mark);
    }
  }
  function render(message) {
    const bad = new Set(E.conflicts(board, puzzle.edges));
    const done = E.complete(board, puzzle.edges);
    cells.forEach((cell, i) => {
      let content = board[i] === 1 ? sun : board[i] === 2 ? moon : '';
      if (puzzle.givens[i]) content += '<span class="tango-fixed-dot" aria-hidden="true"></span>';
      if (bad.has(i)) content += '<span class="tango-conflict-mark" aria-hidden="true">!</span>';
      cell.innerHTML = content;
      cell.disabled = Boolean(puzzle.givens[i]);
      cell.setAttribute('aria-disabled', done || puzzle.givens[i] ? 'true' : 'false');
      cell.classList.toggle('is-conflict', bad.has(i));
      const constraints = puzzle.edges.filter(([a,b]) => a === i || b === i).map(([a,b,same]) => position(a === i ? b : a) + '과 ' + (same ? '같은 모양' : '다른 모양')).join(', ');
      cell.setAttribute('aria-label', position(i) + ', ' + names[board[i]] + (puzzle.givens[i] ? ', 고정 단서' : '') + (bad.has(i) ? ', 규칙 위반' : '') + (constraints ? '. ' + constraints : ''));
    });
    el('progress').textContent = board.filter(Boolean).length + ' / 36';
    el('hints').textContent = String(hints);
    el('undo').disabled = !history.length;
    el('hint').disabled = done;
    el('reset').disabled = !board.some((v,i) => v !== puzzle.givens[i]) && hints === 0;
    el('status').textContent = message || (done ? '완성했어요! 해와 달의 균형을 찾았네요.' : bad.size ? '! 표시된 칸의 규칙을 다시 살펴보세요.' : '차근차근 균형을 맞춰 보세요.');
    root.classList.toggle('is-complete', done);
  }
  function remember() {
    history.push({ board: board.slice(), hints });
    if (history.length > 200) history.shift();
    el('reset-confirm').hidden = true;
  }
  function openDate(date, push, notice) {
    if (!available(date)) return;
    selected = date;
    const index = Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(bank.start + 'T00:00:00Z')) / 86400000);
    puzzle = bank.puzzles[index];
    showDateNotice(notice || '');
    restore();
    el('date').value = selected;
    el('date-title').dateTime = selected;
    el('date-title').textContent = selected.replaceAll('-', '. ');
    el('reset-confirm').hidden = true;
    refreshDateRange(); makeBoard(); render();
    if (push) {
      const url = new URL(location.href); url.searchParams.set('date', selected);
      window.history.pushState(null, '', url);
    }
  }
  function goToday() {
    today = E.dayKey();
    if (available(today)) { dayChanged = false; openDate(today, true); }
  }
  function fromURL() {
    const requested = new URL(location.href).searchParams.get('date');
    const fallback = maximumDate();
    let notice = '';
    if (requested && !available(requested)) notice = '선택한 날짜의 퍼즐은 아직 열리지 않았거나 제공 범위를 벗어났어요.';
    if (today > end && !requested) notice = '오늘의 새 퍼즐은 아직 준비되지 않았어요. 마지막으로 준비된 지난 퍼즐을 열었어요.';
    openDate(requested && available(requested) ? requested : fallback, false, notice);
  }
  function validateBank(data) {
    if (!data || data.version !== 1 || !E.validDate(data.start) || !Array.isArray(data.puzzles) || !data.puzzles.length) throw new Error('Invalid bank');
    for (const p of data.puzzles) {
      if (!p || !Array.isArray(p.givens) || p.givens.length !== 36 || !p.givens.every(v => Number.isInteger(v) && v >= 0 && v <= 2) || !Array.isArray(p.solution) || p.solution.length !== 36 || !p.solution.every(v => v === 1 || v === 2) || !p.givens.every((v,i) => !v || v === p.solution[i]) || !Array.isArray(p.edges) || !p.edges.every(edge => Array.isArray(edge) && edge.length === 3 && edge.every(Number.isInteger) && edge[0] >= 0 && edge[1] < 36 && edge[1] > edge[0] && (edge[1] === edge[0] + 6 || (edge[1] === edge[0] + 1 && Math.floor(edge[0] / 6) === Math.floor(edge[1] / 6))) && (edge[2] === 0 || edge[2] === 1)) || !E.complete(p.solution, p.edges)) throw new Error('Invalid puzzle');
    }
    return data;
  }
  async function load() {
    if (busy) return;
    busy = true; el('loading').hidden = false; el('load-error').hidden = true;
    try {
      if (!E) throw new Error('Missing engine');
      const response = await fetch(root.dataset.bankUrl);
      if (!response.ok) throw new Error('Bank unavailable');
      bank = validateBank(await response.json());
      end = E.addDays(bank.start, bank.puzzles.length - 1); today = E.dayKey();
      if (today < bank.start) {
        el('loading').textContent = '첫 퍼즐은 ' + bank.start + ' 한국 시간 자정에 열려요.';
        return;
      }
      el('coverage').textContent = '준비된 퍼즐: ' + bank.start + ' ~ ' + end;
      fromURL(); el('play').hidden = false; el('loading').hidden = true;
    } catch (_) { el('loading').hidden = true; el('load-error').hidden = false; }
    finally { busy = false; }
  }
  el('retry').addEventListener('click', load);
  el('today').addEventListener('click', goToday);
  el('new-today').addEventListener('click', goToday);
  el('date').addEventListener('change', () => {
    if (available(el('date').value)) openDate(el('date').value, true);
    else { el('date').value = selected; showDateNotice('열린 날짜를 선택해 주세요. 미래 날짜는 아직 플레이할 수 없어요.'); }
  });
  el('undo').addEventListener('click', () => {
    if (!history.length) return;
    const previous = history.pop(); board = previous.board; hints = previous.hints;
    el('reset-confirm').hidden = true; persist(); render('한 수 되돌렸어요.');
  });
  el('hint').addEventListener('click', () => {
    if (E.complete(board, puzzle.edges)) return;
    const i = board.findIndex((v, index) => v !== puzzle.solution[index]);
    if (i < 0) return;
    remember(); board[i] = puzzle.solution[i]; hints++; persist(); render(E.complete(board, puzzle.edges) ? undefined : position(i) + '의 정답을 알려드렸어요.');
    cells[i].focus();
  });
  el('reset').addEventListener('click', () => { el('reset-confirm').hidden = false; el('reset-cancel').focus(); });
  el('reset-cancel').addEventListener('click', () => { el('reset-confirm').hidden = true; el('reset').focus(); });
  el('reset-yes').addEventListener('click', () => {
    history = []; board = puzzle.givens.slice(); hints = 0; el('reset-confirm').hidden = true;
    persist(); render('처음 상태로 돌아왔어요.'); cells.find(cell => !cell.disabled).focus();
  });
  window.addEventListener('popstate', () => { if (bank) fromURL(); });
  function checkDay() {
    if (!bank || !selected) return;
    const next = E.dayKey();
    if (next !== today) {
      today = next; dayChanged = true; refreshDateRange();
      if (today > end) showDateNotice('오늘의 새 퍼즐은 아직 준비되지 않았어요. 지난 퍼즐은 계속 풀 수 있어요.');
    }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDay(); });
  window.setInterval(checkDay, 30000);
  load();
})();
