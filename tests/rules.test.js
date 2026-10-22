const assert = require("node:assert/strict");
const game = require("../game.js");

assert.equal(game.calculateDamage("CAT"), 4);
assert.equal(game.calculateDamage("CATER"), 10);
assert.equal(game.rarityWeights(0).Legendary, 5);
assert.equal(game.rarityWeights(10).Legendary, 25);
assert.equal(game.rarityWeights(48).Legendary, 100);

for (let run = 0; run < 250; run += 1) {
  const campaign = game.makeCampaign();
  assert.equal(campaign.length, 15);
  assert.equal(new Set(campaign).size, 15);
  assert.equal(campaign.at(-1), "typhon");
}

console.log("All game-rule checks passed.");
