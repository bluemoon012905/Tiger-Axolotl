const ROOM_FILL = "#e7dcc5";
const ROOM_STROKE = "#8f8165";
const HUD_INK = "#1f2328";

export function renderScene(context, scene) {
  const { room, player, enemies, projectiles, hazards, phase, overlayLines } = scene;

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.fillStyle = "#f4efe4";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);

  drawRoom(context, room, phase);
  drawHazards(context, hazards);
  drawProjectiles(context, projectiles);
  enemies.forEach((enemy) => drawEntity(context, enemy));
  drawPlayer(context, player);
  drawHud(context, player, scene);

  if (overlayLines.length > 0) {
    drawOverlay(context, overlayLines);
  }
}

function drawRoom(context, room, phase) {
  context.fillStyle = ROOM_FILL;
  context.fillRect(room.bounds.x, room.bounds.y, room.bounds.width, room.bounds.height);

  context.strokeStyle = ROOM_STROKE;
  context.lineWidth = 6;
  context.strokeRect(room.bounds.x, room.bounds.y, room.bounds.width, room.bounds.height);

  const doorColor = phase === "combat" ? "#bd5d38" : "#5f9d7a";
  drawDoor(context, room.bounds.x + room.bounds.width / 2 - 26, room.bounds.y - 8, doorColor);
  drawDoor(
    context,
    room.bounds.x + room.bounds.width / 2 - 26,
    room.bounds.y + room.bounds.height - 8,
    doorColor
  );
}

function drawDoor(context, x, y, color) {
  context.fillStyle = color;
  context.fillRect(x, y, 52, 16);
}

function drawHazards(context, hazards) {
  hazards.forEach((hazard) => {
    if (hazard.kind === "telegraph") {
      context.beginPath();
      context.strokeStyle = "rgba(189, 93, 56, 0.85)";
      context.lineWidth = 3;
      context.arc(hazard.position.x, hazard.position.y, hazard.radius, 0, Math.PI * 2);
      context.stroke();
      return;
    }

    context.beginPath();
    context.fillStyle = "rgba(189, 93, 56, 0.32)";
    context.arc(hazard.position.x, hazard.position.y, hazard.radius, 0, Math.PI * 2);
    context.fill();
  });
}

function drawProjectiles(context, projectiles) {
  projectiles.forEach((projectile) => {
    context.beginPath();
    context.fillStyle = projectile.color;
    context.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2);
    context.fill();
  });
}

function drawPlayer(context, player) {
  if (player.attackState) {
    context.beginPath();
    context.fillStyle = "rgba(46, 111, 149, 0.18)";
    context.arc(player.position.x, player.position.y, player.attackState.range, 0, Math.PI * 2);
    context.fill();
  }

  drawEntity(context, player);
}

function drawEntity(context, entity) {
  context.beginPath();
  context.fillStyle = entity.damageFlash > 0 ? "#f5b46b" : entity.color;
  context.arc(entity.position.x, entity.position.y, entity.radius, 0, Math.PI * 2);
  context.fill();

  drawHealthBar(context, entity);
}

function drawHealthBar(context, entity) {
  const barWidth = entity.radius * 2.4;
  const barHeight = 5;
  const x = entity.position.x - barWidth / 2;
  const y = entity.position.y - entity.radius - 14;
  const ratio = Math.max(0, entity.health) / entity.maxHealth;

  context.fillStyle = "rgba(31, 35, 40, 0.22)";
  context.fillRect(x, y, barWidth, barHeight);
  context.fillStyle = entity.kind === "player" ? "#2e6f95" : "#bd5d38";
  context.fillRect(x, y, barWidth * ratio, barHeight);
}

function drawHud(context, player, scene) {
  const lines = [
    `HP ${Math.ceil(player.health)}/${player.maxHealth}`,
    `STA ${Math.ceil(player.stamina)}/${player.maxStamina}`,
    `MANA ${Math.ceil(player.mana)}/${player.maxMana}`,
    `Damage ${scene.totalDamageDealt}`,
  ];

  context.fillStyle = "rgba(255, 250, 241, 0.86)";
  context.fillRect(20, 16, 220, 98);
  context.fillStyle = HUD_INK;
  context.font = "15px Roboto, sans-serif";

  lines.forEach((line, index) => {
    context.fillText(line, 34, 40 + index * 20);
  });
}

function drawOverlay(context, overlayLines) {
  context.fillStyle = "rgba(7, 10, 14, 0.58)";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  context.fillStyle = "#f4efe4";
  context.textAlign = "center";
  context.font = "700 28px Roboto, sans-serif";
  context.fillText(overlayLines[0], context.canvas.width / 2, context.canvas.height / 2 - 18);

  context.font = "16px Roboto, sans-serif";
  overlayLines.slice(1).forEach((line, index) => {
    context.fillText(line, context.canvas.width / 2, context.canvas.height / 2 + 18 + index * 24);
  });
  context.textAlign = "start";
}
