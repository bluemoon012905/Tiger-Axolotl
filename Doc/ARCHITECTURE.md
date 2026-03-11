# Factory + Decoder Setup

## Recommended Shape

For this project, keep a clean split:

1. `data/`
   - Static JSON definitions checked into the repo.
   - Examples: player templates, enemy archetypes, room layouts, item definitions.

2. `src/decoders/`
   - Read raw JSON and validate its shape.
   - Output trusted definitions for the game runtime.
   - Decoders should not mutate global state or build live objects.

3. `src/runtime/`
   - Factories turn decoded definitions into runtime entities.
   - Runtime code owns mutable state such as current HP, position, cooldowns, and status effects.

4. `src/main.js`
   - Boot sequence.
   - Load JSON, decode it, pass it into factories, then hand entities to gameplay systems/renderers.

## Why This Works Well

This keeps content authoring separate from game behavior:

- Designers can edit JSON without touching runtime code.
- Invalid data fails early inside decoders instead of breaking random gameplay code later.
- Runtime entities stay free to mutate because the source definitions remain static.

## Static Hosting

This pattern works fine on static hosting like GitHub Pages because:

- JSON files are served as normal static assets.
- The browser can `fetch()` them at runtime.
- All gameplay logic stays client-side in JavaScript.

Typical static flow:

1. Browser loads `index.html`
2. `src/main.js` loads JSON from `data/`
3. Decoders validate the definitions
4. Factories build runtime entities
5. Systems update and render those entities

## Python

Python is fine for local development and offline tooling, for example:

- running a local static server
- converting spreadsheets into JSON
- validating or generating content files
- asset pipeline scripts

Python is not part of the deployed runtime on normal static hosting. GitHub Pages will not run a Python backend for gameplay. For deployed static hosting, the browser only receives built files such as HTML, CSS, JS, JSON, and images.

## Practical Rule

Use Python if it helps you build content or run local tools. Do not depend on Python being available after deployment unless you move off static hosting and add a real backend/server platform.
