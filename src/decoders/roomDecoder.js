export function decodeRoomDefinition(raw) {
  assertObject(raw, "room");

  return {
    id: readString(raw.id, "room.id"),
    name: readString(raw.name, "room.name"),
    objective: readString(raw.objective, "room.objective"),
    bounds: readBounds(raw.bounds, "room.bounds"),
    enemies: readEnemyList(raw.enemies, "room.enemies"),
  };
}

function readEnemyList(raw, path) {
  if (!Array.isArray(raw)) {
    throw new Error(`${path} must be an array`);
  }

  return raw.map((enemy, index) => decodeEnemyDefinition(enemy, `${path}[${index}]`));
}

function decodeEnemyDefinition(raw, path) {
  assertObject(raw, path);

  return {
    id: readString(raw.id, `${path}.id`),
    archetype: readString(raw.archetype, `${path}.archetype`),
    spawn: readVector(raw.spawn, `${path}.spawn`),
    stats: decodeStats(raw.stats, `${path}.stats`),
  };
}

function readBounds(raw, path) {
  assertObject(raw, path);
  return {
    x: readNumber(raw.x, `${path}.x`),
    y: readNumber(raw.y, `${path}.y`),
    width: readNumber(raw.width, `${path}.width`),
    height: readNumber(raw.height, `${path}.height`),
  };
}

function decodeStats(raw, path) {
  assertObject(raw, path);

  return {
    health: readNumber(raw.health, `${path}.health`),
    damage: readNumber(raw.damage, `${path}.damage`),
    speed: readNumber(raw.speed, `${path}.speed`),
  };
}

function readVector(raw, path) {
  assertObject(raw, path);
  return {
    x: readNumber(raw.x, `${path}.x`),
    y: readNumber(raw.y, `${path}.y`),
  };
}

function readString(value, path) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }

  return value;
}

function readNumber(value, path) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${path} must be a number`);
  }

  return value;
}

function assertObject(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
}
