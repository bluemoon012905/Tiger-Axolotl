const STORAGE_KEY = "tiger-axolotl.keybindings.v1";

export const DEFAULT_KEYBINDINGS = {
  moveUp: "w",
  moveLeft: "a",
  moveDown: "s",
  moveRight: "d",
  attack1: "j",
  attack2: "k",
  attack3: "l",
  attack4: "u",
  attack5: "i",
  attack6: "o",
  advance: "enter",
};

export const KEYBIND_ORDER = [
  { action: "moveUp", label: "Move Up" },
  { action: "moveLeft", label: "Move Left" },
  { action: "moveDown", label: "Move Down" },
  { action: "moveRight", label: "Move Right" },
  { action: "attack1", label: "Attack Slot 1" },
  { action: "attack2", label: "Attack Slot 2" },
  { action: "attack3", label: "Attack Slot 3" },
  { action: "attack4", label: "Attack Slot 4" },
  { action: "attack5", label: "Attack Slot 5" },
  { action: "attack6", label: "Attack Slot 6" },
  { action: "advance", label: "Advance / Confirm" },
];

export function loadKeybindings() {
  const saved = readStoredBindings();
  return sanitizeBindings(saved);
}

export function saveKeybindings(bindings) {
  const sanitized = sanitizeBindings(bindings);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export function resetKeybindings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_KEYBINDINGS));
  return { ...DEFAULT_KEYBINDINGS };
}

export function normalizeKey(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized === " ") {
    return "space";
  }

  if (normalized === "escape") {
    return "esc";
  }

  if (normalized.startsWith("arrow")) {
    return normalized.slice(5);
  }

  return normalized;
}

export function formatKeyLabel(key) {
  if (!key) {
    return "Unbound";
  }

  if (key.length === 1) {
    return key.toUpperCase();
  }

  if (key === "esc") {
    return "Esc";
  }

  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function getAttackKeys(bindings) {
  return [
    bindings.attack1,
    bindings.attack2,
    bindings.attack3,
    bindings.attack4,
    bindings.attack5,
    bindings.attack6,
  ];
}

function readStoredBindings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to read saved keybindings", error);
    return null;
  }
}

function sanitizeBindings(raw) {
  const sanitized = { ...DEFAULT_KEYBINDINGS };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return sanitized;
  }

  Object.keys(DEFAULT_KEYBINDINGS).forEach((action) => {
    const normalized = normalizeKey(raw[action]);
    if (normalized) {
      sanitized[action] = normalized;
    }
  });

  return sanitized;
}
