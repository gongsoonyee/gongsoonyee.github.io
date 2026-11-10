// Run against a Jekyll build served locally. This repository adds no npm runtime dependencies.
// PLAYWRIGHT_MODULE=/path/to/playwright node tests/tango-browser.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const bank = require('../assets/data/tango.json');
const url = (process.env.TANGO_TEST_URL || 'http://127.0.0.1:4010') + '/mini-games/tango/';
const output = process.env.TANGO_SCREENSHOTS || '/tmp/tango-screenshots';
const selectors = '#tango-board button';
(async () => {
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.clock.install({ time: new Date('2026-11-10T02:00:00Z') });
      await page.goto(url);
      await page.waitForSelector(selectors);
      assert.equal(await page.locator(selectors).count(), 36);
      assert.equal(await page.locator('#tango-date').inputValue(), '2026-11-10');
      assert.equal(await page.locator('#tango-new-day').isVisible(), false);
      if (viewport.width < 992) await page.locator('.navbar-toggler').click();
      await page.locator('#miniGamesDropdown').click();
      const gameLink = page.locator('[aria-labelledby="miniGamesDropdown"] a');
      assert(await gameLink.isVisible());
      assert.equal(await gameLink.getAttribute('href'), '/mini-games/tango/');
      await page.locator('#miniGamesDropdown').click();
      if (viewport.width < 992) await page.locator('.navbar-toggler').click();
      const cell = page.locator('#tango-board button:not(:disabled)').first();
      const initial = await cell.getAttribute('aria-label');
      await cell.click();
      const changed = await cell.getAttribute('aria-label');
      assert.notEqual(changed, initial);
      await page.locator('#tango-undo').click();
      assert.equal(await cell.getAttribute('aria-label'), initial);
      await cell.click();
      await page.reload(); await page.waitForSelector(selectors);
      assert.equal(await cell.getAttribute('aria-label'), changed);
      await page.locator('#tango-reset').click();
      await page.locator('#tango-reset-cancel').click();
      assert.equal(await cell.getAttribute('aria-label'), changed);
      await page.locator('#tango-reset').click(); await page.locator('#tango-reset-yes').click();
      assert.equal(await cell.getAttribute('aria-label'), initial);
      await page.locator('#tango-hint').click();
      assert.equal(await page.locator('#tango-hints').textContent(), '1');
      await page.locator('#tango-undo').click();
      assert.equal(await page.locator('#tango-hints').textContent(), '0');
      await page.locator('#tango-date').fill('2026-11-05');
      assert.equal(await page.locator('#tango-date-title').getAttribute('datetime'), '2026-11-05');
      assert.equal(await page.locator('#tango-new-day').isVisible(), false);
      await cell.click(); const past = await cell.getAttribute('aria-label');
      await page.locator('#tango-today').click();
      assert.equal(await cell.getAttribute('aria-label'), initial);
      await page.goBack();
      assert.equal(await page.locator('#tango-date').inputValue(), '2026-11-05');
      assert.equal(await cell.getAttribute('aria-label'), past);
      await page.goto(url + '?date=2026-11-11'); await page.waitForSelector(selectors);
      assert.equal(await page.locator('#tango-date').inputValue(), '2026-11-10');
      assert(await page.locator('#tango-date-notice').isVisible());
      await page.goto(url); await page.waitForSelector(selectors);
      const p = bank.puzzles[9];
      // Complete through real cell interactions, not by injecting solved DOM/state.
      for (let i = 0; i < 36; i++) if (!p.givens[i]) {
        const target = page.locator(selectors).nth(i);
        for (let n = 0; n < p.solution[i]; n++) await target.click();
      }
      assert.match(await page.locator('#tango-status').textContent(), /완성/);
      assert(await page.locator('#tango-hint').isDisabled());
      await page.reload(); await page.waitForSelector(selectors);
      assert.match(await page.locator('#tango-status').textContent(), /완성/);
      await page.locator('#tango-reset').click(); await page.locator('#tango-reset-yes').click();
      await page.screenshot({ path: `${output}/${viewport.width}.png` });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(overflow, false);
      await page.clock.setSystemTime(new Date('2026-11-10T15:00:00Z'));
      await page.clock.runFor(30001);
      assert(await page.locator('#tango-new-day').isVisible());
      assert.equal(await page.locator('#tango-date').inputValue(), '2026-11-10');
      await page.locator('#tango-new-today').click();
      assert.equal(await page.locator('#tango-date').inputValue(), '2026-11-11');
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${viewport.width}: moves, undo, persistence, reset, hint, archive, completion, KST rollover, overflow`);
    }
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    });
    const page = await context.newPage();
    await page.clock.install({ time: new Date('2026-11-10T02:00:00Z') });
    await page.route('**/assets/data/tango.json', route => route.abort());
    await page.goto(url); await page.waitForSelector('#tango-load-error:not([hidden])');
    await page.unroute('**/assets/data/tango.json'); await page.locator('#tango-retry').click();
    await page.waitForSelector(selectors);
    assert(await page.locator('#tango-storage-warning').isVisible());
    const playable = page.locator('#tango-board button:not(:disabled)').first();
    await playable.click();
    const memoryState = await playable.getAttribute('aria-label');
    await page.locator('#tango-date').fill('2026-11-05');
    await page.locator('#tango-today').click();
    assert.equal(await playable.getAttribute('aria-label'), memoryState);
    await page.clock.setSystemTime(new Date('2027-12-06T02:00:00Z'));
    await page.goto(url); await page.waitForSelector(selectors);
    assert.equal(await page.locator('#tango-date').inputValue(), '2027-12-05');
    assert.match(await page.locator('#tango-date-notice').textContent(), /아직 준비되지/);
    await context.close();
    console.log('PASS error/retry, blocked storage, end-of-bank fallback');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
