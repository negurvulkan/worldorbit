import { WorldOrbitError } from "./errors.js";
import { getFieldSchema, WORLDORBIT_OBJECT_TYPES } from "./schema.js";
import { getIndent, tokenizeLineDetailed } from "./tokenize.js";
import type {
  AstFieldNode,
  AstInfoEntryNode,
  AstSourceLocation,
  LineToken,
  RenderPresetName,
  RenderSceneLayer,
  RenderSceneViewpointFilter,
  ViewProjection,
  WorldOrbitAtlasDocument,
  WorldOrbitAtlasDocumentVersion,
  WorldOrbitDiagnostic,
  WorldOrbitDraftAnnotation,
  WorldOrbitDraftDocument,
  WorldOrbitDraftDocumentVersion,
  WorldOrbitEvent,
  WorldOrbitEventPose,
  WorldOrbitDraftSystem,
  WorldOrbitDraftViewpoint,
  WorldOrbitFieldSchema,
  WorldOrbitGroup,
  WorldOrbitObject,
  WorldOrbitObjectType,
  WorldOrbitRelation,
  WorldOrbitTypedBlockName,
  WorldOrbitViewCamera,
} from "./types.js";
import {
  ensureAtlasFieldSupported,
  humanizeIdentifier,
  normalizeIdentifier,
  normalizeLegacyScalarValue,
  parseAtlasAtReference,
  parseAtlasBoolean,
  parseAtlasNumber,
  parseAtlasUnitValue,
  singleAtlasValue,
  tryParseAtlasUnitValue,
} from "./atlas-utils.js";
import { collectAtlasDiagnostics } from "./atlas-validate.js";

type SourceSchemaVersion =
  | WorldOrbitAtlasDocumentVersion
  | WorldOrbitDraftDocumentVersion;
type DraftOutputVersion =
  | WorldOrbitAtlasDocumentVersion
  | WorldOrbitDraftDocumentVersion;

interface AtlasComment {
  kind: "line" | "block";
  line: number;
  column: number;
}

interface PreparedAtlasSource {
  source: string;
  comments: AtlasComment[];
}

interface DraftRawObject {
  objectType: Exclude<WorldOrbitObjectType, "system">;
  id: string;
  fields: AstFieldNode[];
  infoEntries: AstInfoEntryNode[];
  typedBlockEntries: Partial<Record<WorldOrbitTypedBlockName, AstInfoEntryNode[]>>;
  location: AstSourceLocation;
}

interface DraftRawEventPose {
  objectId: string;
  fields: AstFieldNode[];
  location: AstSourceLocation;
}

type ObjectBlockKind = "info" | WorldOrbitTypedBlockName;

type DraftSectionState =
  | {
      kind: "system";
      system: WorldOrbitDraftSystem;
      sourceSchemaVersion: SourceSchemaVersion;
      diagnostics: WorldOrbitDiagnostic[];
      seenFields: Set<string>;
    }
  | {
      kind: "defaults";
      system: WorldOrbitDraftSystem;
      sourceSchemaVersion: SourceSchemaVersion;
      diagnostics: WorldOrbitDiagnostic[];
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
      sourceSchemaVersion: SourceSchemaVersion;
      diagnostics: WorldOrbitDiagnostic[];
      seenFields: Set<string>;
      inFilter: boolean;
      filterIndent: number | null;
      seenFilterFields: Set<string>;
      inCamera: boolean;
      cameraIndent: number | null;
      seenCameraFields: Set<string>;
    }
  | {
      kind: "annotation";
      annotation: WorldOrbitDraftAnnotation;
      seenFields: Set<string>;
    }
  | {
      kind: "group";
      group: WorldOrbitGroup;
      seenFields: Set<string>;
    }
  | {
      kind: "relation";
      relation: WorldOrbitRelation;
      seenFields: Set<string>;
    }
  | {
      kind: "event";
      event: WorldOrbitEvent;
      sourceSchemaVersion: SourceSchemaVersion;
      diagnostics: WorldOrbitDiagnostic[];
      seenFields: Set<string>;
      rawPoses: DraftRawEventPose[];
      inPositions: boolean;
      positionsIndent: number | null;
      activePose: DraftRawEventPose | null;
      poseIndent: number | null;
      activePoseSeenFields: Set<string>;
    }
  | {
      kind: "object";
      objectNode: DraftRawObject;
      sourceSchemaVersion: SourceSchemaVersion;
      diagnostics: WorldOrbitDiagnostic[];
      activeBlock: ObjectBlockKind | null;
      blockIndent: number | null;
      seenInfoKeys: Set<string>;
      seenTypedBlockKeys: Partial<Record<WorldOrbitTypedBlockName, Set<string>>>;
    };

interface DraftObjectFieldSpec {
  key: string;
  version: "2.0" | "2.1" | "2.5" | "2.6";
  inlineMode: "single" | "multiple" | "pair";
  allowRepeat: boolean;
  legacySchema?: WorldOrbitFieldSchema;
}

const STRUCTURED_TYPED_BLOCKS = new Set<WorldOrbitTypedBlockName>([
  "climate",
  "habitability",
  "settlement",
]);

const DRAFT_OBJECT_FIELD_SPECS = new Map<string, DraftObjectFieldSpec>();

for (const key of [
  "orbit",
  "distance",
  "semiMajor",
  "eccentricity",
  "period",
  "angle",
  "inclination",
  "phase",
  "at",
  "surface",
  "free",
  "kind",
  "class",
  "culture",
  "tags",
  "color",
  "image",
  "hidden",
  "radius",
  "mass",
  "density",
  "gravity",
  "temperature",
  "albedo",
  "atmosphere",
  "inner",
  "outer",
  "on",
  "source",
  "cycle",
] as const) {
  const schema = getFieldSchema(key);
  if (schema) {
    DRAFT_OBJECT_FIELD_SPECS.set(key, {
      key,
      version: "2.0",
      inlineMode: schema.arity === "multiple" ? "multiple" : "single",
      allowRepeat: false,
      legacySchema: schema,
    });
  }
}

for (const spec of [
  { key: "groups", inlineMode: "multiple", allowRepeat: false },
  { key: "epoch", inlineMode: "single", allowRepeat: false },
  { key: "referencePlane", inlineMode: "single", allowRepeat: false },
  { key: "tidalLock", inlineMode: "single", allowRepeat: false },
  { key: "renderLabel", inlineMode: "single", allowRepeat: false },
  { key: "renderOrbit", inlineMode: "single", allowRepeat: false },
  { key: "renderPriority", inlineMode: "single", allowRepeat: false },
  { key: "resonance", inlineMode: "pair", allowRepeat: false },
  { key: "derive", inlineMode: "pair", allowRepeat: true },
  { key: "validate", inlineMode: "single", allowRepeat: true },
  { key: "locked", inlineMode: "multiple", allowRepeat: false },
  { key: "tolerance", inlineMode: "pair", allowRepeat: true },
] as const) {
  DRAFT_OBJECT_FIELD_SPECS.set(spec.key, {
    key: spec.key,
    version: "2.1",
    inlineMode: spec.inlineMode,
    allowRepeat: spec.allowRepeat,
  });
}

const DRAFT_OBJECT_FIELD_KEYS = new Set(DRAFT_OBJECT_FIELD_SPECS.keys());
const EVENT_POSE_FIELD_KEYS = new Set([
  "orbit",
  "distance",
  "semiMajor",
  "eccentricity",
  "period",
  "angle",
  "inclination",
  "phase",
  "at",
  "surface",
  "free",
  "inner",
  "outer",
  "epoch",
  "referencePlane",
]);

export function parseWorldOrbitAtlas(source: string): WorldOrbitAtlasDocument {
  return parseAtlasSource(source) as WorldOrbitAtlasDocument;
}

export function parseWorldOrbitDraft(source: string): WorldOrbitDraftDocument {
  return parseAtlasSource(source, "2.0-draft") as WorldOrbitDraftDocument;
}

function parseAtlasSource(
  source: string,
  forcedOutputVersion?: DraftOutputVersion,
): WorldOrbitAtlasDocument | WorldOrbitDraftDocument {
  const prepared = preprocessAtlasSource(source);
  const lines = prepared.source.split(/\r?\n/);
  const diagnostics: WorldOrbitDiagnostic[] = [];
  let sawSchemaHeader = false;
  let sourceSchemaVersion: SourceSchemaVersion = "2.0";
  let system: WorldOrbitDraftSystem | null = null;
  let section: DraftSectionState | null = null;
  const objectNodes: DraftRawObject[] = [];
  const groups: WorldOrbitGroup[] = [];
  const relations: WorldOrbitRelation[] = [];
  const events: WorldOrbitEvent[] = [];
  const eventPoseNodes = new Map<string, DraftRawEventPose[]>();
  let sawDefaults = false;
  let sawAtlas = false;
  const viewpointIds = new Set<string>();
  const annotationIds = new Set<string>();
  const groupIds = new Set<string>();
  const relationIds = new Set<string>();
  const eventIds = new Set<string>();

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
      sourceSchemaVersion = assertDraftSchemaHeader(tokens, lineNumber);
      sawSchemaHeader = true;
      if (prepared.comments.length > 0 && isSchemaOlderThan(sourceSchemaVersion, "2.1")) {
        diagnostics.push({
          code: "parse.schema21.commentCompatibility",
          severity: "warning",
          source: "parse",
          message: `Comments require schema 2.1; parsed in compatibility mode because the document header is "schema ${sourceSchemaVersion}".`,
          line: prepared.comments[0].line,
          column: prepared.comments[0].column,
        });
      }
      continue;
    }

    if (indent === 0) {
      section = startTopLevelSection(
        tokens,
        lineNumber,
        sourceSchemaVersion,
        diagnostics,
        system,
        objectNodes,
        groups,
        relations,
        events,
        eventPoseNodes,
        viewpointIds,
        annotationIds,
        groupIds,
        relationIds,
        eventIds,
        { sawDefaults, sawAtlas },
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
        "Indented line without parent atlas section",
        lineNumber,
        indent + 1,
      );
    }

    handleSectionLine(section, indent, tokens, lineNumber);
  }

  if (!sawSchemaHeader) {
    throw new WorldOrbitError('Missing required atlas schema header "schema 2.0"');
  }

  const objects = objectNodes.map((node) =>
    normalizeDraftObject(node, sourceSchemaVersion, diagnostics),
  );
  const normalizedEvents = events.map((event) =>
    normalizeDraftEvent(event, eventPoseNodes.get(event.id) ?? []),
  );

  const outputVersion =
    forcedOutputVersion ??
    (sourceSchemaVersion === "2.0-draft" ? "2.0" : sourceSchemaVersion);

  const baseDocument = {
    format: "worldorbit" as const,
    sourceVersion: "1.0" as const,
    theme: null,
    system,
    groups,
    relations,
    events: normalizedEvents,
    objects,
    diagnostics,
  };

  if (outputVersion === "2.0-draft") {
    const document: WorldOrbitDraftDocument = {
      ...baseDocument,
      version: "2.0-draft",
      schemaVersion: "2.0-draft",
    };
    document.diagnostics.push(...collectAtlasDiagnostics(document, sourceSchemaVersion));
    return document;
  }

  const document: WorldOrbitAtlasDocument = {
    ...baseDocument,
    version: outputVersion,
    schemaVersion: outputVersion,
  };

  if (sourceSchemaVersion === "2.0-draft") {
    document.diagnostics.push({
      code: "load.schema.deprecatedDraft",
      severity: "warning",
      source: "upgrade",
      message:
        'Source header "schema 2.0-draft" is deprecated; canonical v2 documents now use "schema 2.0".',
    });
  }

  document.diagnostics.push(...collectAtlasDiagnostics(document, sourceSchemaVersion));
  return document;
}

function assertDraftSchemaHeader(
  tokens: LineToken[],
  line: number,
): SourceSchemaVersion {
  if (
    tokens.length !== 2 ||
    tokens[0].value.toLowerCase() !== "schema" ||
    !["2.0-draft", "2.0", "2.1", "2.5", "2.6"].includes(tokens[1].value.toLowerCase())
  ) {
    throw new WorldOrbitError(
      'Expected atlas header "schema 2.0", "schema 2.1", "schema 2.5", "schema 2.6", or legacy "schema 2.0-draft"',
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const version = tokens[1].value.toLowerCase();
  return version === "2.6"
    ? "2.6"
    : version === "2.5"
    ? "2.5"
    : version === "2.1"
    ? "2.1"
    : version === "2.0-draft"
      ? "2.0-draft"
      : "2.0";
}

function startTopLevelSection(
  tokens: LineToken[],
  line: number,
  sourceSchemaVersion: SourceSchemaVersion,
  diagnostics: WorldOrbitDiagnostic[],
  system: WorldOrbitDraftSystem | null,
  objectNodes: DraftRawObject[],
  groups: WorldOrbitGroup[],
  relations: WorldOrbitRelation[],
  events: WorldOrbitEvent[],
  eventPoseNodes: Map<string, DraftRawEventPose[]>,
  viewpointIds: Set<string>,
  annotationIds: Set<string>,
  groupIds: Set<string>,
  relationIds: Set<string>,
  eventIds: Set<string>,
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
          'Atlas section "system" may only appear once',
          line,
          tokens[0].column,
        );
      }
      return startSystemSection(tokens, line, sourceSchemaVersion, diagnostics);
    case "defaults":
      if (!system) {
        throw new WorldOrbitError(
          'Atlas section "defaults" requires a preceding system declaration',
          line,
          tokens[0].column,
        );
      }
      if (flags.sawDefaults) {
        throw new WorldOrbitError(
          'Atlas section "defaults" may only appear once',
          line,
          tokens[0].column,
        );
      }
      return {
        kind: "defaults",
        system,
        sourceSchemaVersion,
        diagnostics,
        seenFields: new Set<string>(),
      };
    case "atlas":
      if (!system) {
        throw new WorldOrbitError(
          'Atlas section "atlas" requires a preceding system declaration',
          line,
          tokens[0].column,
        );
      }
      if (flags.sawAtlas) {
        throw new WorldOrbitError(
          'Atlas section "atlas" may only appear once',
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
          'Atlas section "viewpoint" requires a preceding system declaration',
          line,
          tokens[0].column,
        );
      }
      return startViewpointSection(tokens, line, system, viewpointIds, sourceSchemaVersion, diagnostics);
    case "annotation":
      if (!system) {
        throw new WorldOrbitError(
          'Atlas section "annotation" requires a preceding system declaration',
          line,
          tokens[0].column,
        );
      }
      return startAnnotationSection(tokens, line, system, annotationIds);
    case "group":
      warnIfSchema21Feature(
        sourceSchemaVersion,
        diagnostics,
        "group",
        { line, column: tokens[0].column },
      );
      return startGroupSection(tokens, line, groups, groupIds);
    case "relation":
      warnIfSchema21Feature(
        sourceSchemaVersion,
        diagnostics,
        "relation",
        { line, column: tokens[0].column },
      );
      return startRelationSection(tokens, line, relations, relationIds);
    case "event":
      warnIfSchema21Feature(
        sourceSchemaVersion,
        diagnostics,
        "event",
        { line, column: tokens[0].column },
      );
      return startEventSection(tokens, line, events, eventPoseNodes, eventIds, sourceSchemaVersion, diagnostics);
    case "object":
      return startObjectSection(tokens, line, sourceSchemaVersion, diagnostics, objectNodes);
    default:
      throw new WorldOrbitError(
        `Unknown atlas section "${tokens[0]?.value ?? ""}"`,
        line,
        tokens[0]?.column ?? 1,
      );
  }
}

function startSystemSection(
  tokens: LineToken[],
  line: number,
  sourceSchemaVersion: SourceSchemaVersion,
  diagnostics: WorldOrbitDiagnostic[],
): DraftSectionState {
  if (tokens.length !== 2) {
    throw new WorldOrbitError(
      "Invalid atlas system declaration",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const system: WorldOrbitDraftSystem = {
    type: "system",
    id: tokens[1].value,
    title: null,
    description: null,
    epoch: null,
    referencePlane: null,
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
    sourceSchemaVersion,
    diagnostics,
    seenFields: new Set<string>(),
  };
}

function startViewpointSection(
  tokens: LineToken[],
  line: number,
  system: WorldOrbitDraftSystem,
  viewpointIds: Set<string>,
  sourceSchemaVersion: SourceSchemaVersion,
  diagnostics: WorldOrbitDiagnostic[],
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
    events: [],
    projection: system.defaults.view,
    preset: system.defaults.preset,
    zoom: null,
    rotationDeg: 0,
    camera: null,
    layers: {},
    filter: null,
  };

  system.viewpoints.push(viewpoint);
  viewpointIds.add(id);

  return {
    kind: "viewpoint",
    viewpoint,
    sourceSchemaVersion,
    diagnostics,
    seenFields: new Set<string>(),
    inFilter: false,
    filterIndent: null,
    seenFilterFields: new Set<string>(),
    inCamera: false,
    cameraIndent: null,
    seenCameraFields: new Set<string>(),
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

function startGroupSection(
  tokens: LineToken[],
  line: number,
  groups: WorldOrbitGroup[],
  groupIds: Set<string>,
): DraftSectionState {
  if (tokens.length !== 2) {
    throw new WorldOrbitError(
      "Invalid group declaration",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const id = normalizeIdentifier(tokens[1].value);
  if (!id) {
    throw new WorldOrbitError("Group id must not be empty", line, tokens[1].column);
  }
  if (groupIds.has(id)) {
    throw new WorldOrbitError(`Duplicate group id "${id}"`, line, tokens[1].column);
  }

  const group: WorldOrbitGroup = {
    id,
    label: humanizeIdentifier(id),
    summary: "",
    color: null,
    tags: [],
    hidden: false,
  };

  groups.push(group);
  groupIds.add(id);

  return {
    kind: "group",
    group,
    seenFields: new Set<string>(),
  };
}

function startRelationSection(
  tokens: LineToken[],
  line: number,
  relations: WorldOrbitRelation[],
  relationIds: Set<string>,
): DraftSectionState {
  if (tokens.length !== 2) {
    throw new WorldOrbitError(
      "Invalid relation declaration",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const id = normalizeIdentifier(tokens[1].value);
  if (!id) {
    throw new WorldOrbitError("Relation id must not be empty", line, tokens[1].column);
  }
  if (relationIds.has(id)) {
    throw new WorldOrbitError(`Duplicate relation id "${id}"`, line, tokens[1].column);
  }

  const relation: WorldOrbitRelation = {
    id,
    from: "",
    to: "",
    kind: "",
    label: null,
    summary: null,
    tags: [],
    color: null,
    hidden: false,
  };

  relations.push(relation);
  relationIds.add(id);

  return {
    kind: "relation",
    relation,
    seenFields: new Set<string>(),
  };
}

function startEventSection(
  tokens: LineToken[],
  line: number,
  events: WorldOrbitEvent[],
  eventPoseNodes: Map<string, DraftRawEventPose[]>,
  eventIds: Set<string>,
  sourceSchemaVersion: SourceSchemaVersion,
  diagnostics: WorldOrbitDiagnostic[],
): DraftSectionState {
  if (tokens.length !== 2) {
    throw new WorldOrbitError(
      "Invalid event declaration",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const id = normalizeIdentifier(tokens[1].value);
  if (!id) {
    throw new WorldOrbitError("Event id must not be empty", line, tokens[1].column);
  }
  if (eventIds.has(id)) {
    throw new WorldOrbitError(`Duplicate event id "${id}"`, line, tokens[1].column);
  }

  const event: WorldOrbitEvent = {
    id,
    kind: "",
    label: humanizeIdentifier(id),
    summary: null,
    targetObjectId: null,
    participantObjectIds: [],
    timing: null,
    visibility: null,
    epoch: null,
    referencePlane: null,
    tags: [],
    color: null,
    hidden: false,
    positions: [],
  };

  const rawPoses: DraftRawEventPose[] = [];
  events.push(event);
  eventPoseNodes.set(id, rawPoses);
  eventIds.add(id);

  return {
    kind: "event",
    event,
    sourceSchemaVersion,
    diagnostics,
    seenFields: new Set<string>(),
    rawPoses,
    inPositions: false,
    positionsIndent: null,
    activePose: null,
    poseIndent: null,
    activePoseSeenFields: new Set<string>(),
  };
}

function startObjectSection(
  tokens: LineToken[],
  line: number,
  sourceSchemaVersion: SourceSchemaVersion,
  diagnostics: WorldOrbitDiagnostic[],
  objectNodes: DraftRawObject[],
): DraftSectionState {
  if (tokens.length < 3) {
    throw new WorldOrbitError(
      "Invalid atlas object declaration",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const objectTypeToken = tokens[1];
  const idToken = tokens[2];
  const objectType = objectTypeToken.value as WorldOrbitObjectType;

  if (!WORLDORBIT_OBJECT_TYPES.has(objectType) || objectType === "system") {
    throw new WorldOrbitError(
      `Unknown object type "${objectTypeToken.value}"`,
      line,
      objectTypeToken.column,
    );
  }

  const objectNode: DraftRawObject = {
    objectType: objectType as Exclude<WorldOrbitObjectType, "system">,
    id: idToken.value,
    fields: parseInlineObjectFields(
      tokens.slice(3),
      line,
      objectType as Exclude<WorldOrbitObjectType, "system">,
      sourceSchemaVersion,
      diagnostics,
    ),
    infoEntries: [],
    typedBlockEntries: {},
    location: {
      line,
      column: objectTypeToken.column,
    },
  };

  objectNodes.push(objectNode);

  return {
    kind: "object",
    objectNode,
    sourceSchemaVersion,
    diagnostics,
    activeBlock: null,
    blockIndent: null,
    seenInfoKeys: new Set<string>(),
    seenTypedBlockKeys: {},
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
    case "group":
      applyGroupField(section, tokens, line);
      return;
    case "relation":
      applyRelationField(section, tokens, line);
      return;
    case "event":
      applyEventField(section, indent, tokens, line);
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
  const value = joinFieldValue(tokens, line);

  switch (key) {
    case "title":
      section.system.title = value;
      return;
    case "description":
      warnIfSchema21Feature(section.sourceSchemaVersion, section.diagnostics, key, {
        line,
        column: tokens[0].column,
      });
      section.system.description = value;
      return;
    case "epoch":
      warnIfSchema21Feature(section.sourceSchemaVersion, section.diagnostics, key, {
        line,
        column: tokens[0].column,
      });
      section.system.epoch = value;
      return;
    case "referenceplane":
      warnIfSchema21Feature(section.sourceSchemaVersion, section.diagnostics, "referencePlane", {
        line,
        column: tokens[0].column,
      });
      section.system.referencePlane = value;
      return;
    default:
      throw new WorldOrbitError(
        `Unknown system atlas field "${tokens[0].value}"`,
        line,
        tokens[0].column,
      );
  }
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
      if (isSchema25Projection(value)) {
        warnIfSchema25Feature(section.sourceSchemaVersion, section.diagnostics, "defaults.view", {
          line,
          column: tokens[0].column,
        });
      }
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
    const entry = parseInfoLikeEntry(tokens, line, "Invalid atlas metadata entry");
    if (entry.key in section.system.atlasMetadata) {
      throw new WorldOrbitError(
        `Duplicate atlas metadata key "${entry.key}"`,
        line,
        tokens[0].column,
      );
    }

    section.system.atlasMetadata[entry.key] = entry.value;
    return;
  }

  if (tokens.length === 1 && tokens[0].value.toLowerCase() === "metadata") {
    section.inMetadata = true;
    section.metadataIndent = indent;
    return;
  }

  throw new WorldOrbitError(
    `Unknown atlas field "${tokens[0].value}"`,
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
  if (section.inCamera && indent <= (section.cameraIndent ?? 0)) {
    section.inCamera = false;
    section.cameraIndent = null;
  }

  if (section.inFilter && indent <= (section.filterIndent ?? 0)) {
    section.inFilter = false;
    section.filterIndent = null;
  }

  if (section.inCamera) {
    applyViewpointCameraField(section, tokens, line);
    return;
  }

  if (section.inFilter) {
    applyViewpointFilterField(section, tokens, line);
    return;
  }

  if (tokens.length === 1 && tokens[0].value.toLowerCase() === "camera") {
    warnIfSchema25Feature(section.sourceSchemaVersion, section.diagnostics, "viewpoint.camera", {
      line,
      column: tokens[0].column,
    });
    if (section.seenFields.has("camera")) {
      throw new WorldOrbitError('Duplicate viewpoint field "camera"', line, tokens[0].column);
    }
    section.seenFields.add("camera");
    section.inCamera = true;
    section.cameraIndent = indent;
    section.viewpoint.camera = section.viewpoint.camera ?? createEmptyViewCamera();
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
      if (isSchema25Projection(value)) {
        warnIfSchema25Feature(section.sourceSchemaVersion, section.diagnostics, "projection", {
          line,
          column: tokens[0].column,
        });
      }
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
    case "camera":
      warnIfSchema25Feature(section.sourceSchemaVersion, section.diagnostics, "viewpoint.camera", {
        line,
        column: tokens[0].column,
      });
      section.viewpoint.camera = parseInlineViewCamera(
        tokens.slice(1),
        line,
        section.viewpoint.camera,
      );
      return;
    case "layers":
      section.viewpoint.layers = parseLayerTokens(
        tokens.slice(1),
        line,
        section.sourceSchemaVersion,
        section.diagnostics,
      );
      return;
    case "events":
      warnIfSchema21Feature(section.sourceSchemaVersion, section.diagnostics, "viewpoint.events", {
        line,
        column: tokens[0].column,
      });
      section.viewpoint.events = parseTokenList(tokens.slice(1), line, "events");
      return;
    default:
      throw new WorldOrbitError(
        `Unknown viewpoint field "${tokens[0].value}"`,
        line,
        tokens[0].column,
      );
  }
}

function applyViewpointCameraField(
  section: Extract<DraftSectionState, { kind: "viewpoint" }>,
  tokens: LineToken[],
  line: number,
): void {
  const key = requireUniqueField(tokens, section.seenCameraFields, line);
  const value = joinFieldValue(tokens, line);
  const camera = section.viewpoint.camera ?? createEmptyViewCamera();

  switch (key) {
    case "azimuth":
      camera.azimuth = parseFiniteNumber(value, line, tokens[0].column, "camera.azimuth");
      break;
    case "elevation":
      camera.elevation = parseFiniteNumber(value, line, tokens[0].column, "camera.elevation");
      break;
    case "roll":
      camera.roll = parseFiniteNumber(value, line, tokens[0].column, "camera.roll");
      break;
    case "distance":
      camera.distance = parsePositiveNumber(value, line, tokens[0].column, "camera.distance");
      break;
    default:
      throw new WorldOrbitError(
        `Unknown viewpoint camera field "${tokens[0].value}"`,
        line,
        tokens[0].column,
      );
  }

  section.viewpoint.camera = camera;
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

function applyGroupField(
  section: Extract<DraftSectionState, { kind: "group" }>,
  tokens: LineToken[],
  line: number,
): void {
  const key = requireUniqueField(tokens, section.seenFields, line);

  switch (key) {
    case "label":
      section.group.label = joinFieldValue(tokens, line);
      return;
    case "summary":
      section.group.summary = joinFieldValue(tokens, line);
      return;
    case "color":
      section.group.color = joinFieldValue(tokens, line);
      return;
    case "tags":
      section.group.tags = parseTokenList(tokens.slice(1), line, "tags");
      return;
    case "hidden":
      section.group.hidden = parseAtlasBoolean(joinFieldValue(tokens, line), "hidden", {
        line,
        column: tokens[0].column,
      });
      return;
    default:
      throw new WorldOrbitError(
        `Unknown group field "${tokens[0].value}"`,
        line,
        tokens[0].column,
      );
  }
}

function applyRelationField(
  section: Extract<DraftSectionState, { kind: "relation" }>,
  tokens: LineToken[],
  line: number,
): void {
  const key = requireUniqueField(tokens, section.seenFields, line);

  switch (key) {
    case "from":
      section.relation.from = joinFieldValue(tokens, line);
      return;
    case "to":
      section.relation.to = joinFieldValue(tokens, line);
      return;
    case "kind":
      section.relation.kind = joinFieldValue(tokens, line);
      return;
    case "label":
      section.relation.label = joinFieldValue(tokens, line);
      return;
    case "summary":
      section.relation.summary = joinFieldValue(tokens, line);
      return;
    case "tags":
      section.relation.tags = parseTokenList(tokens.slice(1), line, "tags");
      return;
    case "color":
      section.relation.color = joinFieldValue(tokens, line);
      return;
    case "hidden":
      section.relation.hidden = parseAtlasBoolean(joinFieldValue(tokens, line), "hidden", {
        line,
        column: tokens[0].column,
      });
      return;
    default:
      throw new WorldOrbitError(
        `Unknown relation field "${tokens[0].value}"`,
        line,
        tokens[0].column,
      );
  }
}

function applyEventField(
  section: Extract<DraftSectionState, { kind: "event" }>,
  indent: number,
  tokens: LineToken[],
  line: number,
): void {
  if (section.activePose && indent <= (section.poseIndent ?? 0)) {
    section.activePose = null;
    section.poseIndent = null;
    section.activePoseSeenFields.clear();
  }

  if (!section.activePose && section.inPositions && indent <= (section.positionsIndent ?? 0)) {
    section.inPositions = false;
    section.positionsIndent = null;
  }

  if (section.activePose) {
    if (
      tokens[0]?.value === "epoch" ||
      tokens[0]?.value === "referencePlane"
    ) {
      warnIfSchema25Feature(section.sourceSchemaVersion, section.diagnostics, `pose.${tokens[0].value}`, {
        line,
        column: tokens[0]?.column ?? 1,
      });
    }
    section.activePose.fields.push(parseEventPoseField(tokens, line, section.activePoseSeenFields));
    return;
  }

  if (section.inPositions) {
    if (tokens.length !== 2 || tokens[0].value.toLowerCase() !== "pose") {
      throw new WorldOrbitError(
        `Unknown event positions field "${tokens[0].value}"`,
        line,
        tokens[0]?.column ?? 1,
      );
    }

    const objectId = tokens[1].value;
    if (!objectId.trim()) {
      throw new WorldOrbitError("Event pose object id must not be empty", line, tokens[1].column);
    }

    const rawPose: DraftRawEventPose = {
      objectId,
      fields: [],
      location: { line, column: tokens[0].column },
    };
    section.rawPoses.push(rawPose);
    section.activePose = rawPose;
    section.poseIndent = indent;
    section.activePoseSeenFields = new Set<string>();
    return;
  }

  if (tokens.length === 1 && tokens[0].value.toLowerCase() === "positions") {
    if (section.seenFields.has("positions")) {
      throw new WorldOrbitError('Duplicate event field "positions"', line, tokens[0].column);
    }
    section.seenFields.add("positions");
    section.inPositions = true;
    section.positionsIndent = indent;
    return;
  }

  const key = requireUniqueField(tokens, section.seenFields, line);

  switch (key) {
    case "kind":
      section.event.kind = joinFieldValue(tokens, line);
      return;
    case "label":
      section.event.label = joinFieldValue(tokens, line);
      return;
    case "summary":
      section.event.summary = joinFieldValue(tokens, line);
      return;
    case "target":
      section.event.targetObjectId = joinFieldValue(tokens, line);
      return;
    case "participants":
      section.event.participantObjectIds = parseTokenList(tokens.slice(1), line, "participants");
      return;
    case "timing":
      section.event.timing = joinFieldValue(tokens, line);
      return;
    case "visibility":
      section.event.visibility = joinFieldValue(tokens, line);
      return;
    case "epoch":
      warnIfSchema25Feature(section.sourceSchemaVersion, section.diagnostics, "event.epoch", {
        line,
        column: tokens[0].column,
      });
      section.event.epoch = joinFieldValue(tokens, line);
      return;
    case "referenceplane":
      warnIfSchema25Feature(section.sourceSchemaVersion, section.diagnostics, "event.referencePlane", {
        line,
        column: tokens[0].column,
      });
      section.event.referencePlane = joinFieldValue(tokens, line);
      return;
    case "tags":
      section.event.tags = parseTokenList(tokens.slice(1), line, "tags");
      return;
    case "color":
      section.event.color = joinFieldValue(tokens, line);
      return;
    case "hidden":
      section.event.hidden = parseAtlasBoolean(joinFieldValue(tokens, line), "hidden", {
        line,
        column: tokens[0].column,
      });
      return;
    default:
      throw new WorldOrbitError(
        `Unknown event field "${tokens[0].value}"`,
        line,
        tokens[0].column,
      );
  }
}

function parseEventPoseField(
  tokens: LineToken[],
  line: number,
  seenFields: Set<string>,
): AstFieldNode {
  if (tokens.length < 2) {
    throw new WorldOrbitError("Invalid event pose field line", line, tokens[0]?.column ?? 1);
  }

  const key = tokens[0].value;
  if (!EVENT_POSE_FIELD_KEYS.has(key)) {
    throw new WorldOrbitError(`Unknown event pose field "${key}"`, line, tokens[0].column);
  }

  if (seenFields.has(key)) {
    throw new WorldOrbitError(`Duplicate event pose field "${key}"`, line, tokens[0].column);
  }
  seenFields.add(key);

  return {
    type: "field",
    key,
    values: tokens.slice(1).map((token) => token.value),
    location: { line, column: tokens[0].column },
  };
}

function applyObjectField(
  section: Extract<DraftSectionState, { kind: "object" }>,
  indent: number,
  tokens: LineToken[],
  line: number,
): void {
  if (section.activeBlock && indent <= (section.blockIndent ?? 0)) {
    section.activeBlock = null;
    section.blockIndent = null;
  }

  if (tokens.length === 1) {
    const blockName = tokens[0].value.toLowerCase();
    if (blockName === "info" || STRUCTURED_TYPED_BLOCKS.has(blockName as WorldOrbitTypedBlockName)) {
      if (blockName !== "info") {
        warnIfSchema21Feature(
          section.sourceSchemaVersion,
          section.diagnostics,
          blockName,
          { line, column: tokens[0].column },
        );
      }
      section.activeBlock = blockName as ObjectBlockKind;
      section.blockIndent = indent;
      return;
    }
  }

  if (section.activeBlock) {
    const entry = parseInfoLikeEntry(tokens, line, `Invalid ${section.activeBlock} entry`);
    if (section.activeBlock === "info") {
      if (section.seenInfoKeys.has(entry.key)) {
        throw new WorldOrbitError(`Duplicate info key "${entry.key}"`, line, tokens[0].column);
      }
      section.seenInfoKeys.add(entry.key);
      section.objectNode.infoEntries.push(entry);
      return;
    }

    const typedBlock = section.activeBlock as WorldOrbitTypedBlockName;
    const seenKeys =
      section.seenTypedBlockKeys[typedBlock] ??
      (section.seenTypedBlockKeys[typedBlock] = new Set<string>());

    if (seenKeys.has(entry.key)) {
      throw new WorldOrbitError(
        `Duplicate ${typedBlock} key "${entry.key}"`,
        line,
        tokens[0].column,
      );
    }
    seenKeys.add(entry.key);
    const entries =
      section.objectNode.typedBlockEntries[typedBlock] ??
      (section.objectNode.typedBlockEntries[typedBlock] = []);
    entries.push(entry);
    return;
  }

  section.objectNode.fields.push(
    parseObjectField(
      tokens,
      line,
      section.objectNode.objectType,
      section.sourceSchemaVersion,
      section.diagnostics,
    ),
  );
}

function requireUniqueField(
  tokens: LineToken[],
  seenFields: Set<string>,
  line: number,
): string {
  if (tokens.length < 2) {
    throw new WorldOrbitError("Invalid atlas field line", line, tokens[0]?.column ?? 1);
  }

  const key = tokens[0].value.toLowerCase();
  if (seenFields.has(key)) {
    throw new WorldOrbitError(`Duplicate atlas field "${tokens[0].value}"`, line, tokens[0].column);
  }

  seenFields.add(key);
  return key;
}

function joinFieldValue(tokens: LineToken[], line: number): string {
  if (tokens.length < 2) {
    throw new WorldOrbitError("Missing value for atlas field", line, tokens[0]?.column ?? 1);
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
): Array<Exclude<WorldOrbitObjectType, "system">> {
  return parseTokenList(tokens, line, "objectTypes").filter(
    (value): value is Exclude<WorldOrbitObjectType, "system"> =>
      value === "star" ||
      value === "planet" ||
      value === "moon" ||
      value === "belt" ||
      value === "asteroid" ||
      value === "comet" ||
      value === "ring" ||
      value === "structure" ||
      value === "phenomenon",
  );
}

function parseLayerTokens(
  tokens: LineToken[],
  line: number,
  sourceSchemaVersion?: SourceSchemaVersion,
  diagnostics?: WorldOrbitDiagnostic[],
): Partial<Record<RenderSceneLayer["id"], boolean>> {
  const layers: Partial<Record<RenderSceneLayer["id"], boolean>> = {};

  for (const token of parseTokenList(tokens, line, "layers")) {
    const enabled = !token.startsWith("-") && !token.startsWith("!");
    const raw = token.replace(/^[-!]+/, "").toLowerCase();

    if (raw === "orbits") {
      layers["orbits-back"] = enabled;
      layers["orbits-front"] = enabled;
      continue;
    }

    if (
      raw === "background" ||
      raw === "guides" ||
      raw === "orbits-back" ||
      raw === "orbits-front" ||
      raw === "relations" ||
      raw === "events" ||
      raw === "objects" ||
      raw === "labels" ||
      raw === "metadata"
    ) {
      if (raw === "events" && sourceSchemaVersion && diagnostics) {
        warnIfSchema21Feature(sourceSchemaVersion, diagnostics, "layers.events", {
          line,
          column: tokens[0]?.column ?? 1,
        });
      }
      layers[raw] = enabled;
    }
  }

  return layers;
}

function parseTokenList(tokens: LineToken[], line: number, fieldName: string): string[] {
  if (tokens.length === 0) {
    throw new WorldOrbitError(`Missing value for atlas field "${fieldName}"`, line, 1);
  }

  const values = tokens.map((token) => token.value).filter(Boolean);
  if (values.length === 0) {
    throw new WorldOrbitError(`Missing value for atlas field "${fieldName}"`, line, tokens[0]?.column ?? 1);
  }

  return values;
}

function parseProjectionValue(
  value: string,
  line: number,
  column: number,
): ViewProjection {
  const normalized = value.toLowerCase();
  if (
    normalized !== "topdown" &&
    normalized !== "isometric" &&
    normalized !== "orthographic" &&
    normalized !== "perspective"
  ) {
    throw new WorldOrbitError(`Unknown projection "${value}"`, line, column);
  }

  return normalized;
}

function isSchema25Projection(value: string): boolean {
  const normalized = value.toLowerCase();
  return normalized === "orthographic" || normalized === "perspective";
}

function parsePresetValue(
  value: string,
  line: number,
  column: number,
): RenderPresetName | null {
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
  const parsed = parseFiniteNumber(value, line, column, field);
  if (parsed <= 0) {
    throw new WorldOrbitError(`Field "${field}" must be greater than zero`, line, column);
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
    throw new WorldOrbitError(`Invalid numeric value "${value}" for "${field}"`, line, column);
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

function createEmptyViewCamera(): WorldOrbitViewCamera {
  return {
    azimuth: null,
    elevation: null,
    roll: null,
    distance: null,
  };
}

function parseInlineViewCamera(
  tokens: LineToken[],
  line: number,
  current: WorldOrbitDraftViewpoint["camera"],
): WorldOrbitDraftViewpoint["camera"] {
  if (tokens.length === 0 || tokens.length % 2 !== 0) {
    throw new WorldOrbitError(
      'Field "camera" expects "<field> <value>" pairs',
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const camera = current ? { ...current } : createEmptyViewCamera();
  const seen = new Set<string>();

  for (let index = 0; index < tokens.length; index += 2) {
    const fieldToken = tokens[index];
    const valueToken = tokens[index + 1];
    const key = fieldToken.value.toLowerCase();
    if (seen.has(key)) {
      throw new WorldOrbitError(`Duplicate viewpoint camera field "${fieldToken.value}"`, line, fieldToken.column);
    }
    seen.add(key);
    const value = valueToken.value;

    switch (key) {
      case "azimuth":
        camera.azimuth = parseFiniteNumber(value, line, fieldToken.column, "camera.azimuth");
        break;
      case "elevation":
        camera.elevation = parseFiniteNumber(value, line, fieldToken.column, "camera.elevation");
        break;
      case "roll":
        camera.roll = parseFiniteNumber(value, line, fieldToken.column, "camera.roll");
        break;
      case "distance":
        camera.distance = parsePositiveNumber(value, line, fieldToken.column, "camera.distance");
        break;
      default:
        throw new WorldOrbitError(`Unknown viewpoint camera field "${fieldToken.value}"`, line, fieldToken.column);
    }
  }

  return camera;
}

function parseInlineObjectFields(
  tokens: LineToken[],
  line: number,
  objectType: Exclude<WorldOrbitObjectType, "system">,
  sourceSchemaVersion: SourceSchemaVersion,
  diagnostics: WorldOrbitDiagnostic[],
): AstFieldNode[] {
  const fields: AstFieldNode[] = [];
  let index = 0;

  while (index < tokens.length) {
    const keyToken = tokens[index];
    const spec = getDraftObjectFieldSpec(keyToken.value);

    if (!spec) {
      throw new WorldOrbitError(`Unknown field "${keyToken.value}"`, line, keyToken.column);
    }

    if (spec.version === "2.1") {
      warnIfSchema21Feature(sourceSchemaVersion, diagnostics, keyToken.value, {
        line,
        column: keyToken.column,
      });
    }

    index++;
    const valueTokens: LineToken[] = [];

    if (spec.inlineMode === "single") {
      const nextToken = tokens[index];
      if (nextToken) {
        valueTokens.push(nextToken);
        index++;
      }
    } else if (spec.inlineMode === "pair") {
      for (let count = 0; count < 2; count++) {
        const nextToken = tokens[index];
        if (!nextToken) {
          break;
        }
        valueTokens.push(nextToken);
        index++;
      }
    } else {
      while (index < tokens.length && !DRAFT_OBJECT_FIELD_KEYS.has(tokens[index].value)) {
        valueTokens.push(tokens[index]);
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

  validateDraftObjectFieldCompatibility(fields, objectType);
  return fields;
}

function parseObjectField(
  tokens: LineToken[],
  line: number,
  objectType: Exclude<WorldOrbitObjectType, "system">,
  sourceSchemaVersion: SourceSchemaVersion,
  diagnostics: WorldOrbitDiagnostic[],
): AstFieldNode {
  if (tokens.length < 2) {
    throw new WorldOrbitError("Invalid field line", line, tokens[0]?.column ?? 1);
  }

  const spec = getDraftObjectFieldSpec(tokens[0].value);
  if (!spec) {
    throw new WorldOrbitError(
      `Unknown field "${tokens[0].value}"`,
      line,
      tokens[0].column,
    );
  }

  if (spec.version === "2.1") {
    warnIfSchema21Feature(sourceSchemaVersion, diagnostics, tokens[0].value, {
      line,
      column: tokens[0].column,
    });
  }

  const field = {
    type: "field",
    key: tokens[0].value,
    values: tokens.slice(1).map((token) => token.value),
    location: { line, column: tokens[0].column },
  } satisfies AstFieldNode;

  validateDraftObjectFieldCompatibility([field], objectType);
  return field;
}

function parseInfoLikeEntry(
  tokens: LineToken[],
  line: number,
  errorMessage: string,
): AstInfoEntryNode {
  if (tokens.length < 2) {
    throw new WorldOrbitError(errorMessage, line, tokens[0]?.column ?? 1);
  }

  return {
    type: "info-entry",
    key: tokens[0].value,
    value: tokens.slice(1).map((token) => token.value).join(" "),
    location: { line, column: tokens[0].column },
  };
}

function normalizeDraftObject(
  node: DraftRawObject,
  sourceSchemaVersion: SourceSchemaVersion,
  diagnostics: WorldOrbitDiagnostic[],
): WorldOrbitObject {
  const fieldMap = collectDraftFields(node.fields);
  const placement = extractPlacementFromFieldMap(fieldMap);
  const properties = normalizeDraftProperties(node.objectType, fieldMap);
  const groups = parseOptionalTokenList(fieldMap.get("groups")?.[0]);
  const epoch = parseOptionalJoinedValue(fieldMap.get("epoch")?.[0]);
  const referencePlane = parseOptionalJoinedValue(fieldMap.get("referencePlane")?.[0]);
  const tidalLock = fieldMap.has("tidalLock")
    ? parseAtlasBoolean(singleFieldValue(fieldMap.get("tidalLock")![0]), "tidalLock", fieldMap.get("tidalLock")![0].location)
    : undefined;
  const resonance = fieldMap.has("resonance")
    ? parseResonanceField(fieldMap.get("resonance")![0])
    : undefined;
  const renderHints = extractRenderHints(fieldMap);
  const deriveRules = fieldMap.get("derive")?.map((field) => parseDeriveField(field));
  const validationRules = fieldMap.get("validate")?.map((field) => ({
    rule: singleFieldValue(field),
  }));
  const lockedFields = fieldMap.has("locked")
    ? [...new Set(fieldMap.get("locked")!.flatMap((field) => field.values))]
    : undefined;
  const tolerances = fieldMap.get("tolerance")?.map((field) => parseToleranceField(field));
  const typedBlocks = normalizeTypedBlocks(node.typedBlockEntries);
  const info = normalizeInfoEntries(node.infoEntries, "info");

  const object: WorldOrbitObject = {
    type: node.objectType,
    id: node.id,
    properties,
    placement,
    info,
  };

  if (groups.length > 0) object.groups = groups;
  if (epoch) object.epoch = epoch;
  if (referencePlane) object.referencePlane = referencePlane;
  if (tidalLock !== undefined) object.tidalLock = tidalLock;
  if (resonance) object.resonance = resonance;
  if (renderHints) object.renderHints = renderHints;
  if (deriveRules?.length) object.deriveRules = deriveRules;
  if (validationRules?.length) object.validationRules = validationRules;
  if (lockedFields?.length) object.lockedFields = lockedFields;
  if (tolerances?.length) object.tolerances = tolerances;
  if (typedBlocks && Object.keys(typedBlocks).length > 0) object.typedBlocks = typedBlocks;

  if (isSchemaOlderThan(sourceSchemaVersion, "2.1")) {
    if (
      object.groups ||
      object.epoch ||
      object.referencePlane ||
      object.tidalLock !== undefined ||
      object.resonance ||
      object.renderHints ||
      object.deriveRules?.length ||
      object.validationRules?.length ||
      object.lockedFields?.length ||
      object.tolerances?.length ||
      object.typedBlocks
    ) {
      warnIfSchema21Feature(sourceSchemaVersion, diagnostics, node.id, node.location);
    }
  }

  return object;
}

function normalizeDraftEvent(
  event: WorldOrbitEvent,
  rawPoses: DraftRawEventPose[],
): WorldOrbitEvent {
  return {
    ...event,
    participantObjectIds: [...new Set(event.participantObjectIds)],
    tags: [...new Set(event.tags)],
    positions: rawPoses.map((pose) => normalizeDraftEventPose(pose)),
  };
}

function normalizeDraftEventPose(
  rawPose: DraftRawEventPose,
): WorldOrbitEventPose {
  const fieldMap = collectDraftFields(rawPose.fields, "event-pose");
  const placement = extractPlacementFromFieldMap(fieldMap);
  return {
    objectId: rawPose.objectId,
    placement,
    inner: parseOptionalUnitField(fieldMap.get("inner")?.[0], "inner"),
    outer: parseOptionalUnitField(fieldMap.get("outer")?.[0], "outer"),
    epoch: parseOptionalJoinedValue(fieldMap.get("epoch")?.[0]),
    referencePlane: parseOptionalJoinedValue(fieldMap.get("referencePlane")?.[0]),
  };
}

function collectDraftFields(
  fields: AstFieldNode[],
  _mode: "object" | "event-pose" = "object",
): Map<string, AstFieldNode[]> {
  const grouped = new Map<string, AstFieldNode[]>();

  for (const field of fields) {
    const spec = getDraftObjectFieldSpec(field.key);
    if (!spec && !EVENT_POSE_FIELD_KEYS.has(field.key)) {
      throw WorldOrbitError.fromLocation(`Unknown field "${field.key}"`, field.location);
    }

    if (!spec?.allowRepeat && grouped.has(field.key)) {
      throw WorldOrbitError.fromLocation(`Duplicate field "${field.key}"`, field.location);
    }

    const existing = grouped.get(field.key) ?? [];
    existing.push(field);
    grouped.set(field.key, existing);
  }

  return grouped;
}

function extractPlacementFromFieldMap(
  fieldMap: Map<string, AstFieldNode[]>,
): WorldOrbitObject["placement"] {
  const orbitField = fieldMap.get("orbit")?.[0];
  const atField = fieldMap.get("at")?.[0];
  const surfaceField = fieldMap.get("surface")?.[0];
  const freeField = fieldMap.get("free")?.[0];
  const count = [orbitField, atField, surfaceField, freeField].filter(Boolean).length;

  if (count > 1) {
    const conflictingField = orbitField ?? atField ?? surfaceField ?? freeField;
    throw WorldOrbitError.fromLocation("Object has multiple placement modes", conflictingField?.location);
  }

  if (orbitField) {
    return {
      mode: "orbit",
      target: singleFieldValue(orbitField),
      distance: parseOptionalUnitField(fieldMap.get("distance")?.[0], "distance"),
      semiMajor: parseOptionalUnitField(fieldMap.get("semiMajor")?.[0], "semiMajor"),
      eccentricity: parseOptionalNumberField(fieldMap.get("eccentricity")?.[0], "eccentricity"),
      period: parseOptionalUnitField(fieldMap.get("period")?.[0], "period"),
      angle: parseOptionalUnitField(fieldMap.get("angle")?.[0], "angle"),
      inclination: parseOptionalUnitField(fieldMap.get("inclination")?.[0], "inclination"),
      phase: parseOptionalUnitField(fieldMap.get("phase")?.[0], "phase"),
    };
  }

  if (atField) {
    const target = singleFieldValue(atField);
    return {
      mode: "at",
      target,
      reference: parseAtlasAtReference(target, atField.location),
    };
  }

  if (surfaceField) {
    return {
      mode: "surface",
      target: singleFieldValue(surfaceField),
    };
  }

  if (freeField) {
    const raw = singleFieldValue(freeField);
    const distance = tryParseAtlasUnitValue(raw);
    return {
      mode: "free",
      distance: distance ?? undefined,
      descriptor: distance ? undefined : raw,
    };
  }

  return null;
}

function normalizeDraftProperties(
  objectType: Exclude<WorldOrbitObjectType, "system">,
  fieldMap: Map<string, AstFieldNode[]>,
): Record<string, WorldOrbitObject["properties"][string]> {
  const properties: Record<string, WorldOrbitObject["properties"][string]> = {};

  for (const [key, fields] of fieldMap.entries()) {
    const field = fields[0];
    const spec = getDraftObjectFieldSpec(key);
    if (!field || !spec?.legacySchema || spec.legacySchema.placement) {
      continue;
    }

    ensureAtlasFieldSupported(key, objectType, field.location);
    properties[key] = normalizeLegacyScalarValue(key, field.values, field.location);
  }

  return properties;
}

function normalizeInfoEntries(
  entries: AstInfoEntryNode[],
  label: string,
): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const entry of entries) {
    if (entry.key in normalized) {
      throw WorldOrbitError.fromLocation(`Duplicate ${label} key "${entry.key}"`, entry.location);
    }

    normalized[entry.key] = entry.value;
  }

  return normalized;
}

function normalizeTypedBlocks(
  typedBlockEntries: DraftRawObject["typedBlockEntries"],
): Partial<Record<WorldOrbitTypedBlockName, Record<string, string>>> {
  const typedBlocks: Partial<Record<WorldOrbitTypedBlockName, Record<string, string>>> = {};

  for (const blockName of Object.keys(typedBlockEntries) as WorldOrbitTypedBlockName[]) {
    const entries = typedBlockEntries[blockName];
    if (entries?.length) {
      typedBlocks[blockName] = normalizeInfoEntries(entries, blockName);
    }
  }

  return typedBlocks;
}

function extractRenderHints(
  fieldMap: Map<string, AstFieldNode[]>,
): WorldOrbitObject["renderHints"] | undefined {
  const renderHints: NonNullable<WorldOrbitObject["renderHints"]> = {};
  const renderLabelField = fieldMap.get("renderLabel")?.[0];
  const renderOrbitField = fieldMap.get("renderOrbit")?.[0];
  const renderPriorityField = fieldMap.get("renderPriority")?.[0];

  if (renderLabelField) {
    renderHints.renderLabel = parseAtlasBoolean(
      singleFieldValue(renderLabelField),
      "renderLabel",
      renderLabelField.location,
    );
  }
  if (renderOrbitField) {
    renderHints.renderOrbit = parseAtlasBoolean(
      singleFieldValue(renderOrbitField),
      "renderOrbit",
      renderOrbitField.location,
    );
  }
  if (renderPriorityField) {
    renderHints.renderPriority = parseAtlasNumber(
      singleFieldValue(renderPriorityField),
      "renderPriority",
      renderPriorityField.location,
    );
  }

  return Object.keys(renderHints).length > 0 ? renderHints : undefined;
}

function parseResonanceField(field: AstFieldNode): NonNullable<WorldOrbitObject["resonance"]> {
  if (field.values.length !== 2) {
    throw WorldOrbitError.fromLocation(
      'Field "resonance" expects "<targetObjectId> <ratio>"',
      field.location,
    );
  }

  const ratio = field.values[1];
  if (!/^\d+:\d+$/.test(ratio)) {
    throw WorldOrbitError.fromLocation(`Invalid resonance ratio "${ratio}"`, field.location);
  }

  return {
    targetObjectId: field.values[0],
    ratio,
  };
}

function parseDeriveField(field: AstFieldNode): NonNullable<WorldOrbitObject["deriveRules"]>[number] {
  if (field.values.length !== 2) {
    throw WorldOrbitError.fromLocation(
      'Field "derive" expects "<field> <strategy>"',
      field.location,
    );
  }

  return {
    field: field.values[0],
    strategy: field.values[1],
  };
}

function parseToleranceField(field: AstFieldNode): NonNullable<WorldOrbitObject["tolerances"]>[number] {
  if (field.values.length !== 2) {
    throw WorldOrbitError.fromLocation(
      'Field "tolerance" expects "<field> <value>"',
      field.location,
    );
  }

  const rawValue = field.values[1];
  const unitValue = tryParseAtlasUnitValue(rawValue);
  const numericValue = Number(rawValue);

  return {
    field: field.values[0],
    value: unitValue ?? (Number.isFinite(numericValue) ? numericValue : rawValue),
  };
}

function parseOptionalTokenList(field?: AstFieldNode): string[] {
  return field ? [...new Set(field.values)] : [];
}

function parseOptionalJoinedValue(field?: AstFieldNode): string | null {
  if (!field) {
    return null;
  }

  return field.values.join(" ").trim() || null;
}

function parseOptionalUnitField(field: AstFieldNode | undefined, key: string) {
  return field ? parseAtlasUnitValue(singleFieldValue(field), field.location, key) : undefined;
}

function parseOptionalNumberField(field: AstFieldNode | undefined, key: string) {
  return field ? parseAtlasNumber(singleFieldValue(field), key, field.location) : undefined;
}

function singleFieldValue(field: AstFieldNode): string {
  return singleAtlasValue(field.values, field.key, field.location);
}

function getDraftObjectFieldSpec(key: string): DraftObjectFieldSpec | undefined {
  return DRAFT_OBJECT_FIELD_SPECS.get(key);
}

function validateDraftObjectFieldCompatibility(
  fields: AstFieldNode[],
  objectType: Exclude<WorldOrbitObjectType, "system">,
): void {
  for (const field of fields) {
    const spec = getDraftObjectFieldSpec(field.key);
    if (!spec) {
      throw WorldOrbitError.fromLocation(`Unknown field "${field.key}"`, field.location);
    }

    if (spec.legacySchema) {
      ensureAtlasFieldSupported(field.key, objectType, field.location);
      continue;
    }

    if (
      (field.key === "renderLabel" || field.key === "renderOrbit" || field.key === "tidalLock") &&
      field.values.length !== 1
    ) {
      throw WorldOrbitError.fromLocation(
        `Field "${field.key}" expects exactly one value`,
        field.location,
      );
    }
  }
}

function warnIfSchema21Feature(
  sourceSchemaVersion: SourceSchemaVersion,
  diagnostics: WorldOrbitDiagnostic[],
  featureName: string,
  location: AstSourceLocation,
): void {
  if (!isSchemaOlderThan(sourceSchemaVersion, "2.1")) {
    return;
  }

  diagnostics.push({
    code: "parse.schema21.featureCompatibility",
    severity: "warning",
    source: "parse",
    message: `Feature "${featureName}" requires schema 2.1; parsed in compatibility mode because the document header is "schema ${sourceSchemaVersion}".`,
    line: location.line,
    column: location.column,
  });
}

function warnIfSchema25Feature(
  sourceSchemaVersion: SourceSchemaVersion,
  diagnostics: WorldOrbitDiagnostic[],
  featureName: string,
  location: AstSourceLocation,
): void {
  if (!isSchemaOlderThan(sourceSchemaVersion, "2.5")) {
    return;
  }

  diagnostics.push({
    code: "parse.schema25.featureCompatibility",
    severity: "warning",
    source: "parse",
    message: `Feature "${featureName}" requires schema 2.5; parsed in compatibility mode because the document header is "schema ${sourceSchemaVersion}".`,
    line: location.line,
    column: location.column,
  });
}

function isSchemaOlderThan(
  sourceSchemaVersion: SourceSchemaVersion,
  requiredVersion: "2.1" | "2.5" | "2.6",
): boolean {
  return schemaVersionRank(sourceSchemaVersion) < schemaVersionRank(requiredVersion);
}

function schemaVersionRank(
  version: SourceSchemaVersion | "2.1" | "2.5" | "2.6",
): number {
  switch (version) {
    case "2.0-draft":
      return 0;
    case "2.0":
      return 1;
    case "2.1":
      return 2;
    case "2.5":
      return 3;
    case "2.6":
      return 4;
    default:
      return 5;
  }
}

function preprocessAtlasSource(source: string): PreparedAtlasSource {
  const chars = [...source];
  const comments: AtlasComment[] = [];
  let inString = false;
  let inBlockComment = false;
  let blockCommentStart: AstSourceLocation | null = null;
  let line = 1;
  let column = 1;

  for (let index = 0; index < chars.length; index++) {
    const ch = chars[index];
    const next = chars[index + 1];

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        chars[index] = " ";
        chars[index + 1] = " ";
        inBlockComment = false;
        blockCommentStart = null;
        index++;
        column += 2;
        continue;
      }

      if (ch !== "\n" && ch !== "\r") {
        chars[index] = " ";
      }

      if (ch === "\n") {
        line++;
        column = 1;
      } else {
        column++;
      }
      continue;
    }

    if (!inString && ch === "/" && next === "*") {
      comments.push({ kind: "block", line, column });
      chars[index] = " ";
      chars[index + 1] = " ";
      inBlockComment = true;
      blockCommentStart = { line, column };
      index++;
      column += 2;
      continue;
    }

    if (!inString && ch === "#" && !isHexColorLiteral(chars, index)) {
      comments.push({ kind: "line", line, column });
      chars[index] = " ";

      let inner = index + 1;
      while (inner < chars.length && chars[inner] !== "\n" && chars[inner] !== "\r") {
        chars[inner] = " ";
        inner++;
      }
      column += inner - index;
      index = inner - 1;
      continue;
    }

    if (ch === '"' && chars[index - 1] !== "\\") {
      inString = !inString;
    }

    if (ch === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  if (inBlockComment) {
    throw WorldOrbitError.fromLocation("Unclosed block comment", blockCommentStart ?? undefined);
  }

  return {
    source: chars.join(""),
    comments,
  };
}

function isHexColorLiteral(chars: string[], start: number): boolean {
  let index = start + 1;
  let length = 0;

  while (index < chars.length && /[0-9a-f]/i.test(chars[index] ?? "")) {
    index++;
    length++;
  }

  if (![3, 4, 6, 8].includes(length)) {
    return false;
  }

  const next = chars[index];
  return next === undefined || next === " " || next === "\t" || next === "\r" || next === "\n";
}
