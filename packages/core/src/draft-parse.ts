import { WorldOrbitError } from "./errors.js";
import { normalizeDocument } from "./normalize.js";
import { getFieldSchema, isKnownFieldKey, WORLDORBIT_OBJECT_TYPES } from "./schema.js";
import { getIndent, tokenizeLineDetailed } from "./tokenize.js";
import type {
  AstDocument,
  AstFieldNode,
  AstInfoEntryNode,
  AstObjectNode,
  LineToken,
  RenderPresetName,
  RenderSceneLayer,
  RenderSceneViewpointFilter,
  ViewProjection,
  WorldOrbitDraftAnnotation,
  WorldOrbitDraftDocument,
  WorldOrbitDraftSystem,
  WorldOrbitDraftViewpoint,
  WorldOrbitObject,
  WorldOrbitObjectType,
} from "./types.js";
import { validateDocument } from "./validate.js";

type DraftSectionState =
  | {
      kind: "system";
      system: WorldOrbitDraftSystem;
      seenFields: Set<string>;
    }
  | {
      kind: "defaults";
      system: WorldOrbitDraftSystem;
      seenFields: Set<string>;
    }
  | {
      kind: "atlas";
      system: WorldOrbitDraftSystem;
      inMetadata: boolean;
      metadataIndent: number | null;
    }
  | {
      kind: "viewpoint";
      viewpoint: WorldOrbitDraftViewpoint;
      seenFields: Set<string>;
      inFilter: boolean;
      filterIndent: number | null;
      seenFilterFields: Set<string>;
    }
  | {
      kind: "annotation";
      annotation: WorldOrbitDraftAnnotation;
      seenFields: Set<string>;
    }
  | {
      kind: "object";
      objectNode: AstObjectNode;
      inInfoBlock: boolean;
      infoIndent: number | null;
    };

export function parseWorldOrbitDraft(source: string): WorldOrbitDraftDocument {
  const lines = source.split(/\r?\n/);
  let sawSchemaHeader = false;
  let system: WorldOrbitDraftSystem | null = null;
  let section: DraftSectionState | null = null;
  const objectNodes: AstObjectNode[] = [];
  let sawDefaults = false;
  let sawAtlas = false;
  const viewpointIds = new Set<string>();
  const annotationIds = new Set<string>();

  for (let index = 0; index < lines.length; index++) {
    const rawLine = lines[index];
    const lineNumber = index + 1;

    if (!rawLine.trim()) {
      continue;
    }

    const indent = getIndent(rawLine);
    const tokens = tokenizeLineDetailed(rawLine.slice(indent), {
      line: lineNumber,
      columnOffset: indent,
    });

    if (tokens.length === 0) {
      continue;
    }

    if (!sawSchemaHeader) {
      assertDraftSchemaHeader(tokens, lineNumber);
      sawSchemaHeader = true;
      continue;
    }

    if (indent === 0) {
      section = startTopLevelSection(
        tokens,
        lineNumber,
        system,
        objectNodes,
        viewpointIds,
        annotationIds,
        {
          sawDefaults,
          sawAtlas,
        },
      );

      if (section.kind === "system") {
        system = section.system;
      } else if (section.kind === "defaults") {
        sawDefaults = true;
      } else if (section.kind === "atlas") {
        sawAtlas = true;
      }

      continue;
    }

    if (!section) {
      throw new WorldOrbitError(
        "Indented line without parent draft section",
        lineNumber,
        indent + 1,
      );
    }

    handleSectionLine(section, indent, tokens, lineNumber);
  }

  if (!sawSchemaHeader) {
    throw new WorldOrbitError('Missing required draft schema header "schema 2.0-draft"');
  }

  const ast: AstDocument = {
    type: "document",
    objects: objectNodes,
  };
  const normalizedObjects = normalizeDocument(ast).objects;
  validateDocument({
    format: "worldorbit",
    version: "1.0",
    system: null,
    objects: normalizedObjects,
  });

  return {
    format: "worldorbit",
    version: "2.0-draft",
    sourceVersion: "1.0",
    system,
    objects: normalizedObjects,
    diagnostics: [],
  };
}

function assertDraftSchemaHeader(tokens: LineToken[], line: number): void {
  if (
    tokens.length !== 2 ||
    tokens[0].value.toLowerCase() !== "schema" ||
    tokens[1].value.toLowerCase() !== "2.0-draft"
  ) {
    throw new WorldOrbitError(
      'Expected draft header "schema 2.0-draft"',
      line,
      tokens[0]?.column ?? 1,
    );
  }
}

function startTopLevelSection(
  tokens: LineToken[],
  line: number,
  system: WorldOrbitDraftSystem | null,
  objectNodes: AstObjectNode[],
  viewpointIds: Set<string>,
  annotationIds: Set<string>,
  flags: {
    sawDefaults: boolean;
    sawAtlas: boolean;
  },
): DraftSectionState {
  const keyword = tokens[0]?.value.toLowerCase();

  switch (keyword) {
    case "system":
      if (system) {
        throw new WorldOrbitError(
          'Draft section "system" may only appear once',
          line,
          tokens[0].column,
        );
      }
      return startSystemSection(tokens, line);
    case "defaults":
      if (!system) {
        throw new WorldOrbitError(
          'Draft section "defaults" requires a preceding system declaration',
          line,
          tokens[0].column,
        );
      }
      if (flags.sawDefaults) {
        throw new WorldOrbitError(
          'Draft section "defaults" may only appear once',
          line,
          tokens[0].column,
        );
      }
      return {
        kind: "defaults",
        system,
        seenFields: new Set<string>(),
      };
    case "atlas":
      if (!system) {
        throw new WorldOrbitError(
          'Draft section "atlas" requires a preceding system declaration',
          line,
          tokens[0].column,
        );
      }
      if (flags.sawAtlas) {
        throw new WorldOrbitError(
          'Draft section "atlas" may only appear once',
          line,
          tokens[0].column,
        );
      }
      return {
        kind: "atlas",
        system,
        inMetadata: false,
        metadataIndent: null,
      };
    case "viewpoint":
      if (!system) {
        throw new WorldOrbitError(
          'Draft section "viewpoint" requires a preceding system declaration',
          line,
          tokens[0].column,
        );
      }
      return startViewpointSection(tokens, line, system, viewpointIds);
    case "annotation":
      if (!system) {
        throw new WorldOrbitError(
          'Draft section "annotation" requires a preceding system declaration',
          line,
          tokens[0].column,
        );
      }
      return startAnnotationSection(tokens, line, system, annotationIds);
    case "object":
      return startObjectSection(tokens, line, objectNodes);
    default:
      throw new WorldOrbitError(
        `Unknown draft section "${tokens[0]?.value ?? ""}"`,
        line,
        tokens[0]?.column ?? 1,
      );
  }
}

function startSystemSection(tokens: LineToken[], line: number): DraftSectionState {
  if (tokens.length !== 2) {
    throw new WorldOrbitError(
      "Invalid draft system declaration",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const system: WorldOrbitDraftSystem = {
    type: "system",
    id: tokens[1].value,
    title: null,
    defaults: {
      view: "topdown",
      scale: null,
      units: null,
      preset: null,
      theme: null,
    },
    atlasMetadata: {},
    viewpoints: [],
    annotations: [],
  };

  return {
    kind: "system",
    system,
    seenFields: new Set<string>(),
  };
}

function startViewpointSection(
  tokens: LineToken[],
  line: number,
  system: WorldOrbitDraftSystem,
  viewpointIds: Set<string>,
): DraftSectionState {
  if (tokens.length !== 2) {
    throw new WorldOrbitError(
      "Invalid viewpoint declaration",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const id = normalizeIdentifier(tokens[1].value);
  if (!id) {
    throw new WorldOrbitError("Viewpoint id must not be empty", line, tokens[1].column);
  }
  if (viewpointIds.has(id)) {
    throw new WorldOrbitError(`Duplicate viewpoint id "${id}"`, line, tokens[1].column);
  }

  const viewpoint: WorldOrbitDraftViewpoint = {
    id,
    label: humanizeIdentifier(id),
    summary: "",
    focusObjectId: null,
    selectedObjectId: null,
    projection: system.defaults.view,
    preset: system.defaults.preset,
    zoom: null,
    rotationDeg: 0,
    layers: {},
    filter: null,
  };

  system.viewpoints.push(viewpoint);
  viewpointIds.add(id);

  return {
    kind: "viewpoint",
    viewpoint,
    seenFields: new Set<string>(),
    inFilter: false,
    filterIndent: null,
    seenFilterFields: new Set<string>(),
  };
}

function startAnnotationSection(
  tokens: LineToken[],
  line: number,
  system: WorldOrbitDraftSystem,
  annotationIds: Set<string>,
): DraftSectionState {
  if (tokens.length !== 2) {
    throw new WorldOrbitError(
      "Invalid annotation declaration",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const id = normalizeIdentifier(tokens[1].value);
  if (!id) {
    throw new WorldOrbitError("Annotation id must not be empty", line, tokens[1].column);
  }
  if (annotationIds.has(id)) {
    throw new WorldOrbitError(`Duplicate annotation id "${id}"`, line, tokens[1].column);
  }

  const annotation: WorldOrbitDraftAnnotation = {
    id,
    label: humanizeIdentifier(id),
    targetObjectId: null,
    body: "",
    tags: [],
    sourceObjectId: null,
  };

  system.annotations.push(annotation);
  annotationIds.add(id);

  return {
    kind: "annotation",
    annotation,
    seenFields: new Set<string>(),
  };
}

function startObjectSection(
  tokens: LineToken[],
  line: number,
  objectNodes: AstObjectNode[],
): DraftSectionState {
  if (tokens.length < 3) {
    throw new WorldOrbitError(
      "Invalid draft object declaration",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const objectTypeToken = tokens[1];
  const idToken = tokens[2];
  const objectType = objectTypeToken.value as WorldOrbitObjectType;

  if (
    !WORLDORBIT_OBJECT_TYPES.has(objectType) ||
    objectType === "system"
  ) {
    throw new WorldOrbitError(
      `Unknown object type "${objectTypeToken.value}"`,
      line,
      objectTypeToken.column,
    );
  }

  const objectNode: AstObjectNode = {
    type: "object",
    objectType,
    name: idToken.value,
    inlineFields: parseInlineFields(tokens.slice(3), line),
    blockFields: [],
    infoEntries: [],
    location: {
      line,
      column: objectTypeToken.column,
    },
  };

  objectNodes.push(objectNode);

  return {
    kind: "object",
    objectNode,
    inInfoBlock: false,
    infoIndent: null,
  };
}

function handleSectionLine(
  section: DraftSectionState,
  indent: number,
  tokens: LineToken[],
  line: number,
): void {
  switch (section.kind) {
    case "system":
      applySystemField(section, tokens, line);
      return;
    case "defaults":
      applyDefaultsField(section, tokens, line);
      return;
    case "atlas":
      applyAtlasField(section, indent, tokens, line);
      return;
    case "viewpoint":
      applyViewpointField(section, indent, tokens, line);
      return;
    case "annotation":
      applyAnnotationField(section, tokens, line);
      return;
    case "object":
      applyObjectField(section, indent, tokens, line);
      return;
  }
}

function applySystemField(
  section: Extract<DraftSectionState, { kind: "system" }>,
  tokens: LineToken[],
  line: number,
): void {
  const key = requireUniqueField(tokens, section.seenFields, line);

  if (key !== "title") {
    throw new WorldOrbitError(
      `Unknown system draft field "${tokens[0].value}"`,
      line,
      tokens[0].column,
    );
  }

  section.system.title = joinFieldValue(tokens, line);
}

function applyDefaultsField(
  section: Extract<DraftSectionState, { kind: "defaults" }>,
  tokens: LineToken[],
  line: number,
): void {
  const key = requireUniqueField(tokens, section.seenFields, line);
  const value = joinFieldValue(tokens, line);

  switch (key) {
    case "view":
      section.system.defaults.view = parseProjectionValue(value, line, tokens[0].column);
      return;
    case "scale":
      section.system.defaults.scale = value;
      return;
    case "units":
      section.system.defaults.units = value;
      return;
    case "preset":
      section.system.defaults.preset = parsePresetValue(value, line, tokens[0].column);
      return;
    case "theme":
      section.system.defaults.theme = value;
      return;
    default:
      throw new WorldOrbitError(
        `Unknown defaults field "${tokens[0].value}"`,
        line,
        tokens[0].column,
      );
  }
}

function applyAtlasField(
  section: Extract<DraftSectionState, { kind: "atlas" }>,
  indent: number,
  tokens: LineToken[],
  line: number,
): void {
  if (section.inMetadata && indent <= (section.metadataIndent ?? 0)) {
    section.inMetadata = false;
    section.metadataIndent = null;
  }

  if (section.inMetadata) {
    if (tokens.length < 2) {
      throw new WorldOrbitError("Invalid atlas metadata entry", line, tokens[0]?.column ?? 1);
    }

    const key = tokens[0].value;
    if (key in section.system.atlasMetadata) {
      throw new WorldOrbitError(
        `Duplicate atlas metadata key "${key}"`,
        line,
        tokens[0].column,
      );
    }

    section.system.atlasMetadata[key] = joinFieldValue(tokens, line);
    return;
  }

  if (tokens.length === 1 && tokens[0].value.toLowerCase() === "metadata") {
    section.inMetadata = true;
    section.metadataIndent = indent;
    return;
  }

  throw new WorldOrbitError(
    `Unknown atlas draft field "${tokens[0].value}"`,
    line,
    tokens[0].column,
  );
}

function applyViewpointField(
  section: Extract<DraftSectionState, { kind: "viewpoint" }>,
  indent: number,
  tokens: LineToken[],
  line: number,
): void {
  if (section.inFilter && indent <= (section.filterIndent ?? 0)) {
    section.inFilter = false;
    section.filterIndent = null;
  }

  if (section.inFilter) {
    applyViewpointFilterField(section, tokens, line);
    return;
  }

  if (tokens.length === 1 && tokens[0].value.toLowerCase() === "filter") {
    if (section.seenFields.has("filter")) {
      throw new WorldOrbitError('Duplicate viewpoint field "filter"', line, tokens[0].column);
    }
    section.seenFields.add("filter");
    section.inFilter = true;
    section.filterIndent = indent;
    return;
  }

  const key = requireUniqueField(tokens, section.seenFields, line);
  const value = joinFieldValue(tokens, line);

  switch (key) {
    case "label":
      section.viewpoint.label = value;
      return;
    case "summary":
      section.viewpoint.summary = value;
      return;
    case "focus":
      section.viewpoint.focusObjectId = value;
      return;
    case "select":
      section.viewpoint.selectedObjectId = value;
      return;
    case "projection":
      section.viewpoint.projection = parseProjectionValue(value, line, tokens[0].column);
      return;
    case "preset":
      section.viewpoint.preset = parsePresetValue(value, line, tokens[0].column);
      return;
    case "zoom":
      section.viewpoint.zoom = parsePositiveNumber(value, line, tokens[0].column, "zoom");
      return;
    case "rotation":
      section.viewpoint.rotationDeg = parseFiniteNumber(
        value,
        line,
        tokens[0].column,
        "rotation",
      );
      return;
    case "layers":
      section.viewpoint.layers = parseLayerTokens(tokens.slice(1), line);
      return;
    default:
      throw new WorldOrbitError(
        `Unknown viewpoint field "${tokens[0].value}"`,
        line,
        tokens[0].column,
      );
  }
}

function applyViewpointFilterField(
  section: Extract<DraftSectionState, { kind: "viewpoint" }>,
  tokens: LineToken[],
  line: number,
): void {
  const key = requireUniqueField(tokens, section.seenFilterFields, line);
  const filter = section.viewpoint.filter ?? createEmptyViewpointFilter();

  switch (key) {
    case "query":
      filter.query = joinFieldValue(tokens, line);
      break;
    case "objecttypes":
      filter.objectTypes = parseObjectTypeTokens(tokens.slice(1), line);
      break;
    case "tags":
      filter.tags = parseTokenList(tokens.slice(1), line, "tags");
      break;
    case "groups":
      filter.groupIds = parseTokenList(tokens.slice(1), line, "groups");
      break;
    default:
      throw new WorldOrbitError(
        `Unknown viewpoint filter field "${tokens[0].value}"`,
        line,
        tokens[0].column,
      );
  }

  section.viewpoint.filter = filter;
}

function applyAnnotationField(
  section: Extract<DraftSectionState, { kind: "annotation" }>,
  tokens: LineToken[],
  line: number,
): void {
  const key = requireUniqueField(tokens, section.seenFields, line);

  switch (key) {
    case "label":
      section.annotation.label = joinFieldValue(tokens, line);
      return;
    case "target":
      section.annotation.targetObjectId = joinFieldValue(tokens, line);
      return;
    case "body":
      section.annotation.body = joinFieldValue(tokens, line);
      return;
    case "tags":
      section.annotation.tags = parseTokenList(tokens.slice(1), line, "tags");
      return;
    default:
      throw new WorldOrbitError(
        `Unknown annotation field "${tokens[0].value}"`,
        line,
        tokens[0].column,
      );
  }
}

function applyObjectField(
  section: Extract<DraftSectionState, { kind: "object" }>,
  indent: number,
  tokens: LineToken[],
  line: number,
): void {
  if (tokens.length === 1 && tokens[0].value === "info") {
    section.inInfoBlock = true;
    section.infoIndent = indent;
    return;
  }

  if (section.inInfoBlock && indent <= (section.infoIndent ?? 0)) {
    section.inInfoBlock = false;
    section.infoIndent = null;
  }

  if (section.inInfoBlock) {
    section.objectNode.infoEntries.push(parseInfoEntry(tokens, line));
    return;
  }

  section.objectNode.blockFields.push(parseField(tokens, line));
}

function requireUniqueField(
  tokens: LineToken[],
  seenFields: Set<string>,
  line: number,
): string {
  if (tokens.length < 2) {
    throw new WorldOrbitError("Invalid draft field line", line, tokens[0]?.column ?? 1);
  }

  const key = tokens[0].value.toLowerCase();
  if (seenFields.has(key)) {
    throw new WorldOrbitError(`Duplicate draft field "${tokens[0].value}"`, line, tokens[0].column);
  }

  seenFields.add(key);
  return key;
}

function joinFieldValue(tokens: LineToken[], line: number): string {
  if (tokens.length < 2) {
    throw new WorldOrbitError("Missing value for draft field", line, tokens[0]?.column ?? 1);
  }

  return tokens
    .slice(1)
    .map((token) => token.value)
    .join(" ")
    .trim();
}

function parseObjectTypeTokens(
  tokens: LineToken[],
  line: number,
): Array<WorldOrbitObject["type"]> {
  if (tokens.length === 0) {
    throw new WorldOrbitError("Missing value for draft field", line);
  }

  return tokens.map((token) => {
    const value = token.value as WorldOrbitObject["type"];
    if (
      value !== "star" &&
      value !== "planet" &&
      value !== "moon" &&
      value !== "belt" &&
      value !== "asteroid" &&
      value !== "comet" &&
      value !== "ring" &&
      value !== "structure" &&
      value !== "phenomenon"
    ) {
      throw new WorldOrbitError(
        `Unknown viewpoint object type "${token.value}"`,
        line,
        token.column,
      );
    }

    return value;
  });
}

function parseTokenList(tokens: LineToken[], line: number, field: string): string[] {
  if (tokens.length === 0) {
    throw new WorldOrbitError(`Missing value for field "${field}"`, line);
  }

  return tokens.map((token) => token.value);
}

function parseLayerTokens(
  tokens: LineToken[],
  line: number,
): Partial<Record<RenderSceneLayer["id"], boolean>> {
  if (tokens.length === 0) {
    throw new WorldOrbitError('Missing value for field "layers"', line);
  }

  const next: Partial<Record<RenderSceneLayer["id"], boolean>> = {};

  for (const token of tokens) {
    const enabled = !token.value.startsWith("-") && !token.value.startsWith("!");
    const rawLayer = token.value.replace(/^[-!]+/, "").toLowerCase();

    if (rawLayer === "orbits") {
      next["orbits-back"] = enabled;
      next["orbits-front"] = enabled;
      continue;
    }

    if (
      rawLayer === "background" ||
      rawLayer === "guides" ||
      rawLayer === "orbits-back" ||
      rawLayer === "orbits-front" ||
      rawLayer === "objects" ||
      rawLayer === "labels" ||
      rawLayer === "metadata"
    ) {
      next[rawLayer] = enabled;
      continue;
    }

    throw new WorldOrbitError(
      `Unknown layer token "${token.value}"`,
      line,
      token.column,
    );
  }

  return next;
}

function parseProjectionValue(
  value: string,
  line: number,
  column: number,
): ViewProjection {
  const normalized = value.toLowerCase();
  if (normalized === "topdown" || normalized === "isometric") {
    return normalized;
  }

  throw new WorldOrbitError(`Unknown projection "${value}"`, line, column);
}

function parsePresetValue(
  value: string,
  line: number,
  column: number,
): RenderPresetName {
  const normalized = value.toLowerCase();
  if (
    normalized === "diagram" ||
    normalized === "presentation" ||
    normalized === "atlas-card" ||
    normalized === "markdown"
  ) {
    return normalized;
  }

  throw new WorldOrbitError(`Unknown render preset "${value}"`, line, column);
}

function parsePositiveNumber(
  value: string,
  line: number,
  column: number,
  field: string,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new WorldOrbitError(
      `Field "${field}" expects a positive number`,
      line,
      column,
    );
  }

  return parsed;
}

function parseFiniteNumber(
  value: string,
  line: number,
  column: number,
  field: string,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new WorldOrbitError(
      `Field "${field}" expects a finite number`,
      line,
      column,
    );
  }

  return parsed;
}

function createEmptyViewpointFilter(): RenderSceneViewpointFilter {
  return {
    query: null,
    objectTypes: [],
    tags: [],
    groupIds: [],
  };
}

function parseInlineFields(tokens: LineToken[], line: number): AstFieldNode[] {
  const fields: AstFieldNode[] = [];
  let index = 0;

  while (index < tokens.length) {
    const keyToken = tokens[index];
    const schema = getFieldSchema(keyToken.value);

    if (!schema) {
      throw new WorldOrbitError(
        `Unknown field "${keyToken.value}"`,
        line,
        keyToken.column,
      );
    }

    index++;
    const valueTokens: LineToken[] = [];

    if (schema.arity === "multiple") {
      while (index < tokens.length && !isKnownFieldKey(tokens[index].value)) {
        valueTokens.push(tokens[index]);
        index++;
      }
    } else {
      const nextToken = tokens[index];
      if (nextToken) {
        valueTokens.push(nextToken);
        index++;
      }
    }

    if (valueTokens.length === 0) {
      throw new WorldOrbitError(
        `Missing value for field "${keyToken.value}"`,
        line,
        keyToken.column,
      );
    }

    fields.push({
      type: "field",
      key: keyToken.value,
      values: valueTokens.map((token) => token.value),
      location: { line, column: keyToken.column },
    });
  }

  return fields;
}

function parseField(tokens: LineToken[], line: number): AstFieldNode {
  if (tokens.length < 2) {
    throw new WorldOrbitError(
      "Invalid field line",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  if (!getFieldSchema(tokens[0].value)) {
    throw new WorldOrbitError(
      `Unknown field "${tokens[0].value}"`,
      line,
      tokens[0].column,
    );
  }

  return {
    type: "field",
    key: tokens[0].value,
    values: tokens.slice(1).map((token) => token.value),
    location: { line, column: tokens[0].column },
  };
}

function parseInfoEntry(tokens: LineToken[], line: number): AstInfoEntryNode {
  if (tokens.length < 2) {
    throw new WorldOrbitError(
      "Invalid info entry",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  return {
    type: "info-entry",
    key: tokens[0].value,
    value: tokens.slice(1).map((token) => token.value).join(" "),
    location: { line, column: tokens[0].column },
  };
}

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeIdentifier(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");
}
