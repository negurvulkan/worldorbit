import type { FormattableWorldOrbitDocument, FormatDocumentOptions, WorldOrbitAtlasDocument, WorldOrbitDraftDocument } from "./types.js";
export declare function formatDocument(document: FormattableWorldOrbitDocument, options?: FormatDocumentOptions): string;
export declare function formatAtlasDocument(document: WorldOrbitAtlasDocument): string;
export declare function formatDraftDocument(document: WorldOrbitAtlasDocument | WorldOrbitDraftDocument): string;
