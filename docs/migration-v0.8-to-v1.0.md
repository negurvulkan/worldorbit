# Migration v0.8 to v1.0

## Package split

WorldOrbit no longer ships as one catch-all root package.

- Parser, schema, normalization, validation, formatting, scene generation:
  `@worldorbit/core`
- SVG rendering, themes, embeds, and interactive browser viewer:
  `@worldorbit/viewer`
- Remark/Rehype Markdown integration:
  `@worldorbit/markdown`

## Import changes

v0.8:

```ts
import {
  createInteractiveViewer,
  parse,
  renderDocumentToScene,
  renderSceneToSvg,
} from "../dist/index.js";
```

v1.0:

```ts
import { parse, renderDocumentToScene } from "@worldorbit/core";
import { createInteractiveViewer, renderSceneToSvg } from "@worldorbit/viewer";
```

## Document version

- Normalized documents now use `version: "1.0"` instead of `"0.1"`.
- This is a schema/document-model version bump, not just a package-release label.

## Renderer and viewer changes

- `renderDocumentToScene(...)` stays available, now from `@worldorbit/core`
- `renderSceneToSvg(...)` moved to `@worldorbit/viewer`
- `renderDocumentToSvg(...)` and `renderSourceToSvg(...)` now live in `@worldorbit/viewer`
- Interactive embed helpers are new in `@worldorbit/viewer`:
  - `createWorldOrbitEmbedMarkup(...)`
  - `mountWorldOrbitEmbeds(...)`

## Markdown integration

New in v1.0:

- `remarkWorldOrbit(...)`
- `rehypeWorldOrbit(...)`
- `renderWorldOrbitBlock(...)`

These can emit:

- static inline SVG
- interactive embed containers with serialized scene payloads for hydration

## Object textures

v1.0 adds an `image` field for textured object rendering in SVG, the interactive viewer, and Markdown embeds.

- supported on `star`, `planet`, `moon`, `asteroid`, `comet`, `structure`, and `phenomenon`
- rejected on `system`, `belt`, and `ring`
- accepts relative paths, root-relative paths, and `http:` / `https:` URLs
- rejects unsupported schemes such as `javascript:`, `data:`, and `file:`

Image URLs are emitted unchanged into SVG and embed payloads. Relative paths resolve in the browser against the hosting page URL.

## Validation tightening

v1.0 rejects more invalid input than v0.8, especially around:

- field compatibility by object type
- unit families by field
- malformed special positions such as `L8`
- invalid anchor and surface references
