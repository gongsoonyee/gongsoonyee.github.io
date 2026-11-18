// TOPICS_TEST_URL=http://127.0.0.1:4000/topics/ PLAYWRIGHT_MODULE=/path/to/playwright node tests/topics-browser.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const postCount = fs.readdirSync(require('node:path').join(__dirname,'../_posts')).filter(name=>name.endsWith('.md')).length;
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    for(const width of [1280,390,320]) {
      const context=await browser.newContext({viewport:{width,height:width>500?900:844},reducedMotion:'reduce'});
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      // Avoid unrelated analytics/CDNs in local fixture QA.
      if(process.env.TOPICS_TEST_URL?.startsWith('file:')) await page.route('https://**/*',route=>route.abort());
      const url=process.env.TOPICS_TEST_URL||'http://127.0.0.1:4000/topics/';
      await page.goto(url);await page.waitForSelector('.topics-post-list a');
      assert.equal(await page.locator('.topics-topic').count(),4);
      assert.equal(await page.locator('.topics-post-list a').count(),postCount);
      const hrefs=await page.locator('.topics-post-list a').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
      assert.equal(new Set(hrefs).size,hrefs.length);
      assert.equal(await page.locator('.nav-link[aria-current="page"]').textContent(),'Topics');
      const last=page.locator('#life-and-experience');
      if(width<768) assert.equal(await last.getAttribute('open'),null);
      await page.locator('.topics-nav a[href="#life-and-experience"]').click();
      assert.notEqual(await last.getAttribute('open'),null);
      await last.locator('summary').click();assert.equal(await last.getAttribute('open'),null);
      await last.locator('summary').focus();await page.keyboard.press('Enter');assert.notEqual(await last.getAttribute('open'),null);
      await page.goto(url+'#coding-agents');
      assert.notEqual(await page.locator('#ai-development').getAttribute('open'),null);
      const bounds=await page.locator('#coding-agents').boundingBox();assert(bounds.y>=0 && bounds.y<844,'deep link reveals its group');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
      await page.goto(url);await page.screenshot({path:`/tmp/topics-${width}.png`,fullPage:true});
      assert.deepEqual(errors,[]);await context.close();console.log(`Topics navigation, coverage, accordion and responsive checks passed at ${width}px`);
    }
    const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const page=await nojs.newPage();await page.goto(process.env.TOPICS_TEST_URL||'http://127.0.0.1:4000/topics/');
    assert.equal(await page.locator('.topics-topic[open]').count(),4);assert.equal(await page.locator('.topics-post-list a').count(),postCount);await nojs.close();
    console.log('All posts accessible without JavaScript.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
