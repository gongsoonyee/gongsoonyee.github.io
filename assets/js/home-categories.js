(function () {
  var buttons = Array.from(document.querySelectorAll('[data-topic]'));
  var cards = Array.from(document.querySelectorAll('[data-home-topics]'));
  function select(topic, update) {
    if (!buttons.some(function (b) { return b.dataset.topic === topic; })) topic = 'all';
    var count = 0;
    cards.forEach(function (card) {
      var show = topic === 'all' || JSON.parse(card.dataset.homeTopics).includes(topic);
      card.hidden = !show; if (show) count++;
    });
    buttons.forEach(function (button) {
      var active = button.dataset.topic === topic;
      button.setAttribute('aria-pressed', String(active));
      if (active) document.getElementById('home-list-title').textContent = topic === 'all' ? 'All Stories' : '#' + topic;
    });
    document.getElementById('home-featured').hidden = topic !== 'all';
    document.getElementById('home-count').textContent = count + '개의 글';
    if (update) {
      var url = new URL(location.href);
      if (topic === 'all') url.searchParams.delete('tag'); else url.searchParams.set('tag', topic);
      history.pushState(null, '', url);
    }
  }
  buttons.forEach(function (button) { button.addEventListener('click', function () { select(button.dataset.topic, true); }); });
  window.addEventListener('popstate', function () { select(new URL(location.href).searchParams.get('tag') || 'all', false); });
  select(new URL(location.href).searchParams.get('tag') || 'all', false);
})();
