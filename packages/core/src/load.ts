import { diagnosticFromError } from "./diagnostics.js";
import { materializeAtlasDocument } from "./draft.js";
import { parseWorldOrbitAtlas } from "./draft-parse.js";
import { WorldOrbitError } from "./errors.js";
import { normalizeDocument } from "./normalize.js";
import { parseWorldOrbit } from "./parse.js";
import type {
  AstDocument,
  DiagnosticResult,
  LoadedWorldOrbitSource,
  WorldOrbitAnyDocumentVersion,
  WorldOrbitAtlasDocument,
  WorldOrbitDocument,
} from "./types.js";
import { validateDocument } from "./validate.js";

const ATLAS_SCHEMA_PATTERN = /^schema\s+2(?:\.0)?$/i;
const LEGACY_DRAFT_SCHEMA_PATTERN = /^schema\s+2\.0-draft$/i;

export function detectWorldOrbitSchemaVersion(source: string): WorldOrbitAnyDocumentVersion {
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (LEGACY_DRAFT_SCHEMA_PATTERN.test(trimmed)) {
      return "2.0-draft";
    }

    if (ATLAS_SCHEMA_PATTERN.test(trimmed)) {
      return "2.0";
    }

    return "1.0";
  }

  return "1.0";
}

export function loadWorldOrbitSource(source: string): LoadedWorldOrbitSource {
  const result = loadWorldOrbitSourceWithDiagnostics(source);

  if (!result.ok || !result.value) {
    const diagnostic = result.diagnostics[0];
    throw new WorldOrbitError(
      diagnostic?.message ?? "Failed to load WorldOrbit source",
      diagnostic?.line,
      diagnostic?.column,
    );
  }

  return result.value;
}

export function loadWorldOrbitSourceWithDiagnostics(
  source: string,
): DiagnosticResult<LoadedWorldOrbitSource> {
  const schemaVersion = detectWorldOrbitSchemaVersion(source);

  if (schemaVersion === "2.0" || schemaVersion === "2.0-draft") {
    return loadAtlasSourceWithDiagnostics(source, schemaVersion);
  }

  let ast: AstDocument;
  try {
    ast = parseWorldOrbit(source);
  } catch (error) {
    return {
      ok: false,
      value: null,
      diagnostics: [diagnosticFromError(error, "parse")],
    };
  }

  let document: WorldOrbitDocument;
  try {
    document = normalizeDocument(ast);
  } catch (error) {
    return {
      ok: false,
      value: null,
      diagnostics: [diagnosticFromError(error, "normalize")],
    };
  }

  try {
    validateDocument(document);
  } catch (error) {
    return {
      ok: false,
      value: null,
      diagnostics: [diagnosticFromError(error, "validate")],
    };
  }

  return {
    ok: true,
    value: {
      schemaVersion,
      ast,
      document,
      atlasDocument: null,
      draftDocument: null,
      diagnostics: [],
    },
    diagnostics: [],
  };
}

function loadAtlasSourceWithDiagnostics(
  source: string,
  schemaVersion: "2.0" | "2.0-draft",
): DiagnosticResult<LoadedWorldOrbitSource> {
  let atlasDocument: WorldOrbitAtlasDocument;
  try {
    atlasDocument = parseWorldOrbitAtlas(source);
  } catch (error) {
    return {
      ok: false,
      value: null,
      diagnostics: [diagnosticFromError(error, "parse", "load.atlas.failed")],
    };
  }

  let document: WorldOrbitDocument;
  try {
    document = materializeAtlasDocument(atlasDocument);
  } catch (error) {
    return {
      ok: false,
      value: null,
      diagnostics: [diagnosticFromError(error, "normalize", "load.atlas.materialize.failed")],
    };
  }

  try {
    validateDocument(document);
  } catch (error) {
    return {
      ok: false,
      value: null,
      diagnostics: [diagnosticFromError(error, "validate", "load.atlas.validate.failed")],
    };
  }

  const loaded: LoadedWorldOrbitSource = {
    schemaVersion,
    ast: null,
    document,
    atlasDocument,
    draftDocument: atlasDocument,
    diagnostics: [...atlasDocument.diagnostics],
  };

  return {
    ok: true,
    value: loaded,
    diagnostics: [...atlasDocument.diagnostics],
  };
}
