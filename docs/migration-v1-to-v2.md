# Migration: v1 Source to v2.0 Atlas Source

This guide covers the stable `v2.0` migration path.

If you are already on canonical `schema 2.0`, see [migration-v2-to-v2.1.md](./migration-v2-to-v2.1.md) for the backward-compatible Schema 2.1 upgrade path.

## What changed

- Canonical atlas source now starts with `schema 2.0`.
- `@worldorbit/core`, `@worldorbit/viewer`, and `@worldorbit/markdown` accept:
  - classic `1.0` source
  - canonical `2.0` atlas source
  - legacy `2.0-draft` source as a compatibility path
- Stable rendering still goes through the normalized `1.0` render document internally, but the authoring-facing atlas schema is now the primary structured source form.

## New primary APIs

- `upgradeDocumentToV2(document, options?)`
- `formatDocument(document, { schema: "2.0" })`
- `parseWorldOrbitAtlas(source)`
- `materializeAtlasDocument(atlasDocument)`
- `loadWorldOrbitSource(source)`
- `loadWorldOrbitSourceWithDiagnostics(source)`

Legacy compatibility APIs remain available:

- `upgradeDocumentToDraftV2(document, options?)`
- `formatDocument(document, { schema: "2.0-draft" })`
- `parseWorldOrbitDraft(source)`
- `materializeDraftDocument(draftDocument)`

## Typical migration flow

```ts
import {
  formatDocument,
  loadWorldOrbitSource,
  parse,
  upgradeDocumentToV2,
} from "@worldorbit/core";

const stable = parse(source);
const atlas = upgradeDocumentToV2(stable.document, {
  preset: "atlas-card",
});

const atlasSource = formatDocument(atlas, { schema: "2.0" });
const loaded = loadWorldOrbitSource(atlasSource);
```

`loaded.document` is the stable render document. `loaded.atlasDocument` preserves the structured `2.0` atlas document for tooling, embeds, and authoring workflows.

## Authoring differences

`1.0` source keeps atlas metadata in `system info`:

```worldorbit
system Iyath
  info
    viewpoint.naar.focus Naar
    annotation.naar-notes.body "Heimatwelt der Enari."
```

`2.0` moves that structure into explicit sections:

```worldorbit
schema 2.0

system Iyath

defaults
  view isometric
  scale presentation
  preset atlas-card

viewpoint naar
  label "Naar Close Orbit"
  focus Naar

annotation naar-notes
  label "Naar Notes"
  target Naar
  body "Heimatwelt der Enari."
```

Structured atlas source also uses `object <type> <id>` headers:

```worldorbit
object planet Naar
  orbit Iyath
  semiMajor 1.18au
  atmosphere nitrogen-oxygen
```

## Viewer and Markdown behavior

- `renderSourceToSvg(source)` accepts `2.0` directly.
- `createInteractiveViewer({ source })` accepts `2.0` directly.
- `createAtlasViewer({ source })` accepts `2.0` directly.
- `renderWorldOrbitBlock(source)` accepts `2.0` directly.
- `defaults preset ...` values flow into scene generation when no runtime preset override is supplied.

## Legacy draft compatibility

Legacy `schema 2.0-draft` files still load, but they now emit a deprecation diagnostic pointing to `schema 2.0`. That path is intended for migration, not new authoring.
