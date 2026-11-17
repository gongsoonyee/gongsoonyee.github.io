(function () {
  'use strict';
  const $ = id => document.getElementById(id), fields = { left: $('diff-left'), right: $('diff-right') };
  const history = []; let hunks = [], active = -1, timer;
  const snapshot = () => ({ left: fields.left.value, right: fields.right.value });
  function save() { history.push(snapshot()); if (history.length > 50) history.shift(); }
  function notify(message) { $('diff-message').textContent = message; }
  function updateCounts() {
    for (const side of ['left', 'right']) {
      const c = TextDiff.count(fields[side].value);
      $('count-' + side).textContent = `${c.characters.toLocaleString()}자 · 공백 제외 ${c.compact.toLocaleString()}자 · ${c.words.toLocaleString()}단어 · ${c.lines.toLocaleString()}줄`;
    }
  }
  function navigate(index, scroll = true) {
    active = hunks.length ? (index + hunks.length) % hunks.length : -1;
    document.querySelectorAll('.diff-hunk').forEach((el, i) => el.classList.toggle('is-current', i === active));
    $('diff-position').textContent = active < 0 ? '' : `${active + 1} / ${hunks.length}`;
    if (scroll && active >= 0) $('diff-hunk-' + active).scrollIntoView({ block: 'nearest' });
  }
  function render() {
    clearTimeout(timer); updateCounts();
    const { left, right } = snapshot();
    const result = TextDiff.compare(left, right, $('diff-unit').value, $('diff-ignore').checked);
    hunks = result.hunks;
    $('diff-total').textContent = hunks.length;
    $('diff-summary').textContent = !left && !right ? '양쪽에 텍스트를 입력하면 자동으로 비교해요.' : !hunks.length ? ($('diff-ignore').checked ? '공백 차이를 제외하면 두 문서가 같아요.' : '두 문서가 같아요.') : `${hunks.length}개의 변경 구간이 있어요. 반영할 방향을 선택하세요.`;
    $('diff-limit').hidden = !result.coarse;
    $('diff-undo').disabled = !history.length;
    $('diff-jump').disabled = !hunks.length;
    $('diff-prev').disabled = $('diff-next').disabled = !hunks.length;
    document.querySelectorAll('[data-full]').forEach(el => { el.disabled = left === right; });
    const container = $('diff-hunks'); container.replaceChildren();
    hunks.forEach((h, index) => {
      const article = document.createElement('article'); article.className = 'diff-hunk'; article.id = 'diff-hunk-' + index;
      const bar = document.createElement('div'); bar.className = 'diff-hunk-bar';
      const title = document.createElement('h3'); title.textContent = `변경 ${index + 1} · ${!h.left ? '오른쪽에만 있음' : !h.right ? '왼쪽에만 있음' : '내용 다름'}`; bar.append(title);
      const actions = document.createElement('div');
      for (const side of ['left', 'right']) {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.merge = side; button.dataset.index = index;
        button.textContent = side === 'left' ? '← 왼쪽에 반영' : '오른쪽에 반영 →';
        button.setAttribute('aria-label', `변경 ${index + 1}, ${side === 'left' ? '오른쪽 내용을 왼쪽에 반영' : '왼쪽 내용을 오른쪽에 반영'}`);
        button.addEventListener('click', () => {
          save(); fields[side].value = TextDiff.merge(fields.left.value, fields.right.value, h, side); render();
          navigate(Math.min(index, hunks.length - 1), false); $('diff-undo').focus(); notify('변경 구간을 반영했어요. 되돌리기로 복구할 수 있어요.');
        }); actions.append(button);
      }
      bar.append(actions); article.append(bar);
      const texts = document.createElement('div'); texts.className = 'diff-hunk-texts';
      for (const side of ['left', 'right']) {
        const pre = document.createElement('pre'), label = document.createElement('small'), mark = document.createElement('mark');
        label.textContent = side === 'left' ? '왼쪽' : '오른쪽'; mark.textContent = h[side] || '(내용 없음)'; pre.append(label, mark); texts.append(pre);
      }
      article.append(texts); container.append(article);
    });
    navigate(Math.max(0, Math.min(active, hunks.length - 1)), false);
  }
  for (const side of ['left', 'right']) {
    fields[side].addEventListener('beforeinput', save);
    fields[side].addEventListener('input', () => { clearTimeout(timer); updateCounts(); document.querySelectorAll('[data-merge], #diff-prev, #diff-next').forEach(button => { button.disabled = true; }); timer = setTimeout(render, 200); });
  }
  $('diff-jump').addEventListener('click', () => navigate(Math.max(active, 0)));
  $('diff-unit').addEventListener('change', render); $('diff-ignore').addEventListener('change', render);
  $('diff-prev').addEventListener('click', () => navigate(active - 1)); $('diff-next').addEventListener('click', () => navigate(active + 1));
  $('diff-undo').addEventListener('click', () => { const previous = history.pop(); if (!previous) return; fields.left.value = previous.left; fields.right.value = previous.right; render(); notify('이전 내용으로 되돌렸어요.'); });
  document.querySelectorAll('[data-full]').forEach(button => button.addEventListener('click', () => { save(); const side = button.dataset.full; fields[side].value = fields[side === 'left' ? 'right' : 'left'].value; render(); notify('문서 전체를 반영했어요. 되돌리기로 복구할 수 있어요.'); }));
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const field = fields[button.dataset.copy];
    try { await navigator.clipboard.writeText(field.value); notify('텍스트를 복사했어요.'); }
    catch (_) { field.focus(); field.select(); notify('자동 복사를 사용할 수 없어요. 선택한 텍스트를 Ctrl+C 또는 ⌘C로 복사하세요.'); }
  }));
  document.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', () => {
    const side = button.dataset.download, url = URL.createObjectURL(new Blob([fields[side].value], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `document-${side}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('TXT 파일을 저장했어요.');
  }));
  render();
})();
