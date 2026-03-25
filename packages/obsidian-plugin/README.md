# WorldOrbit for Obsidian

Render fictional star systems from fenced `worldorbit` code blocks directly inside Obsidian.

WorldOrbit is a text-first DSL for orbital worldbuilding. This plugin turns `worldorbit` blocks into rendered diagrams in Reading View and Live Preview, with optional 2D interaction, diagnostics, help, and example insertion.

## Features

- Render `worldorbit` fenced code blocks in notes
- Lazy-load previews when blocks become visible
- Keep embedded diagrams locked by default for safer scrolling
- Activate 2D pan/zoom only when needed
- Open diagrams in a fullscreen modal
- Show parse and normalization diagnostics inline
- Jump from diagnostics to the relevant editor position
- Insert a ready-made Solar System example from the command palette

## Quick Start

Paste this into any note:

```worldorbit
schema 2.5

system Sol

object star Sun

object planet Earth
  orbit Sun
  semiMajor 1au
```

Open Reading View or Live Preview and the diagram should render automatically.

## Example

```worldorbit
schema 2.5

system Sol
  title "Solar System"
  referencePlane ecliptic

defaults
  view orthographic
  preset atlas-card

group inner-system
  label "Inner System"

object star Sun
  mass 1sol

object planet Mercury
  orbit Sun
  semiMajor 0.39au
  color #b7b1a7
  groups inner-system

object planet Venus
  orbit Sun
  semiMajor 0.72au
  color #d9b37a
  groups inner-system

object planet Earth
  orbit Sun
  semiMajor 1au
  color #6fa8ff
  atmosphere nitrogen-oxygen
  groups inner-system

object moon Luna
  orbit Earth
  distance 384400km
```

## Syntax Basics

Common DSL building blocks:

- `object star Sun`
- `object planet Earth`
- `object moon Luna`
- `orbit Sun`
- `semiMajor 1au`
- `distance 384400km`
- `radius 1re`
- `mass 1me`
- `color #6fa8ff`
- `kind relay`
- `atmosphere nitrogen-oxygen`

WorldOrbit is designed for fictional systems, not strict astrophysical simulation.

## Commands

The plugin adds this command:

- `WorldOrbit: Insert Solar System Example`

Use it from the command palette to insert a complete starter block at the current cursor position.

## Settings

### Embedded interaction

- `Locked by default`: diagrams render as static previews first. Users must click `Activate interaction` before panning or zooming. This is the recommended mode for long notes and mobile use.
- `Interactive by default`: rendered blocks start with 2D interaction enabled immediately.

### Show validator diagnostics

Shows diagnostics produced by the validation phase under rendered blocks. These are hidden by default to keep notes cleaner.

### Show fullscreen button

Adds a toolbar action that opens the current diagram in a larger modal view.

## In-Note Help

- Empty `worldorbit` blocks show a quick-start hint
- The toolbar includes a help button
- Diagnostic entries can link back to the matching editor position

## Installation

### Community Plugin Build

Copy these files into your vault at:

`.obsidian/plugins/worldorbit/`

Required files:

- `main.js`
- `manifest.json`
- `styles.css`

The built plugin artifacts are emitted to:

- [`dist/obsidian-plugin/main.js`](/H:/Projekte/worldorbit/dist/obsidian-plugin/main.js)
- [`dist/obsidian-plugin/manifest.json`](/H:/Projekte/worldorbit/dist/obsidian-plugin/manifest.json)
- [`dist/obsidian-plugin/styles.css`](/H:/Projekte/worldorbit/dist/obsidian-plugin/styles.css)

### Development

Build from the repository root:

```bash
npm run build
```

Run the full test suite:

```bash
npm test
```

## Notes

- The plugin is optimized for a single-file Obsidian bundle
- The Obsidian integration uses a slim 2D viewer path and excludes 3D runtime code
- Rendering is delayed until blocks become visible to keep notes responsive

## License

MIT
