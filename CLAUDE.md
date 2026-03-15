# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn start          # Development mode with file watching + dev server on port 5000
yarn build          # Full production build (clean → lint → rollup)
yarn lint           # ESLint TypeScript linting
yarn clean          # Remove dist/
yarn rollup         # Production bundle only (no clean/lint)
```

There are no tests currently in this project.

## Sibling project

The Home Assistant integration that this card consumes lives at `../crop-planner-integration/custom_components/crop/`. Key files to cross-reference:

- `const.py` — `ChoreCategory` enum and phase/category constants
- `data.py` — `CropData` / `CropPhase` dataclasses (source of truth for entity attributes)
- `todo.py` — `CropTodoList` entity; todo entity ID is `todo.crop_chores`
- `crop.py` — `Crop` entity; state derives from nearest due chore or current lifecycle phase

## Architecture

This is a **Home Assistant Lovelace custom card** implemented as a Lit Web Component (`<crop-planner-card>`), distributed as a single-file ES module bundle.

**Source**: `src/crop-planner-card.ts` + `src/types.ts`
**Output**: `dist/crop-planner-card.js` (registered in HACS as `crop-planner-card.js`)

The card renders two sections inside a single `ha-card`: the crop grid on top and a todo/chore list below, separated by a divider.

### How it works

The card reads crop entities from Home Assistant's state dictionary — any entity whose domain starts with `crop.` is treated as a crop. HA injects the `hass` property automatically when the card is rendered on a dashboard.

Crop attributes (`CropAttributes` in `types.ts`) include `phases` (array of date-ranged lifecycle stages). `getCurrentPhase()` compares today's date against phase date ranges to determine the active phase, which drives the phase badge color and emoji.

### Key patterns

- **LitElement** with `@property()` for HA-injected `hass` and `@state()` for internal `_config`
- `setConfig()` is the standard HA card lifecycle method for receiving YAML config
- Static `getConfigElement()` / `getStubConfig()` are HA conventions for the visual card editor (not yet implemented)
- Custom element registration: `customElements.define('crop-planner-card', CropPlannerCard)`

### Build pipeline

- **Dev**: `rollup.config.dev.js` uses `esbuild` for fast transpilation + `rollup-plugin-serve` on port 5000 with CORS/no-cache headers (designed for use alongside a running HA instance)
- **Prod**: `rollup.config.js` uses `@rollup/plugin-typescript` (full type checking) + `@rollup/plugin-terser` for minification

### Code style

- Prettier: single quotes, 120 char width, trailing commas, 2-space indent
- ESLint: TypeScript strict mode; `_`-prefixed names allowed as unused; `console` usage warns
- Config files (`.config.js`) are excluded from linting
