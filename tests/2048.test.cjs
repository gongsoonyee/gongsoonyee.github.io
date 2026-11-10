const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../assets/js/2048-engine.js');
const boardOf = row => [...row, ...Array(12).fill(0)];

test('slides compact gaps and merge each tile at most once in directional order', () => {
  for (const [row, expected, score, merged] of [
    [[2,2,4,0], [4,4,0,0], 4, [0]],
    [[2,2,2,2], [4,4,0,0], 8, [0,1]],
    [[4,4,4,0], [8,4,0,0], 8, [0]],
    [[2,0,2,2], [4,2,0,0], 4, [0]],
    [[2,4,4,2], [2,8,2,0], 8, [1]],
    [[0,2,0,4], [2,4,0,0], 0, []]
  ]) {
    const input = boardOf(row), copy = input.slice();
    const output = E.slide(input, 'left');
    assert.deepEqual(output.board, boardOf(expected));
    assert.equal(output.score, score); assert.deepEqual(output.merged, merged);
    assert.equal(output.moved, true); assert.deepEqual(input, copy);
  }
  const right = E.slide(boardOf([2,2,2,2]), 'right');
  assert.deepEqual(right.board.slice(0,4), [0,0,4,4]);
  assert.deepEqual(right.merged, [3,2]); assert.equal(right.score,8);
  const column = [2,0,0,0,2,0,0,0,4,0,0,0,0,0,0,0];
  const up = E.slide(column, 'up');
  assert.deepEqual(up.board, [4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0]);
  assert.deepEqual(up.merged,[0]); assert.equal(up.score,4);
  const down = E.slide(column,'down');
  assert.deepEqual(down.board,[0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0]);
  assert.deepEqual(down.merged,[8]); assert.equal(down.score,4);
});

test('no-op moves neither change the input nor manufacture score or merges', () => {
  const original=boardOf([2,4,8,16]);
  const result=E.slide(original,'left');
  assert.deepEqual(result,{board:original,moved:false,score:0,merged:[]});
  assert.notStrictEqual(result.board,original);
  assert.deepEqual(E.slide(Array(16).fill(0),'up'),{board:Array(16).fill(0),moved:false,score:0,merged:[]});
});

test('spawning chooses an empty cell uniformly and uses the 90/10 value threshold', () => {
  const source=Array(16).fill(0);
  let samples=[0,0.899999];
  const two=E.spawn(source,()=>samples.shift());
  assert.equal(two[0],2); assert.equal(two.filter(Boolean).length,1);
  samples=[0.999999,0.9];
  const four=E.spawn(two,()=>samples.shift());
  assert.equal(four[15],4); assert.equal(four[0],2);
  assert.deepEqual(source,Array(16).fill(0));
  const full=Array(16).fill(2);
  const untouched=E.spawn(full,()=>{throw new Error('No RNG call expected');});
  assert.deepEqual(untouched,full); assert.notStrictEqual(untouched,full);
  const occupied=Array(16).fill(4); occupied[3]=0; occupied[11]=0;
  samples=[0.5,0];
  assert.equal(E.spawn(occupied,()=>samples.shift())[11],2);
  assert.equal(E.start(()=>0).filter(Boolean).length,2);
  assert.deepEqual(E.start(()=>0).slice(0,4),[2,2,0,0]);
  assert.equal(E.start(()=>0.99).filter(v=>v===4).length,2);
});

test('game-over and victory checks distinguish full stalled boards and continued play', () => {
  const stalled=[2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2];
  assert.equal(E.canMove(stalled),false);
  const horizontal=stalled.slice(); horizontal[1]=2; assert(E.canMove(horizontal));
  const vertical=stalled.slice(); vertical[4]=2; assert(E.canMove(vertical));
  const empty=stalled.slice(); empty[15]=0; assert(E.canMove(empty));
  assert(!E.hasWon(stalled));
  const winning=E.slide(boardOf([1024,1024,0,0]),'left');
  assert.equal(winning.score,2048); assert(E.hasWon(winning.board));
  const continued=E.slide(boardOf([2048,2048,0,0]),'left');
  assert.equal(continued.score,4096); assert.equal(continued.board[0],4096); assert(E.hasWon(continued.board));
});

test('invalid inputs are rejected without silent corruption', () => {
  for (const board of [null,[],Array(15).fill(0),Array(16),Array(16).fill(1),Array(16).fill(3),Array(16).fill(NaN),Array(16).fill(2**31),Array(16).fill('2')]) {
    assert.equal(E.validBoard(board),false); assert.throws(()=>E.slide(board,'left')); assert.throws(()=>E.spawn(board));
    assert.equal(E.canMove(board),false); assert.equal(E.hasWon(board),false);
  }
  assert(E.validBoard(Array(16).fill(2**30)));
  assert.throws(()=>E.slide(Array(16).fill(0),'diagonal'));
  assert.throws(()=>E.slide(boardOf([2**30,2**30,0,0]),'left'),RangeError);
  for (const sample of [-0.1,1,NaN,Infinity,'0']) assert.throws(()=>E.spawn(Array(16).fill(0),()=>sample));
  assert.throws(()=>E.start(null));
});

test('invariant sweep preserves sums and agrees across rotated directions', () => {
  let seed=7139;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  const sum=b=>b.reduce((a,v)=>a+v,0);
  const rotate=b=>Array.from({length:16},(_,i)=>b[(3-i%4)*4+Math.floor(i/4)]);
  const nextDirection={left:'up',up:'right',right:'down',down:'left'};
  for(let n=0;n<500;n++) {
    const board=Array.from({length:16},()=>random()<.3?0:2**(1+Math.floor(random()*10)));
    const copy=board.slice();
    for(const direction of ['up','down','left','right']) {
      const result=E.slide(board,direction);
      assert.equal(sum(result.board),sum(board));
      assert.equal(result.board.filter(Boolean).length,board.filter(Boolean).length-result.merged.length);
      assert.equal(result.score,result.merged.reduce((total,id)=>total+result.board[id],0));
      assert(E.validBoard(result.board));
      const rotated=E.slide(rotate(board),nextDirection[direction]);
      assert.deepEqual(rotated.board,rotate(result.board)); assert.equal(rotated.score,result.score);
      assert.equal(rotated.moved,result.moved);
      assert.deepEqual(board,copy);
    }
  }
});
