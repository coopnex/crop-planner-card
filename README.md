# Crop Planner Card

A Lovelace card for the [Crop Planner](https://github.com/your-org/crop-planner-integration) Home Assistant integration.

Displays all your crops in a responsive grid with images, species, quantity, and current lifecycle phase.

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
show_images: true
```

## Options

| Option        | Type    | Default   | Description                          |
| ------------- | ------- | --------- | ------------------------------------ |
| `title`       | string  | `"Crops"` | Card title                           |
| `show_images` | boolean | `true`    | Show crop images / phase placeholder |

## Development

```bash
npm install
npm run build   # produces dist/crop-planner-card.js
npm run dev     # watch mode
```
