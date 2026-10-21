const PLAYER_MAX = 60;
const values = {A:1,B:2,C:2,D:2,E:1,F:3,G:2,H:3,I:1,J:5,K:4,L:1,M:2,N:1,O:1,P:2,Q:5,R:1,S:1,T:1,U:1,V:3,W:3,X:5,Y:3,Z:5};
const vowels = "AAAAAAAEEEEEEEEEEIIIIIIOOOOOOUUUY";
const consonants = "BBBBCCCDDDDFFGGGGHHHJKLLLLMMMMNNNNNNPPQRRRRRRSSSSSSTTTTTTVVWWXYZ";
const charges = [
  {id:"ember",symbol:"◆",label:"Ember",damage:4},
  {id:"ward",symbol:"⬟",label:"Ward",block:3},
  {id:"bloom",symbol:"✦",label:"Bloom",heal:3}
];

const enemies = [
  {name:"Pip the Satyr",place:"The Whispering Olive Grove",hp:42,pos:0,moves:[
    {name:"Horn Rush",damage:4,pose:"rush"},{name:"Pipe Puzzle",damage:3,scramble:true,pose:"pipes"},{name:"Mule Kick",damage:7,pose:"kick"}
  ]},
  {name:"Brontes the Minotaur",place:"The Crooked Labyrinth",hp:58,pos:23,moves:[
    {name:"Horn Rush",damage:6},{name:"Maze Seal",damage:3,lock:3},{name:"Wall Breaker",damage:9}
  ]},
  {name:"Melia the Gorgon",place:"The Silent Statue Garden",hp:68,pos:48,moves:[
    {name:"Snake Snap",damage:6},{name:"Stone Glance",damage:4,lock:4},{name:"Marble Gaze",damage:10}
  ]},
  {name:"The Marsh Hydra",place:"The Reedy Moon Marsh",hp:80,pos:70,moves:[
    {name:"Triple Nip",damage:7},{name:"Mire Spray",damage:5,ink:3},{name:"Regrow",damage:4,heal:7}
  ]},
  {name:"Polyphemus the Scribe",place:"The Summit Archive",hp:96,pos:95,moves:[
    {name:"Tablet Thump",damage:8},{name:"Bad Revision",damage:5,devalue:5},{name:"Final Draft",damage:13}
  ]}
];

const $ = s => document.querySelector(s);
const el = {battle:$("#battle"),chapter:$("#chapter-card"),heroF:$("#hero-fighter"),enemyF:$("#enemy-fighter"),heroArt:$("#hero-art"),enemyArt:$("#enemy-art"),enemyName:$("#enemy-name"),heroHp:$("#hero-hp"),enemyHp:$("#enemy-hp"),enemyMax:$("#enemy-max"),heroBar:$("#hero-bar"),enemyBar:$("#enemy-bar"),effects:$("#effects"),grid:$("#grid"),word:$("#word"),damage:$("#damage"),message:$("#message"),shuffle:$("#shuffle"),attack:$("#attack"),restart:$("#restart")};

// Screen-left and screen-right are used deliberately so visual feedback maps
// directly to these coordinates. This object is Pip's single skeleton source.
const pipSkeleton = {
  neck:{x:102,y:66,label:"N"}, chest:{x:105,y:90,label:"C"},
  leftShoulder:{x:78,y:74,label:"LS"}, leftElbow:{x:69,y:102,label:"LE"}, leftHand:{x:48,y:138,label:"LH"},
  rightShoulder:{x:120,y:71,label:"RS"}, rightElbow:{x:139,y:98,label:"RE"}, rightHand:{x:166,y:120,label:"RH"},
  pelvis:{x:104,y:123,label:"P"},
  leftHip:{x:88,y:131,label:"LHi"}, leftKnee:{x:93,y:161,label:"LK"}, leftAnkle:{x:75,y:186,label:"LA"}, leftHoof:{x:72,y:204,label:"LF"},
  rightHip:{x:120,y:131,label:"RHi"}, rightKnee:{x:132,y:161,label:"RK"}, rightAnkle:{x:153,y:188,label:"RA"}, rightHoof:{x:163,y:206,label:"RF"},
  tailBase:{x:131,y:134,label:"TB"}, tailTip:{x:159,y:144,label:"TT"}
};

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
let heroHP = PLAYER_MAX, enemyHP = 0, enemyIndex = 0, moveIndex = 0, ward = 0;
let busy = true, finished = false;
let pipIdleTimer = 0;

const pick = string => string[Math.floor(Math.random() * string.length)];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function tile(letter, charge=null) { return {letter: letter || pick(consonants), charge, modifier:0}; }

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
  tiles=tiles.map((item,index)=>tile(letters[index],item.charge));
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
    if(disabled.has(i)) b.classList.add(disabled.get?.(i)||"locked");
    if(item.charge) b.classList.add(`charge-${item.charge.id}`);
    const unavailable=busy||disabled.has(i); b.disabled=unavailable;
    b.title=item.charge?`${item.charge.label}: ${chargeHelp(item.charge)}`:`${item.letter}: ${score(i)} points`;
    b.setAttribute("aria-label",b.title);
    b.innerHTML=`<span class="letter">${item.letter}</span>${item.charge?`<span class="charge">${item.charge.symbol}</span>`:""}`;
    b.addEventListener("click",()=>toggle(i)); el.grid.appendChild(b);
  });
}

function chargeHelp(c){ return c.damage?"adds 4 damage":c.block?"blocks 3 damage":"heals 3 HP"; }
function score(i){ return Math.max(1,values[tiles[i].letter]+tiles[i].modifier); }
function toggle(i){ if(busy||disabled.has(i))return; const at=selected.indexOf(i); at<0?selected.push(i):selected.splice(at,1); render(); updateWord(); }
function word(){ return selected.map(i=>tiles[i].letter).join(""); }
function bonus(n){ return n>=8?15:n===7?10:n===6?6:n===5?3:0; }
function reward(n){ return n>=8?3:n>=6?2:n===5?1:0; }
function preview(){ return selected.reduce((n,i)=>n+score(i)+(tiles[i].charge?.damage||0),0)+bonus(selected.length); }
function updateWord(){ el.word.textContent=word()||"Choose letters"; el.damage.textContent=`${preview()} damage`; }

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
function health(){ const enemy=enemies[enemyIndex]; el.heroHp.textContent=heroHP; el.enemyHp.textContent=enemyHP; el.enemyMax.textContent=enemy.hp; el.heroBar.style.width=`${heroHP/PLAYER_MAX*100}%`; el.enemyBar.style.width=`${enemyHP/enemy.hp*100}%`; }
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
  if(attempt.length<3){el.message.textContent="Build a word using at least three letters.";return;}
  if(!dictionary.has(attempt)){el.message.textContent=`${attempt.toUpperCase()} is not in the local dictionary.`;return;}
  busy=true;controls();
  const damage=preview(), prizes=reward(attempt.length), used=[...selected];
  let healing=0;
  used.forEach(i=>{const c=tiles[i].charge;if(c){ward+=c.block||0;healing+=c.heal||0;}});
  heroHP=Math.min(PLAYER_MAX,heroHP+healing);
  pose(el.heroArt,"cast",880);
  await delay(350);
  enemyHP=Math.max(0,enemyHP-damage);
  pose(el.enemyArt,"hit");effect(`-${damage}`,"enemy");health();
  el.message.textContent=`${attempt.toUpperCase()} dealt ${damage} damage${prizes?` and charged ${prizes} new ${prizes===1?"tile":"tiles"}`:""}.`;
  await collapseUsedTiles(used,prizes);
  await delay(510);
  if(enemyHP<=0){await victory();return;}
  el.message.textContent += " The enemy prepares to answer…";
  await delay(2500);
  await enemyTurn();
}

async function shuffle(){
  if(busy||finished)return;busy=true;controls();el.grid.classList.add("shuffling");el.message.textContent="Syntax reshuffles the letters. Special tiles keep their power.";await delay(520);el.grid.classList.remove("shuffling");reshuffleLetters();el.message.textContent="The enemy takes a turn.";await enemyTurn();
}

async function enemyTurn(){
  const enemy=enemies[enemyIndex], move=enemy.moves[moveIndex];
  pose(el.enemyArt,enemyIndex===0?`move-${move.pose}`:"cast",1120);
  await delay(520);
  pose(el.heroArt,"hit",820);
  let amount=move.damage,blocked=Math.min(ward,amount);ward-=blocked;amount-=blocked;heroHP=Math.max(0,heroHP-amount);effect(`-${amount}`,"hero");
  if(move.scramble){tiles.sort(()=>Math.random()-.5);selected=[];}
  if(move.lock||move.ink){disabled.clear();const count=move.lock||move.ink;while(disabled.size<count)disabled.add(Math.floor(Math.random()*16));}
  if(move.heal){enemyHP=Math.min(enemy.hp,enemyHP+move.heal);effect(`+${move.heal}`,"enemy");}
  if(move.devalue){[...tiles].sort(()=>Math.random()-.5).slice(0,move.devalue).forEach(t=>t.modifier=-1);}
  moveIndex=(moveIndex+1)%enemy.moves.length;health();render();updateWord();
  el.message.textContent=`${enemy.name} used ${move.name}: ${amount} damage${blocked?` (${blocked} blocked)`:""}.`;
  await delay(600);
  if(heroHP<=0){finish(false);return;}busy=false;controls();
}

async function victory(){
  const defeated=enemies[enemyIndex];
  if(enemyIndex===enemies.length-1){finish(true);return;}
  if(enemyIndex===0){pose(el.enemyArt,"defeat",1250);await delay(1250);}
  el.message.textContent=`${defeated.name} is defeated. Syntax continues along the mythic road…`;
  el.battle.classList.add("walking");await delay(1600);enemyIndex++;moveIndex=0;setupEnemy();
  el.chapter.textContent=`Chapter ${enemyIndex+1}: ${enemies[enemyIndex].place}`;el.chapter.classList.remove("show");void el.chapter.offsetWidth;el.chapter.classList.add("show");
  await delay(1650);el.battle.classList.remove("walking");freshGrid();el.message.textContent=`${enemies[enemyIndex].name} blocks the road!`;busy=false;controls();
}

function setupEnemy(){const enemy=enemies[enemyIndex];enemyHP=enemy.hp;el.enemyName.textContent=enemy.name;el.enemyArt.classList.remove(...poseClasses,"pip");if(enemyIndex===0)el.enemyArt.classList.add("pip");el.enemyArt.style.setProperty("--enemy-position",`${enemy.pos}%`);el.enemyArt.setAttribute("aria-label",enemy.name);health();schedulePipIdle();}
function finish(won){finished=true;busy=true;controls();el.restart.style.display="block";el.message.textContent=won?"The Summit Archive is free! Syntax has completed the first Word Odyssey.":"Syntax has run out of strength. Begin again and choose stronger words.";}
function restart(){heroHP=PLAYER_MAX;enemyIndex=0;moveIndex=0;ward=0;finished=false;busy=false;el.restart.style.display="none";setupEnemy();freshGrid();el.message.textContent="Choose any three or more letters.";controls();}

async function loadDictionary(){
  try{const responses=await Promise.all([fetch("words.txt"),fetch("custom-words.txt")]);if(responses.some(r=>!r.ok))throw Error();const text=(await Promise.all(responses.map(r=>r.text()))).join("\n");dictionary=new Set(text.split(/\r?\n/).map(w=>w.trim().toLowerCase()).filter(w=>/^[a-z]{3,}$/.test(w)));busy=false;controls();el.message.textContent=`The scroll knows ${dictionary.size.toLocaleString()} words.`;}
  catch{el.message.textContent="The dictionary could not load. Publish words.txt beside index.html.";}
}

el.attack.addEventListener("click",attack);el.shuffle.addEventListener("click",shuffle);el.restart.addEventListener("click",restart);
positionPipSkeleton();setupEnemy();freshGrid();controls();loadDictionary();
