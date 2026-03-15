# API Inventory

## @worldorbit/core

Stable `v2.5` APIs:

- `parse(source)`
- `parseSafe(source)`
- `parseWithDiagnostics(source)`
- `render(source)`
- `parseWorldOrbit(source)`
- `parseWorldOrbitAtlas(source)`
- `normalizeDocument(ast)`
- `normalizeWithDiagnostics(ast)`
- `validateDocument(document)`
- `validateDocumentWithDiagnostics(document)`
- `renderDocumentToScene(document, options?)`
- `formatDocument(document, options?)`
- `formatAtlasDocument(document)`
- `upgradeDocumentToV2(document, options?)`
- `materializeAtlasDocument(document)`
- `createEmptyAtlasDocument(systemId?)`
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

Legacy compatibility APIs retained in `v2.4`:

- `parseWorldOrbitDraft(source)`
- `formatDraftDocument(document)`
- `upgradeDocumentToDraftV2(document, options?)`
- `materializeDraftDocument(document)`

Core public types include:

- `WorldOrbitDocument`
- `WorldOrbitAtlasDocument`
- `WorldOrbitDraftDocument`
- `LoadedWorldOrbitSource`
- `WorldOrbitObject`
- `Placement`
- `AtReference`
- `WorldOrbitDiagnostic`
- `DiagnosticResult`
- `RenderScene`
- `RenderSceneLayer`
- `RenderSceneGroup`
- `RenderSceneLabel`
- `RenderSceneViewpoint`
- `RenderPresetName`
- `RenderScaleModel`
- `AtlasDocumentPath`
- `AtlasResolvedDiagnostic`
- `WorldOrbitFieldSchema`
- `MarkdownFenceBlock`

## @worldorbit/viewer

Stable `v2.4` APIs:

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

## @worldorbit/editor

Stable `v2.4` APIs:

- `createWorldOrbitEditor(container, options)`

Editor public types include:

- `WorldOrbitEditor`
- `WorldOrbitEditorOptions`
- `WorldOrbitEditorSelection`
- `WorldOrbitEditorSnapshot`

`WorldOrbitEditor` now includes:

- `isDirty()`
- `markSaved()`

`WorldOrbitEditorOptions` now includes:

- `onDirtyChange?(dirty)`
- `shortcuts?`

## @worldorbit/markdown

Stable `v2.4` APIs:

- `renderWorldOrbitBlock(source, options?)`
- `renderWorldOrbitError(message)`
- `remarkWorldOrbit(options?)`
- `rehypeWorldOrbit(options?)`
