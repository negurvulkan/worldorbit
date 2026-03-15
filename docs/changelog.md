# Changelog

## v1.9.0

- added direct source loading for both stable `1.0` and draft `2.0-draft` files through `loadWorldOrbitSource(...)`, `loadWorldOrbitSourceWithDiagnostics(...)`, and the `load(...)` convenience export
- introduced `parseWorldOrbitDraft(...)` and `materializeDraftDocument(...)` so draft source can be parsed, inspected, and projected back into the stable render document explicitly
- wired dual-source support through `renderSourceToSvg(...)`, `createInteractiveViewer(...)`, and Markdown block rendering so draft source strings now hydrate and render without a manual conversion step
- preserved draft-authored viewpoint summaries and draft default presets across scene generation, viewer hydration, and Markdown embed payloads
- refreshed the draft example, README, API inventory, migration notes, and regression suite around dual-source loading

## v1.8.0

- added structured diagnostics APIs for parse, normalize, and validate phases through `parseWithDiagnostics(...)`, `normalizeWithDiagnostics(...)`, and `validateDocumentWithDiagnostics(...)`
- introduced a programmatic `2.0-draft` core document model with `upgradeDocumentToDraftV2(...)` and canonical draft formatting through `formatDocument(..., { schema: "2.0-draft" })`
- promoted scene viewpoints into structured draft viewpoints and lifted object descriptions plus explicit system annotations into draft annotations
- added schema-draft examples, docs, and regression coverage around diagnostics, draft upgrade, and canonical draft output

## v1.7.0

- added named atlas viewpoints on the scene model, derived from document-side `system info` viewpoint metadata
- extended the interactive viewer with search, object filtering, focus paths, bookmark capture, active viewpoint switching, and serializable atlas state snapshots
- added optional viewer minimaps plus embed payload support for initial viewpoint, filter, selection, and full atlas-state hydration
- refreshed the browser demo, Markdown output, and regression suite around atlas navigation and deep-linkable viewer state

## v1.6.0

- added atlas-oriented scene metadata with explicit render layers, object groups, and prepared label positions
- introduced named render presets across scene generation, SVG rendering, embeds, and Markdown blocks
- extended the interactive viewer with object details hooks plus hover/selection chain highlighting
- refreshed the demo and regression suite around presets, groups, labels, and atlas-style embeds

## v1.5.0

- added projection-aware scene generation with `topdown` and `isometric` output modes
- introduced the public `RenderScaleModel` plus runtime projection and scale overrides across core, viewer, and markdown
- upgraded orbit rendering to use ellipse geometry, split front/back orbit arcs, and projected ring and belt bands
- extended the interactive viewer with `getRenderOptions()` and `setRenderOptions(...)` for live projection and scale changes
- refreshed the demo, examples, README, and tests around isometric scenes, textures, atmospheres, and scale controls

## v1.1.1

- added PNG-style object textures through the `image` field for supported object types
- carried texture references from `@worldorbit/core` scenes into `@worldorbit/viewer` SVG output and interactive exports
- updated the browser demo, Markdown examples, and release docs with a checked-in sample planet texture
- expanded parser, renderer, viewer, and Markdown test coverage around textured objects

## v1.0.0

- split the project into `@worldorbit/core`, `@worldorbit/viewer`, and `@worldorbit/markdown`
- promoted the normalized document model to schema version `1.0`
- moved SVG rendering to the viewer package and kept scene generation in core
- added theme presets, layer controls, embed payload helpers, and hydration support
- added build-time Markdown integration through Remark and Rehype plugins
- added canonical formatting with `formatDocument(...)`
- added `image` textures for supported object types across scenes, SVG output, viewer export, and Markdown embeds
- tightened semantic validation for field compatibility, units, anchors, surface targets, and special positions
- refreshed the browser demo, examples, migration notes, and test coverage
