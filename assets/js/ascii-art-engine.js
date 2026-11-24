(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AsciiArtEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function makeArt(pixels, imageWidth, imageHeight, columns, charset, options = {}) {
    if (!Number.isInteger(imageWidth) || imageWidth < 1 || !Number.isInteger(imageHeight) || imageHeight < 1) throw new RangeError('Image dimensions must be positive integers');
    if (!Number.isInteger(columns) || columns < 1 || columns > 240) throw new RangeError('Art width must be between 1 and 240');
    if (typeof charset !== 'string' || charset.length < 2) throw new TypeError('Character set must contain at least two characters');
    if (!pixels || pixels.length !== imageWidth * imageHeight * 4) throw new TypeError('Invalid image pixels');
    const rows = Math.max(1, Math.min(300, Math.round(imageHeight / imageWidth * columns * 0.5)));
    const lines = [], colors = [];
    for (let y = 0; y < rows; y++) {
      let line = '';
      const colorLine = [];
      const sourceY = Math.min(imageHeight - 1, Math.floor((y + 0.5) * imageHeight / rows));
      for (let x = 0; x < columns; x++) {
        const sourceX = Math.min(imageWidth - 1, Math.floor((x + 0.5) * imageWidth / columns));
        const offset = (sourceY * imageWidth + sourceX) * 4;
        const red = pixels[offset], green = pixels[offset + 1], blue = pixels[offset + 2];
        let brightness = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
        if (options.invert) brightness = 1 - brightness;
        const index = Math.round(brightness * (charset.length - 1));
        line += charset[index];
        colorLine.push(options.grayscale ? grayColor(red, green, blue) : rgbHex(red, green, blue));
      }
      lines.push(line);
      colors.push(colorLine);
    }
    return { text: lines.join('\n'), lines, colors };
  }

  function grayColor(red, green, blue) {
    const gray = Math.round(red * 0.2126 + green * 0.7152 + blue * 0.0722);
    return rgbHex(gray, gray, gray);
  }

  function rgbHex(red, green, blue) {
    return `#${[red, green, blue].map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
  }

  function toHtml(art) {
    const rows = art.lines.map((line, y) => {
      let output = '';
      for (let x = 0; x < line.length; x++) {
        const character = line[x];
        const escaped = character === '&' ? '&amp;' : character === '<' ? '&lt;' : character === '>' ? '&gt;' : character;
        output += `<span style="color:${art.colors[y][x]}">${escaped}</span>`;
      }
      return output;
    });
    return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff"><pre style="font:9px/9px monospace;white-space:pre;color:#808080">${rows.join('\n')}</pre></body></html>`;
  }

  return { makeArt, toHtml };
});
