(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const fileInput = $('ascii-file');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let image = null, art = null, html = '';

  function status(message) { $('ascii-status').textContent = message; }
  function selectPreview() {
    const selection = window.getSelection(), range = document.createRange();
    range.selectNodeContents($('ascii-preview'));
    selection.removeAllRanges();
    selection.addRange(range);
  }
  function selectHtmlSource() {
    $('ascii-html-details').open = true;
    $('ascii-html-source').focus();
    $('ascii-html-source').select();
  }
  function readFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      status('Please choose a valid image file.');
      return;
    }
    const url = URL.createObjectURL(file);
    const nextImage = new Image();
    nextImage.onload = () => {
      URL.revokeObjectURL(url);
      image = nextImage;
      $('ascii-upload-title').textContent = file.name;
      $('ascii-upload-help').textContent = `${image.naturalWidth} × ${image.naturalHeight} · click to change`;
      render();
    };
    nextImage.onerror = () => {
      URL.revokeObjectURL(url);
      status('This image could not be opened. Try another file.');
    };
    nextImage.src = url;
  }

  function render() {
    if (!image) return;
    const columns = Number($('ascii-width').value);
    const rows = Math.max(1, Math.min(600, Math.round(image.naturalHeight / image.naturalWidth * columns)));
    canvas.width = columns;
    canvas.height = rows;
    context.filter = 'none';
    context.fillStyle = '#fff';
    context.fillRect(0, 0, columns, rows);
    context.filter = `brightness(${$('ascii-brightness').value}%) contrast(${$('ascii-contrast').value}%) saturate(${$('ascii-saturation').value}%)${$('ascii-grayscale').checked ? ' grayscale(1)' : ''}`;
    context.drawImage(image, 0, 0, columns, rows);
    context.filter = 'none';
    const pixels = context.getImageData(0, 0, columns, rows);
    art = AsciiArtEngine.makeArt(pixels.data, columns, rows, columns, $('ascii-palette').value, { invert: $('ascii-invert').checked, grayscale: $('ascii-grayscale').checked });
    html = AsciiArtEngine.toHtml(art);
    const preview = $('ascii-preview');
    preview.replaceChildren();
    art.lines.forEach((line, y) => {
      for (let x = 0; x < line.length; x++) {
        const character = document.createElement('span');
        character.style.color = art.colors[y][x];
        character.textContent = line[x];
        preview.append(character);
      }
      if (y < art.lines.length - 1) preview.append(document.createTextNode('\n'));
    });
    $('ascii-html-source').value = html;
    $('ascii-html-details').hidden = false;
    $('ascii-copy-text').disabled = $('ascii-copy-html').disabled = $('ascii-copy-source').disabled = false;
    status(`${columns} characters wide · ${art.lines.length} lines`);
  }

  async function copyText(text, button, success, isHtmlSource = false) {
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(text);
      status(success);
    } catch (error) {
      if (isHtmlSource) selectHtmlSource();
      else selectPreview();
      status(`Clipboard access failed: ${error.message}. The output is selected for manual copying.`);
    } finally {
      button.disabled = false;
    }
  }

  async function copyHtml() {
    const button = $('ascii-copy-html');
    button.disabled = true;
    try {
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('Rich clipboard is not supported in this browser');
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([art.text], { type: 'text/plain' })
      });
      await navigator.clipboard.write([item]);
      status('Colored HTML copied. Paste into a rich-text editor to keep the colors.');
    } catch (error) {
      try {
        await navigator.clipboard.writeText(html);
        status(`Could not copy formatted artwork: ${error.message}. HTML source copied instead.`);
      } catch (fallbackError) {
        selectHtmlSource();
        status(`Could not copy formatted artwork: ${error.message}. HTML source copy also failed: ${fallbackError.message}. The source is selected for manual copying.`);
      }
    } finally {
      button.disabled = false;
    }
  }

  for (const id of ['ascii-width', 'ascii-brightness', 'ascii-contrast', 'ascii-saturation']) {
    $(id).addEventListener('input', () => {
      $(`${id}-value`).textContent = id === 'ascii-width' ? $(id).value : `${$(id).value}%`;
      render();
    });
  }
  for (const id of ['ascii-grayscale', 'ascii-invert', 'ascii-palette']) $(id).addEventListener('change', render);
  fileInput.addEventListener('change', () => readFile(fileInput.files[0]));
  $('ascii-copy-text').addEventListener('click', event => copyText(art.text, event.currentTarget, 'Plain text copied.'));
  $('ascii-copy-html').addEventListener('click', copyHtml);
  $('ascii-copy-source').addEventListener('click', event => copyText(html, event.currentTarget, 'HTML source copied.', true));
  const drop = $('ascii-drop');
  drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('is-dragging'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('is-dragging'));
  drop.addEventListener('drop', event => {
    event.preventDefault();
    drop.classList.remove('is-dragging');
    readFile(event.dataTransfer.files[0]);
  });
})();
