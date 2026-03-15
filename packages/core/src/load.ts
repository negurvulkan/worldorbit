import { diagnosticFromError } from "./diagnostics.js";
import { materializeDraftDocument } from "./draft.js";
import { parseWorldOrbitDraft } from "./draft-parse.js";
import { WorldOrbitError } from "./errors.js";
import { normalizeDocument } from "./normalize.js";
import { parseWorldOrbit } from "./parse.js";
import type {
  AstDocument,
  DiagnosticResult,
  LoadedWorldOrbitSource,
  WorldOrbitAnyDocumentVersion,
  WorldOrbitDocument,
  WorldOrbitDraftDocument,
} from "./types.js";
import { validateDocument } from "./validate.js";

const DRAFT_SCHEMA_PATTERN = /^schema\s+2\.0-draft$/i;

export function detectWorldOrbitSchemaVersion(source: string): WorldOrbitAnyDocumentVersion {
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    return DRAFT_SCHEMA_PATTERN.test(trimmed) ? "2.0-draft" : "1.0";
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

  if (schemaVersion === "2.0-draft") {
    return loadDraftSourceWithDiagnostics(source);
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
      draftDocument: null,
      diagnostics: [],
    },
    diagnostics: [],
  };
}

function loadDraftSourceWithDiagnostics(
  source: string,
): DiagnosticResult<LoadedWorldOrbitSource> {
  let draftDocument: WorldOrbitDraftDocument;
  try {
    draftDocument = parseWorldOrbitDraft(source);
  } catch (error) {
    return {
      ok: false,
      value: null,
      diagnostics: [diagnosticFromError(error, "parse", "load.draft.failed")],
    };
  }

  let document: WorldOrbitDocument;
  try {
    document = materializeDraftDocument(draftDocument);
  } catch (error) {
    return {
      ok: false,
      value: null,
      diagnostics: [diagnosticFromError(error, "normalize", "load.draft.materialize.failed")],
    };
  }

  try {
    validateDocument(document);
  } catch (error) {
    return {
      ok: false,
      value: null,
      diagnostics: [diagnosticFromError(error, "validate", "load.draft.validate.failed")],
    };
  }

  const loaded: LoadedWorldOrbitSource = {
    schemaVersion: "2.0-draft",
    ast: null,
    document,
    draftDocument,
    diagnostics: [...draftDocument.diagnostics],
  };

  return {
    ok: true,
    value: loaded,
    diagnostics: [...draftDocument.diagnostics],
  };
}
