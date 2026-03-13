import { renderScene } from "./renderScene.js";
import { formatKeyLabel, getAttackKeys } from "./keybindings.js";

const SKILL_POOL = [
  "Whirling Cut",
  "Stone Breaker",
  "Wind Step",
  "Arc Thread",
  "Guard Pulse",
];

const SECRET_DAMAGE_THRESHOLD = 180;
const PLAYER_ATTACK_COST = {
  stamina: 18,
  mana: 6,
};
export function createTutorialRuntime({
  context,
  entityFactory,
  getKeybindings,
  onStatus,
  onSummary,
  onMeta,
}) {
  const input = createInputTracker(getKeybindings);
  let animationFrameId = 0;
  let active = false;
  let defs = null;
  let state = null;
  let lastTimestamp = 0;

  function start(definitions) {
    defs = definitions;
    active = true;
    resetRun();
    input.attach();
    lastTimestamp = performance.now();
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(step);
  }

  function stop() {
    active = false;
    cancelAnimationFrame(animationFrameId);
    input.detach();
  }

  function resetRun() {
    const player = entityFactory.createPlayer(defs.playerDefinition);

    state = {
      player,
      rooms: defs.roomDefinitions,
      roomIndex: 0,
      currentRoom: null,
      enemies: [],
      projectiles: [],
      hazards: [],
      levelReward: null,
      totalDamageDealt: 0,
      levelsCleared: 0,
      secretUnlocked: false,
      phase: "briefing",
      phaseTimer: 1.2,
      overlayLines: [
        "Entering tutorial",
        `${getMovementHint()} to move`,
        `Attack with ${getAttackHint()}`,
      ],
    };

    loadRoom(0, true);
  }

  function loadRoom(index, isFreshRun = false) {
    const room = state.rooms[index];
    state.roomIndex = index;
    state.currentRoom = room;
    state.enemies = room.enemies.map((enemyDefinition) => entityFactory.createEnemy(enemyDefinition));
    state.projectiles = [];
    state.hazards = [];
    state.phase = "briefing";
    state.phaseTimer = isFreshRun ? 1.2 : 0.9;
    state.overlayLines = [
      room.name,
      room.objective,
      `Press ${getAttackHint()} to strike. Clear the room to advance.`,
    ];
    resetPlayerForRoom();
    publishState();
  }

  function resetPlayerForRoom() {
    state.player.position = { ...defs.playerDefinition.spawn };
    state.player.velocity = { x: 0, y: 0 };
    state.player.attackState = null;
    state.player.attackCooldown = 0;
    state.player.contactCooldown = 0;
    state.player.stamina = state.player.maxStamina;
    state.player.mana = state.player.maxMana;
    state.player.health = state.player.maxHealth;
  }

  function step(timestamp) {
    if (!active) {
      return;
    }

    const dt = Math.min(0.033, (timestamp - lastTimestamp) / 1000 || 0.016);
    lastTimestamp = timestamp;

    update(dt);
    renderScene(context, {
      room: state.currentRoom,
      player: state.player,
      enemies: state.enemies,
      projectiles: state.projectiles,
      hazards: state.hazards,
      phase: state.phase,
      overlayLines: state.overlayLines,
      totalDamageDealt: state.totalDamageDealt,
    });

    animationFrameId = requestAnimationFrame(step);
  }

  function update(dt) {
    updateTimers(dt);

    if (state.phase === "briefing") {
      state.phaseTimer -= dt;
      if (state.phaseTimer <= 0) {
        state.phase = "combat";
        state.overlayLines = [];
      }
      publishState();
      return;
    }

    if (state.phase === "reward" || state.phase === "complete" || state.phase === "gameover") {
      handleAdvanceInput();
      publishState();
      return;
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateHazards(dt);
    resolveRoomState();
    publishState();
  }

  function updateTimers(dt) {
    fadeDamage(state.player, dt);
    state.player.attackCooldown = Math.max(0, state.player.attackCooldown - dt);
    state.player.contactCooldown = Math.max(0, state.player.contactCooldown - dt);
    state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 24 * dt);
    state.player.mana = Math.min(state.player.maxMana, state.player.mana + 12 * dt);

    if (state.player.attackState) {
      state.player.attackState.timer -= dt;
      if (!state.player.attackState.didHit) {
        resolvePlayerAttack();
        state.player.attackState.didHit = true;
      }
      if (state.player.attackState.timer <= 0) {
        state.player.attackState = null;
      }
    }

    state.enemies.forEach((enemy) => {
      fadeDamage(enemy, dt);
      enemy.meleeCooldown = Math.max(0, enemy.meleeCooldown - dt);
      enemy.rangedCooldown = Math.max(0, enemy.rangedCooldown - dt);
      enemy.castCooldown = Math.max(0, enemy.castCooldown - dt);
    });
  }

  function updatePlayer(dt) {
    const move = input.getMovementVector();
    const moveSpeed = state.player.stats.speed * 58;

    state.player.position.x += move.x * moveSpeed * dt;
    state.player.position.y += move.y * moveSpeed * dt;

    if (move.x !== 0 || move.y !== 0) {
      state.player.facing = { x: move.x, y: move.y };
    }

    clampToBounds(state.player, state.currentRoom.bounds);

    if (input.consumeAttackPress(getAttackKeys(getKeybindings())) && canAttack()) {
      state.player.stamina -= PLAYER_ATTACK_COST.stamina;
      state.player.mana -= PLAYER_ATTACK_COST.mana;
      state.player.attackCooldown = 0.36;
      state.player.attackState = {
        timer: 0.12,
        damage: 28,
        range: 64,
        didHit: false,
      };
    }
  }

  function canAttack() {
    return (
      state.player.attackCooldown <= 0 &&
      state.player.stamina >= PLAYER_ATTACK_COST.stamina &&
      state.player.mana >= PLAYER_ATTACK_COST.mana
    );
  }

  function resolvePlayerAttack() {
    state.enemies.forEach((enemy) => {
      const distance = getDistance(state.player.position, enemy.position);
      if (distance <= state.player.attackState.range + enemy.radius) {
        applyDamage(enemy, state.player.attackState.damage);
      }
    });
    state.enemies = state.enemies.filter((enemy) => enemy.health > 0);
  }

  function updateEnemies(dt) {
    state.enemies.forEach((enemy) => {
      if (enemy.archetype === "spear") {
        updateSpearEnemy(enemy, dt);
        return;
      }

      if (enemy.archetype === "bow") {
        updateBowEnemy(enemy, dt);
        return;
      }

      if (enemy.archetype === "staff") {
        updateStaffEnemy(enemy, dt);
        return;
      }

      updateMasterEnemy(enemy, dt);
    });
  }

  function updateSpearEnemy(enemy, dt) {
    moveEnemyTowardPlayer(enemy, dt, 46);
    tryEnemyMelee(enemy, 40, enemy.stats.damage);
  }

  function updateBowEnemy(enemy, dt) {
    const distance = getDistance(enemy.position, state.player.position);
    const preferredDistance = 220;
    if (distance < preferredDistance - 24) {
      moveEnemyAwayFromPlayer(enemy, dt);
    } else if (distance > preferredDistance + 50) {
      moveEnemyTowardPlayer(enemy, dt, preferredDistance);
    }

    if (enemy.rangedCooldown <= 0) {
      spawnArrow(enemy, "#7d6a47");
      enemy.rangedCooldown = 1.15;
    }
  }

  function updateStaffEnemy(enemy, dt) {
    moveEnemyTowardPlayer(enemy, dt, 160);

    if (enemy.castCooldown <= 0) {
      spawnBlast(state.player.position, enemy.stats.damage);
      enemy.castCooldown = 1.6;
    }
  }

  function updateMasterEnemy(enemy, dt) {
    moveEnemyTowardPlayer(enemy, dt, 78);
    tryEnemyMelee(enemy, 54, enemy.stats.damage);

    if (enemy.rangedCooldown <= 0) {
      spawnArrow(enemy, "#5b7ca6");
      enemy.rangedCooldown = 1.25;
    }

    if (enemy.castCooldown <= 0) {
      spawnBlast(state.player.position, enemy.stats.damage + 4);
      enemy.castCooldown = 2;
    }
  }

  function moveEnemyTowardPlayer(enemy, dt, stopDistance) {
    const delta = getDelta(enemy.position, state.player.position);
    const distance = Math.max(1, Math.hypot(delta.x, delta.y));
    if (distance <= stopDistance) {
      return;
    }

    enemy.position.x += (delta.x / distance) * enemy.stats.speed * 52 * dt;
    enemy.position.y += (delta.y / distance) * enemy.stats.speed * 52 * dt;
    clampToBounds(enemy, state.currentRoom.bounds);
  }

  function moveEnemyAwayFromPlayer(enemy, dt) {
    const delta = getDelta(state.player.position, enemy.position);
    const distance = Math.max(1, Math.hypot(delta.x, delta.y));

    enemy.position.x += (delta.x / distance) * enemy.stats.speed * 46 * dt;
    enemy.position.y += (delta.y / distance) * enemy.stats.speed * 46 * dt;
    clampToBounds(enemy, state.currentRoom.bounds);
  }

  function tryEnemyMelee(enemy, range, damage) {
    const distance = getDistance(enemy.position, state.player.position);
    if (distance <= range + state.player.radius && enemy.meleeCooldown <= 0) {
      applyPlayerDamage(damage);
      enemy.meleeCooldown = 0.85;
    }
  }

  function updateProjectiles(dt) {
    state.projectiles = state.projectiles.filter((projectile) => {
      projectile.position.x += projectile.velocity.x * dt;
      projectile.position.y += projectile.velocity.y * dt;
      projectile.life -= dt;

      if (!isInsideBounds(projectile.position, state.currentRoom.bounds, projectile.radius)) {
        return false;
      }

      if (
        getDistance(projectile.position, state.player.position) <=
        projectile.radius + state.player.radius
      ) {
        applyPlayerDamage(projectile.damage);
        return false;
      }

      return projectile.life > 0;
    });
  }

  function updateHazards(dt) {
    const nextHazards = [];

    state.hazards.forEach((hazard) => {
      hazard.timer -= dt;

      if (hazard.kind === "telegraph" && hazard.timer <= 0) {
        nextHazards.push({
          kind: "blast",
          position: hazard.position,
          radius: hazard.radius,
          damage: hazard.damage,
          timer: 0.28,
          didDamage: false,
        });
        return;
      }

      if (hazard.kind === "blast") {
        if (!hazard.didDamage) {
          if (getDistance(hazard.position, state.player.position) <= hazard.radius + state.player.radius) {
            applyPlayerDamage(hazard.damage);
          }
          hazard.didDamage = true;
        }

        if (hazard.timer > 0) {
          nextHazards.push(hazard);
        }
        return;
      }

      nextHazards.push(hazard);
    });

    state.hazards = nextHazards;
  }

  function resolveRoomState() {
    if (state.player.health <= 0 && state.phase !== "gameover") {
      state.phase = "gameover";
      state.overlayLines = ["You fell in the Trial", "Press Enter to restart from room 1"];
      return;
    }

    if (state.enemies.length > 0 || state.phase !== "combat") {
      return;
    }

    state.levelsCleared += 1;
    state.secretUnlocked = state.totalDamageDealt >= SECRET_DAMAGE_THRESHOLD;

    if (state.roomIndex < 2) {
      grantReward();
      state.phase = "reward";
      state.overlayLines = [
        `${state.currentRoom.name} cleared`,
        `Unlocked skill: ${state.levelReward.skill}`,
        `Attack slots: ${state.player.unlockedAttackSlots}`,
        "Press Enter to continue",
      ];
      return;
    }

    if (state.roomIndex === 2 && state.secretUnlocked) {
      state.phase = "reward";
      state.overlayLines = [
        "Master Trial unlocked",
        `Damage dealt: ${state.totalDamageDealt} / ${SECRET_DAMAGE_THRESHOLD}`,
        "Press Enter to face the master",
      ];
      return;
    }

    state.phase = "complete";
    state.overlayLines = [
      "Tutorial complete",
      `Rooms cleared: ${state.levelsCleared}`,
      state.secretUnlocked
        ? "Master access granted. Press Enter to fight."
        : "Press Enter to restart the tutorial",
    ];
  }

  function grantReward() {
    const availableSkills = SKILL_POOL.filter((skill) => !state.player.unlockedSkills.includes(skill));
    const skill =
      availableSkills[Math.floor(Math.random() * availableSkills.length)] || "Battle Rhythm";

    state.player.unlockedSkills.push(skill);
    state.player.unlockedAttackSlots += 1;
    state.levelReward = { skill };
  }

  function handleAdvanceInput() {
    if (!input.consumePress(getKeybindings().advance)) {
      return;
    }

    if (state.phase === "gameover") {
      resetRun();
      return;
    }

    if (state.phase === "reward") {
      if (state.roomIndex < 2) {
        loadRoom(state.roomIndex + 1);
        return;
      }

      if (state.roomIndex === 2 && state.secretUnlocked) {
        loadRoom(3);
        return;
      }
    }

    if (state.phase === "complete") {
      if (state.secretUnlocked && state.roomIndex === 2) {
        loadRoom(3);
        return;
      }

      resetRun();
    }
  }

  function spawnArrow(enemy, color) {
    const delta = getDelta(enemy.position, state.player.position);
    const distance = Math.max(1, Math.hypot(delta.x, delta.y));

    state.projectiles.push({
      position: { x: enemy.position.x, y: enemy.position.y },
      velocity: {
        x: (delta.x / distance) * 280,
        y: (delta.y / distance) * 280,
      },
      radius: 6,
      damage: enemy.stats.damage,
      life: 3,
      color,
    });
  }

  function spawnBlast(position, damage) {
    state.hazards.push({
      kind: "telegraph",
      position: { x: position.x, y: position.y },
      radius: 34,
      damage,
      timer: 0.7,
    });
  }

  function applyDamage(enemy, amount) {
    enemy.health = Math.max(0, enemy.health - amount);
    enemy.damageFlash = 0.12;
    state.totalDamageDealt += amount;
  }

  function applyPlayerDamage(amount) {
    if (state.player.contactCooldown > 0) {
      return;
    }

    state.player.health = Math.max(0, state.player.health - amount);
    state.player.damageFlash = 0.12;
    state.player.contactCooldown = 0.28;
  }

  function publishState() {
    const roomNumber = Math.min(state.roomIndex + 1, 4);
    const roomTotal = state.secretUnlocked || state.roomIndex >= 3 ? 4 : 3;

    onStatus(getStatusText());
    onSummary([
      ["Room", `${roomNumber} / ${roomTotal}`],
      ["Objective", state.currentRoom.objective],
      ["HP", `${Math.ceil(state.player.health)} / ${state.player.maxHealth}`],
      ["Attack Slots", String(state.player.unlockedAttackSlots)],
      ["Skills", state.player.unlockedSkills.length ? state.player.unlockedSkills.join(", ") : "None"],
      ["Damage", `${state.totalDamageDealt}`],
    ]);
    onMeta({
      roomLabel: state.currentRoom.name,
      stateLabel: getPhaseLabel(),
    });
  }

  function getStatusText() {
    if (state.phase === "briefing") {
      return `Entering ${state.currentRoom.name}. ${state.currentRoom.objective}`;
    }

    if (state.phase === "combat") {
      return `Combat active. Clear the room to advance. Press ${formatKeyLabel(
        getKeybindings().advance
      )} after reward screens.`;
    }

    if (state.phase === "reward") {
      return `Reward room. Assumption for v1: rewards are auto-granted and confirmed with ${formatKeyLabel(
        getKeybindings().advance
      )}.`;
    }

    if (state.phase === "gameover") {
      return `The tutorial restarts from room 1 on death. Press ${formatKeyLabel(
        getKeybindings().advance
      )} to try again.`;
    }

    return `Tutorial finished. Press ${formatKeyLabel(
      getKeybindings().advance
    )} to restart or continue to the master trial if unlocked.`;
  }

  function getPhaseLabel() {
    if (state.phase === "briefing") {
      return "Briefing";
    }

    if (state.phase === "combat") {
      return "Combat";
    }

    if (state.phase === "reward") {
      return "Reward";
    }

    if (state.phase === "gameover") {
      return "Failure";
    }

    return "Complete";
  }

  return {
    start,
    stop,
  };

  function getMovementHint() {
    const bindings = getKeybindings();
    return [
      formatKeyLabel(bindings.moveUp),
      formatKeyLabel(bindings.moveLeft),
      formatKeyLabel(bindings.moveDown),
      formatKeyLabel(bindings.moveRight),
    ].join(" ");
  }

  function getAttackHint() {
    return getAttackKeys(getKeybindings()).map((key) => formatKeyLabel(key)).join(" ");
  }
}

function createInputTracker(getKeybindings) {
  const pressed = new Set();
  const justPressed = new Set();
  let attached = false;

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (!pressed.has(key)) {
      justPressed.add(key);
    }
    pressed.add(key);

    if (getPreventedKeys().includes(key)) {
      event.preventDefault();
    }
  }

  function handleKeyUp(event) {
    pressed.delete(event.key.toLowerCase());
  }

  return {
    attach() {
      if (attached) {
        return;
      }
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      attached = true;
    },
    detach() {
      if (!attached) {
        return;
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      pressed.clear();
      justPressed.clear();
      attached = false;
    },
    getMovementVector() {
      const bindings = getKeybindings();
      const x =
        (pressed.has(bindings.moveRight) ? 1 : 0) - (pressed.has(bindings.moveLeft) ? 1 : 0);
      const y =
        (pressed.has(bindings.moveDown) ? 1 : 0) - (pressed.has(bindings.moveUp) ? 1 : 0);
      const length = Math.hypot(x, y) || 1;

      return {
        x: x / length,
        y: y / length,
      };
    },
    consumePress(key) {
      if (!justPressed.has(key)) {
        return false;
      }

      justPressed.delete(key);
      return true;
    },
    consumeAttackPress(keys) {
      return keys.some((key) => key && this.consumePress(key));
    },
  };

  function getPreventedKeys() {
    const bindings = getKeybindings();
    return [
      bindings.moveUp,
      bindings.moveLeft,
      bindings.moveDown,
      bindings.moveRight,
      bindings.attack1,
      bindings.attack2,
      bindings.attack3,
      bindings.attack4,
      bindings.attack5,
      bindings.attack6,
      bindings.advance,
    ].filter(Boolean);
  }
}

function fadeDamage(entity, dt) {
  entity.damageFlash = Math.max(0, entity.damageFlash - dt);
}

function clampToBounds(entity, bounds) {
  entity.position.x = clamp(
    entity.position.x,
    bounds.x + entity.radius,
    bounds.x + bounds.width - entity.radius
  );
  entity.position.y = clamp(
    entity.position.y,
    bounds.y + entity.radius,
    bounds.y + bounds.height - entity.radius
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getDelta(from, to) {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
  };
}

function isInsideBounds(position, bounds, radius) {
  return (
    position.x >= bounds.x - radius &&
    position.x <= bounds.x + bounds.width + radius &&
    position.y >= bounds.y - radius &&
    position.y <= bounds.y + bounds.height + radius
  );
}
