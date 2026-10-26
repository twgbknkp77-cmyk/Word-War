const assert=require("node:assert/strict");
const test=require("node:test");
const config=require("../config.js");

test("tapping a selected tile removes it and every later tile",()=>{
  assert.deepEqual(config.updateTileSelection([2,7,5,12],7),[2]);
  assert.deepEqual(config.updateTileSelection([2,7,5,12],2),[]);
  assert.deepEqual(config.updateTileSelection([2,7,5,12],12),[2,7,5]);
});

test("tapping an unselected tile appends it",()=>{
  assert.deepEqual(config.updateTileSelection([2,7],5),[2,7,5]);
});

test("victory rewards contain exactly two distinct categories",()=>{
  const offers=config.chooseRewardCategories(true,()=>0);
  assert.equal(offers.length,2);
  assert.equal(new Set(offers).size,2);
});

test("blessings are excluded once no eligible power remains",()=>{
  const offers=config.chooseRewardCategories(false,()=>0.75);
  assert.deepEqual(new Set(offers),new Set(["obols","health"]));
});
