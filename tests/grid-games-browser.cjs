// PLAYWRIGHT_MODULE=/path/to/playwright node tests/grid-games-browser.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const E = require('../assets/js/grid-puzzle-engine.js');
const base = process.env.GAMES_TEST_URL || 'http://127.0.0.1:4010';
const out = process.env.GAMES_SCREENSHOTS || '/tmp/daily-games-screenshots';
const cell = (page, id) => page.locator(`#game-board button[data-cell="${id}"]`);
const progress = page => page.locator('#game-progress').textContent();
async function reset(page) {
  if (await page.locator('#game-reset').isDisabled()) return;
  await page.locator('#game-reset').click();
  await page.locator('#game-reset-yes').click();
}
async function place(page, rect, keyboard = false) {
  const [r, c, h, w] = rect, first = r * 6 + c, last = (r + h - 1) * 6 + c + w - 1;
  for (const id of [first, last]) {
    if (keyboard) { await cell(page, id).focus(); await cell(page, id).press('Enter'); }
    else await cell(page, id).click();
  }
}
async function drag(page, ids) {
  await page.locator('#game-board').scrollIntoViewIfNeeded();
  const boxes = await Promise.all(ids.map(id => cell(page, id).boundingBox()));
  await page.mouse.move(boxes[0].x + boxes[0].width / 2, boxes[0].y + boxes[0].height / 2);
  await page.mouse.down();
  for (const b of boxes.slice(1)) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
  await page.mouse.up();
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync(out, { recursive: true });
  try {
    for (const game of ['shikaku', 'zip']) for (const width of [1280, 390]) {
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.clock.install({ time: new Date('2026-11-10T02:00:00Z') });
      const url = `${base}/mini-games/${game}/`;
      await page.goto(url); await page.waitForSelector('#game-board button');
      assert.equal(await page.locator('#game-board button').count(), 36);
      assert.equal(await page.locator('#game-date').inputValue(), '2026-11-10');
      assert.equal(await page.locator('#game-new-day').isVisible(), false);
      assert.equal(await page.locator('[aria-labelledby="miniGamesDropdown"] [aria-current="page"]').getAttribute('href'), `/mini-games/${game}/`);
      const puzzle = E.generate(game, '2026-11-10');
      const initial = game === 'shikaku' ? '0 / 36' : '1 / 36';
      assert.equal(await progress(page), initial);
      if (game === 'shikaku') {
        const rect = puzzle.solution[0], area = rect[2] * rect[3];
        // Invalid rectangle is rejected without losing existing work.
        await cell(page, 0).click(); await cell(page, 0).click();
        assert.equal(await progress(page), initial);
        assert.match(await page.locator('#game-status').textContent(), /숫자|칸 수/);
        await place(page, rect); assert.equal(await progress(page), `${area} / 36`);
        await page.locator('#game-undo').click(); assert.equal(await progress(page), initial);
        await place(page, rect); await page.reload(); await page.waitForSelector('#game-board button');
        assert.equal(await progress(page), `${area} / 36`);
        await page.locator('#game-reset').click(); await page.locator('#game-reset-cancel').click();
        assert.equal(await progress(page), `${area} / 36`);
        await reset(page); assert.equal(await progress(page), initial);
        await place(page, rect, true); assert.equal(await progress(page), `${area} / 36`);
        await reset(page);
        await drag(page, [rect[0] * 6 + rect[1], (rect[0] + rect[2] - 1) * 6 + rect[1] + rect[3] - 1]);
        assert.equal(await progress(page), `${area} / 36`);
        await cell(page, rect[0] * 6 + rect[1]).click(); assert.equal(await progress(page), initial);
      } else {
        const path = puzzle.solution, start = path[0];
        const invalid = Array.from({ length: 36 }, (_, i) => i).find(i => i !== start && Math.abs(Math.floor(i / 6) - Math.floor(start / 6)) + Math.abs(i % 6 - start % 6) > 1);
        await cell(page, invalid).click(); assert.equal(await progress(page), initial);
        assert.match(await page.locator('#game-status').textContent(), /이웃한/);
        await cell(page, path[1]).click(); assert.equal(await progress(page), '2 / 36');
        await page.locator('#game-undo').click(); assert.equal(await progress(page), initial);
        await cell(page, path[1]).click(); await page.reload(); await page.waitForSelector('#game-board button');
        assert.equal(await progress(page), '2 / 36');
        await page.locator('#game-reset').click(); await page.locator('#game-reset-cancel').click();
        assert.equal(await progress(page), '2 / 36');
        await reset(page); await cell(page, path[1]).focus(); await cell(page, path[1]).press('Enter');
        assert.equal(await progress(page), '2 / 36'); await reset(page);
        await drag(page, path.slice(0, 4)); assert.equal(await progress(page), '4 / 36');
        await cell(page, path[1]).click(); assert.equal(await progress(page), '2 / 36');
        await page.locator('#game-undo').click(); assert.equal(await progress(page), '4 / 36');
      }
      await reset(page);
      await page.locator('#game-hint').click(); assert.equal(await page.locator('#game-hints').textContent(), '1');
      await page.locator('#game-undo').click(); assert.equal(await progress(page), initial);
      assert.equal(await page.locator('#game-hints').textContent(), '0');
      await page.locator('#game-date').fill('2026-11-05');
      assert.equal(await page.locator('#game-date-title').getAttribute('datetime'), '2026-11-05');
      await page.locator('#game-hint').click(); const past = await progress(page);
      await page.locator('#game-today').click(); assert.equal(await progress(page), initial);
      await page.goBack(); assert.equal(await progress(page), past);
      assert.equal(await page.locator('#game-hints').textContent(), '1');
      await page.goForward(); assert.equal(await progress(page), initial);
      if (game === 'shikaku') for (const rect of puzzle.solution) await place(page, rect);
      else for (const id of puzzle.solution.slice(1)) await cell(page, id).click();
      assert.equal(await progress(page), '36 / 36');
      assert.match(await page.locator('#game-status').textContent(), /완성/);
      assert(await page.locator('#game-hint').isDisabled());
      await page.reload(); await page.waitForSelector('#game-board button');
      assert.match(await page.locator('#game-status').textContent(), /완성/);
      await page.screenshot({ path: `${out}/${game}-${width}-complete.png` });
      await reset(page); await page.goto(url); await page.waitForSelector('#game-board button');
      await page.screenshot({ path: `${out}/${game}-${width}.png` });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert(await page.locator('#game-board button').first().getAttribute('aria-label'));
      await page.clock.setSystemTime(new Date('2026-11-10T15:00:00Z')); await page.clock.runFor(30001);
      assert(await page.locator('#game-new-day').isVisible());
      assert.equal(await page.locator('#game-date').inputValue(), '2026-11-10');
      await page.locator('#game-new-today').click(); assert.equal(await page.locator('#game-date').inputValue(), '2026-11-11');
      await page.goto(url + '?date=2026-11-12'); await page.waitForSelector('#game-board button');
      assert.equal(await page.locator('#game-date').inputValue(), '2026-11-11');
      assert(await page.locator('#game-notice').isVisible());
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${game}/${width}: invalid move, click/drag/keyboard, undo/reset/hint, persistence, archive/back, completion, KST rollover, future date, overflow`);
    }
    for (const game of ['shikaku', 'zip']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
      // Reads succeed but writes fail (quota exhaustion); in-memory changes must win.
      await context.addInitScript(() => { Storage.prototype.setItem = function () { throw new Error('quota'); }; });
      const page = await context.newPage(); await page.clock.install({ time: new Date('2026-11-10T02:00:00Z') });
      await page.goto(`${base}/mini-games/${game}/`); await page.waitForSelector('#game-board button');
      const p = E.generate(game, '2026-11-10');
      if (game === 'shikaku') {
        const [r,c,h,w] = p.solution[0]; await cell(page,r*6+c).tap(); await cell(page,(r+h-1)*6+c+w-1).tap();
      } else await cell(page,p.solution[1]).tap();
      const saved = await progress(page); assert.notEqual(saved, game === 'shikaku' ? '0 / 36' : '1 / 36');
      assert(await page.locator('#game-storage-warning').isVisible());
      await page.locator('#game-date').fill('2026-11-05'); await page.locator('#game-today').click();
      assert.equal(await progress(page), saved);
      await reset(page);
      const touchIds = game === 'shikaku' ? [p.solution[0][0]*6+p.solution[0][1], (p.solution[0][0]+p.solution[0][2]-1)*6+p.solution[0][1]+p.solution[0][3]-1] : p.solution.slice(0,4);
      const boxes = await Promise.all(touchIds.map(id => cell(page,id).boundingBox()));
      const session = await context.newCDPSession(page);
      const touchPoint = b => ({ x: b.x+b.width/2, y: b.y+b.height/2 });
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchPoint(boxes[0])]});
      for (const b of boxes.slice(1)) await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touchPoint(b)]});
      await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      assert.equal(await progress(page), game === 'shikaku' ? `${p.solution[0][2]*p.solution[0][3]} / 36` : '4 / 36');
      await context.close(); console.log(`PASS ${game}: touch taps/drag and quota-failure memory recovery`);
    }
    const context = await browser.newContext();
    const page = await context.newPage(); await page.clock.install({ time: new Date('2026-11-10T02:00:00Z') });
    await page.route('**/assets/js/grid-puzzle-engine.js*', route => route.abort());
    await page.goto(`${base}/mini-games/zip/`); await page.waitForSelector('#game-error:not([hidden])');
    await page.unroute('**/assets/js/grid-puzzle-engine.js*'); await page.locator('#game-retry').click();
    await page.waitForSelector('#game-board button');
    assert.equal(await progress(page),'1 / 36');
    await context.close(); console.log('PASS missing engine asset and retry recovery');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
