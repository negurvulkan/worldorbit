# API Inventory

## @worldorbit/core

Stable v1.0 APIs:

- `parse(source)`
- `render(source)`
- `parseWorldOrbit(source)`
- `normalizeDocument(ast)`
- `validateDocument(document)`
- `renderDocumentToScene(document, options?)`
- `formatDocument(document)`
- `stringify(document)`
- `extractWorldOrbitBlocks(markdown)`

Core public types include:

- `WorldOrbitDocument`
- `WorldOrbitObject`
- `Placement`
- `AtReference`
- `RenderScene`
- `RenderSceneLayer`
- `RenderSceneGroup`
- `RenderSceneLabel`
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
- `ViewerObjectDetails`
- `ViewerState`
- `WorldOrbitViewer`
- `WorldOrbitEmbedPayload`

## @worldorbit/markdown

Preview v1.0 APIs:

- `renderWorldOrbitBlock(source, options?)`
- `renderWorldOrbitError(message)`
- `remarkWorldOrbit(options?)`
- `rehypeWorldOrbit(options?)`
