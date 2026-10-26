const GameConfig=Object.freeze({
  saveVersion:4,
  startingHp:50,
  obolReward:10,
  maxHpReward:50,
  hydraRegeneration:5,
  elementalResistance:.5,
  cyclopsChargeMultiplier:2,
  petrifiedTileCount:2,
  petrifiedWordTurns:2,
  updateTileSelection(selection,index){const position=selection.indexOf(index);return position>=0?selection.slice(0,position):[...selection,index]},
  chooseRewardCategories(hasAvailableBlessing,random=Math.random){const choices=["obols","health"];if(hasAvailableBlessing)choices.push("blessing");for(let i=choices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}return choices.slice(0,2)},
  stages:[
    {name:"Coast of Greece",background:"assets/backgrounds/stage-1-coast.png"},
    {name:"The Aegean Sea",background:"assets/backgrounds/stage-2-aegean.png"},
    {name:"Mount Olympus",background:"assets/backgrounds/stage-3-olympus.png"},
    {name:"The Underworld",background:"assets/backgrounds/stage-4-underworld.png"},
    {name:"Tartarus",background:"assets/backgrounds/stage-5-tartarus.png"}
  ],
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
