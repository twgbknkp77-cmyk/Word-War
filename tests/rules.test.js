const assert = require("node:assert/strict");
const B = require("../blessings.js");

const powers = B.gods.flatMap(g => g.powers);
assert.equal(B.gods.length, 15, "15 gods");
assert.equal(powers.length, 45, "45 powers");
assert.equal(new Set(powers.map(p => p.id)).size, 45, "unique power IDs");

function stateFor(powerId) {
  return {
    blessings: [powerId], playerHp: 50, maxHp: 100,
    counters: { words: 0, aegisReady: 0 }, effects: B.initialEffects(),
    encounterWords: 0, justWon: false
  };
}

// Individually exercise all 45 powers through trigger-rich words and monster turns.
for (const power of powers) {
  const s = stateFor(power.id);
  B.startEncounter(s);
  for (const word of ["OCEAN", "JAZZ", "RAINBOW", "RIVER", "LETTER", "EXAMPLE"]) {
    const hit = B.resolveWord(s, word, { hp: 20, maxHp: 100 }, () => 0);
    assert.ok(Number.isFinite(hit.damage) && hit.damage >= 1, power.id + " valid damage");
    const turn = B.monsterTurn(s, 10, () => 0.99, 100);
    assert.ok(Number.isFinite(turn.damage) && turn.damage >= 0, power.id + " valid defence");
  }
  assert.ok(s.playerHp >= 0 && s.playerHp <= s.maxHp, power.id + " valid health");
}

let s = stateFor("warCry");
assert.equal(B.resolveWord(s, "CAT", { hp: 100, maxHp: 100 }, () => .99).damage, 9);
s = stateFor("earthshaker");
assert.equal(B.resolveWord(s, "OCEAN", { hp: 100, maxHp: 100 }, () => .99).damage, 20);
s = stateFor("divineArmour");
B.startEncounter(s);
assert.equal(B.monsterTurn(s, 8, () => .99).damage, 3);
s = stateFor("staticShock");
B.resolveWord(s, "CAT", { hp: 100, maxHp: 100 }, () => .99);
assert.equal(B.monsterTurn(s, 5, () => .99).dot, 1);
s = stateFor("wintersGrip");
for (let i = 0; i < 4; i++) B.resolveWord(s, "WORDS", { hp: 100, maxHp: 100 }, () => .99);
assert.equal(B.monsterTurn(s, 10, () => .99).skipped, true);

console.log("All 45 blessing smoke tests and focused rule checks passed.");
