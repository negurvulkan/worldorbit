# WorldOrbit

WorldOrbit is a text-first DSL, atlas viewer, and editor platform for fictional orbital systems.

`v2.4` keeps the stable atlas-oriented schema while adding rich tooltip UX, a first editor package, and the new Studio reference app:

- `@worldorbit/core`: parsing, normalization, validation, canonical formatting, diagnostics, schema loading, and scene generation
- `@worldorbit/viewer`: SVG rendering, low-level interactive viewing, high-level atlas viewing, themes, embeds, and custom elements
- `@worldorbit/markdown`: Remark/Rehype integration for static or interactive WorldOrbit blocks
- `@worldorbit/editor`: canvas-first atlas editing with inspector, live source, preview, undo/redo, and direct handles for `orbit`, `at`, `surface`, and `free` placements

## Quick Start

```bash
npm install
npm run build
npm test
```

The workspace builds package outputs into:

- `packages/core/dist`
- `packages/viewer/dist`
- `packages/markdown/dist`
- `packages/editor/dist`

The build also refreshes local package shims in `node_modules/@worldorbit/...` for package-style development imports.

## Stable v2 Schema

The canonical atlas schema now starts with `schema 2.0`:

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

## @worldorbit/core

Use `core` when you need language tooling, schema conversion, diagnostics, or scene generation.

```ts
import {
  formatDocument,
  loadWorldOrbitSource,
  parse,
  parseWorldOrbitAtlas,
  renderDocumentToScene,
  upgradeDocumentToV2,
} from "@worldorbit/core";

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

Core exports include:

- `parse(source)`
- `parseSafe(source)`
- `parseWithDiagnostics(source)`
- `parseWorldOrbit(source)`
- `parseWorldOrbitAtlas(source)`
- `parseWorldOrbitDraft(source)` for legacy compatibility
- `normalizeDocument(ast)`
- `normalizeWithDiagnostics(ast)`
- `validateDocument(document)`
- `validateDocumentWithDiagnostics(document)`
- `renderDocumentToScene(document, options?)`
- `formatDocument(document, options?)`
- `formatAtlasDocument(document)`
- `formatDraftDocument(document)` for legacy compatibility
- `upgradeDocumentToV2(document, options?)`
- `upgradeDocumentToDraftV2(document, options?)` for legacy compatibility
- `materializeAtlasDocument(document)`
- `materializeDraftDocument(document)` for legacy compatibility
- `detectWorldOrbitSchemaVersion(source)`
- `loadWorldOrbitSource(source)`
- `loadWorldOrbitSourceWithDiagnostics(source)`
- `load(source)`
- `extractWorldOrbitBlocks(markdown)`

### Diagnostics and loading

Use `loadWorldOrbitSource(...)` whenever the input may be `1.0`, `2.0`, or legacy `2.0-draft`.

```ts
import { loadWorldOrbitSourceWithDiagnostics } from "@worldorbit/core";

const loaded = loadWorldOrbitSourceWithDiagnostics(source);
if (!loaded.ok) {
  console.error(loaded.diagnostics);
}
```

Loaded results expose:

- `schemaVersion`: detected source schema
- `document`: stable render document
- `atlasDocument`: canonical `2.0` atlas document when applicable
- `draftDocument`: canonical or legacy atlas document for compatibility-sensitive tooling
- `diagnostics`: structured warnings and migration hints

## @worldorbit/viewer

Use `viewer` for SVG output, atlas navigation, embeds, and browser interactivity.

```ts
import { loadWorldOrbitSource } from "@worldorbit/core";
import {
  createAtlasViewer,
  createInteractiveViewer,
  renderSceneToSvg,
} from "@worldorbit/viewer";

const loaded = loadWorldOrbitSource(source);
const scene = renderDocumentToScene(loaded.document, {
  projection: "isometric",
});

const svg = renderSceneToSvg(scene, {
  theme: "atlas",
  preset: "atlas-card",
});

const viewer = createInteractiveViewer(document.getElementById("preview"), {
  document: loaded.document,
  projection: "isometric",
  theme: "atlas",
});

const atlasViewer = createAtlasViewer(document.getElementById("atlas"), {
  source,
  theme: "atlas",
});
```

Viewer capabilities in `v2.4`:

- scene-based SVG rendering
- theme presets: `atlas`, `nightglass`, `ember`
- layer controls for background, guides, orbits, objects, labels, and metadata
- projections: `topdown` and `isometric`
- numeric scale overrides via `RenderScaleModel`
- render presets: `diagram`, `presentation`, `atlas-card`, `markdown`
- object textures through `image`
- selection, hover, focus, fit, pan, zoom, and rotate
- rich tooltip cards with pin/unpin support and shared object-detail payloads
- scene viewpoints, filters, search, and bookmark capture
- serialized atlas state for deep links and embeds
- high-level `createAtlasViewer(...)` with built-in search, type filters, viewpoints, bookmarks, and inspector output
- `defineWorldOrbitViewerElement(...)` with `mode="static" | "interactive" | "atlas"`

## @worldorbit/editor

Use `editor` when you want a browser-based authoring surface that still roundtrips to canonical `schema 2.0`.

```ts
import { createWorldOrbitEditor } from "@worldorbit/editor";

const editor = createWorldOrbitEditor(document.getElementById("studio"), {
  source,
  showInspector: true,
  showTextPane: true,
  showPreview: true,
});
```

Editor capabilities in `v2.4`:

- atlas outline for system/defaults/metadata/viewpoints/annotations/objects
- shared interactive stage built on `createInteractiveViewer(...)`
- live inspector editing for atlas defaults, viewpoints, annotations, and object properties
- live source synchronization with canonical `schema 2.0` formatting
- diagnostics panel plus undo/redo history
- static SVG and interactive embed preview
- first orbit editing handles for phase and orbital scale

### Atlas viewer

`createInteractiveViewer(...)` remains the low-level primitive. `createAtlasViewer(...)` is the stable high-level surface for atlas exploration.

The atlas viewer adds:

- search box
- type filter
- viewpoint selector
- bookmark capture/apply
- inspector snapshot
- access to the wrapped low-level viewer through `getViewer()`

## @worldorbit/markdown

Use `markdown` to transform fenced `worldorbit` blocks into static or hydrated atlas output.

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

In the browser:

```ts
import { mountWorldOrbitEmbeds } from "@worldorbit/viewer";

mountWorldOrbitEmbeds(document, {
  mode: "interactive",
});
```

Markdown embeds honor document defaults from `defaults`, including projection, scale preset, and render preset.

## Examples

Examples live in:

- [examples/minimal.worldorbit](/H:/Projekte/worldorbit/examples/minimal.worldorbit)
- [examples/iyath.worldorbit](/H:/Projekte/worldorbit/examples/iyath.worldorbit)
- [examples/iyath.schema2.worldorbit](/H:/Projekte/worldorbit/examples/iyath.schema2.worldorbit)
- [examples/iyath.schema2-draft.worldorbit](/H:/Projekte/worldorbit/examples/iyath.schema2-draft.worldorbit)
- [examples/markdown/static.md](/H:/Projekte/worldorbit/examples/markdown/static.md)
- [examples/markdown/interactive.md](/H:/Projekte/worldorbit/examples/markdown/interactive.md)
- [examples/markdown/build.mjs](/H:/Projekte/worldorbit/examples/markdown/build.mjs)

The browser demo is available at [demo/index.html](/H:/Projekte/worldorbit/demo/index.html). It now defaults to canonical `schema 2.0` atlas source while continuing to accept stable `1.0` and legacy `2.0-draft` input. The editor reference app is available at [studio/index.html](/H:/Projekte/worldorbit/studio/index.html).

Serve the repository root and open:

```text
http://localhost:8022/demo/
```

```text
http://localhost:8022/studio/
```

## Documentation

- migration guide: [docs/migration-v0.8-to-v1.0.md](/H:/Projekte/worldorbit/docs/migration-v0.8-to-v1.0.md)
- v2 migration guide: [docs/migration-v1-to-v2.md](/H:/Projekte/worldorbit/docs/migration-v1-to-v2.md)
- API inventory: [docs/api-inventory.md](/H:/Projekte/worldorbit/docs/api-inventory.md)
- changelog: [docs/changelog.md](/H:/Projekte/worldorbit/docs/changelog.md)

## Development Notes

- `npm run build` compiles all packages and refreshes local package shims
- `npm test` rebuilds first, then runs the Node and jsdom-based regression suite
- the repository remains parser-first: rendering and atlas interaction stay downstream of parse, normalize, and validate
