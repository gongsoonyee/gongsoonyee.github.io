// DIFF_TEST_URL=http://localhost:4000/work-tools/diffchecker/ PLAYWRIGHT_MODULE=/path/to/playwright node tests/diffchecker-browser.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    for (const width of [1280,390,320]) {
      const context = await browser.newContext({viewport:{width,height:width>500?900:844},reducedMotion:'reduce',acceptDownloads:true});
      const page = await context.newPage(), errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.goto(process.env.DIFF_TEST_URL || 'http://127.0.0.1:4000/work-tools/diffchecker/');
      const left=page.locator('#diff-left'), right=page.locator('#diff-right');
      const fill=async(a,b)=>{await left.fill(a);await right.fill(b);await page.waitForTimeout(250);};
      assert.match(await page.locator('#diff-summary').textContent(),/입력/);
      await fill('안녕 cat\n두 번째 문장.','안녕 dog\n두 번째 문장.');
      assert.equal(await page.locator('.diff-hunk').count(),1);
      await page.locator('[data-merge="left"]').click();
      assert.equal(await left.inputValue(),await right.inputValue());
      await page.locator('#diff-undo').click(); assert.equal(await left.inputValue(),'안녕 cat\n두 번째 문장.');
      await page.locator('[data-merge="right"]').click(); assert.equal(await right.inputValue(),await left.inputValue());
      await page.locator('#diff-undo').click();
      for(const unit of ['sentence','character','line','word']){await page.locator('#diff-unit').selectOption(unit);assert(await page.locator('.diff-hunk').count()>0);}
      await fill('hello  world\n','hello world'); await page.locator('#diff-ignore').check();
      assert.equal(await page.locator('.diff-hunk').count(),0); await page.locator('#diff-ignore').uncheck();assert(await page.locator('.diff-hunk').count()>0);
      await page.locator('[data-full="left"]').click(); assert.equal(await left.inputValue(),'hello world');
      await page.locator('#diff-undo').click();assert.equal(await left.inputValue(),'hello  world\n');
      await fill('a x b y c','a q b z c'); await page.locator('#diff-next').click();assert.match(await page.locator('#diff-position').textContent(),/2 \/ 2/); await page.locator('#diff-prev').click();
      await fill('<script>alert(1)</script>','safe');assert.equal(await page.locator('#diff-hunks script').count(),0);
      await fill('가 👩‍💻\n나','');assert.match(await page.locator('#count-left').textContent(),/^5자/);
      const downloadEvent=page.waitForEvent('download');await page.locator('[data-download="left"]').click();const download=await downloadEvent;assert.equal(fs.readFileSync(await download.path(),'utf8'),'가 👩‍💻\n나');
      await fill('# Intro\nold\n\n# End\nbefore','# Intro\nnew\n\n# End\nafter');
      await page.locator('#diff-unit').selectOption('smart');
      assert.equal(await page.locator('.diff-hunk').count(),2);
      assert(await page.locator('#diff-smart-note').isVisible());
      await page.locator('[data-merge="left"]').first().click();
      assert.equal(await left.inputValue(),'# Intro\nnew\n\n# End\nbefore');
      await page.locator('#diff-undo').click();
      await page.locator('#diff-unit').selectOption('word');
      await fill('The first draft.\n다음 문장을 검토합니다.\n마지막 줄입니다.','The revised draft.\n다음 문장을 함께 검토합니다.\n마지막 줄입니다.');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
      await page.screenshot({path:`/tmp/diff-working-${width}.png`,fullPage:true});
      assert.deepEqual(errors,[]); await context.close();
      console.log(`Diff Checker browser checks passed at ${width}px`);
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
