import {
  diagnosticFromError,
} from "./diagnostics.js";
import { materializeAtlasDocument } from "./draft.js";
import { parseWorldOrbitAtlas } from "./draft-parse.js";

import type {
  WorldOrbitHierarchyContainerFields,
  WorldOrbitHierarchyDocument,
  WorldOrbitGalaxy,
  WorldOrbitHierarchySystem,
  WorldOrbitDiagnostic,
  WorldOrbitUniverse,
} from "./types.js";

const SECTION_KEYWORDS = new Set([
  "defaults",
  "atlas",
  "viewpoint",
  "annotation",
  "group",
  "relation",
  "event",
  "trajectory",
  "object",
]);

const SYSTEM_FORWARD_FIELDS = new Set([
  "title",
  "description",
  "epoch",
  "referencePlane",
]);

const BOOL_FIELDS = new Set(["hidden"]);
const LIST_FIELDS = new Set(["tags"]);

export function parseWorldOrbitHierarchyDocument(source: string): WorldOrbitHierarchyDocument {
  const lines = source.split(/\r?\n/);
  const first = firstMeaningfulLine(lines);
  if (!first || first.tokens[0] !== "schema" || first.tokens[1] !== "4.0") {
    throw createParseError('Expected required header "schema 4.0"', first?.line ?? 1, first?.column ?? 1);
  }

  const universeLine = nextMeaningfulLine(lines, first.index + 1);
  if (!universeLine || universeLine.indent !== 0 || universeLine.tokens[0] !== "universe" || !universeLine.tokens[1]) {
    throw createParseError('Expected top-level "universe <id>" declaration', universeLine?.line ?? 2, universeLine?.column ?? 1);
  }

  const parsedUniverse = parseUniverse(lines, universeLine.index, universeLine.indent);
  const diagnostics = collectSystemDiagnostics(parsedUniverse.universe);

  return {
    format: "worldorbit",
    version: "4.0",
    schemaVersion: "4.0",
    suiteVersion: "6.0.0",
    universe: parsedUniverse.universe,
    diagnostics,
  };
}

function parseUniverse(
  lines: string[],
  startIndex: number,
  indent: number,
): { universe: WorldOrbitUniverse; nextIndex: number } {
  const header = analyzeLine(lines[startIndex], startIndex);
  if (!header) {
    throw createParseError('Expected "universe <id>" declaration', startIndex + 1, 1);
  }
  const universe = createUniverse(header.tokens[1] ?? "");
  let index = startIndex + 1;

  while (index < lines.length) {
    const entry = analyzeLine(lines[index], index);
    if (!entry) {
      index += 1;
      continue;
    }
    if (entry.indent <= indent) {
      break;
    }
    if (entry.indent !== indent + 2) {
      throw createParseError("Universe children must be indented by two spaces.", entry.line, entry.column);
    }

    if (entry.tokens[0] === "galaxy" && entry.tokens[1]) {
      const parsed = parseGalaxy(lines, index, entry.indent, universe.id);
      universe.galaxies.push(parsed.galaxy);
      index = parsed.nextIndex;
      continue;
    }

    applyContainerField(universe, entry.tokens, entry.line, "universe");
    index += 1;
  }

  return { universe, nextIndex: index };
}

function parseGalaxy(
  lines: string[],
  startIndex: number,
  indent: number,
  universeId: string,
): { galaxy: WorldOrbitGalaxy; nextIndex: number } {
  const header = analyzeLine(lines[startIndex], startIndex);
  if (!header) {
    throw createParseError('Expected "galaxy <id>" declaration', startIndex + 1, 1);
  }
  const galaxy: WorldOrbitGalaxy = {
    ...createBaseFields("galaxy", header.tokens[1] ?? ""),
    universeId,
    systems: [],
  };
  let index = startIndex + 1;

  while (index < lines.length) {
    const entry = analyzeLine(lines[index], index);
    if (!entry) {
      index += 1;
      continue;
    }
    if (entry.indent <= indent) {
      break;
    }
    if (entry.indent !== indent + 2) {
      throw createParseError("Galaxy children must be indented by two spaces.", entry.line, entry.column);
    }

    if (entry.tokens[0] === "system" && entry.tokens[1]) {
      const parsed = parseSystem(lines, index, entry.indent, universeId, galaxy.id);
      galaxy.systems.push(parsed.system);
      index = parsed.nextIndex;
      continue;
    }

    applyContainerField(galaxy, entry.tokens, entry.line, "galaxy");
    index += 1;
  }

  return { galaxy, nextIndex: index };
}

function parseSystem(
  lines: string[],
  startIndex: number,
  indent: number,
  universeId: string,
  galaxyId: string,
): { system: WorldOrbitHierarchySystem; nextIndex: number } {
  const header = analyzeLine(lines[startIndex], startIndex);
  if (!header) {
    throw createParseError('Expected "system <id>" declaration', startIndex + 1, 1);
  }
  const systemBase: WorldOrbitHierarchySystem = {
    ...createBaseFields("system", header.tokens[1] ?? ""),
    universeId,
    galaxyId,
    systemSource: "",
    atlasDocument: null,
    materializedDocument: null,
    diagnostics: [],
  };
  const forwardedLines: string[] = [];
  const sectionLines: string[] = [];
  let activeSection = false;
  let index = startIndex + 1;

  while (index < lines.length) {
    const raw = lines[index] ?? "";
    const entry = analyzeLine(raw, index);
    if (!entry) {
      if (activeSection) {
        sectionLines.push("");
      }
      index += 1;
      continue;
    }

    if (entry.indent <= indent) {
      break;
    }

    if (entry.indent === indent + 2) {
      const keyword = entry.tokens[0];
      if (SECTION_KEYWORDS.has(keyword)) {
        activeSection = true;
        sectionLines.push(raw.slice(indent + 2));
      } else {
        activeSection = false;
        applyContainerField(systemBase, entry.tokens, entry.line, "system");
        if (SYSTEM_FORWARD_FIELDS.has(keyword)) {
          forwardedLines.push(`  ${tokensToLine(entry.tokens)}`);
        }
      }
      index += 1;
      continue;
    }

    if (!activeSection) {
      throw createParseError("System metadata fields may not contain nested blocks.", entry.line, entry.column);
    }

    sectionLines.push(raw.slice(indent + 2));
    index += 1;
  }

  const syntheticSource = [
    "schema 3.1",
    "",
    `system ${systemBase.id}`,
    ...forwardedLines,
    ...(forwardedLines.length > 0 ? [""] : []),
    ...trimTrailingEmptyLines(sectionLines),
  ].join("\n").trim();

  systemBase.systemSource = syntheticSource;

  try {
    const atlasDocument = parseWorldOrbitAtlas(syntheticSource);
    systemBase.atlasDocument = atlasDocument;
    systemBase.diagnostics.push(...atlasDocument.diagnostics);
    try {
      systemBase.materializedDocument = materializeAtlasDocument(atlasDocument);
    } catch (error) {
      systemBase.diagnostics.push(diagnosticFromError(error, "normalize", "hierarchy.system.materialize.failed"));
    }
  } catch (error) {
    systemBase.diagnostics.push(diagnosticFromError(error, "parse", "hierarchy.system.parse.failed"));
  }

  return { system: systemBase, nextIndex: index };
}

function createUniverse(id: string): WorldOrbitUniverse {
  return {
    ...createBaseFields("universe", id),
    galaxies: [],
  };
}

function createBaseFields<TKind extends "universe" | "galaxy" | "system">(
  kind: TKind,
  id: string,
): WorldOrbitHierarchyContainerFields & { kind: TKind; id: string } {
  if (!id) {
    throw createParseError(`Expected identifier after "${kind}"`, 1, 1);
  }

  return {
    kind,
    id,
    title: null,
    description: null,
    tags: [],
    color: null,
    image: null,
    hidden: false,
    epoch: null,
    referencePlane: null,
    properties: {},
  };
}

function applyContainerField(
  container: WorldOrbitHierarchyContainerFields,
  tokens: string[],
  line: number,
  scope: "universe" | "galaxy" | "system",
): void {
  const key = tokens[0] ?? "";
  if (!key || tokens.length < 2) {
    throw createParseError(`Invalid ${scope} field line`, line, 1);
  }

  const valueTokens = tokens.slice(1);
  if (key === "title" || key === "description" || key === "color" || key === "image" || key === "epoch" || key === "referencePlane") {
    const value = valueTokens.join(" ").trim();
    (
      container as unknown as Record<
        "title" | "description" | "color" | "image" | "epoch" | "referencePlane",
        string | null
      >
    )[key as "title" | "description" | "color" | "image" | "epoch" | "referencePlane"] = value || null;
    container.properties[key] = value || "";
    return;
  }

  if (LIST_FIELDS.has(key)) {
    container.tags = valueTokens;
    container.properties[key] = [...valueTokens];
    return;
  }

  if (BOOL_FIELDS.has(key)) {
    const normalized = valueTokens[0]?.toLowerCase();
    const boolValue = normalized === "true" || normalized === "yes" || normalized === "on";
    container.hidden = boolValue;
    container.properties[key] = boolValue;
    return;
  }

  container.properties[key] = valueTokens.length > 1 ? [...valueTokens] : valueTokens[0] ?? "";
}

function collectSystemDiagnostics(universe: WorldOrbitUniverse): WorldOrbitDiagnostic[] {
  const diagnostics: WorldOrbitDiagnostic[] = [];
  for (const galaxy of universe.galaxies) {
    for (const system of galaxy.systems) {
      diagnostics.push(...system.diagnostics);
    }
  }
  return diagnostics;
}

function trimTrailingEmptyLines(lines: string[]): string[] {
  const next = [...lines];
  while (next.length > 0 && !next.at(-1)?.trim()) {
    next.pop();
  }
  return next;
}

function tokensToLine(tokens: string[]): string {
  return tokens
    .map((token) => (/\s/.test(token) ? JSON.stringify(token) : token))
    .join(" ");
}

function firstMeaningfulLine(lines: string[]) {
  return nextMeaningfulLine(lines, 0);
}

function nextMeaningfulLine(lines: string[], startIndex: number) {
  for (let index = startIndex; index < lines.length; index += 1) {
    const analyzed = analyzeLine(lines[index] ?? "", index);
    if (analyzed) {
      return analyzed;
    }
  }
  return null;
}

function analyzeLine(line: string, index: number) {
  const withoutComment = stripComment(line);
  if (!withoutComment.trim()) {
    return null;
  }
  const indent = withoutComment.match(/^ */)?.[0].length ?? 0;
  const tokens = tokenize(withoutComment.trim());
  if (tokens.length === 0) {
    return null;
  }
  return {
    index,
    line: index + 1,
    column: indent + 1,
    indent,
    tokens,
  };
}

function stripComment(line: string): string {
  let inQuote = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index - 1] !== "\\") {
      inQuote = !inQuote;
    }
    if (!inQuote && char === "#") {
      return line.slice(0, index);
    }
  }
  return line;
}

function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuote = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index - 1] !== "\\") {
      if (inQuote) {
        tokens.push(current);
        current = "";
        inQuote = false;
      } else {
        if (current.trim()) {
          tokens.push(current.trim());
          current = "";
        }
        inQuote = true;
      }
      continue;
    }
    if (!inQuote && /\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  if (inQuote) {
    throw createParseError("Unclosed quoted string", 1, 1);
  }

  return tokens;
}

function createParseError(message: string, line: number, column: number): Error & { line: number; column: number } {
  const error = new Error(message) as Error & { line: number; column: number };
  error.line = line;
  error.column = column;
  return error;
}
