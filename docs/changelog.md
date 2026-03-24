# Changelog

## v3.0.7

- made interactive embeds responsive to their host container with resize tracking and safe height fallbacks
- moved interactive 2D and 3D labels into screen-space overlays so text keeps a stable on-screen size while zooming
- regenerated browser bundles and docs assets for the responsive viewer update

## v3.0.5

- made the published docs self-contained by copying browser bundles and module-ready browser assets into `docs/assets/` during the build
- switched `docs/index.html`, `docs/beginner_guide.html`, and `docs/studio/index.html` to load only same-root docs assets so GitHub Pages no longer depends on `dist/`, workspace package paths, or external package CDN resolution
- bumped the suite and package metadata to `3.0.5` for the docs hotfix release

## v3.0.3

- switched the main docs landing page and beginner guide back to the bundled browser script `worldorbit.min.js` so direct browser usage no longer depends on the non-self-contained ESM entry

## v3.0.2

- refreshed package metadata and version-pinned CDN references for the `3.0.2` patch release across docs and browser-facing entry points

## v3.0.1

- fixed the browser and UNPKG release entry points so `worldorbit.js` and `worldorbit.min.js` are emitted as executable browser bundles instead of raw ESM re-export shims
- switched the browser-facing docs, examples, and CDN snippets to the working ESM entry path for patch-release usage

## v3.0.0

- added `renderDocumentToSpatialScene(...)`, shared spatial scene types, and deterministic orbit-motion models so the same Schema `2.5` documents can drive both 2D and 3D viewers
- extended `@worldorbit/viewer`, embeds, Markdown, Demo, Editor, and Studio with explicit `viewMode`, `interactive-2d` / `interactive-3d` modes, 3D preview switching, and play/pause/reset/speed animation controls
- refreshed release-facing docs, examples, UNPKG shell pages, migration notes, and package metadata for the `3.0.0` suite while keeping the existing text-first DSL and 2D pipelines intact

## v2.6.0

- added Schema 2.5 as the new recommended atlas format with `orthographic` and `perspective` viewpoints, a Schema-level `camera` block, and clearer event/pose snapshot context for `epoch` and `referencePlane`
- updated the parser, formatter, validator, scene model, viewer, editor, and Studio to preserve Schema 2.5 projection intent, camera metadata, and reproducible event pose fallbacks while keeping Schema 2.1, Schema 2.0, and `schema 2.0-draft` compatibility
- refreshed the README, language references, migration notes, examples, Beginner Guide, Studio starter flow, and versioned package/docs metadata around Schema 2.5 and suite v2.6

## v2.5.17

- added backward-compatible Schema 2.1 event support with declarative `event` sections, viewpoint-linked `events`, `layers events`, and per-event `positions` snapshots with reusable `pose` placement syntax
- updated the parser, formatter, validator, renderer, viewer, and atlas model so event targets, participants, pose overrides, event overlays, and active event scenes load cleanly without breaking existing `schema 2.0` or `schema 2.0-draft` documents
- expanded the editor, Studio, and regression coverage to support creating, inspecting, formatting, navigating, and directly dragging event poses while preserving base object placements and Schema 2.1 source fidelity

## v2.5.16

- added backward-compatible Schema 2.1 atlas support with comments, `group`, `relation`, object-level reference metadata, resonance declarations, typed lore blocks, and light validation/derive rules
- updated the viewer, atlas controls, and Studio to preserve Schema 2.1 semantic groups, relation overlays, render hints, and object detail metadata instead of assuming Schema 2.0-only authoring
- refreshed the README, language references, migration notes, examples, markdown embeds, and Studio starter/example flows around the new Schema 2.1 default while keeping `schema 2.0` and `schema 2.0-draft` compatibility documented

## v2.5.0

- stabilized `@worldorbit/editor` with `isDirty()`, `markSaved()`, `onDirtyChange`, keyboard shortcuts, and a debounced source/preview flow tuned for real save/recovery workflows
- deferred expensive history and canonical formatting for stage drags until commit, added `Escape` drag cancellation, and mirrored diagnostics into outline badges, inspector fields, source diagnostics, stage overlays, and a live status bar
- hardened `WorldOrbit Studio` with browser file actions for new/open/save/export/example loading, canonical `schema 2.0` save output, `beforeunload` protection, local draft recovery, and session-persistent panel visibility and pane sizing
- expanded regression coverage across dirty-state behavior, drag cancellation, large-atlas editor mounts, and the Studio recovery/save flow

## v2.4.0

- delivered the first public `@worldorbit/editor` package with `createWorldOrbitEditor(...)`, shared atlas-document editing, undo/redo, diagnostics, live source syncing, preview output, and first orbit handles
- extended the stage overlay so `orbit`, `at`, `surface`, and `free` placements can now be adjusted directly on the canvas while still roundtripping back into canonical `schema 2.0` source
- added the `WorldOrbit Studio` reference app at `/studio/` as a browser-hosted editor surface built on the new editor package
- extended object editing across placement fields, atlas defaults, viewpoints, annotations, metadata, and canonical `schema 2.0` roundtripping
- moved the workspace and package versions directly to `2.4.0` while keeping the changelog history serial across the internal `2.1` to `2.4` development blocks

## v2.3.0

- added visual atlas editing foundations through the new editor workspace layout: atlas outline, stage, inspector, live source pane, and synchronized preview panels
- connected atlas defaults, viewpoint configuration, annotation editing, and atlas metadata editing to the same editor state and canonical formatter path
- aligned the preview/embed pipeline so editor changes immediately update both exported SVG and hydrated embed markup

## v2.2.0

- introduced the shared editor foundation in `@worldorbit/core` and `@worldorbit/editor`, including atlas-document cloning, path addressing, upsert/remove helpers, and editor-friendly atlas diagnostic resolution
- established the editor history model, selection model, and `schema 2.0` text roundtrip as the canonical authoring path
- added package-level build and smoke-test support for the new editor package

## v2.1.0

- added rich tooltip cards to `@worldorbit/viewer` with shared detail payloads, default card rendering, hover/pinned behavior, and browser-side pin/unpin controls
- exposed tooltip APIs on `createInteractiveViewer(...)` through `tooltipMode`, `tooltipRenderer`, `onTooltipChange`, and `pinTooltip(...)`
- kept tooltip behavior consistent across the low-level viewer, atlas viewer, and interactive embed mounts

## v2.0.0

- stabilized the canonical atlas schema on `schema 2.0` and added first-class `WorldOrbitAtlasDocument` loading, formatting, upgrading, and materialization APIs
- kept legacy `schema 2.0-draft` support as a compatibility path, now normalized through the canonical atlas loader with explicit deprecation diagnostics
- added the high-level `createAtlasViewer(...)` API with built-in atlas controls, inspector snapshots, bookmark handling, and access to the wrapped low-level viewer
- updated the custom element, embed payloads, viewer atlas state, demo, examples, and Markdown flow around the stable `2.0` contract
- refreshed docs, examples, and regression coverage so `2.0` is the primary authoring path while `1.0` and legacy draft input remain readable
