# WorldOrbit

WorldOrbit is a text-first DSL, viewer, and optional editor platform for fictional orbital systems.

It is designed as a specialized Mermaid-like alternative for worldbuilding: you can describe stellar systems in plain text, embed them in Markdown, render them as static diagrams, or explore them interactively with pan, rotate, zoom, and object tooltips.

WorldOrbit is built for:

- worldbuilding projects
- Markdown-based lore repositories and CMS setups
- fictional atlases and codices
- interactive setting documentation
- browser-based orbital diagram tooling

## Why WorldOrbit?

Generic diagram tools can show relationships, but they are not built for fictional orbital systems.

WorldOrbit is designed specifically for:

- stars, planets, moons, belts, structures, and phenomena
- orbit-aware layouts instead of generic node graphs
- Markdown-native embedding
- optional interactivity
- optional visual authoring through Studio

WorldOrbit is not intended to be a real-world astronomy simulator or a high-precision astrophysics engine. Its goal is clear, expressive orbital worldbuilding that works well in content workflows.

## Quick Example

```worldorbit
schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  scale presentation
  preset atlas-card
  theme atlas

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  atmosphere nitrogen-oxygen
````

## Installation

### npm

```bash
npm install worldorbit
```

### What the `worldorbit` package contains

The published `worldorbit` package is the public entry point.

It includes:

* the browser bundles
* subpath exports for core modules
* the packages used by the viewer, Markdown integration, and editor tooling

So for most users, this is enough:

```bash
npm install worldorbit
```

And then:

```ts
import { parse, loadWorldOrbitSource } from "worldorbit";
import * as Viewer from "worldorbit/viewer";
```

## Browser / CDN Quick Setup

For direct browser usage, use the browser bundle:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://unpkg.com/worldorbit@2.5.4/dist/unpkg/worldorbit.min.js"></script>
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
      }

      #view {
        width: 100vw;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="view"></div>

    <script>
      const source = `
schema 2.0

system Iyath

object star Iyath
object planet Naar
  orbit Iyath
  semiMajor 1.18au
`.trim();

      const loaded = WorldOrbit.loadWorldOrbitSource(source);

      WorldOrbit.createInteractiveViewer(document.getElementById("view"), {
        document: loaded.document
      });
    </script>
  </body>
</html>
```

For browser usage, `worldorbit.min.js` is the recommended public entry point.

## Static and Interactive Rendering

WorldOrbit can be used in different ways from the same source:

* as a static diagram
* as an interactive SVG viewer
* inside Markdown pipelines
* inside the optional Studio editor

This means the same WorldOrbit document can be:

* written in plain text
* embedded in Markdown
* rendered in a documentation page
* explored interactively
* edited visually if needed

## Studio Editor

WorldOrbit includes an optional Studio editor for easier authoring and exploration.

Studio is useful when you want:

* visual placement editing
* source and preview side by side
* inspector-based editing
* faster onboarding for non-technical users

The editor is optional. The core format remains text-first.

## Canonical Schema

The stable schema starts with:

```worldorbit
schema 2.0
```

Example:

```worldorbit
schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  scale presentation
  preset atlas-card
  theme atlas

viewpoint overview
  label "Atlas Overview"
  summary "Fit the whole system."
  projection isometric

annotation naar-notes
  label "Naar Notes"
  target Naar
  body "Heimatwelt der Enari."

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  image /demo/assets/naar-map.png
  atmosphere nitrogen-oxygen
```

Stable `1.0` source is still accepted, and legacy `schema 2.0-draft` files remain readable as a compatibility path with a deprecation diagnostic.

## Basic Usage

### Parse and load source

```ts
import {
  loadWorldOrbitSource,
  parse,
} from "worldorbit";

const parsed = parse(`
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
`.trim());

const loaded = loadWorldOrbitSource(`
schema 2.0

system Iyath
object star Iyath
object planet Naar
  orbit Iyath
  semiMajor 1.18au
`.trim());
```

### Render a scene

```ts
import {
  loadWorldOrbitSource,
  renderDocumentToScene,
} from "worldorbit";

const loaded = loadWorldOrbitSource(source);

const scene = renderDocumentToScene(loaded.document, {
  projection: "isometric",
  scaleModel: {
    orbitDistanceMultiplier: 1.1,
    bodyRadiusMultiplier: 1.15,
  },
});
```

### Create an interactive viewer

```ts
import { loadWorldOrbitSource } from "worldorbit";
import { createInteractiveViewer } from "worldorbit/viewer";

const loaded = loadWorldOrbitSource(source);

createInteractiveViewer(document.getElementById("preview"), {
  document: loaded.document,
  projection: "isometric",
  theme: "atlas",
});
```

## Package Overview

WorldOrbit is organized internally as a small ecosystem.

### `worldorbit`

Public package entry point with browser bundles and main exports.

### `worldorbit/core`

Use this when you need:

* parsing
* normalization
* validation
* diagnostics
* schema loading
* canonical formatting
* scene generation

### `worldorbit/viewer`

Use this when you need:

* static SVG rendering
* interactive viewing
* atlas-style exploration
* themes and embeds

### `worldorbit/markdown`

Use this when you want to transform fenced `worldorbit` blocks inside Markdown pipelines.

### `worldorbit/editor`

Use this when you want browser-based visual authoring on top of the text format.

## Core Example

```ts
import {
  formatDocument,
  loadWorldOrbitSource,
  parse,
  parseWorldOrbitAtlas,
  renderDocumentToScene,
  upgradeDocumentToV2,
} from "worldorbit/core";

const stable = parse(`
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
`.trim());

const atlasDocument = upgradeDocumentToV2(stable.document, {
  preset: "atlas-card",
});

const atlasSource = formatDocument(atlasDocument, { schema: "2.0" });
const loaded = loadWorldOrbitSource(atlasSource);
const parsedAtlas = parseWorldOrbitAtlas(atlasSource);
const scene = renderDocumentToScene(loaded.document, {
  projection: "isometric",
  scaleModel: {
    orbitDistanceMultiplier: 1.1,
    bodyRadiusMultiplier: 1.15,
  },
});
```

## Viewer Capabilities

Viewer features in `v2.5` include:

* scene-based SVG rendering
* projections: `topdown` and `isometric`
* theme presets: `atlas`, `nightglass`, `ember`
* layer controls for background, guides, orbits, objects, labels, and metadata
* selection, hover, focus, fit, pan, zoom, and rotate
* tooltip cards and object detail payloads
* viewpoints, filters, search, and bookmark capture
* deep-linkable atlas state
* embeddable viewer custom elements

## Markdown Integration

Use `worldorbit/markdown` to transform fenced `worldorbit` blocks into static or interactive output.

```ts
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { remarkWorldOrbit } from "worldorbit/markdown";

const html = String(
  await unified()
    .use(remarkParse)
    .use(remarkWorldOrbit, { mode: "interactive" })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdownSource),
);
```

In the browser:

```ts
import { mountWorldOrbitEmbeds } from "worldorbit/viewer";

mountWorldOrbitEmbeds(document, {
  mode: "interactive",
});
```

## Examples

Examples live in:

* [examples/minimal.worldorbit](./examples/minimal.worldorbit)
* [examples/iyath.worldorbit](./examples/iyath.worldorbit)
* [examples/iyath.schema2.worldorbit](./examples/iyath.schema2.worldorbit)
* [examples/iyath.schema2-draft.worldorbit](./examples/iyath.schema2-draft.worldorbit)
* [examples/markdown/static.md](./examples/markdown/static.md)
* [examples/markdown/interactive.md](./examples/markdown/interactive.md)
* [examples/markdown/build.mjs](./examples/markdown/build.mjs)

Browser-facing examples and demos live in the repository under `demo/`, `studio/`, and `examples/`.

## Documentation

* [migration guide: v0.8 to v1.0](./docs/migration-v0.8-to-v1.0.md)
* [migration guide: v1 to v2](./docs/migration-v1-to-v2.md)
* [API inventory](./docs/api-inventory.md)
* [changelog](./docs/changelog.md)

## Development

```bash
npm install
npm run build
npm test
```

The workspace builds outputs into package-specific distribution folders and browser bundles.

Useful notes:

* `npm run build` compiles all packages and refreshes local package shims
* `npm test` rebuilds first, then runs the regression suite
* the repository remains parser-first: rendering and atlas interaction stay downstream of parse, normalize, and validate

## Project Direction

WorldOrbit is intended as a specialized Mermaid-like solution for fictional orbital systems.

The long-term focus is:

* strong text-first authoring
* clean Markdown embedding
* rich static and interactive rendering
* optional visual editing
* stable schema evolution over time

## License

MIT