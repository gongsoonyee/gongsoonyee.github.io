(function () {
    var input = document.getElementById('search-input');
    var idle = document.getElementById('search-idle');
    var results = document.getElementById('search-results');
    var recentBlock = document.getElementById('recent-block');
    var recentChips = document.getElementById('recent-chips');
    var clock = document.getElementById('icon-clock');
    var KEY = 'gongsoonyee-recent-searches';

    function load() {
        try { var list = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(list) ? list.filter(function (term) { return typeof term === 'string'; }).slice(0, 6) : []; }
        catch (e) { return []; }
    }

    function remember(term) {
        var list = load().filter(function (t) { return t !== term; });
        list.unshift(term);
        try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 6))); } catch (e) {}
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
            var icon = clock.cloneNode(true); icon.removeAttribute('id'); icon.removeAttribute('hidden'); icon.setAttribute('aria-hidden', 'true'); button.appendChild(icon);
            button.appendChild(document.createTextNode(term));
            button.addEventListener('click', function () { run(term, true); });
            recentChips.appendChild(button);
        });
    }

    function highlight(node, text, term) {
        var words = term.split(/\s+/).filter(Boolean).map(function (word) { return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
        if (!words.length) { node.textContent = text; return; }
        var pattern = new RegExp(words.sort(function (a, b) { return b.length - a.length; }).join('|'), 'gi');
        var start = 0, match;
        while ((match = pattern.exec(text))) {
            node.appendChild(document.createTextNode(text.slice(start, match.index)));
            var mark = document.createElement('mark'); mark.textContent = match[0]; node.appendChild(mark);
            start = match.index + match[0].length;
        }
        node.appendChild(document.createTextNode(text.slice(start)));
    }

    function run(term, store, syncURL) {
        term = term.trim();
        input.value = term;
        if (syncURL !== false) {
            var url = new URL(window.location.href);
            if (term) url.searchParams.set('q', term); else url.searchParams.delete('q');
            window.history.replaceState(null, '', url);
        }
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
        count.textContent = '“' + term + '” · ' + (hits.length ? hits.length + '개의 글' : '일치하는 글이 없습니다');
        results.appendChild(count);

        hits.forEach(function (hit) {
            var doc = documents[hit.ref];
            var link = document.createElement('a');
            link.className = 'search-hit';
            link.href = doc.url;
            var title = document.createElement('span');
            title.className = 'search-hit-title';
            highlight(title, doc.title, term);
            var meta = document.createElement('span');
            meta.className = 'search-hit-meta';
            meta.textContent = doc.date + ((doc.tags || []).length ? ' · ' + doc.tags.join(' · ') : '');
            var body = document.createElement('span');
            body.className = 'search-hit-body';
            var text = String(doc.body || '').replace(/\s+/g, ' ').trim();
            text = text.replace(/^\d{4}년 \d{1,2}월 \d{1,2}일 · @\S+\s*/, '');
            var positions = term.toLowerCase().split(/\s+/).filter(Boolean).map(function (word) { return text.toLowerCase().indexOf(word); }).filter(function (position) { return position >= 0; });
            var start = positions.length ? Math.max(0, Math.min.apply(null, positions) - 45) : 0;
            var snippet = (start ? '…' : '') + text.slice(start, start + 180) + (text.length > start + 180 ? '…' : '');
            highlight(body, snippet, term);
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

    var debounce;
    input.addEventListener('input', function () {
        clearTimeout(debounce);
        debounce = setTimeout(function () { run(input.value, false); }, 150);
    });

    document.getElementById('recent-clear').addEventListener('click', function () {
        try { localStorage.removeItem(KEY); } catch (e) {}
        renderRecent();
    });

    document.querySelectorAll('.search-suggest').forEach(function (button) {
        button.addEventListener('click', function () {
            run(button.getAttribute('data-q'), true);
        });
    });

    renderRecent();
    run(new URL(window.location.href).searchParams.get('q') || '', false, false);
    window.addEventListener('popstate', function () { run(new URL(window.location.href).searchParams.get('q') || '', false, false); });
    input.focus();
})();
