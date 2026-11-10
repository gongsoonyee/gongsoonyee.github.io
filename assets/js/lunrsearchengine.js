---
layout: null
sitemap: false
---

var documents = [{% for page in site.posts %}{
    "id": {{ forloop.index0 }},
    "url": {{ page.url | prepend: site.baseurl | prepend: site.url | jsonify }},
    "title": {{ page.title | jsonify }},
    "tags": {{ page.tags | jsonify }},
    "categories": {{ page.categories | jsonify }},
    "date": {{ page.date | date: "%Y년 %-m월 %-d일" | jsonify }},
    "body": {{ page.content | markdownify | newline_to_br | replace: '<br />', ' ' | replace: '</p>', ' ' | replace: '</h2>', ' ' | replace: '</h3>', ' ' | replace: '</h4>', ' ' | replace: '</li>', ' ' | strip_html | strip_newlines | jsonify }}
}{% unless forloop.last %}, {% endunless %}{% endfor %}];

var idx = {
    search: function (term) {
        var query = String(term || '').normalize('NFKC').toLowerCase().trim();
        var words = query.split(/\s+/).filter(Boolean);
        if (!words.length) return [];
        return documents.map(function (doc) {
            function normalized(value) { return String(value || '').normalize('NFKC').toLowerCase(); }
            var title = normalized(doc.title);
            var keywords = normalized((doc.tags || []).concat(doc.categories || []).join(' '));
            var body = normalized(doc.body);
            if (!words.every(function (word) { return title.includes(word) || keywords.includes(word) || body.includes(word); })) return null;
            var score = words.reduce(function (total, word) {
                return total + (title.includes(word) ? 12 : 0) + (keywords.includes(word) ? 6 : 0) + (body.includes(word) ? 1 : 0);
            }, 0) + (title.includes(query) ? 20 : 0);
            return { ref: doc.id, score: score };
        }).filter(Boolean).sort(function (a, b) { return b.score - a.score || a.ref - b.ref; });
    }
};
