function createBaseEntity({ id, kind, position, radius, color, stats }) {
  return {
    id,
    kind,
    position: { ...position },
    radius,
    color,
    stats: { ...stats },
  };
}

export function createEntityFactory() {
  return {
    createPlayer(definition) {
      return createBaseEntity({
        id: definition.id,
        kind: "player",
        position: definition.spawn,
        radius: 16,
        color: "#2e6f95",
        stats: definition.stats,
      });
    },

    createEnemy(definition) {
      return createBaseEntity({
        id: definition.id,
        kind: "enemy",
        position: definition.spawn,
        radius: 14,
        color: "#bd5d38",
        stats: definition.stats,
      });
    },
  };
}
