const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeArt, toHtml } = require('../assets/js/ascii-art-engine.js');

test('samples image luminance into fixed-width text and preserves pixel colors', () => {
  const pixels = new Uint8ClampedArray([
    0, 0, 0, 255, 255, 255, 255, 255
  ]);
  const result = makeArt(pixels, 2, 1, 4, '@. ');
  assert.deepEqual(result.lines, ['@@  ']);
  assert.deepEqual(result.colors[0], ['#000000', '#000000', '#ffffff', '#ffffff']);
  assert.equal(result.text, '@@  ');
});

test('invert and grayscale options change character mapping and output colors', () => {
  const pixels = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
  const normal = makeArt(pixels, 2, 1, 2, '@. ');
  const inverted = makeArt(pixels, 2, 1, 2, '@. ', { invert: true });
  const gray = makeArt(new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]), 2, 1, 2, '@. ', { grayscale: true });
  assert.equal(normal.text, '@ ');
  assert.equal(inverted.text, ' @');
  assert.deepEqual(gray.colors[0], ['#363636', '#121212']);
});

test('HTML output escapes symbols and includes inline colors and preserved spaces', () => {
  const art = { lines: ['<& '], colors: [['#123456', '#abcdef', '#ffffff']] };
  const html = toHtml(art);
  assert.match(html, /color:#123456">&lt;/);
  assert.match(html, /color:#abcdef">&amp;/);
  assert.match(html, /color:#ffffff"> /);
  assert.match(html, /<pre style="font:9px\/9px monospace/);
});

test('invalid image dimensions, width, or character set are rejected', () => {
  assert.throws(() => makeArt([], 0, 1, 1, '@ '), RangeError);
  assert.throws(() => makeArt([], 1, 1, 0, '@ '), RangeError);
  assert.throws(() => makeArt(new Uint8ClampedArray(4), 1, 1, 1, '@'), TypeError);
  assert.throws(() => makeArt(new Uint8ClampedArray(8), 1, 1, 1, '@ '), TypeError);
});
