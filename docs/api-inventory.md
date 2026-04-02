# API Inventory

This inventory highlights the public WorldOrbit APIs that matter most for authoring, loading, validating, rendering, and editing Schema 3.1 documents in the `5.0.0` viewer/runtime family. Schema 3.0, Schema 2.6, Schema 2.1, canonical Schema 2.0, Schema 1.0, and legacy `schema 2.0-draft` remain supported compatibility paths.

## `@worldorbit/core`

Stable v5.0 APIs:

- `parse(source)`
- `parseSafe(source)`
- `parseWithDiagnostics(source)`
- `render(source)`
- `parseWorldOrbit(source)`
- `parseWorldOrbitAtlas(source)`
- `parseWorldOrbitDraft(source)`
- `normalizeDocument(ast)`
- `normalizeWithDiagnostics(ast)`
- `validateDocument(document)`
- `validateDocumentWithDiagnostics(document)`
- `renderDocumentToScene(document, options?)`
- `renderDocumentToSpatialScene(document, options?)`
- `evaluateSpatialSceneAtTime(scene, timeSeconds)`
- `formatDocument(document, options?)`
- `formatAtlasDocument(document)`
- `formatDraftDocument(document)`
- `upgradeDocumentToV2(document, options?)`
- `upgradeDocumentToDraftV2(document, options?)`
- `materializeAtlasDocument(document)`
- `materializeDraftDocument(document)`
- `createEmptyAtlasDocument(systemId?, version?)`
- `cloneAtlasDocument(document)`
- `listAtlasDocumentPaths(document)`
- `getAtlasDocumentNode(document, path)`
- `updateAtlasDocumentNode(document, path, updater)`
- `upsertAtlasDocumentNode(document, path, value)`
- `removeAtlasDocumentNode(document, path)`
- `resolveAtlasDiagnostics(document, diagnostics)`
- `resolveAtlasDiagnosticPath(document, diagnostic)`
- `validateAtlasDocumentWithDiagnostics(document)`
- `detectWorldOrbitSchemaVersion(source)`
- `loadWorldOrbitSource(source)`
- `loadWorldOrbitSourceWithDiagnostics(source)`
- `load(source)`
- `extractWorldOrbitBlocks(markdown)`
- official `worldorbit/core/solver` subpath for trajectory sampling and consistency checks

Core public types include:

- `WorldOrbitDocument`
- `WorldOrbitAtlasDocument`
- `WorldOrbitDraftDocument`
- `LoadedWorldOrbitSource`
- `WorldOrbitSystem`
- `WorldOrbitAtlasSystem`
- `WorldOrbitObject`
- `WorldOrbitCraft`
- `WorldOrbitGroup`
- `WorldOrbitRelation`
- `WorldOrbitEvent`
- `WorldOrbitEventPose`
- `WorldOrbitTrajectory`
- `WorldOrbitTrajectorySegment`
- `WorldOrbitManeuver`
- `WorldOrbitGravityAssist`
- `WorldOrbitViewCamera`
- `WorldOrbitResonance`
- `WorldOrbitRenderHints`
- `WorldOrbitDeriveRule`
- `WorldOrbitValidationRule`
- `WorldOrbitToleranceRule`
- `Placement`
- `AtReference`
- `WorldOrbitDiagnostic`
- `DiagnosticResult`
- `RenderScene`
- `SpatialScene`
- `SpatialSceneObject`
- `SpatialOrbit`
- `SpatialTrajectory`
- `SpatialTrajectorySample`
- `SpatialFocusTarget`
- `OrbitalMotionModel`
- `SpatialScaleModel`
- `RenderSceneLayer`
- `RenderSceneGroup`
- `RenderSceneSemanticGroup`
- `RenderSceneRelation`
- `RenderSceneEvent`
- `RenderSceneTrajectory`
- `RenderSceneTrajectoryWaypoint`
- `RenderSceneLabel`
- `RenderSceneViewpoint`
- `RenderPresetName`
- `RenderScaleModel`
- `AtlasDocumentPath`
- `AtlasResolvedDiagnostic`
- `WorldOrbitFieldSchema`
- `MarkdownFenceBlock`
- `WorldOrbitSolverHook`

## `@worldorbit/viewer`

Stable v5.0 APIs:

- `renderSceneToSvg(scene, options?)`
- `renderDocumentToSvg(document, options?)`
- `renderSourceToSvg(source, options?)`
- `createInteractiveViewer(container, options)`
- `createAtlasViewer(container, options)`
- `createWorldOrbitEmbedMarkup(payload, options?)`
- `mountWorldOrbitEmbeds(root?, options?)`
- `defineWorldOrbitViewerElement(tagName?)`

Viewer public types include:

- `WorldOrbitTheme`
- `ViewerLayerOptions`
- `SvgRenderOptions`
- `InteractiveViewerOptions`
- `AtlasViewerOptions`
- `AtlasViewerControls`
- `AtlasInspectorSnapshot`
- `ViewerFilter`
- `ViewerSearchResult`
- `ViewerObjectDetails`
- `ViewerTooltipDetails`
- `ViewerTooltipField`
- `ViewerAtlasState`
- `ViewerBookmark`
- `ViewerState`
- `TooltipMode`
- `WorldOrbitViewer`
- `WorldOrbitAtlasViewer`
- `WorldOrbitEmbedPayload`
- `WorldOrbitViewMode`
- `ViewerAnimationState`

Viewer behavior now includes Schema 3.1 semantic projections, camera metadata, visible trajectory curves, waypoints, relation overlays, event overlays, active event scene snapshots, render hints, detail payloads for `epoch`, `referencePlane`, `tidalLock`, `resonance`, events, and typed lore blocks, plus shared 2D/3D documents, explicit `viewMode`, deterministic orbit animation controls, and embed modes `static`, `interactive-2d`, and `interactive-3d`.

## `@worldorbit/editor`

Stable v5.0 APIs:

- `createWorldOrbitEditor(container, options)`

Editor public types include:

- `WorldOrbitEditor`
- `WorldOrbitEditorOptions`
- `WorldOrbitEditorSelection`
- `WorldOrbitEditorSnapshot`

`WorldOrbitEditor` includes:

- `isDirty()`
- `markSaved()`
- `addEvent()`

`WorldOrbitEditorOptions` includes:

- `onDirtyChange?(dirty)`
- `shortcuts?`
- `viewMode?`

The editor and Studio now load, preserve, and roundtrip Schema 3.1 documents instead of assuming Schema 2.0 as the only canonical atlas form, including event sections, event poses, trajectory blocks, trajectory render metadata, viewpoint camera blocks, stage edits that write back into `event.positions` rather than base object placement, and a 3D preview mode that reuses the same document model.

## `@worldorbit/markdown`

Stable v5.0 APIs:

- `renderWorldOrbitBlock(source, options?)`
- `renderWorldOrbitError(message)`
- `remarkWorldOrbit(options?)`
- `rehypeWorldOrbit(options?)`

Markdown rendering accepts Schema 3.1 source directly through the same high-level loading path as the viewer and editor, including explicit `interactive-2d` and `interactive-3d` embed modes.
