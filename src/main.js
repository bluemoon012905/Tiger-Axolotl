import { createEntityFactory } from "./runtime/entityFactory.js";
import { createTutorialRuntime } from "./runtime/tutorialRuntime.js";
import {
  KEYBIND_ORDER,
  formatKeyLabel,
  loadKeybindings,
  normalizeKey,
  resetKeybindings,
  saveKeybindings,
} from "./runtime/keybindings.js";
import { decodePlayerDefinition } from "./decoders/playerDecoder.js";
import { decodeRoomDefinition } from "./decoders/roomDecoder.js";
import { loadJson } from "./runtime/loadJson.js";

const statusNode = document.querySelector("#status");
const summaryNode = document.querySelector("#summary");
const tutorialRoomChip = document.querySelector("#tutorial-room-chip");
const tutorialStateChip = document.querySelector("#tutorial-state-chip");
const settingsPanel = document.querySelector("#tutorial-settings");
const settingsStatusNode = document.querySelector("#settings-status");
const keybindListNode = document.querySelector("#keybind-list");
const settingsToggleButton = document.querySelector('[data-action="open-settings"]');
const screenNodes = Array.from(document.querySelectorAll(".screen"));
const actionButtons = Array.from(document.querySelectorAll("[data-action]"));
const fullscreenButtons = actionButtons.filter(
  (button) => button.dataset.action === "toggle-fullscreen"
);
const canvas = document.querySelector("#stage");
const context = canvas.getContext("2d");
const entityFactory = createEntityFactory();

let tutorialDefinitionsPromise = null;
let keybindings = saveKeybindings(loadKeybindings());
let listeningAction = null;
let listeningLabel = null;
let settingsOpen = false;

const tutorialRuntime = createTutorialRuntime({
  context,
  entityFactory,
  getKeybindings: () => keybindings,
  onStatus: setStatus,
  onSummary: renderSummary,
  onMeta: renderTutorialMeta,
});

const screens = {
  start: {
    status: "Gateway menu ready. Tutorial now supports sequential rooms on the canvas.",
    summary: [
      ["Current Screen", "Gateway"],
      ["Playable Slice", "Tutorial"],
      ["Flow", "3 trials + optional master"],
    ],
  },
  "new-game": {
    status: "New Game remains a placeholder. The combat room implementation lives in Tutorial.",
    summary: [
      ["Current Screen", "New Game"],
      ["State", "Placeholder"],
      ["Implemented Path", "Tutorial"],
    ],
  },
  load: {
    status: "Load Game is still a placeholder interface.",
    summary: [
      ["Current Screen", "Load Game"],
      ["Storage", "Future local save data"],
      ["State", "Mock only"],
    ],
  },
  export: {
    status: "Export Saves is still a placeholder interface.",
    summary: [
      ["Current Screen", "Export Saves"],
      ["Format", "Likely JSON payload"],
      ["State", "Mock only"],
    ],
  },
};

async function bootstrap() {
  bindUi();
  bindFullscreen();
  bindKeybindCapture();
  renderKeybindList();
  closeSettings();
  await showScreen("start");
}

function bindUi() {
  actionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;

      if (action === "open-new-game") {
        await showScreen("new-game");
        return;
      }

      if (action === "open-tutorial") {
        await showScreen("tutorial");
        return;
      }

      if (action === "open-load") {
        await showScreen("load");
        return;
      }

      if (action === "open-export") {
        await showScreen("export");
        return;
      }

      if (action === "toggle-fullscreen") {
        await toggleFullscreen();
        return;
      }

      if (action === "back-start") {
        await showScreen("start");
        return;
      }

      if (action === "open-settings") {
        openSettings();
        return;
      }

      if (action === "close-settings") {
        closeSettings();
        return;
      }

      if (action === "reset-keybinds") {
        keybindings = resetKeybindings();
        cancelRebind("Keybinds reset to defaults.");
        renderKeybindList();
      }
    });
  });

  if (keybindListNode) {
    keybindListNode.addEventListener("click", (event) => {
      const button = event.target.closest("[data-bind-action]");
      if (!button) {
        return;
      }

      startRebind(button.dataset.bindAction, button.dataset.bindLabel);
    });
  }
}

function bindKeybindCapture() {
  window.addEventListener("keydown", (event) => {
    if (!settingsOpen || !listeningAction) {
      return;
    }

    event.preventDefault();

    const key = normalizeKey(event.key);
    if (!key) {
      return;
    }

    if (key === "esc") {
      cancelRebind(`Rebind cancelled for ${listeningLabel}.`);
      return;
    }

    const duplicate = findDuplicateAction(key, listeningAction);
    if (duplicate) {
      cancelRebind(`${formatKeyLabel(key)} is already used by ${duplicate.label}.`);
      return;
    }

    keybindings = saveKeybindings({
      ...keybindings,
      [listeningAction]: key,
    });
    renderKeybindList();
    cancelRebind(`${listeningLabel} is now bound to ${formatKeyLabel(key)}.`);
  });
}

function bindFullscreen() {
  updateFullscreenButtons();
  document.addEventListener("fullscreenchange", updateFullscreenButtons);
}

async function toggleFullscreen() {
  if (!document.fullscreenEnabled) {
    updateFullscreenButtons();
    return;
  }

  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }

  await document.documentElement.requestFullscreen();
}

function updateFullscreenButtons() {
  const fullscreenAvailable = document.fullscreenEnabled;
  const isFullscreen = Boolean(document.fullscreenElement);
  const label = document.fullscreenElement ? "Exit Full Screen" : "Full Screen";

  document.body.classList.toggle("is-fullscreen", isFullscreen);

  fullscreenButtons.forEach((button) => {
    button.disabled = !fullscreenAvailable;
    button.textContent = fullscreenAvailable ? label : "Full Screen Unavailable";
  });
}

async function showScreen(screenId) {
  screenNodes.forEach((node) => {
    node.classList.toggle("screen-active", node.id === `screen-${screenId}`);
  });

  if (screenId !== "tutorial") {
    tutorialRuntime.stop();
    closeSettings();
  }

  if (screenId === "tutorial") {
    await loadTutorial();
    return;
  }

  renderTutorialMeta({
    roomLabel: "Room Prototype",
    stateLabel: "Idle",
  });

  const screen = screens[screenId];
  setStatus(screen.status);
  renderSummary(screen.summary);
}

async function loadTutorial() {
  try {
    const definitions = await getTutorialDefinitions();
    tutorialRuntime.start(definitions);
  } catch (error) {
    setStatus(`Tutorial boot failed: ${error.message}`);
    renderSummary([]);
    console.error(error);
  }
}

async function getTutorialDefinitions() {
  if (!tutorialDefinitionsPromise) {
    tutorialDefinitionsPromise = Promise.all([
      loadJson("./data/actors/player_basic.json"),
      loadJson("./data/rooms/trial_room_01.json"),
      loadJson("./data/rooms/trial_room_02.json"),
      loadJson("./data/rooms/trial_room_03.json"),
      loadJson("./data/rooms/trial_room_04_master.json"),
    ]).then(([playerRaw, ...roomRaws]) => ({
      playerDefinition: decodePlayerDefinition(playerRaw),
      roomDefinitions: roomRaws.map((roomRaw) => decodeRoomDefinition(roomRaw)),
    }));
  }

  return tutorialDefinitionsPromise;
}

function openSettings() {
  settingsOpen = true;
  if (settingsPanel) {
    settingsPanel.hidden = false;
  }
  if (settingsToggleButton) {
    settingsToggleButton.setAttribute("aria-expanded", "true");
  }
  if (settingsStatusNode) {
    settingsStatusNode.textContent =
      "Defaults are saved locally. Select any action to rebind it, then press a key.";
  }
  renderKeybindList();
}

function closeSettings() {
  settingsOpen = false;
  listeningAction = null;
  listeningLabel = null;
  if (settingsPanel) {
    settingsPanel.hidden = true;
  }
  if (settingsToggleButton) {
    settingsToggleButton.setAttribute("aria-expanded", "false");
  }
}

function startRebind(action, label) {
  listeningAction = action;
  listeningLabel = label;
  if (settingsStatusNode) {
    settingsStatusNode.textContent = `Press a key for ${label}. Press Esc to cancel.`;
  }
  renderKeybindList();
}

function cancelRebind(message) {
  listeningAction = null;
  listeningLabel = null;
  if (settingsStatusNode && message) {
    settingsStatusNode.textContent = message;
  }
  renderKeybindList();
}

function findDuplicateAction(key, excludedAction) {
  return KEYBIND_ORDER.find(
    ({ action }) => action !== excludedAction && keybindings[action] === key
  );
}

function renderKeybindList() {
  if (!keybindListNode) {
    return;
  }

  keybindListNode.innerHTML = KEYBIND_ORDER.map(({ action, label }) => {
    const isListening = listeningAction === action;
    const buttonClass = isListening ? "keybind-button is-listening" : "keybind-button";
    const buttonText = isListening ? "Press any key..." : formatKeyLabel(keybindings[action]);

    return `
      <section class="keybind-card">
        <span class="keybind-label">${label}</span>
        <button
          type="button"
          class="${buttonClass}"
          data-bind-action="${action}"
          data-bind-label="${label}"
        >${buttonText}</button>
      </section>
    `;
  }).join("");
}

function setStatus(text) {
  if (statusNode) {
    statusNode.textContent = text;
  }
}

function renderTutorialMeta({ roomLabel, stateLabel }) {
  if (tutorialRoomChip) {
    tutorialRoomChip.textContent = roomLabel;
  }

  if (tutorialStateChip) {
    tutorialStateChip.textContent = stateLabel;
  }
}

function renderSummary(rows) {
  if (!summaryNode) {
    return;
  }

  summaryNode.innerHTML = rows
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
}

bootstrap();
