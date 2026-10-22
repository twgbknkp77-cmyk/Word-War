(function(root){
"use strict";
const G=[
["zeus","Zeus","⚡","Lightning",[["thunderbolt","Thunderbolt","Every successful word deals +2 lightning damage."],["staticShock","Static Shock","Successful words add Shock (max 5); each stack deals 1 damage for 3 monster turns."],["stormcaller","Stormcaller","Words of 7+ letters strike again for the base word damage."]]],
["poseidon","Poseidon","🔱","Sea and earthquakes",[["tidalSurge","Tidal Surge","Every 3rd successful word deals +8 damage."],["undertow","Undertow","Words with 3+ vowels weaken the next attack by 20%."],["earthshaker","Earthshaker","Water-related words deal +10 damage."]]],
["hades","Hades","💀","The Underworld",[["soulDrain","Soul Drain","Heal 5% of actual damage dealt, rounded up (maximum 3 HP per word)."],["underworldCurse","Underworld Curse","Each word adds Curse (max 10), increasing damage taken by 2% per stack."],["deathsDoor","Death's Door","Deal +25% damage while the monster is below 25% HP."]]],
["athena","Athena","🛡️","Wisdom and defence",[["aegis","Aegis","Words of 5+ letters grant a 15 HP shield once every 5 player turns; lasts 3 monster turns."],["battleWisdom","Battle Wisdom","Words of 6+ letters weaken the next attack by 20%."],["calculatedStrike","Calculated Strike","Each J, Q, X or Z adds +5% damage and 5% next-attack reduction (max 20%)."]]],
["ares","Ares","⚔️","War",[["warCry","War Cry","Every successful word deals +3 damage."],["recklessAssault","Reckless Assault","Deal +10% damage, but receive +20% monster damage."],["warpath","Warpath","Every 4th successful word strikes again for the base word damage."]]],
["apollo","Apollo","☀️","Sun and healing",[["healingLight","Healing Light","Words of 6+ letters restore 4 HP."],["sunfire","Sunfire","Words apply Burn for 3 turns, dealing 2 damage before each monster attack."],["blindingRadiance","Blinding Radiance","Each word has a 5% chance to make the next attack miss."]]],
["artemis","Artemis","🏹","Hunting",[["huntersInstinct","Hunter's Instinct","Each word has a 10% critical-hit chance."],["piercingArrow","Piercing Arrow","Every 5th word deals +10 armour-piercing damage."],["perfectShot","Perfect Shot","Words containing J, Q, X or Z gain +15% critical-hit chance."]]],
["hermes","Hermes","🪽","Speed and trickery",[["quickWords","Quick Words","Words of 3–4 letters deal +4 damage."],["fleetfoot","Fleetfoot","Each word grants a 10% chance to dodge the next attack."],["divineExchange","Divine Exchange","Once per encounter, replace 3 random grid letters."]]],
["demeter","Demeter","🌾","Harvest and seasons",[["harvest","Harvest","Every 5th word restores 10 HP."],["wintersGrip","Winter's Grip","Every 4th word freezes the monster's next attack."],["regrowth","Regrowth","Restore 5 HP at the start of each encounter."]]],
["hephaestus","Hephaestus","🔨","The forge",[["forgedWeapon","Forged Weapon","Every 3rd word grants +5 damage for the next 3 attacks; refreshes."],["divineArmour","Divine Armour","Begin each encounter with 5 armour that absorbs damage."],["anvilStrike","Anvil Strike","Repeated letters contribute double their normal tile value."]]],
["dionysus","Dionysus","🍇","Wine and intoxication",[["intoxication","Intoxication","Each word adds Poison (max 6); stacks deal 1 damage before attacks."],["confusion","Confusion","Every word weakens the next attack by 10%."],["wildRevelry","Wild Revelry","Every 2nd word: +5 damage, heal 3 HP, or weaken the next attack by 20%."]]],
["hestia","Hestia","🔥","Hearth and home",[["hearthsWarmth","Hearth's Warmth","Every 3rd word restores 2 HP."],["safeHaven","Safe Haven","Start encounters below 50% HP by restoring 5 HP."],["sacredFlame","Sacred Flame","After taking damage, retaliate for 3 damage once that monster turn."]]],
["iris","Iris","🌈","The rainbow",[["prismaticWords","Prismatic Words","Words with 5+ distinct letters deal +5 damage."],["rainbowBlessing","Rainbow Blessing","Words with 3+ distinct vowels deal +5 damage."],["spectrum","Spectrum","Repeating a vowel across consecutive words adds +1, +2, then +3 damage."]]],
["nike","Nike","🏆","Victory",[["victoryRush","Victory Rush","After a victory, words deal +3 damage in the next encounter."],["openingTriumph","Opening Triumph","The first 2 words of each encounter deal +5 damage."],["unbrokenStreak","Unbroken Streak","Consecutive 5+ letter words add +1 to +4 damage; shorter words reset it."]]],
["hypnos","Hypnos","😴","Sleep",[["slumber","Slumber","Each word has a 2% chance to make the monster skip its next attack."],["heavyEyelids","Heavy Eyelids","Every 4th word weakens the next attack by 50%."],["nightmare","Nightmare","Every 5th word deals +8 damage and weakens the next attack by 10%."]]]
];
const gods=G.map(([id,name,emoji,domain,powers])=>({id,name,emoji,domain,powers:powers.map(([id,name,description])=>({id,name,description,godId:id}))}));
// Correct godId after compact roster expansion.
gods.forEach(g=>g.powers.forEach(p=>p.godId=g.id));
const powerById=Object.fromEntries(gods.flatMap(g=>g.powers).map(p=>[p.id,p]));
const godById=Object.fromEntries(gods.map(g=>[g.id,g]));
const waterWords=new Set(["ocean","river","rain","wave","sea","tide","lake","brook","stream","storm","water","shore","reef","bay","flood"]);
const values={A:1,B:2,C:2,D:2,E:1,F:3,G:2,H:3,I:1,J:4,K:4,L:1,M:2,N:1,O:1,P:2,Q:5,R:1,S:1,T:1,U:1,V:3,W:3,X:4,Y:3,Z:5};
const owns=(s,id)=>s.blessings.includes(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),vowels=w=>[...w].filter(c=>"AEIOU".includes(c));
function initialEffects(){return{shield:0,shieldTurns:0,armour:0,nextReduction:0,dodge:0,skip:false,shock:0,shockTurns:0,burnTurns:0,poison:0,curse:0,forgedHits:0,victoryRush:false,vowelStreak:"",vowelStreakCount:0,longStreak:0,exchangeUsed:false}}
function startEncounter(s){const e=s.effects=initialEffects();if(owns(s,"regrowth"))s.playerHp=Math.min(s.maxHp,s.playerHp+5);if(owns(s,"safeHaven")&&s.playerHp<s.maxHp*.5)s.playerHp=Math.min(s.maxHp,s.playerHp+5);if(owns(s,"divineArmour"))e.armour=5;if(owns(s,"victoryRush")&&s.justWon)e.victoryRush=true;s.encounterWords=0;s.justWon=false}
function resolveWord(s,word,monster,rng=Math.random){
 const e=s.effects,c=s.counters,total=(c.words=(c.words||0)+1),enc=(s.encounterWords=(s.encounterWords||0)+1),counts={};[...word].forEach(x=>counts[x]=(counts[x]||0)+1);
 let base=[...word].reduce((n,x)=>n+values[x],0)+Math.max(0,word.length-3)*2,labels=[],flat=0,pct=0,extra=0,heal=0,elemental={fire:0,water:0,lightning:0};
 if(owns(s,"anvilStrike"))for(const x of word)if(counts[x]>1)base+=values[x];
 if(owns(s,"thunderbolt")){flat+=2;elemental.lightning+=2}if(owns(s,"quickWords")&&word.length<=4)flat+=4;if(owns(s,"prismaticWords")&&new Set(word).size>=5)flat+=5;
 if(owns(s,"recklessAssault"))pct+=.1;if(owns(s,"deathsDoor")&&monster.hp<monster.maxHp*.25)pct+=.25;
 if(owns(s,"openingTriumph")&&enc<=2)flat+=5;if(e.victoryRush)flat+=3;
 const rare=[...word].filter(x=>"JQXZ".includes(x)).length;if(owns(s,"calculatedStrike")&&rare){flat+=rare*2;e.nextReduction=clamp(e.nextReduction+Math.min(.2,rare*.05),0,.8);labels.push("Calculated Strike")}
 if(owns(s,"unbrokenStreak")){e.longStreak=word.length>=5?Math.min(4,e.longStreak+1):0;flat+=e.longStreak}
 if(owns(s,"spectrum")){const present=[...new Set(vowels(word))];if(e.vowelStreak&&present.includes(e.vowelStreak))e.vowelStreakCount=Math.min(3,e.vowelStreakCount+1);else{e.vowelStreak=present[0]||"";e.vowelStreakCount=e.vowelStreak?1:0}flat+=e.vowelStreakCount}
 if(owns(s,"underworldCurse"))pct+=e.curse*.02;
 if(owns(s,"warCry"))flat+=3;if(owns(s,"tidalSurge")&&total%3===0){flat+=8;elemental.water+=8;labels.push("Tidal Surge +8")}if(owns(s,"earthshaker")&&waterWords.has(word.toLowerCase())){flat+=10;elemental.water+=10;labels.push("Earthshaker +10")}
 if(owns(s,"rainbowBlessing")&&new Set(vowels(word)).size>=3)flat+=5;if(owns(s,"piercingArrow")&&total%5===0)flat+=10;if(owns(s,"nightmare")&&total%5===0){flat+=8;e.nextReduction=clamp(e.nextReduction+.1,0,.8)}
 if(owns(s,"forgedWeapon")&&total%3===0)e.forgedHits=3;if(e.forgedHits>0){flat+=5;e.forgedHits--}
 if(owns(s,"wildRevelry")&&total%2===0){const r=Math.floor(rng()*3);if(r===0)flat+=5;else if(r===1)heal+=3;else e.nextReduction=clamp(e.nextReduction+.2,0,.8);labels.push("Wild Revelry")}
 let normal=Math.max(1,Math.round(base*(1+pct)+flat)),critChance=(owns(s,"huntersInstinct")?.1:0)+(owns(s,"perfectShot")&&rare?.15:0),critical=rng()<critChance;if(critical){normal=Math.round(normal*1.5);labels.push("Critical hit!")}
 if(owns(s,"stormcaller")&&word.length>=7)extra+=base;if(owns(s,"warpath")&&total%4===0)extra+=base;
 let damage=normal+extra;if(monster.resistance&&elemental[monster.resistance]){const resisted=Math.round(elemental[monster.resistance]*(monster.resistanceRate||.5));damage=Math.max(1,damage-resisted);labels.push(monster.resistance+" resisted −"+resisted)}
 if(owns(s,"soulDrain"))heal+=Math.min(3,Math.ceil(damage*.05));if(owns(s,"healingLight")&&word.length>=6)heal+=4;if(owns(s,"harvest")&&total%5===0)heal+=10;if(owns(s,"hearthsWarmth")&&total%3===0)heal+=2;
 if(owns(s,"undertow")&&vowels(word).length>=3)e.nextReduction=clamp(e.nextReduction+.2,0,.8);if(owns(s,"battleWisdom")&&word.length>=6)e.nextReduction=clamp(e.nextReduction+.2,0,.8);if(owns(s,"confusion"))e.nextReduction=clamp(e.nextReduction+.1,0,.8);
 if(owns(s,"aegis")&&word.length>=5&&(c.aegisReady||0)<=0){e.shield=15;e.shieldTurns=3;c.aegisReady=5;labels.push("Aegis 15")}if(c.aegisReady>0)c.aegisReady--;
 if(owns(s,"staticShock")){e.shock=Math.min(5,e.shock+1);e.shockTurns=3}if(owns(s,"sunfire"))e.burnTurns=3;if(owns(s,"intoxication"))e.poison=Math.min(6,e.poison+1);if(owns(s,"underworldCurse"))e.curse=Math.min(10,e.curse+1);
 if(owns(s,"wintersGrip")&&total%4===0)e.skip=true;if(owns(s,"heavyEyelids")&&total%4===0)e.nextReduction=clamp(e.nextReduction+.5,0,.8);
 if(owns(s,"blindingRadiance")&&rng()<.05)e.skip=true;if(owns(s,"slumber")&&rng()<.02)e.skip=true;if(owns(s,"fleetfoot"))e.dodge=.1;
 s.playerHp=Math.min(s.maxHp,s.playerHp+heal);return{base,damage,heal,critical,labels,elemental};
}
function monsterTurn(s,rawDamage,rng=Math.random,monsterHp=Infinity){const e=s.effects,dot=(e.shockTurns?e.shock:0)+(e.burnTurns?2:0)+e.poison;let skipped=e.skip||dot>=(s.monsterHp??monsterHp)||rng()<e.dodge,damage=0,retaliate=0;if(!skipped){damage=Math.max(0,Math.round(rawDamage*(owns(s,"recklessAssault")?1.2:1)*(1-e.nextReduction)));let absorbed=Math.min(e.armour,damage);e.armour-=absorbed;damage-=absorbed;absorbed=Math.min(e.shield,damage);e.shield-=absorbed;damage-=absorbed;s.playerHp=Math.max(0,s.playerHp-damage);if(damage>0&&owns(s,"sacredFlame"))retaliate=3}e.skip=false;e.dodge=0;e.nextReduction=0;if(e.shieldTurns>0&&--e.shieldTurns===0)e.shield=0;if(e.shockTurns>0&&--e.shockTurns===0)e.shock=0;if(e.burnTurns>0)e.burnTurns--;return{dot,skipped,damage,retaliate}}
const api={gods,godById,powerById,waterWords,values,initialEffects,startEncounter,resolveWord,monsterTurn};
root.BlessingEngine=api;if(typeof module!=="undefined")module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
