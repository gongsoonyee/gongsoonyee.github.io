---
layout: null
sitemap: false
---

var documents = [{% for page in site.posts %}{
    "id": {{ forloop.index0 }},
    "url": {{ page.url | prepend: site.baseurl | prepend: site.url | jsonify }},
    "title": {{ page.title | jsonify }},
    "date": {{ page.date | date: "%Y년 %-m월 %-d일" | jsonify }},
    "body": {{ page.content | markdownify | strip_html | strip_newlines | jsonify }}
}{% unless forloop.last %}, {% endunless %}{% endfor %}];

var idx = {
    search: function (term) {
        var words = term.toLowerCase().split(/\s+/).filter(Boolean);
        return documents.filter(function (doc) {
            var text = (String(doc.title || '') + ' ' + doc.body).toLowerCase();
            return words.every(function (w) { return text.indexOf(w) !== -1; });
        }).map(function (doc) { return { ref: doc.id }; });
    }
};
