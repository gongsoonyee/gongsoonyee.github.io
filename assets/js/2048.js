(function () {
    'use strict';
    var root = document.getElementById('twenty48');
    if (!root) return;
    var engine = window.Game2048Engine;
    var el = function (id) { return document.getElementById(id + '-2048'); };
    if (!engine) { el('error').hidden = false; return; }
    var stateKey = 'gongsoonyee:2048:v1:state';
    var bestKey = 'gongsoonyee:2048:v1:best';
    var board, score = 0, continued = false, best = 0, history = [], gesture = null, invalidSave = false;
    var gameBoard = el('board');
    function validScore(value) { return Number.isSafeInteger(value) && value >= 0; }
    function storageWarning() { el('storage').hidden = false; }
    try {
        var savedBest = localStorage.getItem(bestKey);
        if (savedBest !== null && /^\d+$/.test(savedBest) && validScore(Number(savedBest))) best = Number(savedBest);
        var raw = localStorage.getItem(stateKey);
        if (raw) {
            var saved;
            try { saved = JSON.parse(raw); } catch (error) { invalidSave = true; }
            if (saved && saved.version === 1 && engine.validBoard(saved.board) && saved.board.some(function (value) { return value > 0; }) && validScore(saved.score) && typeof saved.continued === 'boolean') {
                board = saved.board.slice(); score = saved.score; continued = saved.continued;
            } else invalidSave = true;
        }
    } catch (error) { storageWarning(); }
    if (!board) board = engine.start();
    best = Math.max(best, score);
    for (var i = 0; i < 16; i += 1) {
        var tile = document.createElement('div');
        tile.className = 'tile-2048';
        tile.setAttribute('role', 'img');
        tile.dataset.cell = String(i);
        gameBoard.appendChild(tile);
    }
    function persist() {
        try {
            localStorage.setItem(bestKey, String(best));
            localStorage.setItem(stateKey, JSON.stringify({ version: 1, board: board, score: score, continued: continued }));
        } catch (error) { storageWarning(); }
    }
    function render(message) {
        var won = engine.hasWon(board) && !continued;
        var over = !engine.canMove(board);
        Array.prototype.forEach.call(gameBoard.children, function (tile, index) {
            var value = board[index];
            tile.textContent = value || '';
            tile.dataset.value = String(value);
            tile.dataset.large = String(value >= 128);
            tile.dataset.huge = String(value >= 16384);
            tile.setAttribute('aria-label', (Math.floor(index / 4) + 1) + '행 ' + (index % 4 + 1) + '열, ' + (value || '빈칸'));
        });
        el('score').textContent = String(score);
        el('best').textContent = String(best);
        el('undo').disabled = history.length === 0;
        el('finish').hidden = !(won || over);
        el('continue').hidden = !won || over;
        el('status').textContent = won ? (over ? '2048 달성! 더 움직일 수 없어요. 되돌리거나 새 게임을 시작하세요.' : '2048 달성! 계속 플레이하거나 새 게임을 시작하세요.') : over ? '더 움직일 수 없어요. 되돌리거나 새 게임을 시작하세요.' : message || '2048을 향해 한 칸씩. 천천히 움직여 보세요.';
        root.querySelectorAll('[data-direction]').forEach(function (button) { button.disabled = won || over; });
    }
    function move(direction) {
        if (!el('confirm').hidden || (engine.hasWon(board) && !continued) || !engine.canMove(board)) return;
        var next = engine.slide(board, direction);
        if (!next.moved) { render('이 방향으로는 움직일 수 없어요. 다른 방향을 골라 보세요.'); return; }
        history.push({ board: board.slice(), score: score, continued: continued });
        if (history.length > 100) history.shift();
        board = engine.spawn(next.board);
        score += next.score;
        best = Math.max(best, score);
        persist();
        render(next.score ? next.score + '점 획득 · 현재 ' + score + '점' : '이동했어요 · 현재 ' + score + '점');
    }
    function focusBoard() {
        gameBoard.focus({ preventScroll: true });
        gameBoard.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
    function reset() {
        board = engine.start(); score = 0; continued = false; history = [];
        el('confirm').hidden = true;
        persist(); render('새 게임을 시작했어요.'); focusBoard();
    }
    function requestReset() {
        if (score > 0 || history.length || board.filter(function (value) { return value > 0; }).length > 2 || engine.hasWon(board) || !engine.canMove(board)) {
            el('confirm').hidden = false;
            el('cancel').focus({ preventScroll: true });
        } else reset();
    }
    gameBoard.addEventListener('keydown', function (event) {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        var keys = { ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down', ArrowRight: 'right', a: 'left', w: 'up', s: 'down', d: 'right' };
        var direction = keys[event.key] || keys[event.key.toLowerCase()];
        if (direction) { event.preventDefault(); move(direction); }
    });
    gameBoard.addEventListener('pointerdown', function (event) {
        if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
        gameBoard.focus({ preventScroll: true });
        gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
        gameBoard.setPointerCapture(event.pointerId);
    });
    gameBoard.addEventListener('pointerup', function (event) {
        if (!gesture || gesture.id !== event.pointerId) return;
        var dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
        gesture = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
        move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });
    gameBoard.addEventListener('pointercancel', function () { gesture = null; });
    gameBoard.addEventListener('lostpointercapture', function () { gesture = null; });
    root.querySelectorAll('[data-direction]').forEach(function (button) {
        button.addEventListener('click', function () { move(button.dataset.direction); });
    });
    el('undo').addEventListener('click', function () {
        if (!history.length || !el('confirm').hidden) return;
        var previous = history.pop();
        board = previous.board; score = previous.score; continued = previous.continued;
        persist(); render('한 번의 이동을 되돌렸어요.');
    });
    el('new').addEventListener('click', requestReset);
    el('restart').addEventListener('click', requestReset);
    el('reset').addEventListener('click', reset);
    el('cancel').addEventListener('click', function () { el('confirm').hidden = true; focusBoard(); });
    el('continue').addEventListener('click', function () { continued = true; persist(); render('2048 다음 숫자에도 도전해 보세요.'); focusBoard(); });
    el('play').hidden = false;
    persist(); render(invalidSave ? '저장된 진행 상태를 읽을 수 없어 새 게임을 시작했어요.' : undefined);
}());
