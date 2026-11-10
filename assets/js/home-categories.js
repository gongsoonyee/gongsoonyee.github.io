(function () {
  var buttons = Array.from(document.querySelectorAll('[data-topic]'));
  var cards = Array.from(document.querySelectorAll('[data-home-topics]'));
  var currentTopic = 'all';
  var pagination = document.getElementById('home-pagination');
  function select(topic, update, requestedPage) {
    if (!buttons.some(function (b) { return b.dataset.topic === topic; })) topic = 'all';
    currentTopic = topic;
    var matched = cards.filter(function (card) { return topic === 'all' || JSON.parse(card.dataset.homeTopics).includes(topic); });
    var pages = Math.max(1, Math.ceil(matched.length / 6));
    var page = Math.min(pages, Math.max(1, parseInt(requestedPage, 10) || 1));
    cards.forEach(function (card) { card.hidden = true; });
    matched.slice((page - 1) * 6, page * 6).forEach(function (card) { card.hidden = false; });
    pagination.replaceChildren();
    pagination.hidden = pages <= 1;
    function pageButton(label, target, disabled, active) {
      var button = document.createElement('button');
      button.type = 'button'; button.textContent = label; button.disabled = disabled;
      if (active) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', function () { select(currentTopic, true, target); document.getElementById('home-stories').scrollIntoView({ block: 'start' }); });
      pagination.appendChild(button);
    }
    pageButton('← 이전', page - 1, page === 1, false);
    for (var i = 1; i <= pages; i++) pageButton(String(i), i, false, i === page);
    pageButton('다음 →', page + 1, page === pages, false);
    buttons.forEach(function (button) {
      var active = button.dataset.topic === topic;
      button.setAttribute('aria-pressed', String(active));
      if (active) document.getElementById('home-list-title').textContent = topic === 'all' ? 'All Stories' : '#' + topic;
    });
    document.getElementById('home-featured').hidden = topic !== 'all';
    document.getElementById('home-count').textContent = matched.length + '개의 글 · ' + page + ' / ' + pages + '페이지';
    if (update) {
      var url = new URL(location.href);
      if (topic === 'all') url.searchParams.delete('tag'); else url.searchParams.set('tag', topic);
      if (page > 1) url.searchParams.set('page', String(page)); else url.searchParams.delete('page');
      history.pushState(null, '', url);
    }
  }
  buttons.forEach(function (button) { button.addEventListener('click', function () { select(button.dataset.topic, true); }); });
  window.addEventListener('popstate', function () { select(new URL(location.href).searchParams.get('tag') || 'all', false, new URL(location.href).searchParams.get('page')); });
  select(new URL(location.href).searchParams.get('tag') || 'all', false, new URL(location.href).searchParams.get('page'));
})();
