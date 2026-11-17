/* Plain-text comparison. No network or persistent storage. */
(function (root) {
  'use strict';
  const segment = (text, granularity) => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) return Array.from(new Intl.Segmenter('ko', { granularity }).segment(text), x => x.segment);
    if (granularity === 'grapheme') return Array.from(text);
    return text.match(granularity === 'sentence' ? /[^.!?。！？\n]+[.!?。！？\n]*|[.!?。！？\n]+/gu : /\s+|[^\s]+/gu) || [];
  };
  function smartBlocks(text) {
    const starts = []; let offset = 0, fence = null;
    const lines = text.match(/[^\n]*\n|[^\n]+$/g) || [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/\r?\n$/, '');
      const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1][0];
        else if (fence === marker[1][0]) fence = null;
      } else if (!fence) {
        const heading = /^\s{0,3}#{1,6}\s+\S/.test(line) || /^\s*(?:제\s*)?\d+\s*[장절부편](?:\s|[.:：]|$)/u.test(line) || /^\s*(?:chapter|section|part)\s+(?:\d+|[ivxlcdm]+)\b/i.test(line) || /^\s*\d+(?:\.\d+)+[.)]?\s+\S/.test(line);
        const setext = line.trim() && i + 1 < lines.length && /^\s{0,3}(?:={3,}|-{3,})\s*$/.test(lines[i + 1]);
        if (heading || setext) starts.push({ start: offset, heading: line.trim() });
      }
      offset += lines[i].length;
    }
    if (starts.length) {
      if (starts[0].start) starts.unshift({ start: 0, heading: null });
      return { mode: 'chapter', blocks: starts.map((entry, i) => ({ value: text.slice(entry.start, starts[i + 1]?.start ?? text.length), heading: entry.heading })) };
    }
    // Include separators in their preceding paragraph so merges retain exact spacing.
    return { mode: 'paragraph', blocks: (text.match(/[\s\S]+?(?:\r?\n[ \t]*\r?\n(?:[ \t]*\r?\n)*|$)/g) || []).map(value => ({ value, heading: null })) };
  }
  function tokens(text, unit, ignore) {
    const smart = unit === 'smart' ? smartBlocks(text) : null;
    const parts = smart ? smart.blocks.map(block => block.value) : unit === 'line' ? text.match(/[^\n]*\n|[^\n]+$/g) || [] : segment(text, { word: 'word', sentence: 'sentence', character: 'grapheme' }[unit] || 'word');
    let offset = 0;
    return parts.map((value, index) => { const t = { value, start: offset, end: offset + value.length, key: ignore ? value.replace(/\s/gu, '') : value }; offset = t.end; if (smart?.blocks[index].heading) t.key = 'heading:' + smart.blocks[index].heading.replace(/\s+/gu, ' '); return t; }).filter(t => !ignore || t.key !== '');
  }
  function compare(left, right, unit = 'word', ignore = false) {
    if (ignore && left.replace(/\s/gu, '') === right.replace(/\s/gu, '')) return { hunks: [], coarse: false };
    const a = tokens(left, unit, ignore), b = tokens(right, unit, ignore);
    let prefix = 0, ae = a.length, be = b.length;
    while (prefix < ae && prefix < be && a[prefix].key === b[prefix].key && (unit !== 'smart' || a[prefix].value === b[prefix].value)) prefix++;
    while (ae > prefix && be > prefix && a[ae - 1].key === b[be - 1].key && (unit !== 'smart' || a[ae - 1].value === b[be - 1].value)) { ae--; be--; }
    const n = ae - prefix, m = be - prefix, coarse = n * m > 1000000 || n + m > 20000;
    const ops = [];
    if (coarse) { for (let i = prefix; i < ae; i++) ops.push('a'); for (let j = prefix; j < be; j++) ops.push('b'); }
    else {
      const table = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) table[i][j] = a[prefix + i].key === b[prefix + j].key ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
      let i = 0, j = 0;
      while (i < n || j < m) {
        if (i < n && j < m && a[prefix + i].key === b[prefix + j].key) { ops.push('='); i++; j++; }
        else if (i < n && (j === m || table[i + 1][j] >= table[i][j + 1])) { ops.push('a'); i++; }
        else { ops.push('b'); j++; }
      }
    }
    const hunks = []; let i = prefix, j = prefix, current;
    const range = (ts, start, end, length) => [ts[start]?.start ?? length, end > start ? ts[end - 1].end : ts[start]?.start ?? length];
    function flush() {
      if (!current) return;
      const ar = range(a, current.i, i, left.length), br = range(b, current.j, j, right.length);
      hunks.push({ leftStart: ar[0], leftEnd: ar[1], rightStart: br[0], rightEnd: br[1], left: left.slice(...ar), right: right.slice(...br) }); current = null;
    }
    for (const op of ops) { if (op === '=') { flush(); if (unit === 'smart' && (ignore ? a[i].value.replace(/\s/gu, '') !== b[j].value.replace(/\s/gu, '') : a[i].value !== b[j].value)) { current = { i, j }; i++; j++; flush(); } else { i++; j++; } } else { current ||= { i, j }; if (op === 'a') i++; else j++; } }
    flush();
    return { hunks, coarse };
  }
  function merge(left, right, hunk, target) {
    return target === 'left' ? left.slice(0, hunk.leftStart) + hunk.right + left.slice(hunk.leftEnd) : right.slice(0, hunk.rightStart) + hunk.left + right.slice(hunk.rightEnd);
  }
  function count(text) { return { characters: segment(text, 'grapheme').length, compact: segment(text.replace(/\s/gu, ''), 'grapheme').length, words: text.trim() ? text.trim().split(/\s+/u).length : 0, lines: text ? text.split('\n').length : 0 }; }
  const api = { compare, merge, count };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TextDiff = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
