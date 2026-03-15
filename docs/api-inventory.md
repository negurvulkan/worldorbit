# API Inventory

## @worldorbit/core

Stable v1.0 APIs:

- `parse(source)`
- `parseSafe(source)`
- `parseWithDiagnostics(source)`
- `render(source)`
- `parseWorldOrbit(source)`
- `parseWorldOrbitDraft(source)`
- `normalizeDocument(ast)`
- `normalizeWithDiagnostics(ast)`
- `validateDocument(document)`
- `validateDocumentWithDiagnostics(document)`
- `renderDocumentToScene(document, options?)`
- `formatDocument(document)`
- `formatDraftDocument(document)`
- `stringify(document)`
- `upgradeDocumentToDraftV2(document, options?)`
- `materializeDraftDocument(document)`
- `detectWorldOrbitSchemaVersion(source)`
- `loadWorldOrbitSource(source)`
- `loadWorldOrbitSourceWithDiagnostics(source)`
- `load(source)`
- `extractWorldOrbitBlocks(markdown)`

Core public types include:

- `WorldOrbitDocument`
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
- `WorldOrbitFieldSchema`
- `MarkdownFenceBlock`

## @worldorbit/viewer

Preview v1.0 APIs:

- `renderSceneToSvg(scene, options?)`
- `renderDocumentToSvg(document, options?)`
- `renderSourceToSvg(source, options?)`
- `createInteractiveViewer(container, options)`
- `createWorldOrbitEmbedMarkup(payload, options?)`
- `mountWorldOrbitEmbeds(root?, options?)`
- `defineWorldOrbitViewerElement(tagName?)`

Viewer public types include:

- `WorldOrbitTheme`
- `ViewerLayerOptions`
- `SvgRenderOptions`
- `InteractiveViewerOptions`
- `ViewerFilter`
- `ViewerSearchResult`
- `ViewerObjectDetails`
- `ViewerAtlasState`
- `ViewerBookmark`
- `ViewerState`
- `WorldOrbitViewer`
- `WorldOrbitEmbedPayload`

## @worldorbit/markdown

Preview v1.0 APIs:

- `renderWorldOrbitBlock(source, options?)`
- `renderWorldOrbitError(message)`
- `remarkWorldOrbit(options?)`
- `rehypeWorldOrbit(options?)`
