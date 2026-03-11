export function renderScene(context, roomDefinition, player, enemies) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  context.fillStyle = "#e7dcc5";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);

  context.strokeStyle = "#8f8165";
  context.lineWidth = 6;
  context.strokeRect(
    roomDefinition.bounds.x,
    roomDefinition.bounds.y,
    roomDefinition.bounds.width,
    roomDefinition.bounds.height
  );

  drawEntity(context, player);
  enemies.forEach((enemy) => drawEntity(context, enemy));
}

function drawEntity(context, entity) {
  context.beginPath();
  context.fillStyle = entity.color;
  context.arc(entity.position.x, entity.position.y, entity.radius, 0, Math.PI * 2);
  context.fill();
}
