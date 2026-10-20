const PLAYER_MAX_HEALTH = 60;

const letterValues = {
  A: 1, B: 2, C: 2, D: 2, E: 1, F: 3, G: 2, H: 3, I: 1,
  J: 5, K: 4, L: 1, M: 2, N: 1, O: 1, P: 2, Q: 5, R: 1,
  S: 1, T: 1, U: 1, V: 3, W: 3, X: 5, Y: 3, Z: 5
};

const letterPool = (
  "AAAA" + "B" + "C" + "DD" + "EEEEE" + "F" + "GG" + "H" +
  "III" + "J" + "K" + "LL" + "M" + "NNN" + "OOO" + "P" +
  "Q" + "RRR" + "SSS" + "TTT" + "UU" + "V" + "W" + "X" + "Y" + "Z"
).split("");

const chargeTypes = [
  { id: "ember", symbol: "◆", label: "Ember", damage: 4 },
  { id: "ward", symbol: "⬟", label: "Ward", block: 3 },
  { id: "bloom", symbol: "✦", label: "Bloom", heal: 3 }
];

const enemies = [
  {
    name: "Ink Goblin",
    sprite: "goblin",
    health: 45,
    moves: [
      { name: "Quick Scratch", damage: 4, text: "4 damage" },
      { name: "Ink Bomb", damage: 3, ink: 3, text: "3 damage and hides 3 tiles" },
      { name: "Wild Splash", damage: 7, text: "7 damage" }
    ]
  },
  {
    name: "Stone Archivist",
    sprite: "archivist",
    health: 70,
    moves: [
      { name: "Page Slam", damage: 6, text: "6 damage" },
      { name: "Sealing Script", damage: 4, ink: 4, text: "4 damage and seals 4 tiles" },
      { name: "Grand Index", damage: 11, text: "a heavy 11-damage attack" }
    ]
  }
];

const $ = selector => document.querySelector(selector);
const elements = {
  grid: $("#letter-grid"), word: $("#current-word"), damage: $("#damage-preview"),
  message: $("#message"), enemyMove: $("#enemy-move"), playerHealth: $("#player-health"),
  enemyHealth: $("#enemy-health"), enemyMaxHealth: $("#enemy-max-health"),
  playerBar: $("#player-health-bar"), enemyBar: $("#enemy-health-bar"),
  playerCharacter: $("#player-character"), enemyCharacter: $("#enemy-character"),
  enemyName: $("#enemy-name"), enemySprite: $("#enemy-sprite"), effects: $("#effect-layer"),
  clear: $("#clear-button"), shuffle: $("#shuffle-button"), attack: $("#attack-button"),
  continue: $("#continue-button"), restart: $("#restart-button")
};

let dictionary = new Set();
let grid = [];
let selected = [];
let inked = new Set();
let playerHealth = PLAYER_MAX_HEALTH;
let enemyHealth = 0;
let enemyIndex = 0;
let enemyMoveIndex = 0;
let ward = 0;
let busy = true;
let gameOver = false;

function randomLetter() {
  return letterPool[Math.floor(Math.random() * letterPool.length)];
}

function newTile(charge = null) {
  return { letter: randomLetter(), charge };
}

function createGrid() {
  grid = Array.from({ length: 16 }, () => newTile());
  selected = [];
  inked.clear();
  renderGrid();
}

function renderGrid() {
  elements.grid.innerHTML = "";
  grid.forEach((tile, index) => {
    const button = document.createElement("button");
    button.className = "letter-tile";
    button.disabled = busy || inked.has(index);
    if (selected.includes(index)) button.classList.add("selected");
    if (inked.has(index)) button.classList.add("inked");
    if (tile.charge) button.classList.add("charge-" + tile.charge.id);
    button.setAttribute("aria-label", inked.has(index) ? "Hidden tile" : `Letter ${tile.letter}`);
    button.append(document.createTextNode(tile.letter));

    const value = document.createElement("span");
    value.className = "letter-value";
    value.textContent = letterValues[tile.letter];
    button.appendChild(value);

    if (tile.charge) {
      const mark = document.createElement("span");
      mark.className = "charge-mark";
      mark.textContent = tile.charge.symbol;
      mark.title = tile.charge.label;
      button.appendChild(mark);
    }

    button.addEventListener("click", () => toggleTile(index));
    elements.grid.appendChild(button);
  });
}

function toggleTile(index) {
  if (busy || inked.has(index)) return;
  const position = selected.indexOf(index);
  position === -1 ? selected.push(index) : selected.splice(position, 1);
  renderGrid();
  updateWordDisplay();
}

function currentWord() {
  return selected.map(index => grid[index].letter).join("");
}

function lengthBonus(length) {
  if (length >= 8) return 15;
  if (length === 7) return 10;
  if (length === 6) return 6;
  if (length === 5) return 3;
  return 0;
}

function chargeReward(length) {
  if (length >= 8) return 3;
  if (length >= 6) return 2;
  if (length === 5) return 1;
  return 0;
}

function attackPreview() {
  const base = selected.reduce((sum, index) => sum + letterValues[grid[index].letter], 0);
  const chargeDamage = selected.reduce((sum, index) => sum + (grid[index].charge?.damage || 0), 0);
  return base + lengthBonus(selected.length) + chargeDamage;
}

function updateWordDisplay() {
  elements.word.textContent = currentWord() || "Choose letters";
  elements.damage.textContent = `${attackPreview()} damage`;
}

function clearSelection() {
  if (busy) return;
  selected = [];
  renderGrid();
  updateWordDisplay();
  elements.message.textContent = "Select any three or more letters to build a word.";
}

function applySelectedCharges() {
  let healing = 0;
  selected.forEach(index => {
    const charge = grid[index].charge;
    if (!charge) return;
    ward += charge.block || 0;
    healing += charge.heal || 0;
  });
  if (healing) {
    const actualHealing = Math.min(healing, PLAYER_MAX_HEALTH - playerHealth);
    playerHealth += actualHealing;
    if (actualHealing) showEffect(`+${actualHealing}`, "heal");
  }
}

function replaceUsedTiles(rewardCount) {
  const used = [...selected];
  selected = [];
  used.forEach(index => { grid[index] = newTile(); });
  for (let i = 0; i < Math.min(rewardCount, used.length); i++) {
    const charge = chargeTypes[Math.floor(Math.random() * chargeTypes.length)];
    grid[used[i]].charge = charge;
  }
  renderGrid();
  updateWordDisplay();
}

async function attack() {
  if (busy || gameOver) return;
  const word = currentWord().toLowerCase();
  if (word.length < 3) {
    elements.message.textContent = "Words must contain at least three letters.";
    return;
  }
  if (!dictionary.has(word)) {
    elements.message.textContent = `${word.toUpperCase()} is not in this game's dictionary.`;
    return;
  }

  busy = true;
  setControls();
  const damage = attackPreview();
  const reward = chargeReward(word.length);
  applySelectedCharges();
  enemyHealth = Math.max(0, enemyHealth - damage);
  showEffect(`-${damage}`, "enemy-side");
  animate(elements.playerCharacter, "cast");
  animate(elements.enemyCharacter, "hit");
  updateHealth();

  let text = `${word.toUpperCase()} dealt ${damage} damage.`;
  if (reward) text += ` ${reward} newly drawn ${reward === 1 ? "letter was" : "letters were"} charged.`;
  if (ward) text += ` Ward strength: ${ward}.`;
  elements.message.textContent = text;

  inked.clear();
  replaceUsedTiles(reward);
  if (enemyHealth === 0) return window.setTimeout(enemyDefeated, 750);
  window.setTimeout(enemyAttack, 950);
}

function shuffleGrid() {
  if (busy || gameOver) return;
  busy = true;
  setControls();
  createGrid();
  updateWordDisplay();
  elements.message.textContent = "The grid was reshuffled. The enemy gets its turn.";
  window.setTimeout(enemyAttack, 750);
}

function enemyAttack() {
  const enemy = enemies[enemyIndex];
  const move = enemy.moves[enemyMoveIndex];
  let damage = move.damage;
  const blocked = Math.min(ward, damage);
  ward -= blocked;
  damage -= blocked;
  playerHealth = Math.max(0, playerHealth - damage);

  animate(elements.enemyCharacter, "cast");
  animate(elements.playerCharacter, "hit");
  showEffect(`-${damage}`, "player-side");
  updateHealth();

  let text = `${enemy.name} used ${move.name} for ${damage} damage.`;
  if (blocked) text += ` Your Ward blocked ${blocked}.`;
  if (move.ink) {
    applyInk(move.ink);
    text += ` ${move.ink} letters are hidden until you complete a word or shuffle.`;
  }
  elements.message.textContent += " " + text;

  enemyMoveIndex = (enemyMoveIndex + 1) % enemy.moves.length;
  updateEnemyMove();
  if (playerHealth === 0) return finishGame(false);
  busy = false;
  setControls();
  renderGrid();
}

function applyInk(count) {
  inked.clear();
  const choices = [...Array(16).keys()];
  while (inked.size < count && choices.length) {
    const choice = choices.splice(Math.floor(Math.random() * choices.length), 1)[0];
    inked.add(choice);
  }
}

function enemyDefeated() {
  if (enemyIndex < enemies.length - 1) {
    gameOver = true;
    elements.message.textContent = `${enemies[enemyIndex].name} is defeated. A stronger guardian approaches.`;
    elements.continue.style.display = "block";
    setControls();
  } else {
    finishGame(true);
  }
}

function continueBattle() {
  enemyIndex++;
  enemyMoveIndex = 0;
  inked.clear();
  selected = [];
  gameOver = false;
  setupEnemy();
  createGrid();
  updateWordDisplay();
  elements.continue.style.display = "none";
  elements.message.textContent = `${enemies[enemyIndex].name} enters the battle!`;
  busy = false;
  setControls();
  renderGrid();
}

function setupEnemy() {
  const enemy = enemies[enemyIndex];
  enemyHealth = enemy.health;
  elements.enemyName.textContent = enemy.name;
  elements.enemySprite.className = `sprite ${enemy.sprite}`;
  elements.enemySprite.alt = enemy.name;
  elements.enemyMaxHealth.textContent = enemy.health;
  updateEnemyMove();
  updateHealth();
}

function updateEnemyMove() {
  const move = enemies[enemyIndex].moves[enemyMoveIndex];
  elements.enemyMove.textContent = `${move.name} — ${move.text}`;
}

function updateHealth() {
  const enemyMax = enemies[enemyIndex].health;
  elements.playerHealth.textContent = playerHealth;
  elements.enemyHealth.textContent = enemyHealth;
  elements.playerBar.style.width = `${playerHealth / PLAYER_MAX_HEALTH * 100}%`;
  elements.enemyBar.style.width = `${enemyHealth / enemyMax * 100}%`;
}

function showEffect(text, className) {
  const effect = document.createElement("span");
  effect.className = `float-effect ${className}`;
  effect.textContent = text;
  elements.effects.appendChild(effect);
  window.setTimeout(() => effect.remove(), 1000);
}

function animate(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), 500);
}

function setControls() {
  const disabled = busy || gameOver;
  elements.clear.disabled = disabled;
  elements.shuffle.disabled = disabled;
  elements.attack.disabled = disabled;
  renderGrid();
}

function finishGame(won) {
  gameOver = true;
  busy = true;
  setControls();
  elements.restart.style.display = "block";
  elements.message.textContent = won
    ? "Victory! You defeated both guardians of the Wild Archive."
    : "Your spellbook has fallen silent. Try the battle again.";
}

function restartGame() {
  playerHealth = PLAYER_MAX_HEALTH;
  enemyIndex = 0;
  enemyMoveIndex = 0;
  ward = 0;
  gameOver = false;
  busy = false;
  elements.restart.style.display = "none";
  elements.continue.style.display = "none";
  setupEnemy();
  createGrid();
  updateWordDisplay();
  elements.message.textContent = "Select any three or more letters to build a word.";
  setControls();
}

async function loadDictionary() {
  try {
    const response = await fetch("words.txt");
    if (!response.ok) throw new Error("Word list failed to load");
    const text = await response.text();
    dictionary = new Set(
      text.split(/\r?\n/)
        .map(word => word.trim().toLowerCase())
        .filter(word => /^[a-z]{3,}$/.test(word))
    );
    busy = false;
    setControls();
    elements.message.textContent = `Dictionary ready: ${dictionary.size.toLocaleString()} words.`;
    updateWordDisplay();
  } catch (error) {
    elements.message.textContent = "The local dictionary did not load. Check that words.txt was uploaded beside index.html.";
  }
}

elements.clear.addEventListener("click", clearSelection);
elements.shuffle.addEventListener("click", shuffleGrid);
elements.attack.addEventListener("click", attack);
elements.continue.addEventListener("click", continueBattle);
elements.restart.addEventListener("click", restartGame);

setupEnemy();
createGrid();
updateWordDisplay();
setControls();
loadDictionary();
