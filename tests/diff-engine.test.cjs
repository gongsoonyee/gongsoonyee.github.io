const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compare, merge, count } = require('../assets/js/diff-engine');
test('empty, equal, insertion and deletion preserve exact text', () => {
  for (const [a,b] of [['',''],['same','same'],['','새 문서\n'],['abc',''],['a\nb','a\nc'],['안녕 👩‍💻!','안녕 🌍!']]) {
    for (const unit of ['word','sentence','character','line','smart']) {
      let left = a, right = b;
      for (const h of compare(left,right,unit).hunks.reverse()) left = merge(left,right,h,'left');
      assert.equal(left,b);
      for (const h of compare(a,b,unit).hunks.reverse()) right = merge(a,right,h,'right');
      assert.equal(right,a);
    }
  }
});
test('whitespace ignored while substantive edits remain', () => {
  assert.equal(compare('hello  world\n','hello world','word',true).hunks.length,0);
  assert.equal(compare('안녕\n세상','안녕 세상','character',true).hunks.length,0);
  assert.equal(compare('hello world','helloworld','word',true).hunks.length,0);
  assert(compare('hello cat','hello dog','word',true).hunks.length);
});
test('grapheme counts and whitespace-separated word counts', () => {
  assert.deepEqual(count('가 👩‍💻\n나'), {characters:5,compact:3,words:3,lines:2});
  assert.deepEqual(count(''), {characters:0,compact:0,words:0,lines:0});
});
test('bounded comparison falls back without losing original ranges', () => {
  const a = 'a'.repeat(1500), b = 'b'.repeat(1500), result = compare(a,b,'character');
  assert(result.coarse); assert.equal(merge(a,b,result.hunks[0],'left'),b);
});
test('randomized complete merge reconstructs either document', () => {
  let seed=17; const rand=()=> (seed=(seed*1664525+1013904223)>>>0)/4294967296;
  const alphabet=['가','나',' ','\n','😀','x'];
  for(let run=0;run<200;run++) {
    const make=()=>Array.from({length:Math.floor(rand()*40)},()=>alphabet[Math.floor(rand()*alphabet.length)]).join('');
    const a=make(), b=make();
    for(const unit of ['word','sentence','character','line','smart']) {
      let left=a, right=b;
      for(const h of compare(a,b,unit).hunks.reverse()) {left=merge(left,b,h,'left');right=merge(a,right,h,'right');}
      assert.equal(left,b); assert.equal(right,a);
    }
  }
});

test('smart aligns changed chapters and merges them independently', () => {
  for (const titles of [['# 시작', '# 마무리'], ['제1장 시작', '제2장 마무리'], ['Chapter 1 Intro', 'Chapter 2 End']]) {
    const a = `${titles[0]}\nold\n\n${titles[1]}\nbefore\n`;
    const b = `${titles[0]}\nnew\n\n${titles[1]}\nafter\n`;
    const result = compare(a,b,'smart');
    assert.equal(result.hunks.length,2);
    assert.equal(result.hunks[0].left, `${titles[0]}\nold\n\n`);
    assert.equal(merge(a,b,result.hunks[0],'left'), `${titles[0]}\nnew\n\n${titles[1]}\nbefore\n`);
    let merged=a; for(const h of result.hunks.slice().reverse()) merged=merge(merged,b,h,'left'); assert.equal(merged,b);
  }
});
test('smart handles paragraph fallback, inserted chapters and fenced headings', () => {
  assert.equal(compare('same\n\nold\n\nend','same\n\nnew\n\nend','smart').hunks[0].left,'old\n\n');
  const a='# A\nbody\n\n# C\nend', b='# A\nbody\n\n# B\nadded\n\n# C\nend';
  const h=compare(a,b,'smart').hunks[0]; assert.equal(h.left,''); assert.equal(merge(a,b,h,'left'),b);
  const c='# A\n```md\n# fake\n```\nold\n', d=c.replace('old','new');
  assert.equal(compare(c,d,'smart').hunks[0].left,c);
  assert.equal(compare('# A\nhello  world','# A\nhello world','smart',true).hunks.length,0);
});
