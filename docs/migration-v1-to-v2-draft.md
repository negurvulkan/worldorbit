# Migration: v1 Source to 2.0-draft

This guide covers the `v1.9` draft-authoring workflow.

## What changed

- Stable normalized render documents remain on `version: "1.0"`.
- The richer authoring schema is `version: "2.0-draft"`.
- `@worldorbit/core`, `@worldorbit/viewer`, and `@worldorbit/markdown` now accept both:
  - classic `1.0` source
  - `2.0-draft` source beginning with `schema 2.0-draft`

## New core APIs

- `upgradeDocumentToDraftV2(document, options?)`
- `formatDocument(document, { schema: "2.0-draft" })`
- `parseWorldOrbitDraft(source)`
- `materializeDraftDocument(draftDocument)`
- `loadWorldOrbitSource(source)`
- `loadWorldOrbitSourceWithDiagnostics(source)`

## Typical migration flow

```ts
import {
  formatDocument,
  loadWorldOrbitSource,
  parse,
  upgradeDocumentToDraftV2,
} from "@worldorbit/core";

const stable = parse(source);
const draft = upgradeDocumentToDraftV2(stable.document, {
  preset: "atlas-card",
});

const draftSource = formatDocument(draft, { schema: "2.0-draft" });
const loaded = loadWorldOrbitSource(draftSource);
```

`loaded.document` is the stable render document. `loaded.draftDocument` preserves the structured draft sections for tooling or authoring flows.

## Authoring differences

`1.0` source keeps atlas metadata in `system info`:

```worldorbit
system Iyath
  info
    viewpoint.naar.focus Naar
    annotation.naar-notes.body "Heimatwelt der Enari."
```

`2.0-draft` moves that structure into explicit sections:

```worldorbit
schema 2.0-draft

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

Object declarations remain familiar, but draft source uses `object <type> <id>` headers:

```worldorbit
object planet Naar
  orbit Iyath
  semiMajor 1.18au
  atmosphere nitrogen-oxygen
```

## Viewer and Markdown behavior

- `renderSourceToSvg(source)` now accepts `2.0-draft` directly.
- `createInteractiveViewer({ source })` now accepts `2.0-draft` directly.
- `renderWorldOrbitBlock(source)` now accepts `2.0-draft` directly.
- Draft `defaults preset ...` values flow into scene generation when no runtime preset override is supplied.

## Current limitations

- `2.0-draft` is still a draft authoring schema, not the stable normalized model.
- WorldOrbit still renders from the materialized `1.0` document internally.
- Existing `parse(source)` and `render(source)` remain `1.0`-source convenience APIs; use `loadWorldOrbitSource(...)` when the input schema may vary.
