export function decodePlayerDefinition(raw) {
  assertObject(raw, "player");

  return {
    id: readString(raw.id, "player.id"),
    name: readString(raw.name, "player.name"),
    spawn: readVector(raw.spawn, "player.spawn"),
    stats: decodeStats(raw.stats, "player.stats"),
    loadout: decodeLoadout(raw.loadout, "player.loadout"),
  };
}

function decodeLoadout(raw, path) {
  assertObject(raw, path);

  return {
    weapon: readString(raw.weapon, `${path}.weapon`),
    attacks: readStringArray(raw.attacks, `${path}.attacks`),
  };
}

function decodeStats(raw, path) {
  assertObject(raw, path);

  return {
    health: readNumber(raw.health, `${path}.health`),
    stamina: readNumber(raw.stamina, `${path}.stamina`),
    mana: readNumber(raw.mana, `${path}.mana`),
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

function readStringArray(raw, path) {
  if (!Array.isArray(raw) || raw.some((value) => typeof value !== "string")) {
    throw new Error(`${path} must be an array of strings`);
  }

  return raw;
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
