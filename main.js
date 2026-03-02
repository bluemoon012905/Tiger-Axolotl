const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const tutorialText = document.getElementById("tutorial-text");
const playerStats = document.getElementById("player-stats");
const inventoryPanel = document.getElementById("inventory");
const inventoryBody = document.getElementById("inventory-body");

const ARENA = {
  width: canvas.width,
  height: canvas.height,
};

const ATTACK_KEYS = ["j", "k", "l", ";", "'"];

const state = {
  keysDown: new Set(),
  justPressed: new Set(),
  attacks: [],
  enemies: [],
  friendlies: [],
  lastTime: 0,
  inventoryOpen: false,
  tutorial: {
    step: 0,
    moved: false,
    usedAttack: false,
    swordBasicGiven: false,
  },
  skillTree: null,
};

const player = {
  x: 180,
  y: 260,
  r: 14,
  color: "#1673ff",
  speed: 220,
  hp: 100,
  maxHp: 100,
  armor: 10,
  weapon: "sword(Jian)",
  invulnTimer: 0,
  blockTimer: 0,
  facingX: 1,
  facingY: 0,
  inventory: {
    attackSlots: [null, null, null, null, null],
    unlockedSkills: new Set(),
    unlockedAttacks: new Set(),
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function normalize(x, y) {
  const len = Math.hypot(x, y);
  if (len === 0) {
    return { x: 0, y: 0 };
  }
  return { x: x / len, y: y / len };
}

function spawnInitialActors() {
  state.friendlies = [
    {
      id: "friendly-guide",
      x: 120,
      y: 120,
      r: 12,
      color: "#14b85f",
      label: "Guide",
    },
  ];

  state.enemies = [
    { id: "enemy-1", x: 700, y: 120, r: 13, hp: 60, speed: 75, color: "#de2f2f" },
    { id: "enemy-2", x: 820, y: 260, r: 13, hp: 60, speed: 70, color: "#de2f2f" },
    { id: "enemy-3", x: 730, y: 420, r: 13, hp: 60, speed: 80, color: "#de2f2f" },
  ];
}

function statNumber(node, key, fallback = 0) {
  return node?.stats?.quantitative?.[key] ?? fallback;
}

function buildSkillIndex(tree) {
  const byName = new Map();
  const byId = new Map();
  const tagNameById = new Map();

  for (const tag of tree.tags || []) {
    tagNameById.set(tag.id, tag.name.toLowerCase());
  }

  for (const node of tree.nodes || []) {
    byName.set(node.name.trim().toLowerCase(), node);
    byId.set(node.id, node);
  }

  const basicNodes = (tree.nodes || []).filter((node) =>
    (node.tagIds || []).some((tagId) => tagNameById.get(tagId) === "basic")
  );

  const swordBasicNode = byName.get("sword basic");

  return {
    byName,
    byId,
    basicNodes,
    swordBasicNode,
  };
}

function unlockStarterFromSkillTree(index) {
  for (const node of index.basicNodes) {
    player.inventory.unlockedAttacks.add(node.name);
  }

  const preferred = ["Stab", "Burst", "Chop", "Hang", "Flick"];
  for (let i = 0; i < player.inventory.attackSlots.length; i += 1) {
    player.inventory.attackSlots[i] = preferred[i] || null;
  }
}

function giveSwordBasicSkill(index) {
  if (state.tutorial.swordBasicGiven) {
    return;
  }

  const node = index.swordBasicNode;
  if (node) {
    player.inventory.unlockedSkills.add(node.name);
  } else {
    player.inventory.unlockedSkills.add("Sword basic");
  }
  state.tutorial.swordBasicGiven = true;
}

function getAttackNode(name) {
  if (!state.skillTree) {
    return null;
  }
  return state.skillTree.byName.get(name.trim().toLowerCase()) || null;
}

function performAttack(slotIndex) {
  const attackName = player.inventory.attackSlots[slotIndex];
  if (!attackName) {
    return;
  }

  const node = getAttackNode(attackName);
  const damage = Math.max(8, statNumber(node, "Damage", 0));
  const armorBoost = statNumber(node, "Armor", 0);

  if (armorBoost > 0 && damage <= 8) {
    player.blockTimer = Math.max(player.blockTimer, 0.35);
  }

  const facing = normalize(player.facingX, player.facingY);
  state.attacks.push({
    x: player.x + facing.x * 30,
    y: player.y + facing.y * 30,
    r: 34,
    damage,
    ttl: 0.16,
    hit: new Set(),
    name: attackName,
  });

  state.tutorial.usedAttack = true;
}

function updateTutorial() {
  if (state.tutorial.step === 0) {
    tutorialText.textContent = "Trial 1/3: Move with WASD.";
    if (state.tutorial.moved) {
      state.tutorial.step = 1;
    }
  } else if (state.tutorial.step === 1) {
    tutorialText.textContent = "Trial 2/3: Use attacks with J K L ; '.";
    if (state.tutorial.usedAttack) {
      state.tutorial.step = 2;
    }
  } else if (state.tutorial.step === 2) {
    tutorialText.textContent = "Trial 3/3: Defeat all red enemies.";
    if (state.enemies.length === 0) {
      state.tutorial.step = 3;
      giveSwordBasicSkill(state.skillTree);
    }
  } else {
    tutorialText.textContent = "Trial complete: Sword basic unlocked. Press I for inventory.";
  }
}

function updatePlayer(dt) {
  let dx = 0;
  let dy = 0;

  if (state.keysDown.has("w")) dy -= 1;
  if (state.keysDown.has("s")) dy += 1;
  if (state.keysDown.has("a")) dx -= 1;
  if (state.keysDown.has("d")) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const move = normalize(dx, dy);
    player.x += move.x * player.speed * dt;
    player.y += move.y * player.speed * dt;
    player.facingX = move.x;
    player.facingY = move.y;
    state.tutorial.moved = true;
  }

  player.x = clamp(player.x, player.r, ARENA.width - player.r);
  player.y = clamp(player.y, player.r, ARENA.height - player.r);

  player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  player.blockTimer = Math.max(0, player.blockTimer - dt);

  ATTACK_KEYS.forEach((key, idx) => {
    if (state.justPressed.has(key)) {
      performAttack(idx);
    }
  });
}

function updateAttacks(dt) {
  for (const attack of state.attacks) {
    attack.ttl -= dt;
  }
  state.attacks = state.attacks.filter((attack) => attack.ttl > 0);

  for (const attack of state.attacks) {
    for (const enemy of state.enemies) {
      if (attack.hit.has(enemy.id)) {
        continue;
      }
      if (distance(attack, enemy) <= attack.r + enemy.r) {
        enemy.hp -= attack.damage;
        attack.hit.add(enemy.id);

        const knock = normalize(enemy.x - player.x, enemy.y - player.y);
        enemy.x += knock.x * 18;
        enemy.y += knock.y * 18;
      }
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    const direction = normalize(player.x - enemy.x, player.y - enemy.y);
    enemy.x += direction.x * enemy.speed * dt;
    enemy.y += direction.y * enemy.speed * dt;

    if (distance(enemy, player) <= enemy.r + player.r) {
      if (player.invulnTimer <= 0) {
        const blocked = player.blockTimer > 0;
        player.hp -= blocked ? 3 : 9;
        player.invulnTimer = blocked ? 0.3 : 0.5;
      }
    }
  }

  if (player.hp <= 0) {
    player.hp = player.maxHp;
    player.x = 180;
    player.y = 260;
    state.tutorial.step = 0;
    state.tutorial.moved = false;
    state.tutorial.usedAttack = false;
    state.tutorial.swordBasicGiven = false;
    player.inventory.unlockedSkills.delete("Sword basic");
    spawnInitialActors();
  }
}

function drawCircle(entity) {
  ctx.beginPath();
  ctx.arc(entity.x, entity.y, entity.r, 0, Math.PI * 2);
  ctx.fillStyle = entity.color;
  ctx.fill();
}

function drawArena() {
  ctx.clearRect(0, 0, ARENA.width, ARENA.height);

  ctx.fillStyle = "#0a1426";
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);

  ctx.strokeStyle = "#1e3557";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, ARENA.width - 2, ARENA.height - 2);

  for (const f of state.friendlies) {
    drawCircle(f);
    ctx.fillStyle = "#c8ffd8";
    ctx.font = "12px sans-serif";
    ctx.fillText(f.label, f.x - 16, f.y - 16);
  }

  for (const attack of state.attacks) {
    ctx.beginPath();
    ctx.arc(attack.x, attack.y, attack.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(40, 190, 255, 0.22)";
    ctx.fill();
  }

  for (const enemy of state.enemies) {
    drawCircle(enemy);
  }

  drawCircle(player);

  if (player.blockTimer > 0) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#8bc6ff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function updateInventoryPanel() {
  if (state.inventoryOpen) {
    inventoryPanel.classList.remove("hidden");
  } else {
    inventoryPanel.classList.add("hidden");
  }

  const slotRows = player.inventory.attackSlots
    .map((name, idx) => `<li>${ATTACK_KEYS[idx].toUpperCase()}: ${name ?? "Empty"}</li>`)
    .join("");

  const unlockedAttacks = [...player.inventory.unlockedAttacks]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => `<li>${name}</li>`)
    .join("");

  const unlockedSkills = [...player.inventory.unlockedSkills]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => `<li>${name}</li>`)
    .join("");

  inventoryBody.innerHTML = `
    <p><strong>Armor:</strong> Training Armor (${player.armor})</p>
    <p><strong>Weapon:</strong> ${player.weapon}</p>
    <p><strong>Attack Slots (5):</strong></p>
    <ul>${slotRows}</ul>
    <p><strong>Unlocked Basic Attacks:</strong></p>
    <ul>${unlockedAttacks || "<li>None</li>"}</ul>
    <p><strong>Unlocked Skills:</strong></p>
    <ul>${unlockedSkills || "<li>None</li>"}</ul>
  `;

  playerStats.textContent = `HP ${Math.ceil(player.hp)}/${player.maxHp} | Enemies ${state.enemies.length}`;
}

function loop(time) {
  const dt = Math.min(0.033, (time - state.lastTime) / 1000 || 0);
  state.lastTime = time;

  updatePlayer(dt);
  updateAttacks(dt);
  updateEnemies(dt);
  updateTutorial();
  drawArena();
  updateInventoryPanel();

  state.justPressed.clear();
  requestAnimationFrame(loop);
}

function keyFromEvent(event) {
  return event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
}

window.addEventListener("keydown", (event) => {
  const key = keyFromEvent(event);

  if (["w", "a", "s", "d", "j", "k", "l", ";", "'", "i"].includes(key)) {
    event.preventDefault();
  }

  if (!state.keysDown.has(key)) {
    state.justPressed.add(key);
  }
  state.keysDown.add(key);

  if (key === "i" && state.justPressed.has("i")) {
    state.inventoryOpen = !state.inventoryOpen;
  }
});

window.addEventListener("keyup", (event) => {
  state.keysDown.delete(keyFromEvent(event));
});

async function init() {
  const response = await fetch(encodeURI("./base demo ironridge.json"));
  const tree = await response.json();
  state.skillTree = buildSkillIndex(tree);

  unlockStarterFromSkillTree(state.skillTree);
  spawnInitialActors();
  updateInventoryPanel();
  requestAnimationFrame(loop);
}

init().catch((err) => {
  tutorialText.textContent = `Failed to load skill data: ${String(err)}`;
});
