# @worldorbit/core

WorldOrbit core contains the parser, schema, normalization, validation, formatting, and scene generation APIs for Schema 1.0, canonical Schema 2.0, and Schema 2.1 atlas source.

Main exports:

- `parse(source)`
- `parseWorldOrbitAtlas(source)`
- `parseWorldOrbitDraft(source)`
- `parseWorldOrbit(source)`
- `normalizeDocument(ast)`
- `validateDocument(document)`
- `validateAtlasDocumentWithDiagnostics(document)`
- `renderDocumentToScene(document, options?)`
- `formatDocument(document)`
- `loadWorldOrbitSource(source)`
- `extractWorldOrbitBlocks(markdown)`
