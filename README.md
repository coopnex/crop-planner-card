# Crop Planner Card

A Lovelace card for the [Crop Planner](https://github.com/coopnex/crop-planner) Home Assistant integration.

Displays all your crops with their lifecycle phases, a harvest calendar, and a chore list.

## Installation

### HACS (recommended)

1. Add this repository to HACS as a custom Lovelace resource.
2. Install "Crop Planner Card".
3. Refresh your browser.

### Manual

Download `dist/crop-planner-card.js` and place it in your `/config/www/` directory. Add it as a Lovelace resource:

```yaml
resources:
  - url: /local/crop-planner-card.js
    type: module
```

## Usage

```yaml
type: custom:crop-planner-card
title: My Garden
```

## Options

| Option  | Type   | Default          | Description |
|---------|--------|------------------|-------------|
| `title` | string | `"Crop Planner"` | Card title  |

## Development

### Setup

```bash
yarn install
```

### Build

```bash
yarn build       # production bundle → dist/crop-planner-card.js
yarn start       # watch mode with dev server on http://localhost:5000
```

### Live development against Home Assistant

`yarn start` compiles on save and serves the bundle at:

```
http://localhost:5000/local/crop-planner-card.js
```

Add this URL as a Lovelace resource in your HA instance (Settings → Dashboards → Resources):

```yaml
resources:
  - url: http://localhost:5000/local/crop-planner-card.js
    type: module
```

The dev server includes `Cache-Control: no-cache` headers and CORS enabled, so HA will always fetch the latest build. After saving a source file, reload the browser tab to pick up the changes.

> **Note:** the dev build uses `esbuild` for fast transpilation without full type checking. Run `yarn build` before committing to catch any TypeScript errors.
