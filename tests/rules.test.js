const assert=require("node:assert/strict");
const test=require("node:test");
const B=require("../blessings.js");
const C=require("../config.js");

function stateFor(blessings={}){return{blessings,playerHp:50,maxHp:100,counters:{words:0,aegisReady:0},effects:B.initialEffects(),encounterWords:0,justWon:false}}
const monster=(hp=100)=>({hp,maxHp:100});

test("the roster has six gods with three unique powers each",()=>{
 assert.deepEqual(B.gods.map(g=>g.id),["zeus","poseidon","hades","athena","ares","apollo"]);
 assert.ok(B.gods.every(g=>g.powers.length===3));
 const powers=B.gods.flatMap(g=>g.powers);assert.equal(powers.length,18);assert.equal(new Set(powers.map(p=>p.id)).size,18);
});

test("every power has three centrally configured levels",()=>{
 Object.values(B.powerConfig).forEach(power=>assert.equal(power.levels.length,3,power.name));
});

test("Thunderbolt upgrades replace rather than stack",()=>{
 assert.equal(B.resolveWord(stateFor({thunderbolt:1}),"CAT",monster(),()=>.99).damage,6);
 assert.equal(B.resolveWord(stateFor({thunderbolt:2}),"CAT",monster(),()=>.99).damage,9);
 assert.equal(B.resolveWord(stateFor({thunderbolt:3}),"CAT",monster(),()=>.99).damage,13);
});

test("same-god and cross-god powers combine",()=>{
 const same=B.resolveWord(stateFor({thunderbolt:2,stormcaller:1}),"EXAMPLE",monster(),()=>.99);
 assert.ok(same.damage>9);
 const mixed=B.resolveWord(stateFor({thunderbolt:1,warCry:1}),"CAT",monster(),()=>.99);
 assert.equal(mixed.damage,9);
});

test("level three powers are no longer eligible",()=>{
 const maxed={};B.gods[0].powers.forEach(p=>maxed[p.id]=3);
 assert.ok(!B.eligibleGods(stateFor(maxed)).some(g=>g.id==="zeus"));
 B.gods.slice(1).flatMap(g=>g.powers).forEach(p=>maxed[p.id]=3);
 assert.equal(B.eligibleGods(stateFor(maxed)).length,0);
});

test("healing, shields, damage over time and defence use current levels",()=>{
 let s=stateFor({healingLight:3});s.playerHp=20;assert.equal(B.resolveWord(s,"WORDS",monster(),()=>.99).heal,10);
 s=stateFor({aegis:3});B.resolveWord(s,"WORDS",monster(),()=>.99);assert.equal(s.effects.shield,30);
 s=stateFor({staticShock:2,sunfire:2});B.resolveWord(s,"CAT",monster(),()=>.99);assert.equal(B.monsterTurn(s,0,()=>.99).dot,5);
 s=stateFor({battleWisdom:3});B.resolveWord(s,"WORDS",monster(),()=>.99);assert.equal(B.monsterTurn(s,10,()=>.99).damage,6);
});

test("legacy blessing arrays remain readable as level one",()=>{
 const s=stateFor(["warCry","quickWords"]);assert.equal(B.level(s,"warCry"),1);assert.equal(B.level(s,"quickWords"),0);
});

test("core campaign balance remains unchanged",()=>{
 assert.equal(C.startingHp,50);assert.equal(C.obolReward,10);assert.equal(C.maxHpReward,50);
 assert.deepEqual(C.encounterBands.map(x=>x.bossHp),[55,90,145,220,350]);
});
