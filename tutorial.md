# Tutorial Baseline

## Goal

Build a short combat tutorial that teaches the player how to deal with the three core threat types:

- melee
- ranged
- magic

The tutorial should be short, readable, and repeatable. It is not a full progression system. It is a controlled training sequence that ends in either a normal completion or a secret challenge.

## Core Structure

The tutorial has 3 main levels and 1 optional secret level.

### Level 1: Melee Trial

- Enemy: golem with spear
- Teaching goal: spacing, movement, basic attack timing, avoiding direct rushes
- Completion reward:
  - unlock 1 random skill
  - unlock 1 extra attack slot

### Level 2: Ranged Trial

- Enemy: golem with bow
- Teaching goal: dodging projectiles, closing distance, pressure windows
- Completion reward:
  - unlock 1 random skill
  - unlock 1 extra attack slot

### Level 3: Magic Trial

- Enemy: golem with staff
- Teaching goal: reading telegraphed casts, repositioning, burst punish timing
- Completion reward:
  - unlock 1 random skill
  - unlock 1 extra attack slot

### Secret Level: The Master Trial

- Enemy setup: all three styles combined in one encounter
- Theme: final test of everything taught in the tutorial
- Unlock condition: only available if the player reaches a minimum total damage dealt threshold across the tutorial

## Intended Player Flow

1. Enter tutorial
2. Clear melee trial
3. Receive reward
4. Clear ranged trial
5. Receive reward
6. Clear magic trial
7. Check secret-level requirement
8. If requirement met, enter master trial
9. Show end summary

## Baseline Gameplay Rules

For the first implementation, keep the rules simple:

- One room per level
- One main enemy archetype per room
- Doors lock when combat starts
- Room clears when all required enemies are defeated
- Rewards happen between rooms, not during combat
- Player death restarts the tutorial from level 1

## Progression Rules

### Skill Rewards

- After each of the 3 main levels, present a random skill unlock
- Initial baseline:
  - random choice can come from a small fixed pool
  - if UI choice is too much for v1, grant one random skill automatically

### Extra Attack Slots

- Player starts with a limited number of active attack slots
- After each main level, unlock 1 additional slot
- By the end of level 3, the player should feel noticeably stronger and more flexible

## Secret Level Gate

Use a single performance check for the first version:

- track `totalDamageDealt` across the tutorial run
- if `totalDamageDealt >= secretThreshold`, unlock the master trial

Baseline recommendation:

- keep the threshold low enough that a good run can reach it without grinding
- tune it after combat numbers exist

## Minimum Data the Code Should Track

The tutorial runtime should track:

- `currentLevelIndex`
- `levelsCleared`
- `unlockedSkills`
- `unlockedAttackSlots`
- `totalDamageDealt`
- `secretUnlocked`
- `tutorialComplete`
- `playerDead`

## Minimum Level Data Shape

Each tutorial level should define:

- `id`
- `name`
- `teachingGoal`
- `roomId`
- `enemySet`
- `reward`
- `completionText`

Example direction:

- `tutorial-melee-01`
- `tutorial-ranged-01`
- `tutorial-magic-01`
- `tutorial-master-01`

## Minimum Enemy Archetypes

### Spear Golem

- moves into mid range
- attacks in a forward thrust
- teaches movement and punish timing

### Bow Golem

- prefers distance
- fires simple projectiles
- teaches dodging and gap closing

### Staff Golem

- uses telegraphed magic attack
- punishes standing still
- teaches cast recognition and repositioning

### Master

- combines melee, ranged, and magic pressure
- should feel like an exam, not a long boss fight

## Baseline Implementation Order

### Phase 1: Playable Tutorial Skeleton

- tutorial state machine
- level sequence
- room start and room clear logic
- player death and full restart
- reward stub after each level

### Phase 2: Combat Teaching

- spear golem behavior
- bow projectile behavior
- staff cast behavior
- damage tracking for secret unlock

### Phase 3: Reward and Finish Flow

- random skill reward
- slot unlock reward
- secret level branch
- final summary screen

## Practical V1 Scope

To keep this implementable in the current repo, the first playable version should be:

- 3 rooms
- 3 enemy archetypes
- 1 optional master room
- auto-granted random reward after each main room
- simple text summary between rooms

Do not block v1 on:

- deep inventory UI
- large skill trees
- complex save/load
- multiple reward choices on screen
- advanced enemy coordination

## Open Design Questions

These still need decisions later:

- how many skills are in the random reward pool
- whether rewards are auto-granted or chosen by the player
- whether the master trial is one enemy or multiple enemies
- what the exact secret damage threshold should be
- whether block/dodge is part of the tutorial baseline or a later layer

