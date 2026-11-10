// PLAYWRIGHT_MODULE=/path/to/playwright node tests/2048-browser.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const url = (process.env.GAMES_TEST_URL || 'http://127.0.0.1:4010') + '/mini-games/2048/';
const output = '/tmp/2048-screenshots';
const stateKey = 'gongsoonyee:2048:v1:state';
const bestKey = 'gongsoonyee:2048:v1:best';
const values = page => page.locator('#board-2048 [data-cell]').evaluateAll(tiles => tiles.map(t => Number(t.dataset.value)));
const score = async page => Number(await page.locator('#score-2048').textContent());
const best = async page => Number(await page.locator('#best-2048').textContent());
const rowBoard = row => [...row, ...Array(12).fill(0)];
async function contextFor(browser, width, fixture = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, hasTouch: Boolean(fixture.touch), reducedMotion: 'reduce' });
  await context.addInitScript(({ fixture, stateKey, bestKey }) => {
    Math.random = () => 0;
    if (fixture.state !== undefined && localStorage.getItem(stateKey) === null) localStorage.setItem(stateKey, typeof fixture.state === 'string' ? fixture.state : JSON.stringify(fixture.state));
    if (fixture.best !== undefined && localStorage.getItem(bestKey) === null) localStorage.setItem(bestKey, String(fixture.best));
    if (fixture.blocked) Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied'); } });
  }, { fixture, stateKey, bestKey });
  const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-11-10T02:00:00Z') });
  await page.goto(url); await page.waitForSelector('#board-2048 [data-cell]');
  return { context, page };
}
async function arrow(page, key) { await page.locator('#board-2048').focus(); await page.keyboard.press(key); }
async function swipe(page, dx, dy, touch = false, cancel = false) {
  await page.locator('#board-2048').scrollIntoViewIfNeeded();
  const box = await page.locator('#board-2048').boundingBox();
  const start = { x: box.x + box.width / 2 - dx / 2, y: box.y + box.height / 2 - dy / 2 };
  const end = { x: start.x + dx, y: start.y + dy };
  if (touch) {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [end] });
    await session.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(start.x, start.y); await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 8 }); await page.mouse.up();
  }
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const width of [1280, 390, 320]) {
      const { context, page } = await contextFor(browser, width);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      assert.deepEqual(await values(page), rowBoard([2, 2, 0, 0]));
      assert.equal(await page.locator('#board-2048 [data-cell="0"]').getAttribute('role'), 'img');
      assert.match(await page.locator('#board-2048 [data-cell="0"]').getAttribute('aria-label'), /1행 1열, 2/);
      assert.equal(await score(page), 0); assert.equal(await best(page), 0);
      assert.equal(await page.locator('[aria-labelledby="miniGamesDropdown"] [aria-current="page"]').getAttribute('href'), '/mini-games/2048/');
      await page.locator('.navbar-brand').focus(); await page.keyboard.press('ArrowLeft');
      assert.deepEqual(await values(page), rowBoard([2, 2, 0, 0]));
      await arrow(page, 'ArrowUp');
      assert.deepEqual(await values(page), rowBoard([2, 2, 0, 0]));
      assert(await page.locator('#undo-2048').isDisabled());
      await arrow(page, 'ArrowLeft');
      assert.deepEqual(await values(page), rowBoard([4, 2, 0, 0]));
      assert.equal(await score(page), 4); assert.equal(await best(page), 4);
      await page.locator('#undo-2048').click();
      assert.deepEqual(await values(page), rowBoard([2, 2, 0, 0]));
      assert.equal(await score(page), 0); assert.equal(await best(page), 4);
      await page.locator('[data-direction="left"]').click();
      assert.equal(await score(page), 4);
      await arrow(page, 'd');
      const saved = await values(page);
      await page.reload(); await page.waitForSelector('#board-2048 [data-cell]');
      assert.deepEqual(await values(page), saved); assert.equal(await score(page), 4);
      await page.clock.setSystemTime(new Date('2026-11-11T02:00:00Z'));
      await page.reload(); await page.waitForSelector('#board-2048 [data-cell]');
      assert.deepEqual(await values(page), saved);
      await page.locator('#new-2048').click();
      assert(await page.locator('#confirm-2048').isVisible());
      await arrow(page, 'ArrowLeft'); assert.deepEqual(await values(page), saved);
      await page.locator('#cancel-2048').click(); assert.deepEqual(await values(page), saved);
      await page.locator('#new-2048').click(); await page.locator('#reset-2048').click();
      assert.deepEqual(await values(page), rowBoard([2, 2, 0, 0]));
      assert.equal(await score(page), 0); assert.equal(await best(page), 4);
      assert(await page.locator('#undo-2048').isDisabled());
      await swipe(page, -120, 0); assert.equal(await score(page), 4);
      await page.locator('#undo-2048').click();
      await swipe(page, 10, 0); assert.equal(await score(page), 0);
      assert.deepEqual(await values(page), rowBoard([2, 2, 0, 0]));
      await page.goto(url); await page.waitForSelector('#board-2048 [data-cell]');
      await page.screenshot({ path: `${output}/initial-${width}.png` });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const controls = await page.locator('[data-direction]').evaluateAll(buttons => buttons.map(b => ({ w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height, label: b.getAttribute('aria-label') })));
      assert(controls.every(b => b.w >= 44 && b.h >= 44 && b.label));
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${width}: board-only keyboard/WASD, no-op, merge, direction controls, undo, persistence across dates, guarded restart, best, swipe threshold, overflow`);
    }
    {
      const { context, page } = await contextFor(browser, 390, { state: { version: 1, board: rowBoard([1024, 1024, 0, 0]), score: 0, continued: false } });
      await arrow(page, 'ArrowLeft'); assert.equal(await score(page), 2048);
      assert((await values(page)).includes(2048)); assert(await page.locator('#continue-2048').isVisible());
      const won = await values(page); await arrow(page, 'ArrowDown'); assert.deepEqual(await values(page), won);
      await page.screenshot({ path: `${output}/won-390.png` });
      await page.locator('#undo-2048').click(); assert.equal(await score(page), 0); assert.equal(await best(page), 2048);
      assert(!(await values(page)).includes(2048));
      await arrow(page, 'ArrowLeft'); await page.locator('#continue-2048').click();
      assert.equal(await page.locator('#continue-2048').isVisible(), false);
      await arrow(page, 'ArrowRight'); assert.notDeepEqual(await values(page), won);
      const persisted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), stateKey);
      assert.equal(persisted.continued, true); assert.equal(persisted.score, 2048);
      await page.reload(); await page.waitForSelector('#board-2048 [data-cell]');
      assert.equal(await page.locator('#continue-2048').isVisible(), false);
      assert.equal(await score(page), 2048);
      await context.close(); console.log('PASS 2048 victory, paused movement, undo victory and continue');
    }
    {
      const { context, page } = await contextFor(browser, 390, { state: { version: 1, board: rowBoard([2048, 2048, 0, 0]), score: 0, continued: true } });
      await arrow(page, 'ArrowLeft'); assert.equal(await score(page), 4096);
      assert((await values(page)).includes(4096)); assert.equal(await page.locator('#continue-2048').isVisible(), false);
      const big = page.locator('[data-value="4096"]');
      assert(await big.evaluate(tile => tile.scrollWidth <= tile.clientWidth));
      await page.screenshot({ path: `${output}/continued-390.png` });
      await context.close(); console.log('PASS continued 4096 merge and mobile tile fit');
    }
    {
      const stalled = [2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2];
      const { context, page } = await contextFor(browser, 390, { state: { version: 1, board: stalled, score: 200, continued: false }, best: 300 });
      assert.match(await page.locator('#status-2048').textContent(), /움직일 수 없/);
      assert(await page.locator('#restart-2048').isVisible());
      assert(await page.locator('#undo-2048').isDisabled());
      await arrow(page, 'ArrowLeft'); assert.deepEqual(await values(page), stalled);
      await page.screenshot({ path: `${output}/over-390.png` });
      await page.locator('#restart-2048').click(); await page.locator('#reset-2048').click();
      assert.equal(await score(page), 0); assert.equal(await best(page), 300);
      await context.close(); console.log('PASS restored game over and reachable restart with retained best');
    }
    for (const corrupt of ['{broken', { version: 1, board: Array(16).fill(0), score: 12, continued: false }]) {
      const { context, page } = await contextFor(browser, 390, { state: corrupt, best: 300 });
      assert.equal((await values(page)).filter(Boolean).length, 2);
      assert.equal(await score(page), 0); assert.equal(await best(page), 300);
      assert.match(await page.locator('#status-2048').textContent(), /읽을 수 없어/);
      assert.equal(await page.locator('#storage-2048').isVisible(), false);
      await context.close();
    }
    console.log('PASS corrupt/allzero progress recovery keeps valid best');
    {
      const { context, page } = await contextFor(browser, 390, { touch: true, blocked: true });
      assert(await page.locator('#storage-2048').isVisible());
      await swipe(page, -120, 0, true); assert.equal(await score(page), 4);
      await page.locator('#undo-2048').tap(); assert.equal(await score(page), 0);
      const before = await values(page); await swipe(page, -120, 0, true, true);
      assert.deepEqual(await values(page), before);
      await context.close(); console.log('PASS native touch swipe, pointer cancellation and denied storage gameplay');
    }
    {
      const context = await browser.newContext(); const page = await context.newPage();
      await page.route('**/assets/js/2048-engine.js*', route => route.abort());
      await page.goto(url); await page.waitForSelector('#error-2048:not([hidden])');
      assert.equal(await page.locator('#play-2048').isVisible(), false);
      await page.unroute('**/assets/js/2048-engine.js*'); await page.reload();
      await page.waitForSelector('#board-2048 [data-cell]');
      assert.equal(await page.locator('#error-2048').isVisible(), false);
      await context.close(); console.log('PASS missing-engine notice and reload recovery');
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
