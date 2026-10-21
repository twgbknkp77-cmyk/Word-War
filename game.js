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
    {name:"Reed Racket",damage:4},{name:"Hoof Shuffle",damage:3,scramble:true},{name:"Prankster's Kick",damage:7}
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

let dictionary = new Set(), tiles = [], selected = [], disabled = new Set();
let heroHP = PLAYER_MAX, enemyHP = 0, enemyIndex = 0, moveIndex = 0, ward = 0;
let busy = true, finished = false;

const pick = string => string[Math.floor(Math.random() * string.length)];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function tile(letter, charge=null) { return {letter: letter || pick(consonants), charge, modifier:0}; }

function freshGrid() {
  const letters = [];
  for (let i=0;i<6;i++) letters.push(pick(vowels));
  while (letters.length<16) letters.push(pick(consonants));
  letters.sort(()=>Math.random()-.5);
  tiles = letters.map(letter=>tile(letter));
  selected=[]; disabled.clear(); render(); updateWord();
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
    b.innerHTML=`<span class="letter">${item.letter}</span><span class="value">${score(i)}</span>${item.charge?`<span class="charge">${item.charge.symbol}</span>`:""}`;
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

function controls(){ const off=busy||finished; el.shuffle.disabled=off; el.attack.disabled=off; render(); }
function health(){ const enemy=enemies[enemyIndex]; el.heroHp.textContent=heroHP; el.enemyHp.textContent=enemyHP; el.enemyMax.textContent=enemy.hp; el.heroBar.style.width=`${heroHP/PLAYER_MAX*100}%`; el.enemyBar.style.width=`${enemyHP/enemy.hp*100}%`; }
function pose(node,name,ms=550){ node.classList.remove("cast","hit"); void node.offsetWidth; node.classList.add(name); setTimeout(()=>node.classList.remove(name),ms); }
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
  selected=[]; disabled.clear();
  used.forEach(i=>tiles[i]=tile(pick((i%3===0?vowels:consonants))));
  for(let i=0;i<Math.min(prizes,used.length);i++) tiles[used[i]].charge=charges[Math.floor(Math.random()*charges.length)];
  render();updateWord();
  await delay(510);
  if(enemyHP<=0){await victory();return;}
  await enemyTurn();
}

async function shuffle(){
  if(busy||finished)return;busy=true;controls();el.grid.classList.add("shuffling");el.message.textContent="Syntax reshuffles the letters. The enemy takes a turn.";await delay(520);el.grid.classList.remove("shuffling");freshGrid();await enemyTurn();
}

async function enemyTurn(){
  const enemy=enemies[enemyIndex], move=enemy.moves[moveIndex];
  pose(el.enemyArt,"cast");pose(el.heroArt,"hit",820);
  let amount=move.damage,blocked=Math.min(ward,amount);ward-=blocked;amount-=blocked;heroHP=Math.max(0,heroHP-amount);effect(`-${amount}`,"hero");
  if(move.scramble){tiles.sort(()=>Math.random()-.5);selected=[];}
  if(move.lock||move.ink){disabled.clear();const count=move.lock||move.ink;while(disabled.size<count)disabled.add(Math.floor(Math.random()*16));}
  if(move.heal){enemyHP=Math.min(enemy.hp,enemyHP+move.heal);effect(`+${move.heal}`,"enemy");}
  if(move.devalue){[...tiles].sort(()=>Math.random()-.5).slice(0,move.devalue).forEach(t=>t.modifier=-1);}
  moveIndex=(moveIndex+1)%enemy.moves.length;health();render();updateWord();
  el.message.textContent=`${enemy.name} used ${move.name}: ${amount} damage${blocked?` (${blocked} blocked)`:""}.`;
  await delay(520);
  if(heroHP<=0){finish(false);return;}busy=false;controls();
}

async function victory(){
  const defeated=enemies[enemyIndex];
  if(enemyIndex===enemies.length-1){finish(true);return;}
  el.message.textContent=`${defeated.name} is defeated. Syntax continues along the mythic road…`;
  el.battle.classList.add("walking");await delay(1600);enemyIndex++;moveIndex=0;setupEnemy();
  el.chapter.textContent=`Chapter ${enemyIndex+1}: ${enemies[enemyIndex].place}`;el.chapter.classList.remove("show");void el.chapter.offsetWidth;el.chapter.classList.add("show");
  await delay(1650);el.battle.classList.remove("walking");freshGrid();el.message.textContent=`${enemies[enemyIndex].name} blocks the road!`;busy=false;controls();
}

function setupEnemy(){const enemy=enemies[enemyIndex];enemyHP=enemy.hp;el.enemyName.textContent=enemy.name;el.enemyArt.style.setProperty("--enemy-position",`${enemy.pos}%`);el.enemyArt.setAttribute("aria-label",enemy.name);health();}
function finish(won){finished=true;busy=true;controls();el.restart.style.display="block";el.message.textContent=won?"The Summit Archive is free! Syntax has completed the first Word Odyssey.":"Syntax has run out of strength. Begin again and choose stronger words.";}
function restart(){heroHP=PLAYER_MAX;enemyIndex=0;moveIndex=0;ward=0;finished=false;busy=false;el.restart.style.display="none";setupEnemy();freshGrid();el.message.textContent="Choose any three or more letters.";controls();}

async function loadDictionary(){
  try{const responses=await Promise.all([fetch("words.txt"),fetch("custom-words.txt")]);if(responses.some(r=>!r.ok))throw Error();const text=(await Promise.all(responses.map(r=>r.text()))).join("\n");dictionary=new Set(text.split(/\r?\n/).map(w=>w.trim().toLowerCase()).filter(w=>/^[a-z]{3,}$/.test(w)));busy=false;controls();el.message.textContent=`The scroll knows ${dictionary.size.toLocaleString()} words.`;}
  catch{el.message.textContent="The dictionary could not load. Publish words.txt beside index.html.";}
}

el.attack.addEventListener("click",attack);el.shuffle.addEventListener("click",shuffle);el.restart.addEventListener("click",restart);
setupEnemy();freshGrid();controls();loadDictionary();
