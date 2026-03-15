# WorldOrbit

WorldOrbit is a text-first DSL and rendering pipeline for fictional orbital systems.

The current `v1.x` line includes projection-aware scene generation, numeric scale control, object textures, richer 2D rendering, atlas-oriented viewer features, and direct dual-source support for stable `1.0` plus draft `2.0-draft` authoring files.

- `@worldorbit/core`: parser, schema, normalization, validation, formatting, and scene generation
- `@worldorbit/viewer`: SVG rendering, interactive browser viewer, themes, and embed helpers
- `@worldorbit/markdown`: Remark/Rehype integration for static or interactive Markdown embeds

The `core` package is the stable contract for the `v1` line. `viewer` and `markdown` are released as documented preview APIs inside `v1.x`, with migration notes when they evolve.

## Quick Start

```bash
npm install
npm run build
npm test
```

The root workspace builds all packages into:

- `packages/core/dist`
- `packages/viewer/dist`
- `packages/markdown/dist`

For local package-style imports during development, the build also writes lightweight package shims into `node_modules/@worldorbit/...`.

## Package Overview

### @worldorbit/core

Use `core` when you need the language and model layer only.

```ts
import {
  formatDocument,
  loadWorldOrbitSource,
  parse,
  renderDocumentToScene,
} from "@worldorbit/core";

const source = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
`.trim();

const result = parse(source);
const loaded = loadWorldOrbitSource(source);
const scene = renderDocumentToScene(result.document, {
  projection: "isometric",
  scaleModel: {
    orbitDistanceMultiplier: 1.1,
    bodyRadiusMultiplier: 1.15,
  },
});
const canonical = formatDocument(result.document);
```

Core exports include:

- `parse(source)`
- `parseSafe(source)`
- `parseWithDiagnostics(source)`
- `parseWorldOrbit(source)`
- `normalizeDocument(ast)`
- `normalizeWithDiagnostics(ast)`
- `validateDocument(document)`
- `validateDocumentWithDiagnostics(document)`
- `renderDocumentToScene(document, options?)`
- `formatDocument(document)`
- `formatDraftDocument(document)`
- `upgradeDocumentToDraftV2(document, options?)`
- `materializeDraftDocument(document)`
- `parseWorldOrbitDraft(source)`
- `detectWorldOrbitSchemaVersion(source)`
- `loadWorldOrbitSource(source)`
- `loadWorldOrbitSourceWithDiagnostics(source)`
- `extractWorldOrbitBlocks(markdown)`

#### Schema 2 Draft

`v1.9` keeps the stable `1.0` model as the render contract, but `core`, `viewer`, and `markdown` can now read `2.0-draft` source directly. The draft schema remains the richer authoring shape for atlas defaults, viewpoints, and annotations:

```ts
import {
  formatDocument,
  loadWorldOrbitSource,
  materializeDraftDocument,
  parse,
  parseWorldOrbitDraft,
  upgradeDocumentToDraftV2,
} from "@worldorbit/core";

const result = parse(source);
const draft = upgradeDocumentToDraftV2(result.document, {
  preset: "atlas-card",
});

const draftSource = formatDocument(draft);
const loaded = loadWorldOrbitSource(draftSource);
const parsedDraft = parseWorldOrbitDraft(draftSource);
const stableDocument = materializeDraftDocument(parsedDraft);
```

The draft model currently organizes:

- `defaults` for projection, scale, units, preset, and theme
- structured `viewpoints`
- structured `annotations`
- preserved atlas metadata carried forward from `system info`

When a `2.0-draft` source is loaded directly, WorldOrbit materializes it back into the stable `1.0` render document internally. That keeps the parser/model boundary intact while letting viewers, Markdown embeds, and SVG output accept draft source strings without a separate conversion step.

Diagnostics are also available without relying only on thrown errors:

```ts
import { parseWithDiagnostics } from "@worldorbit/core";

const parsed = parseWithDiagnostics(source);
if (!parsed.ok) {
  console.log(parsed.diagnostics);
}
```

### @worldorbit/viewer

Use `viewer` for SVG output, themes, embeds, and browser-side interactivity.

```ts
import { parse, renderDocumentToScene } from "@worldorbit/core";
import {
  createInteractiveViewer,
  renderSceneToSvg,
} from "@worldorbit/viewer";

const result = parse(source);
const scene = renderDocumentToScene(result.document, {
  projection: "isometric",
});
const svg = renderSceneToSvg(scene, {
  theme: "atlas",
});

const viewer = createInteractiveViewer(document.getElementById("preview"), {
  document: result.document,
  projection: "isometric",
  theme: "atlas",
});
```

Viewer features in the current `v1.x` line:

- scene-based SVG rendering
- theme presets: `atlas`, `nightglass`, `ember`
- layer controls for guides, orbits, labels, structures, and metadata
- interactive camera controls: zoom, pan, rotate, fit, reset, focus
- selection and hover callbacks
- projection-aware topdown and isometric scenes
- live render overrides for `projection` and `scaleModel`
- render presets: `diagram`, `presentation`, `atlas-card`, `markdown`
- ellipse and split-arc orbit rendering with projected ring and belt bands
- scene-provided labels, groups, and stable layer ordering for atlas-style rendering
- viewer details hooks and selection/hover chains for parent and orbit context
- named scene viewpoints plus viewer-side viewpoint activation
- atlas search, object filtering, focus paths, and serializable deep-link state
- optional minimap overlays and bookmark capture/apply helpers
- hydration helpers:
  - `createWorldOrbitEmbedMarkup(...)`
  - `mountWorldOrbitEmbeds(...)`

#### Atlas navigation

`v1.7` extends the viewer stack from atlas-ready rendering into atlas-ready navigation:

- scene generation exposes named `viewpoints`
- viewers can switch viewpoints, search, filter, and serialize current atlas state
- embeds can hydrate with an initial viewpoint, selection, filter, or a full saved atlas state

Document-defined viewpoints are currently authored through `system info` entries such as:

```worldorbit
system Iyath
  info
    viewpoint.overview.label "Atlas Overview"
    viewpoint.naar.focus Naar
    viewpoint.naar.zoom 2.2
    viewpoint.naar.layers background orbits objects labels metadata -guides
```

In the browser, the current atlas state can be round-tripped with:

```ts
const snapshot = viewer.serializeAtlasState();
viewer.setAtlasState(snapshot);
```

#### Projection and scale

WorldOrbit renderers now accept document defaults plus runtime overrides for projection and numeric scale:

```ts
const scene = renderDocumentToScene(document, {
  projection: "isometric",
  scaleModel: {
    orbitDistanceMultiplier: 1.15,
    bodyRadiusMultiplier: 1.1,
    labelMultiplier: 1.05,
  },
});
```

Supported projections:

- `topdown`
- `isometric`

Document `system view` and `system scale` remain the defaults, while SVG, viewer, and Markdown calls can override them per render.

Renderers and embeds also accept named presets:

- `diagram`
- `presentation`
- `atlas-card`
- `markdown`

#### Object textures

WorldOrbit objects can now declare an `image` field for PNG-style body textures:

```worldorbit
planet Naar
  image assets/naar-map.png
  orbit Iyath
  distance 1.18au
```

Texture support is available on:

- `star`
- `planet`
- `moon`
- `asteroid`
- `comet`
- `structure`
- `phenomenon`

`belt`, `ring`, and `system` intentionally reject `image`.

Accepted image source forms:

- relative paths like `assets/naar-map.png`
- root-relative paths like `/demo/assets/naar-map.png`
- absolute `http:` and `https:` URLs

Unsupported schemes such as `javascript:`, `data:`, and `file:` are rejected during normalization.

Image paths are passed through unchanged. Relative and root-relative paths resolve against the hosting HTML page URL, not against the `.worldorbit` source file path. If an image cannot be loaded, the renderer keeps the normal SVG body fill and outline as a fallback.

### @worldorbit/markdown

Use `markdown` to turn fenced `worldorbit` blocks into static or interactive output.

```ts
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { remarkWorldOrbit } from "@worldorbit/markdown";

const html = String(
  await unified()
    .use(remarkParse)
    .use(remarkWorldOrbit, { mode: "interactive" })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdownSource),
);
```

Markdown output modes:

- `static`: inline SVG
- `interactive`: serialized scene payload plus hydration target

Markdown embeds automatically honor document `view` / `scale` defaults. Draft `defaults preset ...` values also flow through into the resolved scene when no runtime preset override is supplied.

In the browser, hydrate generated interactive embeds with:

```ts
import { mountWorldOrbitEmbeds } from "@worldorbit/viewer";

mountWorldOrbitEmbeds(document, {
  mode: "interactive",
});
```

## DSL Scope

Supported object types:

- `system`
- `star`
- `planet`
- `moon`
- `belt`
- `asteroid`
- `comet`
- `ring`
- `structure`
- `phenomenon`

Supported placement modes:

- `orbit`
- `at`
- `surface`
- `free`

## v1.0 Model Changes

- normalized documents now use `version: "1.0"`
- field parsing is schema-driven rather than based on a loose known-key list
- validation now checks:
  - field compatibility by object type
  - unit-family compatibility by field
  - invalid surface targets
  - invalid anchor references
  - malformed special positions such as `L8`

## Examples

WorldOrbit examples live in:

- [examples/minimal.worldorbit](/H:/Projekte/worldorbit/examples/minimal.worldorbit)
- [examples/iyath.worldorbit](/H:/Projekte/worldorbit/examples/iyath.worldorbit)
- [examples/iyath.schema2-draft.worldorbit](/H:/Projekte/worldorbit/examples/iyath.schema2-draft.worldorbit)
- [examples/markdown/static.md](/H:/Projekte/worldorbit/examples/markdown/static.md)
- [examples/markdown/interactive.md](/H:/Projekte/worldorbit/examples/markdown/interactive.md)
- [examples/markdown/build.mjs](/H:/Projekte/worldorbit/examples/markdown/build.mjs)

The browser demo is available at [demo/index.html](/H:/Projekte/worldorbit/demo/index.html).

The demo includes an in-page `importmap`, so the browser can resolve
`@worldorbit/core`, `@worldorbit/viewer`, and `@worldorbit/markdown`
directly from the built package outputs without a bundler.

Serve the repository root with a simple static server and open:

```text
http://localhost:8022/demo/
```

## Documentation

- migration guide: [docs/migration-v0.8-to-v1.0.md](/H:/Projekte/worldorbit/docs/migration-v0.8-to-v1.0.md)
- draft migration guide: [docs/migration-v1-to-v2-draft.md](/H:/Projekte/worldorbit/docs/migration-v1-to-v2-draft.md)
- API inventory: [docs/api-inventory.md](/H:/Projekte/worldorbit/docs/api-inventory.md)
- changelog: [docs/changelog.md](/H:/Projekte/worldorbit/docs/changelog.md)

## Development Notes

- `npm run build` compiles all packages and refreshes local package shims
- `npm test` rebuilds first, then runs the Node and jsdom-based test suite
- the repository still favors a parser-first architecture: rendering sits downstream of parse, normalize, and validate
