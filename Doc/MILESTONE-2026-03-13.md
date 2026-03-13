# Milestone - March 13, 2026

## Session Goal

Move the tutorial from a static room render to a baseline playable room sequence and set up persistent configurable keybinds.

## Completed This Session

- Replaced the old static tutorial room preview with a real tutorial runtime loop.
- Implemented 3 main tutorial rooms plus 1 optional master room:
  - melee trial
  - ranged trial
  - magic trial
  - master trial
- Added room progression logic:
  - room briefing
  - combat phase
  - reward phase
  - completion/failure flow
- Added baseline enemy archetype behaviors:
  - spear
  - bow
  - staff
  - master
- Added baseline combat systems:
  - player movement
  - player melee attack
  - enemy contact damage
  - bow projectiles
  - staff telegraphed blast
  - health, stamina, and mana tracking
  - restart on death
- Added reward flow assumptions:
  - rewards are auto-granted for v1
  - each cleared main room grants 1 random skill
  - each cleared main room grants 1 extra attack slot
- Added secret-room gate:
  - tracks `totalDamageDealt`
  - unlocks the master room if damage threshold is met
- Added tutorial HUD/status support in the tutorial screen.
- Added persistent keybind support with local storage.
- Set default bindings:
  - movement: `W A S D`
  - attack slots: `J K L U I O`
  - confirm/advance: `Enter`
- Added a tutorial settings button with a cog icon.
- Added a keybind settings panel:
  - displays current bindings
  - supports rebinding actions
  - rejects duplicate bindings
  - `Esc` cancels a pending rebind
  - reset-to-defaults button

## Files Added

- [src/runtime/tutorialRuntime.js](/home/moonbox/personal_project/Tiger-Axolotl/src/runtime/tutorialRuntime.js)
- [src/runtime/keybindings.js](/home/moonbox/personal_project/Tiger-Axolotl/src/runtime/keybindings.js)
- [data/rooms/trial_room_02.json](/home/moonbox/personal_project/Tiger-Axolotl/data/rooms/trial_room_02.json)
- [data/rooms/trial_room_03.json](/home/moonbox/personal_project/Tiger-Axolotl/data/rooms/trial_room_03.json)
- [data/rooms/trial_room_04_master.json](/home/moonbox/personal_project/Tiger-Axolotl/data/rooms/trial_room_04_master.json)

## Files Updated

- [src/main.js](/home/moonbox/personal_project/Tiger-Axolotl/src/main.js)
- [src/runtime/entityFactory.js](/home/moonbox/personal_project/Tiger-Axolotl/src/runtime/entityFactory.js)
- [src/runtime/renderScene.js](/home/moonbox/personal_project/Tiger-Axolotl/src/runtime/renderScene.js)
- [data/rooms/trial_room_01.json](/home/moonbox/personal_project/Tiger-Axolotl/data/rooms/trial_room_01.json)
- [index.html](/home/moonbox/personal_project/Tiger-Axolotl/index.html)
- [styles.css](/home/moonbox/personal_project/Tiger-Axolotl/styles.css)
- [tutorial.md](/home/moonbox/personal_project/Tiger-Axolotl/tutorial.md)

## Current Playable State

- Tutorial launches from the menu.
- Player can move and attack inside a bounded room.
- Enemies behave differently by archetype.
- Clearing rooms advances the tutorial flow.
- Rewards are currently automatic.
- A master room can unlock based on damage dealt.
- Keybinds can be changed from the tutorial settings panel and persist locally.

## Important Current Assumptions

- V1 uses one active attack behavior even though there are 6 attack slots.
- `J K L U I O` all currently trigger the same attack behavior.
- Rewards are auto-granted instead of player-selected.
- The player fully refreshes HP/stamina/mana when entering each room.
- Duplicate keybinds are not allowed.
- Keybind persistence is local-only through browser storage.
- Secret-room threshold is currently tuned as a simple placeholder, not final balance.

## Known Gaps

- No browser playtest pass has been done yet for combat feel or pacing.
- No dodge, block, or parry system yet.
- No separate move behavior per attack slot yet.
- No real skill data hookup yet beyond placeholder reward names.
- No reward selection UI yet.
- No save/load integration for tutorial progress.
- No audio, hit effects, or screen shake polish.
- Enemy balance is placeholder and needs tuning.
- Settings UI exists only inside the tutorial screen for now.

## Verification Performed

- `node --check src/main.js`
- `node --check src/runtime/tutorialRuntime.js`
- `node --check src/runtime/keybindings.js`
- `node --check src/runtime/renderScene.js`
- `node --check src/runtime/entityFactory.js`

## Recommended Next Steps

1. Browser-test the tutorial and tune room pacing, enemy damage, enemy speed, and the secret threshold.
2. Split attack-slot behavior so `J K L U I O` can represent genuinely different moves.
3. Replace auto-granted rewards with a simple reward choice screen.
4. Decide whether room-to-room healing should be full, partial, or reward-based.
5. Add dodge/block once the baseline combat feel is stable.

## Resume Notes

- Main runtime entry: [src/main.js](/home/moonbox/personal_project/Tiger-Axolotl/src/main.js)
- Tutorial gameplay loop: [src/runtime/tutorialRuntime.js](/home/moonbox/personal_project/Tiger-Axolotl/src/runtime/tutorialRuntime.js)
- Keybind persistence and defaults: [src/runtime/keybindings.js](/home/moonbox/personal_project/Tiger-Axolotl/src/runtime/keybindings.js)
- Tutorial design baseline: [tutorial.md](/home/moonbox/personal_project/Tiger-Axolotl/tutorial.md)
- Room content:
  - [data/rooms/trial_room_01.json](/home/moonbox/personal_project/Tiger-Axolotl/data/rooms/trial_room_01.json)
  - [data/rooms/trial_room_02.json](/home/moonbox/personal_project/Tiger-Axolotl/data/rooms/trial_room_02.json)
  - [data/rooms/trial_room_03.json](/home/moonbox/personal_project/Tiger-Axolotl/data/rooms/trial_room_03.json)
  - [data/rooms/trial_room_04_master.json](/home/moonbox/personal_project/Tiger-Axolotl/data/rooms/trial_room_04_master.json)


codex resume 019ce450-e75f-7143-97e8-f84eb9f48f70