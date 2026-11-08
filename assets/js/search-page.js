(function () {
    var input = document.getElementById('search-input');
    var idle = document.getElementById('search-idle');
    var results = document.getElementById('search-results');
    var recentBlock = document.getElementById('recent-block');
    var recentChips = document.getElementById('recent-chips');
    var clock = document.getElementById('icon-clock');
    var KEY = 'gongsoonyee-recent-searches';

    function load() {
        try { return JSON.parse(localStorage.getItem(KEY)) || []; }
        catch (e) { return []; }
    }

    function remember(term) {
        var list = load().filter(function (t) { return t !== term; });
        list.unshift(term);
        localStorage.setItem(KEY, JSON.stringify(list.slice(0, 6)));
        renderRecent();
    }

    function renderRecent() {
        var list = load();
        recentChips.innerHTML = '';
        recentBlock.hidden = list.length === 0;
        list.forEach(function (term) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'search-chip';
            button.appendChild(clock.cloneNode(true));
            button.appendChild(document.createTextNode(term));
            button.addEventListener('click', function () { run(term, true); });
            recentChips.appendChild(button);
        });
    }

    function run(term, store) {
        term = term.trim();
        input.value = term;
        if (!term) {
            results.hidden = true;
            results.innerHTML = '';
            idle.hidden = false;
            return;
        }
        if (store) remember(term);
        var hits = idx.search(term);
        idle.hidden = true;
        results.hidden = false;
        results.innerHTML = '';

        var count = document.createElement('p');
        count.className = 'search-count';
        count.textContent = hits.length ? hits.length + '개의 글' : '일치하는 글이 없습니다';
        results.appendChild(count);

        hits.forEach(function (hit) {
            var doc = documents[hit.ref];
            var link = document.createElement('a');
            link.className = 'search-hit';
            link.href = doc.url;
            var title = document.createElement('span');
            title.className = 'search-hit-title';
            title.textContent = doc.title;
            var meta = document.createElement('span');
            meta.className = 'search-hit-meta';
            meta.textContent = doc.date;
            var body = document.createElement('span');
            body.className = 'search-hit-body';
            var text = String(doc.body || '').replace(/\s+/g, ' ').trim();
            body.textContent = text.length > 140 ? text.slice(0, 140) + '…' : text;
            link.appendChild(title);
            link.appendChild(meta);
            link.appendChild(body);
            results.appendChild(link);
        });
    }

    document.getElementById('search-form').addEventListener('submit', function (e) {
        e.preventDefault();
        run(input.value, true);
    });

    input.addEventListener('input', function () {
        if (!input.value.trim()) run('', false);
    });

    document.getElementById('recent-clear').addEventListener('click', function () {
        localStorage.removeItem(KEY);
        renderRecent();
    });

    document.querySelectorAll('.search-suggest').forEach(function (button) {
        button.addEventListener('click', function () {
            run(button.getAttribute('data-q'), true);
        });
    });

    renderRecent();
    input.focus();
})();
