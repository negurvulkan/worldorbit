# API Inventory

This inventory highlights the public WorldOrbit APIs that matter most for authoring, loading, validating, rendering, and editing Schema 2.1 documents. Schema 1.0, canonical Schema 2.0, and legacy `schema 2.0-draft` remain supported compatibility paths.

## `@worldorbit/core`

Stable v2.5 APIs:

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

Core public types include:

- `WorldOrbitDocument`
- `WorldOrbitAtlasDocument`
- `WorldOrbitDraftDocument`
- `LoadedWorldOrbitSource`
- `WorldOrbitSystem`
- `WorldOrbitAtlasSystem`
- `WorldOrbitObject`
- `WorldOrbitGroup`
- `WorldOrbitRelation`
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
- `RenderSceneLayer`
- `RenderSceneGroup`
- `RenderSceneSemanticGroup`
- `RenderSceneRelation`
- `RenderSceneLabel`
- `RenderSceneViewpoint`
- `RenderPresetName`
- `RenderScaleModel`
- `AtlasDocumentPath`
- `AtlasResolvedDiagnostic`
- `WorldOrbitFieldSchema`
- `MarkdownFenceBlock`

## `@worldorbit/viewer`

Stable v2.5 APIs:

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

Viewer behavior now includes Schema 2.1-specific semantic groups, relation overlays, relation layers, render hints, and detail payloads for `epoch`, `referencePlane`, `tidalLock`, `resonance`, and typed lore blocks.

## `@worldorbit/editor`

Stable v2.5 APIs:

- `createWorldOrbitEditor(container, options)`

Editor public types include:

- `WorldOrbitEditor`
- `WorldOrbitEditorOptions`
- `WorldOrbitEditorSelection`
- `WorldOrbitEditorSnapshot`

`WorldOrbitEditor` includes:

- `isDirty()`
- `markSaved()`

`WorldOrbitEditorOptions` includes:

- `onDirtyChange?(dirty)`
- `shortcuts?`

The editor and Studio now load, preserve, and roundtrip Schema 2.1 documents instead of assuming Schema 2.0 as the only canonical atlas form.

## `@worldorbit/markdown`

Stable v2.5 APIs:

- `renderWorldOrbitBlock(source, options?)`
- `renderWorldOrbitError(message)`
- `remarkWorldOrbit(options?)`
- `rehypeWorldOrbit(options?)`

Markdown rendering accepts Schema 2.1 source directly through the same high-level loading path as the viewer and editor.
