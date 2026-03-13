function createBaseEntity({ id, kind, position, radius, color, stats }) {
  return {
    id,
    kind,
    position: { ...position },
    radius,
    color,
    stats: { ...stats },
    velocity: { x: 0, y: 0 },
    facing: { x: 1, y: 0 },
    maxHealth: stats.health,
    health: stats.health,
    damageFlash: 0,
    attackCooldown: 0,
  };
}

export function createEntityFactory() {
  return {
    createPlayer(definition) {
      const player = createBaseEntity({
        id: definition.id,
        kind: "player",
        position: definition.spawn,
        radius: 16,
        color: "#2e6f95",
        stats: definition.stats,
      });

      return {
        ...player,
        name: definition.name,
        loadout: {
          weapon: definition.loadout.weapon,
          attacks: [...definition.loadout.attacks],
        },
        stamina: definition.stats.stamina,
        mana: definition.stats.mana,
        maxStamina: definition.stats.stamina,
        maxMana: definition.stats.mana,
        unlockedSkills: [],
        unlockedAttackSlots: 1,
        attackState: null,
        contactCooldown: 0,
      };
    },

    createEnemy(definition) {
      const enemy = createBaseEntity({
        id: definition.id,
        kind: "enemy",
        position: definition.spawn,
        radius: 14,
        color: "#bd5d38",
        stats: definition.stats,
      });

      return {
        ...enemy,
        archetype: definition.archetype,
        aiCooldown: 0,
        rangedCooldown: 0,
        castCooldown: 0,
        meleeCooldown: 0,
      };
    },
  };
}
