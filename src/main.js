import { createEntityFactory } from "./runtime/entityFactory.js";
import { decodePlayerDefinition } from "./decoders/playerDecoder.js";
import { decodeRoomDefinition } from "./decoders/roomDecoder.js";
import { loadJson } from "./runtime/loadJson.js";
import { renderScene } from "./runtime/renderScene.js";

const statusNode = document.querySelector("#status");
const summaryNode = document.querySelector("#summary");
const screenNodes = Array.from(document.querySelectorAll(".screen"));
const actionButtons = Array.from(document.querySelectorAll("[data-action]"));
const fullscreenButtons = actionButtons.filter(
  (button) => button.dataset.action === "toggle-fullscreen"
);
const canvas = document.querySelector("#stage");
const context = canvas.getContext("2d");
const entityFactory = createEntityFactory();

const screens = {
  start: {
    status: "Gateway menu ready. Tutorial is live; load and export are staged for later.",
    summary: [
      ["Current Screen", "Gateway"],
      ["Playable Slice", "Tutorial"],
      ["Main Flow", "New Game placeholder"],
    ],
  },
  "new-game": {
    status: "New Game is now a separate top-level path. The actual playable work remains in Tutorial for now.",
    summary: [
      ["Current Screen", "New Game"],
      ["State", "Placeholder"],
      ["Implemented Path", "Tutorial"],
    ],
  },
  load: {
    status: "Load Game is a placeholder interface. Real slot data comes later.",
    summary: [
      ["Current Screen", "Load Game"],
      ["Storage", "Future local save data"],
      ["State", "Mock only"],
    ],
  },
  export: {
    status: "Export Saves is a placeholder interface. Export logic comes later.",
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
  await showScreen("start");
}

function bindUi() {
  actionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;

      if (action === "open-new-game") {
        await showScreen("new-game");
      }

      if (action === "open-tutorial") {
        await showScreen("tutorial");
      }

      if (action === "open-load") {
        await showScreen("load");
      }

      if (action === "open-export") {
        await showScreen("export");
      }

      if (action === "toggle-fullscreen") {
        await toggleFullscreen();
      }

      if (action === "back-start") {
        await showScreen("start");
      }
    });
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

  if (screenId === "tutorial") {
    await loadTutorial();
    return;
  }

  const screen = screens[screenId];
  if (statusNode) {
    statusNode.textContent = screen.status;
  }
  if (summaryNode) {
    renderSummary(screen.summary);
  }
}

async function loadTutorial() {
  try {
    const [playerRaw, roomRaw] = await Promise.all([
      loadJson("./data/actors/player_basic.json"),
      loadJson("./data/rooms/trial_room_01.json"),
    ]);

    const playerDefinition = decodePlayerDefinition(playerRaw);
    const roomDefinition = decodeRoomDefinition(roomRaw);
    const player = entityFactory.createPlayer(playerDefinition);
    const enemies = roomDefinition.enemies.map((enemyDefinition) =>
      entityFactory.createEnemy(enemyDefinition)
    );

    if (statusNode) {
      statusNode.textContent =
        "Tutorial loaded. Static JSON was decoded and converted into runtime entities.";
    }
    renderSummary([
      ["Player", playerDefinition.name],
      ["Weapon", playerDefinition.loadout.weapon],
      ["Room", roomDefinition.name],
      ["Objective", roomDefinition.objective],
      ["Enemies", String(roomDefinition.enemies.length)],
    ]);
    renderScene(context, roomDefinition, player, enemies);
  } catch (error) {
    if (statusNode) {
      statusNode.textContent = `Tutorial boot failed: ${error.message}`;
    }
    if (summaryNode) {
      summaryNode.innerHTML = "";
    }
    console.error(error);
  }
}

function renderSummary(rows) {
  if (!summaryNode) {
    return;
  }

  summaryNode.innerHTML = rows
    .map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`)
    .join("");
}

bootstrap();
