const PLAYER_STARTING_MAX = 60;
const values = {A:1,B:2,C:2,D:2,E:1,F:3,G:2,H:3,I:1,J:4,K:4,L:1,M:2,N:1,O:1,P:2,Q:5,R:1,S:1,T:1,U:1,V:3,W:3,X:4,Y:3,Z:5};
const vowels = "AAAAAAAEEEEEEEEEEIIIIIIOOOOOOUUUY";
const consonants = "BBBBCCCDDDDFFGGGGHHHJKLLLLMMMMNNNNNNPPQRRRRRRSSSSSSTTTTTTVVWWXYZ";
const charges = [
  {id:"ember",symbol:"◆",label:"Ember",damage:3},
  {id:"ward",symbol:"⬟",label:"Ward",block:3},
  {id:"bloom",symbol:"✦",label:"Bloom",heal:7}
];
const blockedWords = new Set([
  "arse","arses","asshole","assholes","bastard","bastards","bitch","bitches","bollock","bollocks","boner","bullshit","cock","cocks","crap","cunt","cunts","damn","dick","dicks","dildo","fag","fags","fuck","fucks","fucked","fucker","fuckers","fucking","motherfucker","piss","pissed","prick","pricks","pussy","shit","shits","shitty","slut","sluts","tit","tits","twat","twats","wank","wanker","wankers","whore","whores"
]);
const moveTypes = {
  physical:{symbol:"⚔",label:"Physical attack"},magic:{symbol:"✦",label:"Magical attack"},grid:{symbol:"▦",label:"Grid attack"},power:{symbol:"▲",label:"Power-up"},healing:{symbol:"♥",label:"Healing attack"},curse:{symbol:"◆",label:"Status attack"}
};

const enemies = [
  {name:"Pip the Satyr",place:"The Whispering Olive Grove",hp:42,pos:0,moves:[
    {name:"Horn Rush",damage:4,pose:"rush",type:"physical"},{name:"Pipe Puzzle",damage:3,scramble:true,pose:"pipes",type:"grid"},{name:"Mule Kick",damage:7,pose:"kick",type:"physical"}
  ]},
  {name:"Brontes the Minotaur",place:"The Crooked Labyrinth",hp:60,pos:23,moves:[
    {name:"Horn Rush",damage:6,type:"physical"},{name:"Maze Seal",damage:3,lock:3,turns:3,type:"grid"},{name:"Wall Breaker",damage:9,type:"physical"}
  ]},
  {name:"Melia the Gorgon",place:"The Silent Statue Garden",hp:76,pos:48,moves:[
    {name:"Snake Snap",damage:6,type:"physical"},{name:"Stone Glance",damage:4,petrify:4,turns:2,type:"grid"},{name:"Marble Gaze",damage:10,type:"magic"}
  ]},
  {name:"The Marsh Hydra",place:"The Reedy Moon Marsh",hp:94,pos:70,moves:[
    {name:"Triple Nip",damage:9,hits:3,type:"physical"},{name:"Rising Fury",damage:0,power:5,type:"power"},{name:"Regrow",damage:4,heal:7,type:"healing"}
  ]},
  {name:"Polyphemus the Scribe",place:"The Summit Archive",hp:118,pos:95,moves:[
    {name:"Tablet Thump",damage:8,type:"physical"},{name:"Bad Revision",damage:5,crack:4,turns:3,type:"grid"},{name:"Final Draft",damage:13,erode:true,type:"curse"}
  ]}
];

const $ = s => document.querySelector(s);
const el = {battle:$("#battle"),chapter:$("#chapter-card"),heroF:$("#hero-fighter"),enemyF:$("#enemy-fighter"),heroArt:$("#hero-art"),enemyArt:$("#enemy-art"),enemyName:$("#enemy-name"),heroHp:$("#hero-hp"),heroMax:$("#hero-max"),enemyHp:$("#enemy-hp"),enemyMax:$("#enemy-max"),heroBar:$("#hero-bar"),enemyBar:$("#enemy-bar"),heroStatusIcons:$("#hero-status-icons"),enemyStatusIcons:$("#enemy-status-icons"),enemyMovesToggle:$("#enemy-moves-toggle"),enemyMoves:$("#enemy-moves"),effects:$("#effects"),banner:$("#battle-banner"),rewardModal:$("#reward-modal"),rewardOptions:$("#reward-options"),grid:$("#grid"),word:$("#word"),damage:$("#damage"),message:$("#message"),shuffle:$("#shuffle"),attack:$("#attack"),restart:$("#restart")};

// Screen-left and screen-right are used deliberately so visual feedback maps
// directly to these coordinates. This object is Pip's single skeleton source.
const pipSkeleton = Object.freeze({
  neck:{x:102,y:66,label:"N"}, chest:{x:105,y:90,label:"C"},
  leftShoulder:{x:78,y:74,label:"LS"}, leftElbow:{x:69,y:102,label:"LE"}, leftHand:{x:48,y:138,label:"LH"},
  rightShoulder:{x:120,y:71,label:"RS"}, rightElbow:{x:139,y:98,label:"RE"}, rightHand:{x:166,y:120,label:"RH"},
  pelvis:{x:104,y:130,label:"P"},
  leftHip:{x:88,y:136,label:"LHi"}, leftKnee:{x:93,y:161,label:"LK"}, leftAnkle:{x:75,y:186,label:"LA"}, leftHoof:{x:72,y:204,label:"LF"},
  rightHip:{x:120,y:136,label:"RHi"}, rightKnee:{x:132,y:161,label:"RK"}, rightAnkle:{x:153,y:188,label:"RA"}, rightHoof:{x:163,y:206,label:"RF"},
  tailBase:{x:134,y:139,label:"TB"}, tailTip:{x:159,y:144,label:"TT"}
});

// Pixel-space anchor points measured on the transparent source artwork.
// Each segment is fitted so its two anchors land on the matching skeleton bone.
const pipArtworkAnchors = Object.freeze({
  // Attach the head just beneath Pip's chin, rather than at the bottom of
  // the painted neck. This seats the head closer to the torso.
  head:{width:555,height:470,scale:105/555,anchor:{x:365,y:370}},
  upperArm:{width:300,height:310,scale:.18,from:{x:242,y:58},to:{x:82,y:250}},
  forearm:{width:310,height:245,scale:.18,from:{x:244,y:40},to:{x:60,y:205}},
  upperLeg:{width:290,height:415,scale:.15,from:{x:180,y:50},to:{x:145,y:360}},
  lowerLeg:{width:260,height:380,scale:.18,from:{x:150,y:40},to:{x:70,y:350}}
});

function fitPipPoint(selector,artKey,jointName){
  const node=$(selector),art=pipArtworkAnchors[artKey],joint=pipSkeleton[jointName];
  if(!node||!art?.anchor||!joint)return;
  const width=art.width*art.scale,height=art.height*art.scale;
  node.style.left=`${joint.x-art.anchor.x*art.scale}px`;
  node.style.top=`${joint.y-art.anchor.y*art.scale}px`;
  node.style.width=`${width}px`;node.style.height=`${height}px`;
}

function fitPipSegment(selector,artKey,fromName,toName,mirrored=false){
  const node=$(selector),art=pipArtworkAnchors[artKey],from=pipSkeleton[fromName],to=pipSkeleton[toName];
  if(!node||!art||!from||!to)return;
  const width=art.width*art.scale,height=art.height*art.scale;
  const sourceFrom={x:(mirrored?art.width-art.from.x:art.from.x)*art.scale,y:art.from.y*art.scale};
  const sourceTo={x:(mirrored?art.width-art.to.x:art.to.x)*art.scale,y:art.to.y*art.scale};
  const sourceDX=sourceTo.x-sourceFrom.x,sourceDY=sourceTo.y-sourceFrom.y;
  const targetDX=to.x-from.x,targetDY=to.y-from.y;
  const sourceLength=Math.hypot(sourceDX,sourceDY),targetLength=Math.hypot(targetDX,targetDY);
  const scale=targetLength/sourceLength;
  const angle=Math.atan2(targetDY,targetDX)-Math.atan2(sourceDY,sourceDX);
  const cos=Math.cos(angle)*scale,sin=Math.sin(angle)*scale;
  const translatedX=from.x-(sourceFrom.x*cos-sourceFrom.y*sin);
  const translatedY=from.y-(sourceFrom.x*sin+sourceFrom.y*cos);
  node.style.left="0px";node.style.top="0px";node.style.width=`${width}px`;node.style.height=`${height}px`;
  node.style.transformOrigin="0 0";
  node.style.transform=`translate(${translatedX}px,${translatedY}px) rotate(${angle}rad) scale(${scale})`;
}

function fitPipArtworkToSkeleton(){
  fitPipPoint(".pip-head","head","neck");
  fitPipSegment(".pip-upper-arm-left","upperArm","leftShoulder","leftElbow");
  fitPipSegment(".pip-forearm-left","forearm","leftElbow","leftHand");
  fitPipSegment(".pip-upper-arm-right","upperArm","rightShoulder","rightElbow",true);
  fitPipSegment(".pip-forearm-right","forearm","rightElbow","rightHand",true);
  fitPipSegment(".pip-upper-leg-left","upperLeg","leftHip","leftKnee");
  fitPipSegment(".pip-lower-leg-left","lowerLeg","leftKnee","leftHoof");
  fitPipSegment(".pip-upper-leg-right","upperLeg","rightHip","rightKnee",true);
  fitPipSegment(".pip-lower-leg-right","lowerLeg","rightKnee","rightHoof",true);
}

function positionPipSkeleton(){
  const puppet=$(".pip-puppet"),svg=$("#pip-skeleton");
  if(!puppet||!svg)return;
  Object.entries(pipSkeleton).forEach(([name,joint])=>{
    const cssName=name.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`);
    puppet.style.setProperty(`--${cssName}-x`,`${joint.x}px`);
    puppet.style.setProperty(`--${cssName}-y`,`${joint.y}px`);
  });
  svg.querySelectorAll("line[data-from]").forEach(line=>{
    const from=pipSkeleton[line.dataset.from],to=pipSkeleton[line.dataset.to];
    line.setAttribute("x1",from.x);line.setAttribute("y1",from.y);
    line.setAttribute("x2",to.x);line.setAttribute("y2",to.y);
  });
  const group=svg.querySelector(".pip-joints"),ns="http://www.w3.org/2000/svg";
  group.innerHTML="";
  Object.values(pipSkeleton).forEach(joint=>{
    const circle=document.createElementNS(ns,"circle");
    circle.setAttribute("cx",joint.x);circle.setAttribute("cy",joint.y);circle.setAttribute("r",4.2);group.appendChild(circle);
    const label=document.createElementNS(ns,"text");
    label.setAttribute("x",joint.x+5);label.setAttribute("y",joint.y-4);label.textContent=joint.label;group.appendChild(label);
  });
}

let dictionary = new Set(), tiles = [], selected = [], disabled = new Set();
let heroMax = PLAYER_STARTING_MAX, heroHP = heroMax, enemyHP = 0, enemyIndex = 0, lastMoveIndex = -1, ward = 0;
let permanentAttackBuff = 0, temporaryAttackBuff = 0, attackBuffTurns = 0, shieldTurns = 0, enemyPower = 0;
let busy = true, finished = false;
let pipIdleTimer = 0;
let attackFeedbackTimer = 0;

const pick = string => string[Math.floor(Math.random() * string.length)];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function tile(letter, charge=null) { return {letter: letter || pick(consonants), charge, modifier:0,lockTurns:0,stoneTurns:0,crackedTurns:0}; }

function balancedLetters() {
  const letters = [];
  for (let i=0;i<6;i++) letters.push(pick(vowels));
  while (letters.length<16) letters.push(pick(consonants));
  letters.sort(()=>Math.random()-.5);
  return letters;
}

function freshGrid() {
  const letters = balancedLetters();
  tiles = letters.map(letter=>tile(letter));
  selected=[]; disabled.clear(); render(); updateWord();
}

function reshuffleLetters() {
  const letters=balancedLetters();
  tiles=tiles.map((item,index)=>({...item,letter:letters[index]}));
  selected=[];
  disabled.clear();
  render();
  updateWord();
}

function render() {
  el.grid.innerHTML="";
  tiles.forEach((item,i)=>{
    const b=document.createElement("button");
    b.type="button"; b.className="tile"; b.style.setProperty("--i",i);
    if(selected.includes(i)) b.classList.add("selected");
    if(item.lockTurns>0)b.classList.add("locked");
    if(item.stoneTurns>0)b.classList.add("petrified");
    if(item.crackedTurns>0)b.classList.add("cracked");
    if(disabled.has(i)) b.classList.add("locked");
    if(item.charge) b.classList.add(`charge-${item.charge.id}`);
    const unavailable=busy||disabled.has(i)||item.lockTurns>0; b.disabled=unavailable;
    b.title=item.charge?`${item.charge.label}: ${chargeHelp(item.charge)}`:`${item.letter}: ${score(i)} points`;
    b.setAttribute("aria-label",b.title);
    const turnCount=item.lockTurns||item.stoneTurns||item.crackedTurns;
    b.innerHTML=`<span class="letter">${item.letter}</span>${item.charge?`<span class="charge">${item.charge.symbol}</span>`:""}${item.lockTurns?'<span class="lock-cross" aria-hidden="true"></span>':""}${item.crackedTurns?'<span class="crack-mark" aria-hidden="true"></span>':""}${turnCount?`<span class="status-turns">${turnCount}</span>`:""}`;
    b.addEventListener("click",()=>toggle(i)); el.grid.appendChild(b);
  });
}

function chargeHelp(c){ return c.damage?"adds 3 damage":c.block?"blocks 3 damage":"heals 7 HP"; }
function score(i){ const item=tiles[i];if(item.stoneTurns||item.crackedTurns)return 0;return Math.max(1,values[item.letter]+item.modifier); }
function toggle(i){ if(busy||disabled.has(i)||tiles[i].lockTurns)return; const at=selected.indexOf(i); at<0?selected.push(i):selected.splice(at,1); render(); updateWord(); }
function word(){ return selected.map(i=>tiles[i].letter).join(""); }
function bonus(n){ return n>=8?12:n===7?8:n===6?5:n===5?3:n===4?1:0; }
function reward(n){ return n>=8?3:n>=6?2:n===5?1:0; }
function preview(){
  if(!selected.length)return 0;
  const length=selected.length;
  const base=selected.reduce((n,i)=>n+score(i),0)+bonus(length);
  const ember=selected.some(i=>tiles[i].charge?.damage)?charges.find(c=>c.id==="ember").damage:0;
  const availableBuff=permanentAttackBuff+(attackBuffTurns>0?temporaryAttackBuff:0);
  const buffCap=length===3?3:length===4?5:Infinity;
  return Math.max(1,base+ember+Math.min(availableBuff,buffCap)-(shieldTurns>0?2:0));
}
function isBlockedWord(candidate){return blockedWords.has(candidate.toLowerCase());}
function updateWord(){
  const current=word(),valid=current.length>=3&&dictionary.has(current.toLowerCase())&&!isBlockedWord(current);
  el.word.textContent=current?(valid?`${current} · ${preview()} DAMAGE`:current):"Choose letters";el.damage.textContent=`${preview()} damage`;
  el.word.closest(".word-panel")?.classList.toggle("valid",valid);
  el.attack.classList.toggle("word-valid",valid);el.attack.classList.remove("word-invalid");
  if(!attackFeedbackTimer)el.attack.textContent="Attack";
}
function rejectAttack(label,message){
  clearTimeout(attackFeedbackTimer);el.attack.classList.remove("word-valid");el.attack.classList.add("word-invalid");el.attack.textContent=label;el.message.textContent=message;
  attackFeedbackTimer=setTimeout(()=>{attackFeedbackTimer=0;el.attack.classList.remove("word-invalid");updateWord();},1250);
}

async function collapseUsedTiles(used, prizeCount) {
  const removed = new Set(used);
  const oldPositions = new Map(tiles.map((item,index)=>[item,index]));
  const next = Array(16);
  const newPositions = [];
  const affectedColumns = new Set(used.map(index=>index%4));

  for (let column=0; column<4; column++) {
    const survivors = [];
    for (let row=0; row<4; row++) {
      const index=row*4+column;
      if(!removed.has(index)) survivors.push(tiles[index]);
    }

    const replacements=[];
    while(replacements.length<4-survivors.length) {
      const letter=replacements.length%3===0?pick(vowels):pick(consonants);
      replacements.push(tile(letter));
    }

    const columnTiles=[...replacements,...survivors];
    columnTiles.forEach((item,row)=>{next[row*4+column]=item;});
    replacements.forEach((_,row)=>newPositions.push(row*4+column));
  }

  tiles=next;
  for(let i=0;i<Math.min(prizeCount,newPositions.length);i++) {
    tiles[newPositions[i]].charge=charges[Math.floor(Math.random()*charges.length)];
  }
  selected=[];
  disabled.clear();
  render();
  updateWord();

  const buttons=[...el.grid.children];
  const firstTile=buttons[0];
  const gap=parseFloat(getComputedStyle(el.grid).rowGap)||0;
  const pitch=(firstTile?.getBoundingClientRect().height||0)+gap;
  affectedColumns.forEach(column=>{
    const incoming=newPositions.filter(index=>index%4===column).length;
    for(let row=0;row<4;row++) {
      const index=row*4+column;
      const item=tiles[index];
      const oldIndex=oldPositions.get(item);
      const fallRows=oldIndex===undefined?incoming:(row-Math.floor(oldIndex/4));
      if(fallRows>0) {
        buttons[index].style.setProperty("--fall-distance",`${fallRows*pitch}px`);
        buttons[index].style.setProperty("--fall-delay",`${column*35+row*22}ms`);
        buttons[index].classList.add("falling");
      }
    }
  });
  await delay(680);
}

function controls(){ const off=busy||finished; el.shuffle.disabled=off; el.attack.disabled=off; render(); }
function health(){
  const enemy=enemies[enemyIndex];
  el.heroHp.textContent=heroHP;el.heroMax.textContent=heroMax;el.enemyHp.textContent=enemyHP;el.enemyMax.textContent=enemy.hp;
  el.heroBar.style.width=`${heroHP/heroMax*100}%`;el.enemyBar.style.width=`${enemyHP/enemy.hp*100}%`;
  const icons=[];
  if(permanentAttackBuff)icons.push(`<span class="status-icon sword" title="Permanent: +${permanentAttackBuff} word damage" aria-label="${permanentAttackBuff} permanent extra word damage">⚔<small>+${permanentAttackBuff}</small></span>`);
  if(attackBuffTurns)icons.push(`<span class="status-icon sword temporary" title="+${temporaryAttackBuff} word damage for ${attackBuffTurns} plays" aria-label="${temporaryAttackBuff} extra word damage, ${attackBuffTurns} plays remaining">⚔<small>${attackBuffTurns}</small></span>`);
  if(shieldTurns)icons.push(`<span class="status-icon shield" title="Shield: ${shieldTurns} plays remaining" aria-label="Shield, ${shieldTurns} plays remaining">◆<small>${shieldTurns}</small></span>`);
  el.heroStatusIcons.innerHTML=icons.join("");
  el.enemyStatusIcons.innerHTML=enemyPower?`<span class="status-icon fury" title="Next damaging attack gains ${enemyPower} damage" aria-label="Powered up by ${enemyPower} damage">▲<small>+${enemyPower}</small></span>`:"";
  updateWord();
}

function showBanner(text,tone="victory",duration=1200){
  el.banner.textContent=text;el.banner.className=`battle-banner ${tone} show`;
  clearTimeout(showBanner.timer);showBanner.timer=setTimeout(()=>el.banner.classList.remove("show"),duration);
}

function weighted(values){return values[Math.floor(Math.random()*values.length)];}
function rewardChoices(){
  const permanent=weighted([1,1,1,1,2,2]);
  const temporary=weighted([4,4,5,5,6,7]);
  const tempTurns=temporary===7?2:temporary===6?3:temporary===5?4:5;
  const maxHealth=weighted([5,5,5,10,10,15]);
  const pool=[
    {type:"permanent",value:permanent,icon:"⚔",name:"Etched Edge",text:`Permanently add ${permanent} damage to every valid word.`},
    {type:"temporary",value:temporary,turns:tempTurns,icon:"⚔",name:"Heroic Phrase",text:`Add ${temporary} word damage for the next ${tempTurns} plays.`},
    {type:"shield",value:5,icon:"◆",name:"Measured Guard",text:"For 5 plays, block 3 incoming damage but deal 2 less word damage."},
    {type:"maxhp",value:maxHealth,icon:"♥",name:"Heart of the Road",text:`Permanently increase maximum HP by ${maxHealth}, and gain that much HP now.`}
  ];
  if(heroHP<=heroMax*.5){
    const amount=weighted([10,10,10,10,20,20,20,30,30,40,50]);
    pool.push({type:"heal",value:amount,icon:"♥",name:"Second Wind",text:`Restore ${amount}% of Syntax's maximum health.`});
  }
  return pool.sort(()=>Math.random()-.5).slice(0,3);
}

function chooseReward(){
  return new Promise(resolve=>{
    el.rewardOptions.innerHTML="";
    rewardChoices().forEach(choice=>{
      const button=document.createElement("button");button.type="button";button.className=`reward-option reward-${choice.type}`;
      button.innerHTML=`<span class="reward-icon">${choice.icon}</span><strong>${choice.name}</strong><span>${choice.text}</span>`;
      button.addEventListener("click",()=>{
        if(choice.type==="permanent")permanentAttackBuff+=choice.value;
        if(choice.type==="temporary"){temporaryAttackBuff=choice.value;attackBuffTurns=choice.turns;}
        if(choice.type==="shield")shieldTurns=choice.value;
        if(choice.type==="heal")heroHP=Math.min(heroMax,heroHP+Math.round(heroMax*choice.value/100));
        if(choice.type==="maxhp"){heroMax+=choice.value;heroHP+=choice.value;}
        el.rewardModal.hidden=true;health();resolve(choice);
      },{once:true});
      el.rewardOptions.appendChild(button);
    });
    el.rewardModal.hidden=false;
  });
}

function ageTileEffects(){
  tiles.forEach(item=>{
    if(item.lockTurns>0)item.lockTurns--;
    if(item.stoneTurns>0)item.stoneTurns--;
    if(item.crackedTurns>0)item.crackedTurns--;
  });
}
function consumeBoonPlay(){
  if(shieldTurns>0)shieldTurns--;
  if(attackBuffTurns>0){attackBuffTurns--;if(!attackBuffTurns)temporaryAttackBuff=0;}
  health();
}
function clearBattleEffects(){
  ward=0;enemyPower=0;disabled.clear();
  tiles.forEach(item=>{item.lockTurns=0;item.stoneTurns=0;item.crackedTurns=0;item.modifier=0;});
}
const poseClasses=["cast","hit","scratch","move-rush","move-pipes","move-kick","defeat"];
function pose(node,name,ms=550){ node.classList.remove(...poseClasses); void node.offsetWidth; node.classList.add(name); setTimeout(()=>node.classList.remove(name),ms); }
function schedulePipIdle(){
  clearTimeout(pipIdleTimer);
  pipIdleTimer=setTimeout(()=>{
    if(enemyIndex===0&&!busy&&!finished&&!el.enemyArt.classList.contains("hit")) pose(el.enemyArt,"scratch",1750);
    schedulePipIdle();
  },6500+Math.random()*3500);
}
function effect(text,side){ const s=document.createElement("span"); s.className=`effect ${side}`; s.textContent=text; el.effects.appendChild(s); setTimeout(()=>s.remove(),1000); }

async function attack(){
  if(busy||finished)return;
  const attempt=word().toLowerCase();
  if(isBlockedWord(attempt)){showBanner("WE DON'T SWEAR HERE","warning",1800);rejectAttack("Not here!","Syntax refuses to use that word.");return;}
  if(attempt.length<3){rejectAttack("Need 3 letters","Build a word using at least three letters.");return;}
  if(!dictionary.has(attempt)){rejectAttack("Invalid word",`${attempt.toUpperCase()} is not in the local dictionary.`);return;}
  busy=true;controls();
  const damage=preview(), prizes=reward(attempt.length), used=[...selected];
  let healing=0;const activated=new Set();
  used.forEach(i=>{
    const c=tiles[i].charge;
    if(!c||activated.has(c.id))return;
    activated.add(c.id);ward+=c.block||0;healing+=c.heal||0;
  });
  heroHP=Math.min(heroMax,heroHP+healing);
  pose(el.heroArt,"cast",880);
  await delay(350);
  enemyHP=Math.max(0,enemyHP-damage);
  pose(el.enemyArt,"hit");effect(`-${damage}`,"enemy");health();
  el.message.textContent=`${attempt.toUpperCase()} dealt ${damage} damage${prizes?` and charged ${prizes} new ${prizes===1?"tile":"tiles"}`:""}.`;
  ageTileEffects();
  await collapseUsedTiles(used,prizes);
  await delay(510);
  if(enemyHP<=0){consumeBoonPlay();await victory();return;}
  el.message.textContent += " The enemy prepares to answer…";
  await delay(2500);
  await enemyTurn();
}

async function shuffle(){
  if(busy||finished)return;busy=true;controls();el.grid.classList.add("shuffling");el.message.textContent="Syntax reshuffles the letters. Special tiles keep their power.";await delay(520);el.grid.classList.remove("shuffling");ageTileEffects();reshuffleLetters();el.message.textContent="The enemy takes a turn.";await enemyTurn();
}

function chooseEnemyMove(enemy){
  const weightedIndexes=[];
  enemy.moves.forEach((move,index)=>{
    if(index===lastMoveIndex)return;
    if(move.power&&enemyPower>0)return;
    if(move.lock&&tiles.some(item=>item.lockTurns>0))return;
    if(move.petrify&&tiles.some(item=>item.stoneTurns>0))return;
    if(move.crack&&tiles.some(item=>item.crackedTurns>0))return;
    const weight=[45,35,20][index]||25;
    for(let i=0;i<weight;i++)weightedIndexes.push(index);
  });
  const index=weighted(weightedIndexes.length?weightedIndexes:enemy.moves.map((_,i)=>i));
  lastMoveIndex=index;return enemy.moves[index];
}
function ordinaryTargets(count,status){
  const candidates=tiles.map((item,index)=>({item,index})).filter(({item})=>!item.charge&&!item.lockTurns&&!item.stoneTurns&&!item.crackedTurns).sort(()=>Math.random()-.5).slice(0,count);
  candidates.forEach(({item})=>{item[status]=status==="lockTurns"?3:status==="stoneTurns"?2:3;});
}
function weakenBoon(){
  const active=[];
  if(temporaryAttackBuff>0)active.push("temporary");
  if(permanentAttackBuff>0)active.push("permanent");
  if(shieldTurns>0)active.push("shield");
  if(!active.length)return "no boon to revise";
  const target=weighted(active);
  if(target==="temporary"){temporaryAttackBuff=Math.max(0,temporaryAttackBuff-1);if(!temporaryAttackBuff)attackBuffTurns=0;return "temporary sword power reduced";}
  if(target==="permanent"){permanentAttackBuff=Math.max(0,permanentAttackBuff-1);return "permanent sword power reduced";}
  shieldTurns=Math.max(0,shieldTurns-1);return "shield shortened by one play";
}
async function pipeScramble(){
  for(let i=0;i<3;i++){const note=document.createElement("span");note.className=`music-note note-${i+1}`;note.textContent=i===1?"♫":"♪";el.effects.appendChild(note);setTimeout(()=>note.remove(),1000);}
  el.grid.classList.add("pipe-scramble");await delay(720);tiles.sort(()=>Math.random()-.5);selected=[];el.grid.classList.remove("pipe-scramble");
}

async function enemyTurn(){
  const enemy=enemies[enemyIndex], move=chooseEnemyMove(enemy);
  pose(el.enemyArt,enemyIndex===0?`move-${move.pose}`:"cast",1120);
  await delay(520);
  let amount=move.damage,blocked=0,powerUsed=0,extraMessage="";
  if(move.power){enemyPower=move.power;effect(`+${move.power} next`,"enemy");extraMessage=` The next damaging attack gains ${move.power} damage.`;}
  else if(amount>0&&enemyPower){powerUsed=enemyPower;amount+=enemyPower;enemyPower=0;}
  if(shieldTurns>0){const shielded=Math.min(3,amount);amount-=shielded;blocked+=shielded;}
  const warded=Math.min(ward,amount);ward-=warded;amount-=warded;blocked+=warded;
  if(amount>0){
    pose(el.heroArt,"hit",820);
    if(move.hits){
      let remaining=amount;
      for(let hit=0;hit<move.hits;hit++){
        const part=Math.ceil(remaining/(move.hits-hit));remaining-=part;heroHP=Math.max(0,heroHP-part);effect(`-${part}`,"hero");
        if(hit<move.hits-1)await delay(170);
      }
    }else{heroHP=Math.max(0,heroHP-amount);effect(`-${amount}`,"hero");}
  }
  if(move.scramble)await pipeScramble();
  if(move.lock)ordinaryTargets(move.lock,"lockTurns");
  if(move.petrify)ordinaryTargets(move.petrify,"stoneTurns");
  if(move.crack)ordinaryTargets(move.crack,"crackedTurns");
  if(move.heal){enemyHP=Math.min(enemy.hp,enemyHP+move.heal);effect(`+${move.heal}`,"enemy");}
  if(move.erode)extraMessage=` ${weakenBoon()}.`;
  health();render();updateWord();
  el.message.textContent=`${enemy.name} used ${move.name}: ${amount} damage${powerUsed?` (${powerUsed} powered)`:""}${blocked?` (${blocked} blocked)`:""}.${extraMessage}`;
  await delay(600);
  consumeBoonPlay();
  if(heroHP<=0){finish(false);return;}busy=false;controls();
}

async function victory(){
  const defeated=enemies[enemyIndex];
  if(enemyIndex===0){pose(el.enemyArt,"defeat",1250);await delay(1250);}
  showBanner("VICTORY!","victory",1600);
  const recovery=Math.ceil(heroMax*.2),before=heroHP;heroHP=Math.min(heroMax,heroHP+recovery);const restored=heroHP-before;
  if(restored){effect(`+${restored} HP`,"hero");health();}
  el.message.textContent=`${defeated.name} has been defeated.${restored?` Syntax recovers ${restored} HP.`:" Syntax is already at full health."}`;
  await delay(1500);
  if(enemyIndex===enemies.length-1){finish(true);return;}
  const chosen=await chooseReward();
  el.message.textContent=`${chosen.name} gained. Syntax continues along the mythic road…`;
  clearBattleEffects();
  el.battle.classList.add("walking");await delay(2200);enemyIndex++;lastMoveIndex=-1;setupEnemy();
  el.chapter.textContent=`Chapter ${enemyIndex+1}: ${enemies[enemyIndex].place}`;el.chapter.classList.remove("show");void el.chapter.offsetWidth;el.chapter.classList.add("show");
  await delay(1300);el.battle.classList.remove("walking");render();updateWord();el.message.textContent=`${enemies[enemyIndex].name} blocks the road!`;busy=false;controls();
}

function setupEnemy(){
  const enemy=enemies[enemyIndex];enemyHP=enemy.hp;enemyPower=0;lastMoveIndex=-1;el.enemyName.textContent=enemy.name;
  el.enemyArt.classList.remove(...poseClasses,"pip");if(enemyIndex===0)el.enemyArt.classList.add("pip");
  el.enemyArt.style.setProperty("--enemy-position",`${enemy.pos}%`);el.enemyArt.setAttribute("aria-label",enemy.name);
  el.enemyMoves.innerHTML=`<strong>Attacks</strong>${enemy.moves.map(move=>{const type=moveTypes[move.type]||moveTypes.physical;return `<span class="move-entry"><span>${move.name}</span><i title="${type.label}" aria-label="${type.label}">${type.symbol}</i></span>`;}).join("")}`;
  el.enemyMoves.hidden=true;el.enemyMovesToggle.setAttribute("aria-expanded","false");health();schedulePipIdle();
}
function finish(won){
  finished=true;busy=true;controls();el.restart.style.display="block";
  if(won){showBanner("ODYSSEY COMPLETE","victory",4000);el.message.textContent="The Summit Archive is free! Syntax has completed the first Word Odyssey.";}
  else{showBanner("YOU HAVE PERISHED","perished",86400000);el.message.textContent="Syntax has run out of strength. Begin again and choose stronger words.";}
}
function restart(){heroMax=PLAYER_STARTING_MAX;heroHP=heroMax;enemyIndex=0;lastMoveIndex=-1;ward=0;permanentAttackBuff=0;temporaryAttackBuff=0;attackBuffTurns=0;shieldTurns=0;enemyPower=0;finished=false;busy=false;el.restart.style.display="none";el.banner.classList.remove("show");setupEnemy();freshGrid();el.message.textContent="Choose any three or more letters.";controls();}

async function loadDictionary(){
  try{const responses=await Promise.all([fetch("words.txt"),fetch("custom-words.txt")]);if(responses.some(r=>!r.ok))throw Error();const text=(await Promise.all(responses.map(r=>r.text()))).join("\n");dictionary=new Set(text.split(/\r?\n/).map(w=>w.trim().toLowerCase()).filter(w=>/^[a-z]{3,}$/.test(w)&&!blockedWords.has(w)));busy=false;controls();updateWord();el.message.textContent=`The scroll knows ${dictionary.size.toLocaleString()} words.`;}
  catch{el.message.textContent="The dictionary could not load. Publish words.txt beside index.html.";}
}

el.attack.addEventListener("click",attack);el.shuffle.addEventListener("click",shuffle);el.restart.addEventListener("click",restart);
el.enemyMovesToggle.addEventListener("click",()=>{const open=el.enemyMoves.hidden;el.enemyMoves.hidden=!open;el.enemyMovesToggle.setAttribute("aria-expanded",String(open));});
positionPipSkeleton();fitPipArtworkToSkeleton();setupEnemy();freshGrid();controls();loadDictionary();
