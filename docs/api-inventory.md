# API Inventory

## @worldorbit/core

Stable `v2.0` APIs:

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
- `detectWorldOrbitSchemaVersion(source)`
- `loadWorldOrbitSource(source)`
- `loadWorldOrbitSourceWithDiagnostics(source)`
- `load(source)`
- `extractWorldOrbitBlocks(markdown)`

Legacy compatibility APIs retained in `v2.0`:

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
- `WorldOrbitFieldSchema`
- `MarkdownFenceBlock`

## @worldorbit/viewer

Stable `v2.0` APIs:

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
- `ViewerAtlasState`
- `ViewerBookmark`
- `ViewerState`
- `WorldOrbitViewer`
- `WorldOrbitAtlasViewer`
- `WorldOrbitEmbedPayload`

## @worldorbit/markdown

Stable `v2.0` APIs:

- `renderWorldOrbitBlock(source, options?)`
- `renderWorldOrbitError(message)`
- `remarkWorldOrbit(options?)`
- `rehypeWorldOrbit(options?)`
