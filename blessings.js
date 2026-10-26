(function(root){
"use strict";
const MAX_LEVEL=3;
const powerConfig={
 thunderbolt:{name:"Thunderbolt",levels:[{flat:2,text:"+2 damage to every successful word."},{flat:5,text:"+5 damage to every successful word."},{flat:9,text:"+9 damage to every successful word."}]},
 staticShock:{name:"Static Shock",levels:[{damage:1,stacks:5,duration:3,text:"Shock stacks up to 5; each stack deals 1 damage for 3 monster turns."},{damage:2,stacks:6,duration:3,text:"Shock stacks up to 6; each stack deals 2 damage for 3 monster turns."},{damage:3,stacks:7,duration:4,text:"Shock stacks up to 7; each stack deals 3 damage for 4 monster turns."}]},
 stormcaller:{name:"Stormcaller",levels:[{length:7,multiplier:1,text:"Words of 7+ letters trigger a lightning strike worth 100% of base damage."},{length:6,multiplier:1.25,text:"Words of 6+ letters trigger a lightning strike worth 125% of base damage."},{length:5,multiplier:1.5,text:"Words of 5+ letters trigger a lightning strike worth 150% of base damage."}]},
 tidalSurge:{name:"Tidal Surge",levels:[{every:3,damage:8,text:"Every 3rd successful word deals +8 damage."},{every:3,damage:12,text:"Every 3rd successful word deals +12 damage."},{every:3,damage:16,text:"Every 3rd successful word deals +16 damage."}]},
 undertow:{name:"Undertow",levels:[{vowels:3,reduction:.2,text:"Words with 3+ vowels reduce the next attack by 20%."},{vowels:3,reduction:.3,text:"Words with 3+ vowels reduce the next attack by 30%."},{vowels:2,reduction:.4,text:"Words with 2+ vowels reduce the next attack by 40%."}]},
 earthshaker:{name:"Earthshaker",levels:[{damage:10,text:"Water-related words deal +10 damage."},{damage:15,text:"Water-related words deal +15 damage."},{damage:22,text:"Water-related words deal +22 damage."}]},
 soulDrain:{name:"Soul Drain",levels:[{rate:.05,cap:3,text:"Restore 5% of damage dealt, up to 3 HP per word."},{rate:.08,cap:5,text:"Restore 8% of damage dealt, up to 5 HP per word."},{rate:.12,cap:8,text:"Restore 12% of damage dealt, up to 8 HP per word."}]},
 underworldCurse:{name:"Underworld Curse",levels:[{rate:.02,stacks:10,text:"Curse stacks up to 10; each stack increases damage taken by 2%."},{rate:.03,stacks:10,text:"Curse stacks up to 10; each stack increases damage taken by 3%."},{rate:.04,stacks:12,text:"Curse stacks up to 12; each stack increases damage taken by 4%."}]},
 deathsDoor:{name:"Death's Door",levels:[{threshold:.25,bonus:.25,text:"Deal +25% damage below 25% monster HP."},{threshold:.3,bonus:.35,text:"Deal +35% damage below 30% monster HP."},{threshold:.35,bonus:.5,text:"Deal +50% damage below 35% monster HP."}]},
 aegis:{name:"Aegis",levels:[{shield:15,cooldown:5,duration:3,length:5,text:"5+ letter words grant 15 shield for 3 turns; 5-word cooldown."},{shield:22,cooldown:4,duration:3,length:5,text:"5+ letter words grant 22 shield for 3 turns; 4-word cooldown."},{shield:30,cooldown:3,duration:4,length:5,text:"5+ letter words grant 30 shield for 4 turns; 3-word cooldown."}]},
 battleWisdom:{name:"Battle Wisdom",levels:[{length:6,reduction:.2,text:"Words of 6+ letters reduce the next attack by 20%."},{length:5,reduction:.3,text:"Words of 5+ letters reduce the next attack by 30%."},{length:5,reduction:.4,text:"Words of 5+ letters reduce the next attack by 40%."}]},
 calculatedStrike:{name:"Calculated Strike",levels:[{flat:2,reduction:.05,cap:.2,text:"Each J, Q, X or Z adds +2 damage and 5% reduction (max 20%)."},{flat:3,reduction:.075,cap:.3,text:"Each J, Q, X or Z adds +3 damage and 7.5% reduction (max 30%)."},{flat:5,reduction:.1,cap:.4,text:"Each J, Q, X or Z adds +5 damage and 10% reduction (max 40%)."}]},
 warCry:{name:"War Cry",levels:[{flat:3,text:"+3 damage to every successful word."},{flat:6,text:"+6 damage to every successful word."},{flat:10,text:"+10 damage to every successful word."}]},
 recklessAssault:{name:"Reckless Assault",levels:[{outgoing:.1,incoming:.2,text:"Deal 10% more damage but receive 20% more damage."},{outgoing:.18,incoming:.18,text:"Deal 18% more damage but receive 18% more damage."},{outgoing:.28,incoming:.15,text:"Deal 28% more damage but receive 15% more damage."}]},
 warpath:{name:"Warpath",levels:[{every:4,multiplier:1,text:"Every 4th word strikes again for 100% of base damage."},{every:3,multiplier:1.25,text:"Every 3rd word strikes again for 125% of base damage."},{every:3,multiplier:1.5,text:"Every 3rd word strikes again for 150% of base damage."}]},
 healingLight:{name:"Healing Light",levels:[{length:6,heal:4,text:"Words of 6+ letters restore 4 HP."},{length:6,heal:7,text:"Words of 6+ letters restore 7 HP."},{length:5,heal:10,text:"Words of 5+ letters restore 10 HP."}]},
 sunfire:{name:"Sunfire",levels:[{damage:2,duration:3,text:"Burn deals 2 damage for 3 monster turns."},{damage:3,duration:3,text:"Burn deals 3 damage for 3 monster turns."},{damage:5,duration:4,text:"Burn deals 5 damage for 4 monster turns."}]},
 blindingRadiance:{name:"Blinding Radiance",levels:[{chance:.05,text:"Each word has a 5% chance to blind the monster."},{chance:.1,text:"Each word has a 10% chance to blind the monster."},{chance:.18,text:"Each word has an 18% chance to blind the monster."}]}
};
const roster=[
 ["zeus","Zeus","⚡","Lightning, direct damage and shock",["thunderbolt","staticShock","stormcaller"]],
 ["poseidon","Poseidon","🔱","Water, powerful attacks and weakening",["tidalSurge","undertow","earthshaker"]],
 ["hades","Hades","💀","Life stealing, curses and damage over time",["soulDrain","underworldCurse","deathsDoor"]],
 ["athena","Athena","🛡️","Shields, protection and damage reduction",["aegis","battleWisdom","calculatedStrike"]],
 ["ares","Ares","⚔️","Aggressive attacks and additional strikes",["warCry","recklessAssault","warpath"]],
 ["apollo","Apollo","☀️","Healing, sunlight and burning",["healingLight","sunfire","blindingRadiance"]]
];
const gods=roster.map(([id,name,emoji,domain,ids])=>({id,name,emoji,domain,powers:ids.map(powerId=>({id:powerId,godId:id,name:powerConfig[powerId].name}))}));
const godById=Object.fromEntries(gods.map(g=>[g.id,g])),powerById=Object.fromEntries(gods.flatMap(g=>g.powers).map(p=>[p.id,p]));
const waterWords=new Set(["ocean","river","rain","wave","sea","tide","lake","brook","stream","storm","water","shore","reef","bay","flood"]);
const values={A:1,B:2,C:2,D:2,E:1,F:3,G:2,H:3,I:1,J:4,K:4,L:1,M:2,N:1,O:1,P:2,Q:5,R:1,S:1,T:1,U:1,V:3,W:3,X:4,Y:3,Z:5};
const level=(s,id)=>powerConfig[id]?Math.max(0,Math.min(MAX_LEVEL,Number(s.blessings?.[id]||(Array.isArray(s.blessings)&&s.blessings.includes(id)?1:0))||0)):0;
const owns=(s,id)=>level(s,id)>0,stats=(s,id)=>powerConfig[id].levels[level(s,id)-1],description=(id,lvl)=>powerConfig[id].levels[Math.max(1,Math.min(MAX_LEVEL,lvl))-1].text;
const eligibleGods=s=>gods.filter(g=>g.powers.some(p=>level(s,p.id)<MAX_LEVEL));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),vowels=w=>[...w].filter(c=>"AEIOU".includes(c));
function initialEffects(){return{shield:0,shieldTurns:0,nextReduction:0,skip:false,shock:0,shockTurns:0,burnTurns:0,curse:0}}
function startEncounter(s){s.effects=initialEffects();s.encounterWords=0;s.justWon=false}
function resolveWord(s,word,monster,rng=Math.random){
 const e=s.effects,c=s.counters,total=(c.words=(c.words||0)+1);s.encounterWords=(s.encounterWords||0)+1;
 let base=[...word].reduce((n,x)=>n+values[x],0)+Math.max(0,word.length-3)*2,flat=0,pct=0,extra=0,heal=0,labels=[],elemental={fire:0,water:0,lightning:0};
 if(owns(s,"thunderbolt")){const v=stats(s,"thunderbolt").flat;flat+=v;elemental.lightning+=v}
 if(owns(s,"warCry"))flat+=stats(s,"warCry").flat;
 if(owns(s,"recklessAssault"))pct+=stats(s,"recklessAssault").outgoing;
 if(owns(s,"deathsDoor")){const v=stats(s,"deathsDoor");if(monster.hp<monster.maxHp*v.threshold)pct+=v.bonus}
 if(owns(s,"underworldCurse"))pct+=e.curse*stats(s,"underworldCurse").rate;
 const rare=[...word].filter(x=>"JQXZ".includes(x)).length;if(owns(s,"calculatedStrike")&&rare){const v=stats(s,"calculatedStrike");flat+=rare*v.flat;e.nextReduction=clamp(e.nextReduction+Math.min(v.cap,rare*v.reduction),0,.8);labels.push("Calculated Strike")}
 if(owns(s,"tidalSurge")){const v=stats(s,"tidalSurge");if(total%v.every===0){flat+=v.damage;elemental.water+=v.damage;labels.push("Tidal Surge +"+v.damage)}}
 if(owns(s,"earthshaker")&&waterWords.has(word.toLowerCase())){const v=stats(s,"earthshaker").damage;flat+=v;elemental.water+=v;labels.push("Earthshaker +"+v)}
 if(owns(s,"stormcaller")){const v=stats(s,"stormcaller");if(word.length>=v.length){extra+=Math.round(base*v.multiplier);labels.push("Stormcaller")}}
 if(owns(s,"warpath")){const v=stats(s,"warpath");if(total%v.every===0){extra+=Math.round(base*v.multiplier);labels.push("Warpath")}}
 let normal=Math.max(1,Math.round(base*(1+pct)+flat)),damage=normal+extra;
 if(monster.resistance&&elemental[monster.resistance]){const resisted=Math.round(elemental[monster.resistance]*(monster.resistanceRate||.5));damage=Math.max(1,damage-resisted);labels.push(monster.resistance+" resisted −"+resisted)}
 if(owns(s,"soulDrain")){const v=stats(s,"soulDrain");heal+=Math.min(v.cap,Math.ceil(damage*v.rate))}
 if(owns(s,"healingLight")){const v=stats(s,"healingLight");if(word.length>=v.length)heal+=v.heal}
 if(owns(s,"undertow")){const v=stats(s,"undertow");if(vowels(word).length>=v.vowels)e.nextReduction=clamp(e.nextReduction+v.reduction,0,.8)}
 if(owns(s,"battleWisdom")){const v=stats(s,"battleWisdom");if(word.length>=v.length)e.nextReduction=clamp(e.nextReduction+v.reduction,0,.8)}
 if(owns(s,"aegis")){const v=stats(s,"aegis");if((c.aegisReady||0)>0)c.aegisReady--;if(word.length>=v.length&&(c.aegisReady||0)<=0){e.shield=v.shield;e.shieldTurns=v.duration;c.aegisReady=v.cooldown;labels.push("Aegis "+v.shield)}}
 if(owns(s,"staticShock")){const v=stats(s,"staticShock");e.shock=Math.min(v.stacks,e.shock+1);e.shockTurns=v.duration}
 if(owns(s,"sunfire")){const v=stats(s,"sunfire");e.burnTurns=v.duration}
 if(owns(s,"underworldCurse")){const v=stats(s,"underworldCurse");e.curse=Math.min(v.stacks,e.curse+1)}
 if(owns(s,"blindingRadiance")&&rng()<stats(s,"blindingRadiance").chance)e.skip=true;
 s.playerHp=Math.min(s.maxHp,s.playerHp+heal);return{base,damage,heal,critical:false,labels,elemental};
}
function monsterTurn(s,rawDamage,rng=Math.random,monsterHp=Infinity){
 const e=s.effects,shock=owns(s,"staticShock")&&e.shockTurns?e.shock*stats(s,"staticShock").damage:0,burn=owns(s,"sunfire")&&e.burnTurns?stats(s,"sunfire").damage:0,dot=shock+burn;
 let skipped=e.skip||dot>=(s.monsterHp??monsterHp),damage=0;if(!skipped){const incoming=owns(s,"recklessAssault")?1+stats(s,"recklessAssault").incoming:1;damage=Math.max(0,Math.round(rawDamage*incoming*(1-e.nextReduction)));const absorbed=Math.min(e.shield,damage);e.shield-=absorbed;damage-=absorbed;s.playerHp=Math.max(0,s.playerHp-damage)}
 e.skip=false;e.nextReduction=0;if(e.shieldTurns>0&&--e.shieldTurns===0)e.shield=0;if(e.shockTurns>0&&--e.shockTurns===0)e.shock=0;if(e.burnTurns>0)e.burnTurns--;return{dot,skipped,damage,retaliate:0};
}
const api={MAX_LEVEL,powerConfig,gods,godById,powerById,waterWords,values,level,owns,stats,description,eligibleGods,initialEffects,startEncounter,resolveWord,monsterTurn};
root.BlessingEngine=api;if(typeof module!=="undefined")module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
