# Tiger-Axolotl

## Demo Goal (Phase 1 Foundation)

Build a **basic playable demo** that is heavily inspired by *Soul Knight* moment-to-moment gameplay:
- Fast top-down room combat
- Clear weapon feel
- Short runs
- Repeatable encounters

This first version is not the full open world. It is a focused combat tutorial slice.

## Deployment Target

This demo is planned for **static hosting on GitHub Pages**.

Implications for implementation:
- Frontend must run as static assets (HTML/CSS/JS and bundled files)
- No required backend server for core gameplay
- Game state should be local/session based for the demo phase

## Start of Game: The Trial

The game starts with the main character inside a repeatable **Trial**.

Purpose of the Trial:
- Teach core controls
- Repeat core actions until they feel natural
- Establish combat rhythm early

Trial structure:
1. Movement room
2. Basic attack room
3. Dodge/block timing room
4. Simple enemy room
5. Mixed enemy room
6. Mini-boss room

If the player fails, they restart the Trial quickly. Repetition is intentional.

## Core Gameplay Loop (Soul Knight Referenced)

For this demo, loop is:
1. Enter room
2. Doors lock
3. Clear enemies
4. Choose reward
5. Move to next room

Room design should stay compact and readable. Combat should be quick and decisive.

## Player Setup (Basic)

- One default main character
- One starter weapon: `sword (jian)`
- Basic actions only:
  - Move
  - Light attack combo
  - Block / defensive action
  - One simple ability

No class selection yet in this phase.

## Demo Progression (Basic)

Use simple run-based upgrades during Trial/demo:
- Small stat boosts (damage, armor, stamina, mana)
- One new move unlock after early rooms
- One reward choice after each cleared room

Keep numbers easy to tune and easy to read.

## Content Scope for Foundation

Include:
- 1 biome/theme for Trial
- 6-10 handcrafted rooms
- 3-5 basic enemy types
- 1 mini-boss
- 1 end-of-trial summary screen

Defer for later:
- Open world map
- Schools/disciples meta-system
- Complex world simulation
- Large narrative systems

## Immediate Build Priorities

1. Lock in Trial flow from spawn to mini-boss.
2. Make controls and combat feel responsive.
3. Implement room lock/clear/reward loop.
4. Hook in current skill tree data as simple unlocks.
5. Add fast restart to encourage repetition.
