const GameConfig=Object.freeze({
  saveVersion:3,
  startingHp:50,
  obolReward:10,
  maxHpReward:50,
  hydraRegeneration:5,
  elementalResistance:.5,
  cyclopsChargeMultiplier:2,
  petrifiedTileCount:2,
  petrifiedWordTurns:2,
  encounterBands:[
    {regularHp:[20,35],regularDamage:[2,4],bossHp:55,bossDamage:5},
    {regularHp:[40,65],regularDamage:[4,6],bossHp:90,bossDamage:7},
    {regularHp:[75,110],regularDamage:[6,9],bossHp:145,bossDamage:10},
    {regularHp:[120,170],regularDamage:[8,12],bossHp:220,bossDamage:14},
    {regularHp:[180,260],regularDamage:[11,16],bossHp:350,bossDamage:18}
  ]
});
globalThis.GameConfig=GameConfig;
if(typeof module!=="undefined")module.exports=GameConfig;
