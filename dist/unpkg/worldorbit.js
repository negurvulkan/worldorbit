var WorldOrbit = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // dist/unpkg/worldorbit.esm.js
  var worldorbit_esm_exports = {};
  __export(worldorbit_esm_exports, {
    DEFAULT_VIEWER_STATE: () => DEFAULT_VIEWER_STATE,
    WORLDORBIT_FIELD_KEYS: () => WORLDORBIT_FIELD_KEYS,
    WORLDORBIT_FIELD_SCHEMAS: () => WORLDORBIT_FIELD_SCHEMAS,
    WORLDORBIT_OBJECT_TYPES: () => WORLDORBIT_OBJECT_TYPES,
    WORLD_LAYER_ID: () => WORLD_LAYER_ID,
    WorldOrbitError: () => WorldOrbitError,
    clampScale: () => clampScale,
    cloneAtlasDocument: () => cloneAtlasDocument,
    composeViewerTransform: () => composeViewerTransform,
    createAtlasViewer: () => createAtlasViewer,
    createDiagnostic: () => createDiagnostic,
    createEmbedPayload: () => createEmbedPayload,
    createEmptyAtlasDocument: () => createEmptyAtlasDocument,
    createInteractiveViewer: () => createInteractiveViewer,
    createWorldOrbitEmbedMarkup: () => createWorldOrbitEmbedMarkup,
    defineWorldOrbitViewerElement: () => defineWorldOrbitViewerElement,
    deserializeViewerAtlasState: () => deserializeViewerAtlasState,
    deserializeWorldOrbitEmbedPayload: () => deserializeWorldOrbitEmbedPayload,
    detectWorldOrbitSchemaVersion: () => detectWorldOrbitSchemaVersion,
    diagnosticFromError: () => diagnosticFromError,
    extractWorldOrbitBlocks: () => extractWorldOrbitBlocks,
    fitViewerState: () => fitViewerState,
    focusViewerState: () => focusViewerState,
    formatAtlasDocument: () => formatAtlasDocument,
    formatDocument: () => formatDocument,
    formatDraftDocument: () => formatDraftDocument,
    getAtlasDocumentNode: () => getAtlasDocumentNode,
    getFieldSchema: () => getFieldSchema,
    getSceneCenter: () => getSceneCenter,
    getThemePreset: () => getThemePreset,
    getViewerVisibleBounds: () => getViewerVisibleBounds,
    invertViewerPoint: () => invertViewerPoint,
    isKnownFieldKey: () => isKnownFieldKey,
    listAtlasDocumentPaths: () => listAtlasDocumentPaths,
    load: () => load,
    loadWorldOrbitSource: () => loadWorldOrbitSource,
    loadWorldOrbitSourceWithDiagnostics: () => loadWorldOrbitSourceWithDiagnostics,
    materializeAtlasDocument: () => materializeAtlasDocument,
    materializeDraftDocument: () => materializeDraftDocument,
    mountWorldOrbitEmbeds: () => mountWorldOrbitEmbeds,
    normalizeDocument: () => normalizeDocument,
    normalizeRotation: () => normalizeRotation,
    normalizeViewerFilter: () => normalizeViewerFilter,
    normalizeWithDiagnostics: () => normalizeWithDiagnostics,
    panViewerState: () => panViewerState,
    parse: () => parse,
    parseSafe: () => parseSafe,
    parseWithDiagnostics: () => parseWithDiagnostics,
    parseWorldOrbit: () => parseWorldOrbit,
    parseWorldOrbitAtlas: () => parseWorldOrbitAtlas,
    parseWorldOrbitDraft: () => parseWorldOrbitDraft,
    removeAtlasDocumentNode: () => removeAtlasDocumentNode,
    render: () => render,
    renderDocumentToScene: () => renderDocumentToScene,
    renderDocumentToSvg: () => renderDocumentToSvg,
    renderSceneToSvg: () => renderSceneToSvg,
    renderSourceToSvg: () => renderSourceToSvg,
    resolveAtlasDiagnosticPath: () => resolveAtlasDiagnosticPath,
    resolveAtlasDiagnostics: () => resolveAtlasDiagnostics,
    resolveLayers: () => resolveLayers,
    resolveTheme: () => resolveTheme,
    rotatePoint: () => rotatePoint,
    rotateViewerState: () => rotateViewerState,
    sceneViewpointToLayerOptions: () => sceneViewpointToLayerOptions,
    searchSceneObjects: () => searchSceneObjects,
    serializeViewerAtlasState: () => serializeViewerAtlasState,
    serializeWorldOrbitEmbedPayload: () => serializeWorldOrbitEmbedPayload,
    stringify: () => stringify,
    supportsObjectType: () => supportsObjectType,
    tokenizeLine: () => tokenizeLine,
    tokenizeLineDetailed: () => tokenizeLineDetailed,
    unitFamilyAllowsUnit: () => unitFamilyAllowsUnit,
    updateAtlasDocumentNode: () => updateAtlasDocumentNode,
    upgradeDocumentToDraftV2: () => upgradeDocumentToDraftV2,
    upgradeDocumentToV2: () => upgradeDocumentToV2,
    upsertAtlasDocumentNode: () => upsertAtlasDocumentNode,
    validateAtlasDocumentWithDiagnostics: () => validateAtlasDocumentWithDiagnostics,
    validateDocument: () => validateDocument,
    validateDocumentWithDiagnostics: () => validateDocumentWithDiagnostics,
    viewpointToViewerFilter: () => viewpointToViewerFilter,
    zoomViewerStateAt: () => zoomViewerStateAt
  });

  // packages/core/dist/errors.js
  var WorldOrbitError = class _WorldOrbitError extends Error {
    line;
    column;
    constructor(message, line, column) {
      const locationSuffix = line === void 0 ? "" : ` (line ${line}${column === void 0 ? "" : `, column ${column}`})`;
      super(`${message}${locationSuffix}`);
      this.name = "WorldOrbitError";
      this.line = line;
      this.column = column;
    }
    static fromLocation(message, location) {
      return new _WorldOrbitError(message, location?.line, location?.column);
    }
  };

  // packages/core/dist/schema.js
  var ALL_OBJECTS = [
    "system",
    "star",
    "planet",
    "moon",
    "belt",
    "asteroid",
    "comet",
    "ring",
    "structure",
    "phenomenon"
  ];
  var NON_SYSTEM_OBJECTS = ALL_OBJECTS.filter((objectType) => objectType !== "system");
  var IMAGE_OBJECTS = [
    "star",
    "planet",
    "moon",
    "asteroid",
    "comet",
    "structure",
    "phenomenon"
  ];
  var ANCHORED_OBJECTS = ["structure", "phenomenon"];
  var ORBITAL_OBJECTS = [
    "star",
    "planet",
    "moon",
    "belt",
    "asteroid",
    "comet",
    "ring",
    "structure",
    "phenomenon"
  ];
  var FREE_OBJECTS = [
    "star",
    "planet",
    "moon",
    "belt",
    "asteroid",
    "comet",
    "ring",
    "structure",
    "phenomenon"
  ];
  function createField(key, options) {
    return {
      key,
      ...options
    };
  }
  var WORLDORBIT_OBJECT_TYPES = new Set(ALL_OBJECTS);
  var WORLDORBIT_FIELD_SCHEMAS = new Map([
    createField("orbit", {
      kind: "string",
      placement: true,
      arity: "single",
      objectTypes: ORBITAL_OBJECTS
    }),
    createField("distance", {
      kind: "unit",
      placement: true,
      arity: "single",
      objectTypes: ORBITAL_OBJECTS,
      unitFamily: "distance"
    }),
    createField("semiMajor", {
      kind: "unit",
      placement: true,
      arity: "single",
      objectTypes: ORBITAL_OBJECTS,
      unitFamily: "distance"
    }),
    createField("eccentricity", {
      kind: "number",
      placement: true,
      arity: "single",
      objectTypes: ORBITAL_OBJECTS
    }),
    createField("period", {
      kind: "unit",
      placement: true,
      arity: "single",
      objectTypes: ORBITAL_OBJECTS,
      unitFamily: "duration"
    }),
    createField("angle", {
      kind: "unit",
      placement: true,
      arity: "single",
      objectTypes: ORBITAL_OBJECTS,
      unitFamily: "angle"
    }),
    createField("inclination", {
      kind: "unit",
      placement: true,
      arity: "single",
      objectTypes: ORBITAL_OBJECTS,
      unitFamily: "angle"
    }),
    createField("phase", {
      kind: "unit",
      placement: true,
      arity: "single",
      objectTypes: ORBITAL_OBJECTS,
      unitFamily: "angle"
    }),
    createField("at", {
      kind: "string",
      placement: true,
      arity: "single",
      objectTypes: ANCHORED_OBJECTS
    }),
    createField("surface", {
      kind: "string",
      placement: true,
      arity: "single",
      objectTypes: ANCHORED_OBJECTS
    }),
    createField("free", {
      kind: "string",
      placement: true,
      arity: "single",
      objectTypes: FREE_OBJECTS
    }),
    createField("kind", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS
    }),
    createField("class", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS
    }),
    createField("culture", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS
    }),
    createField("tags", {
      kind: "list",
      placement: false,
      arity: "multiple",
      objectTypes: ALL_OBJECTS
    }),
    createField("color", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: ALL_OBJECTS
    }),
    createField("image", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: IMAGE_OBJECTS
    }),
    createField("hidden", {
      kind: "boolean",
      placement: false,
      arity: "single",
      objectTypes: ALL_OBJECTS
    }),
    createField("radius", {
      kind: "unit",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS,
      unitFamily: "radius"
    }),
    createField("mass", {
      kind: "unit",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS,
      unitFamily: "mass"
    }),
    createField("density", {
      kind: "unit",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS,
      unitFamily: "generic"
    }),
    createField("gravity", {
      kind: "unit",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS,
      unitFamily: "generic"
    }),
    createField("temperature", {
      kind: "unit",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS,
      unitFamily: "generic"
    }),
    createField("albedo", {
      kind: "number",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS
    }),
    createField("atmosphere", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: ["planet", "moon", "asteroid", "comet", "phenomenon"]
    }),
    createField("inner", {
      kind: "unit",
      placement: false,
      arity: "single",
      objectTypes: ["belt", "ring", "phenomenon"],
      unitFamily: "distance"
    }),
    createField("outer", {
      kind: "unit",
      placement: false,
      arity: "single",
      objectTypes: ["belt", "ring", "phenomenon"],
      unitFamily: "distance"
    }),
    createField("view", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: ["system"]
    }),
    createField("scale", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: ["system"]
    }),
    createField("units", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: ["system"]
    }),
    createField("title", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: ["system"]
    }),
    createField("on", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS
    }),
    createField("source", {
      kind: "string",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS
    }),
    createField("cycle", {
      kind: "unit",
      placement: false,
      arity: "single",
      objectTypes: NON_SYSTEM_OBJECTS,
      unitFamily: "duration"
    })
  ].map((schema) => [schema.key, schema]));
  var WORLDORBIT_FIELD_KEYS = new Set(WORLDORBIT_FIELD_SCHEMAS.keys());
  function getFieldSchema(key) {
    return WORLDORBIT_FIELD_SCHEMAS.get(key);
  }
  function isKnownFieldKey(key) {
    return WORLDORBIT_FIELD_KEYS.has(key);
  }
  function supportsObjectType(schema, objectType) {
    return schema.objectTypes.includes(objectType);
  }
  function unitFamilyAllowsUnit(family, unit) {
    switch (family) {
      case "distance":
        return unit === null || ["au", "km", "re", "sol"].includes(unit);
      case "radius":
        return unit === null || ["km", "re", "sol"].includes(unit);
      case "mass":
        return unit === null || ["me", "sol"].includes(unit);
      case "duration":
        return unit === null || ["h", "d", "y"].includes(unit);
      case "angle":
        return unit === null || unit === "deg";
      case "generic":
        return true;
    }
  }

  // packages/core/dist/tokenize.js
  function tokenizeLine(input) {
    return tokenizeLineDetailed(input).map((token) => token.value);
  }
  function tokenizeLineDetailed(input, options = {}) {
    const tokens = [];
    const columnOffset = options.columnOffset ?? 0;
    let current = "";
    let tokenColumn = null;
    let tokenWasQuoted = false;
    let inQuotes = false;
    let quoteColumn = null;
    const pushToken = () => {
      if (tokenColumn === null) {
        return;
      }
      tokens.push({
        value: current,
        column: tokenColumn,
        quoted: tokenWasQuoted
      });
      current = "";
      tokenColumn = null;
      tokenWasQuoted = false;
    };
    for (let index = 0; index < input.length; index++) {
      const ch = input[index];
      const absoluteColumn = columnOffset + index + 1;
      if (inQuotes && ch === "\\") {
        const next = input[index + 1];
        if (next === '"' || next === "\\") {
          current += next;
          index++;
          continue;
        }
      }
      if (ch === '"') {
        if (!inQuotes) {
          if (tokenColumn === null) {
            tokenColumn = absoluteColumn;
          }
          tokenWasQuoted = true;
          quoteColumn = absoluteColumn;
          inQuotes = true;
        } else {
          inQuotes = false;
        }
        continue;
      }
      if (!inQuotes && /\s/.test(ch)) {
        pushToken();
        continue;
      }
      if (tokenColumn === null) {
        tokenColumn = absoluteColumn;
      }
      current += ch;
    }
    if (inQuotes) {
      throw new WorldOrbitError("Unclosed quote in line", options.line, quoteColumn ?? columnOffset + input.length);
    }
    pushToken();
    return tokens;
  }
  function getIndent(rawLine) {
    return rawLine.match(/^\s*/)?.[0].length ?? 0;
  }

  // packages/core/dist/parse.js
  function parseWorldOrbit(source) {
    const lines = source.split(/\r?\n/);
    const objects = [];
    let currentObject = null;
    let inInfoBlock = false;
    let infoIndent = null;
    for (let index = 0; index < lines.length; index++) {
      const rawLine = lines[index];
      const lineNumber = index + 1;
      if (!rawLine.trim()) {
        continue;
      }
      const indent = getIndent(rawLine);
      const tokens = tokenizeLineDetailed(rawLine.slice(indent), {
        line: lineNumber,
        columnOffset: indent
      });
      if (tokens.length === 0) {
        continue;
      }
      if (indent === 0) {
        inInfoBlock = false;
        infoIndent = null;
        const objectNode = parseObjectHeader(tokens, lineNumber);
        objects.push(objectNode);
        currentObject = objectNode;
        continue;
      }
      if (!currentObject) {
        throw new WorldOrbitError("Indented line without parent object", lineNumber, indent + 1);
      }
      if (tokens.length === 1 && tokens[0].value === "info") {
        inInfoBlock = true;
        infoIndent = indent;
        continue;
      }
      if (inInfoBlock && indent <= (infoIndent ?? 0)) {
        inInfoBlock = false;
      }
      if (inInfoBlock) {
        currentObject.infoEntries.push(parseInfoEntry(tokens, lineNumber));
      } else {
        currentObject.blockFields.push(parseField(tokens, lineNumber));
      }
    }
    return {
      type: "document",
      objects
    };
  }
  function parseObjectHeader(tokens, line) {
    if (tokens.length < 2) {
      throw new WorldOrbitError("Invalid object declaration", line, tokens[0]?.column ?? 1);
    }
    const [objectTypeToken, nameToken, ...rest] = tokens;
    if (!WORLDORBIT_OBJECT_TYPES.has(objectTypeToken.value)) {
      throw new WorldOrbitError(`Unknown object type "${objectTypeToken.value}"`, line, objectTypeToken.column);
    }
    return {
      type: "object",
      objectType: objectTypeToken.value,
      name: nameToken.value,
      inlineFields: parseInlineFields(rest, line),
      blockFields: [],
      infoEntries: [],
      location: { line, column: objectTypeToken.column }
    };
  }
  function parseInlineFields(tokens, line) {
    const fields = [];
    let index = 0;
    while (index < tokens.length) {
      const keyToken = tokens[index];
      const schema = getFieldSchema(keyToken.value);
      if (!schema) {
        throw new WorldOrbitError(`Unknown field "${keyToken.value}"`, line, keyToken.column);
      }
      index++;
      const valueTokens = [];
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
        throw new WorldOrbitError(`Missing value for field "${keyToken.value}"`, line, keyToken.column);
      }
      fields.push({
        type: "field",
        key: keyToken.value,
        values: valueTokens.map((token) => token.value),
        location: { line, column: keyToken.column }
      });
    }
    return fields;
  }
  function parseField(tokens, line) {
    if (tokens.length < 2) {
      throw new WorldOrbitError("Invalid field line", line, tokens[0]?.column ?? 1);
    }
    if (!getFieldSchema(tokens[0].value)) {
      throw new WorldOrbitError(`Unknown field "${tokens[0].value}"`, line, tokens[0].column);
    }
    return {
      type: "field",
      key: tokens[0].value,
      values: tokens.slice(1).map((token) => token.value),
      location: { line, column: tokens[0].column }
    };
  }
  function parseInfoEntry(tokens, line) {
    if (tokens.length < 2) {
      throw new WorldOrbitError("Invalid info entry", line, tokens[0]?.column ?? 1);
    }
    return {
      type: "info-entry",
      key: tokens[0].value,
      value: tokens.slice(1).map((token) => token.value).join(" "),
      location: { line, column: tokens[0].column }
    };
  }

  // packages/core/dist/normalize.js
  var UNIT_PATTERN = /^(-?\d+(?:\.\d+)?)(au|km|re|sol|me|d|y|h|deg)?$/;
  var BOOLEAN_VALUES = /* @__PURE__ */ new Map([
    ["true", true],
    ["false", false],
    ["yes", true],
    ["no", false]
  ]);
  var URL_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:/;
  function normalizeDocument(ast) {
    let system = null;
    const objects = [];
    for (const node of ast.objects) {
      const normalized = normalizeObject(node);
      if (node.objectType === "system") {
        if (system) {
          throw WorldOrbitError.fromLocation("Only one system object is allowed", node.location);
        }
        system = normalized;
      } else {
        objects.push(normalized);
      }
    }
    return {
      format: "worldorbit",
      version: "1.0",
      system,
      objects
    };
  }
  function normalizeObject(node) {
    const mergedFields = [...node.inlineFields, ...node.blockFields];
    validateFieldCompatibility(node.objectType, mergedFields);
    const fieldMap = collectFields(mergedFields);
    const placement = extractPlacement(node.objectType, fieldMap);
    const properties = normalizeProperties(fieldMap);
    const info = normalizeInfo(node.infoEntries);
    if (node.objectType === "system") {
      return {
        type: "system",
        id: node.name,
        properties,
        info
      };
    }
    return {
      type: node.objectType,
      id: node.name,
      properties,
      placement,
      info
    };
  }
  function validateFieldCompatibility(objectType, fields) {
    for (const field of fields) {
      const schema = getFieldSchema(field.key);
      if (!schema) {
        throw WorldOrbitError.fromLocation(`Unknown field "${field.key}"`, field.location);
      }
      if (!supportsObjectType(schema, objectType)) {
        throw WorldOrbitError.fromLocation(`Field "${field.key}" is not valid on "${objectType}"`, field.location);
      }
      if (schema.arity === "single" && field.values.length !== 1) {
        throw WorldOrbitError.fromLocation(`Field "${field.key}" expects exactly one value`, field.location);
      }
    }
  }
  function collectFields(fields) {
    const map = /* @__PURE__ */ new Map();
    for (const field of fields) {
      if (map.has(field.key)) {
        throw WorldOrbitError.fromLocation(`Duplicate field "${field.key}"`, field.location);
      }
      map.set(field.key, field);
    }
    return map;
  }
  function extractPlacement(objectType, fieldMap) {
    const hasOrbit = fieldMap.has("orbit");
    const hasAt = fieldMap.has("at");
    const hasSurface = fieldMap.has("surface");
    const hasFree = fieldMap.has("free");
    const count = [hasOrbit, hasAt, hasSurface, hasFree].filter(Boolean).length;
    if (count > 1) {
      const conflictingField = fieldMap.get("orbit") ?? fieldMap.get("at") ?? fieldMap.get("surface") ?? fieldMap.get("free");
      throw WorldOrbitError.fromLocation("Object has multiple placement modes", conflictingField?.location);
    }
    if (objectType === "system" && count > 0) {
      throw WorldOrbitError.fromLocation("System objects cannot declare placement", [...fieldMap.values()][0]?.location);
    }
    if (hasOrbit) {
      return {
        mode: "orbit",
        target: singleValue(fieldMap, "orbit"),
        distance: parseOptionalUnitValue(fieldMap, "distance"),
        semiMajor: parseOptionalUnitValue(fieldMap, "semiMajor"),
        eccentricity: parseOptionalNumber(fieldMap, "eccentricity"),
        period: parseOptionalUnitValue(fieldMap, "period"),
        angle: parseOptionalUnitValue(fieldMap, "angle"),
        inclination: parseOptionalUnitValue(fieldMap, "inclination"),
        phase: parseOptionalUnitValue(fieldMap, "phase")
      };
    }
    if (hasAt) {
      const field = getField(fieldMap, "at");
      const target = singleValue(fieldMap, "at");
      return {
        mode: "at",
        target,
        reference: parseAtReference(target, field.location)
      };
    }
    if (hasSurface) {
      return {
        mode: "surface",
        target: singleValue(fieldMap, "surface")
      };
    }
    if (hasFree) {
      const raw = singleValue(fieldMap, "free");
      const distance = tryParseUnitValue(raw);
      return {
        mode: "free",
        distance: distance ?? void 0,
        descriptor: distance ? void 0 : raw
      };
    }
    return null;
  }
  function normalizeProperties(fieldMap) {
    const result = {};
    for (const [key, field] of fieldMap.entries()) {
      const schema = getFieldSchema(key);
      if (!schema || schema.placement) {
        continue;
      }
      switch (schema.kind) {
        case "list":
          result[key] = field.values;
          break;
        case "boolean":
          result[key] = parseBoolean(field);
          break;
        case "number":
          result[key] = parseNumber(singleFieldValue(field), key, field.location);
          break;
        case "unit":
          result[key] = parseUnitValue(singleFieldValue(field), field.location, key);
          break;
        case "string":
          result[key] = normalizeStringValue(key, field);
          break;
      }
    }
    return result;
  }
  function normalizeStringValue(key, field) {
    const value = field.values.join(" ").trim();
    if (key === "image") {
      validateImageSource(value, field.location);
    }
    return value;
  }
  function validateImageSource(value, location) {
    if (!value) {
      throw WorldOrbitError.fromLocation('Field "image" must not be empty', location);
    }
    if (value.startsWith("//")) {
      throw WorldOrbitError.fromLocation('Field "image" must use a relative path, root-relative path, or an http/https URL', location);
    }
    const schemeMatch = value.match(URL_SCHEME_PATTERN);
    if (!schemeMatch) {
      return;
    }
    const scheme = schemeMatch[0].slice(0, -1).toLowerCase();
    if (scheme !== "http" && scheme !== "https") {
      throw WorldOrbitError.fromLocation(`Field "image" does not support the "${scheme}" scheme`, location);
    }
  }
  function normalizeInfo(entries) {
    const info = {};
    for (const entry of entries) {
      if (entry.key in info) {
        throw WorldOrbitError.fromLocation(`Duplicate info key "${entry.key}"`, entry.location);
      }
      info[entry.key] = entry.value;
    }
    return info;
  }
  function parseAtReference(target, location) {
    if (/^[A-Za-z0-9._-]+-[A-Za-z0-9._-]+:L\d+$/i.test(target)) {
      throw WorldOrbitError.fromLocation(`Invalid special position "${target}"`, location);
    }
    const pairedMatch = target.match(/^([A-Za-z0-9._-]+)-([A-Za-z0-9._-]+):(L[1-5])$/);
    if (pairedMatch) {
      return {
        kind: "lagrange",
        primary: pairedMatch[1],
        secondary: pairedMatch[2],
        point: pairedMatch[3]
      };
    }
    const simpleMatch = target.match(/^([A-Za-z0-9._-]+):(L[1-5])$/);
    if (simpleMatch) {
      return {
        kind: "lagrange",
        primary: simpleMatch[1],
        secondary: null,
        point: simpleMatch[2]
      };
    }
    if (/^[A-Za-z0-9._-]+:L\d+$/i.test(target)) {
      throw WorldOrbitError.fromLocation(`Invalid special position "${target}"`, location);
    }
    const anchorMatch = target.match(/^([A-Za-z0-9._-]+):([A-Za-z0-9._-]+)$/);
    if (anchorMatch) {
      return {
        kind: "anchor",
        objectId: anchorMatch[1],
        anchor: anchorMatch[2]
      };
    }
    return {
      kind: "named",
      name: target
    };
  }
  function parseUnitValue(input, location, fieldKey) {
    const match = input.match(UNIT_PATTERN);
    if (!match) {
      throw WorldOrbitError.fromLocation(`Invalid unit value "${input}"`, location);
    }
    const unitValue = {
      value: Number(match[1]),
      unit: match[2] ?? null
    };
    if (fieldKey) {
      const schema = getFieldSchema(fieldKey);
      if (schema?.unitFamily && !unitFamilyAllowsUnit(schema.unitFamily, unitValue.unit)) {
        throw WorldOrbitError.fromLocation(`Unit "${unitValue.unit ?? "none"}" is not valid for "${fieldKey}"`, location);
      }
    }
    return unitValue;
  }
  function tryParseUnitValue(input) {
    const match = input.match(UNIT_PATTERN);
    if (!match) {
      return null;
    }
    return {
      value: Number(match[1]),
      unit: match[2] ?? null
    };
  }
  function parseOptionalUnitValue(fieldMap, key) {
    if (!fieldMap.has(key)) {
      return void 0;
    }
    const field = getField(fieldMap, key);
    return parseUnitValue(singleFieldValue(field), field.location, key);
  }
  function parseOptionalNumber(fieldMap, key) {
    if (!fieldMap.has(key)) {
      return void 0;
    }
    const field = getField(fieldMap, key);
    return parseNumber(singleFieldValue(field), key, field.location);
  }
  function parseNumber(input, key, location) {
    const value = Number(input);
    if (!Number.isFinite(value)) {
      throw WorldOrbitError.fromLocation(`Invalid numeric value "${input}" for "${key}"`, location);
    }
    return value;
  }
  function parseBoolean(field) {
    const rawValue = singleFieldValue(field).toLowerCase();
    const parsed = BOOLEAN_VALUES.get(rawValue);
    if (parsed === void 0) {
      throw WorldOrbitError.fromLocation(`Invalid boolean value "${rawValue}" for "${field.key}"`, field.location);
    }
    return parsed;
  }
  function getField(fieldMap, key) {
    const field = fieldMap.get(key);
    if (!field) {
      throw new WorldOrbitError(`Missing value for key "${key}"`);
    }
    return field;
  }
  function singleValue(fieldMap, key) {
    return singleFieldValue(getField(fieldMap, key));
  }
  function singleFieldValue(field) {
    if (field.values.length !== 1) {
      throw WorldOrbitError.fromLocation(`Field "${field.key}" expects exactly one value`, field.location);
    }
    return field.values[0];
  }

  // packages/core/dist/validate.js
  var SURFACE_TARGET_TYPES = /* @__PURE__ */ new Set([
    "star",
    "planet",
    "moon",
    "asteroid",
    "comet"
  ]);
  function validateDocument(doc) {
    const knownIds = /* @__PURE__ */ new Set();
    const objectMap = /* @__PURE__ */ new Map();
    for (const obj of doc.objects) {
      if (knownIds.has(obj.id)) {
        throw new WorldOrbitError(`Duplicate object id "${obj.id}"`);
      }
      knownIds.add(obj.id);
      objectMap.set(obj.id, obj);
    }
    for (const obj of doc.objects) {
      if (!obj.placement) {
        continue;
      }
      if (obj.placement.mode === "orbit" || obj.placement.mode === "surface") {
        if (!knownIds.has(obj.placement.target)) {
          throw new WorldOrbitError(`Unknown placement target "${obj.placement.target}" on "${obj.id}"`);
        }
      }
      if (obj.placement.mode === "surface") {
        const target = objectMap.get(obj.placement.target);
        if (!target || !SURFACE_TARGET_TYPES.has(target.type)) {
          throw new WorldOrbitError(`Surface target "${obj.placement.target}" on "${obj.id}" is not surface-capable`);
        }
      }
      if (obj.placement.mode === "at") {
        if (obj.placement.reference.kind === "lagrange") {
          validateLagrangeReference(obj, obj.placement.reference, knownIds);
        }
        if (obj.placement.reference.kind === "anchor") {
          validateAnchorReference(obj, obj.placement.reference, knownIds);
        }
      }
    }
  }
  function validateLagrangeReference(obj, reference, knownIds) {
    if (!knownIds.has(reference.primary)) {
      throw new WorldOrbitError(`Unknown Lagrange reference "${reference.primary}" on "${obj.id}"`);
    }
    if (reference.secondary && !knownIds.has(reference.secondary)) {
      throw new WorldOrbitError(`Unknown Lagrange reference "${reference.secondary}" on "${obj.id}"`);
    }
  }
  function validateAnchorReference(obj, reference, knownIds) {
    if (!knownIds.has(reference.objectId)) {
      throw new WorldOrbitError(`Unknown anchor target "${reference.objectId}" on "${obj.id}"`);
    }
  }

  // packages/core/dist/diagnostics.js
  function createDiagnostic(diagnostic) {
    return { ...diagnostic };
  }
  function diagnosticFromError(error, source, code = `${source}.failed`) {
    if (error instanceof WorldOrbitError) {
      return {
        code,
        severity: "error",
        source,
        message: error.message,
        line: error.line,
        column: error.column
      };
    }
    if (error instanceof Error) {
      return {
        code,
        severity: "error",
        source,
        message: error.message
      };
    }
    return {
      code,
      severity: "error",
      source,
      message: String(error)
    };
  }
  function parseWithDiagnostics(source) {
    let ast;
    try {
      ast = parseWorldOrbit(source);
    } catch (error) {
      const diagnostic = diagnosticFromError(error, "parse");
      return {
        ok: false,
        value: null,
        diagnostics: [diagnostic]
      };
    }
    let document2;
    try {
      document2 = normalizeDocument(ast);
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "normalize")]
      };
    }
    try {
      validateDocument(document2);
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "validate")]
      };
    }
    return {
      ok: true,
      value: {
        ast,
        document: document2
      },
      diagnostics: []
    };
  }
  function normalizeWithDiagnostics(ast) {
    try {
      return {
        ok: true,
        value: normalizeDocument(ast),
        diagnostics: []
      };
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "normalize")]
      };
    }
  }
  function validateDocumentWithDiagnostics(document2) {
    try {
      validateDocument(document2);
      return {
        ok: true,
        value: document2,
        diagnostics: []
      };
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "validate")]
      };
    }
  }

  // packages/core/dist/scene.js
  var AU_IN_KM = 1495978707e-1;
  var EARTH_RADIUS_IN_KM = 6371;
  var SOLAR_RADIUS_IN_KM = 695700;
  var ISO_FLATTENING = 0.68;
  var MIN_ISO_MINOR_SCALE = 0.2;
  var ARC_SAMPLE_COUNT = 28;
  function renderDocumentToScene(document2, options = {}) {
    const frame = resolveSceneFrame(options);
    const width = frame.width;
    const height = frame.height;
    const padding = frame.padding;
    const layoutPreset = resolveLayoutPreset(document2);
    const projection = resolveProjection(document2, options.projection);
    const scaleModel = resolveScaleModel(layoutPreset, options.scaleModel);
    const spacingFactor = layoutPresetSpacing(layoutPreset);
    const systemId = document2.system?.id ?? null;
    const objectMap = new Map(document2.objects.map((object) => [object.id, object]));
    const relationships = buildSceneRelationships(document2.objects, objectMap);
    const positions = /* @__PURE__ */ new Map();
    const orbitDrafts = [];
    const leaderDrafts = [];
    const rootObjects = [];
    const freeObjects = [];
    const atObjects = [];
    const surfaceChildren = /* @__PURE__ */ new Map();
    const orbitChildren = /* @__PURE__ */ new Map();
    for (const object of document2.objects) {
      const placement = object.placement;
      if (!placement) {
        rootObjects.push(object);
        continue;
      }
      if (placement.mode === "orbit") {
        pushGrouped(orbitChildren, placement.target, object);
        continue;
      }
      if (placement.mode === "surface") {
        pushGrouped(surfaceChildren, placement.target, object);
        continue;
      }
      if (placement.mode === "at") {
        atObjects.push(object);
        continue;
      }
      freeObjects.push(object);
    }
    const centerX = freeObjects.length > 0 ? width * 0.42 : width / 2;
    const centerY = height / 2;
    const context = {
      orbitChildren,
      surfaceChildren,
      objectMap,
      spacingFactor,
      projection,
      scaleModel
    };
    const primaryRoot = rootObjects.find((object) => object.type === "star") ?? rootObjects[0] ?? null;
    if (primaryRoot) {
      placeObject(primaryRoot, centerX, centerY, 0, positions, orbitDrafts, leaderDrafts, context);
    }
    const secondaryRoots = rootObjects.filter((object) => object.id !== primaryRoot?.id);
    if (secondaryRoots.length > 0) {
      const rootRingRadius = Math.min(width, height) * 0.28 * spacingFactor * scaleModel.orbitDistanceMultiplier;
      secondaryRoots.forEach((object, index) => {
        const angle = angleForIndex(index, secondaryRoots.length, -Math.PI / 2);
        const offset = projectPolarOffset(angle, rootRingRadius, projection, 1);
        placeObject(object, centerX + offset.x, centerY + offset.y, 0, positions, orbitDrafts, leaderDrafts, context);
      });
    }
    freeObjects.forEach((object, index) => {
      const x = width - padding - 140 - freePlacementOffsetPx(object.placement?.mode === "free" ? object.placement.distance : void 0, scaleModel);
      const rowStep = Math.max(76, (height - padding * 2 - 180) / Math.max(1, freeObjects.length) * spacingFactor) * scaleModel.freePlacementMultiplier;
      const y = padding + 92 + index * rowStep;
      positions.set(object.id, {
        object,
        x,
        y,
        radius: visualRadiusFor(object, 0, scaleModel),
        sortKey: computeSortKey(x, y, 0)
      });
      leaderDrafts.push({
        object,
        groupId: relationships.groupIds.get(object.id) ?? null,
        x1: x - 60,
        y1: y,
        x2: x - 18,
        y2: y,
        mode: "free"
      });
      placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, context, 1);
    });
    atObjects.forEach((object, index) => {
      if (positions.has(object.id) || !object.placement || object.placement.mode !== "at") {
        return;
      }
      const resolved = resolveAtPosition(object.placement.reference, positions, objectMap, index, atObjects.length, width, height, padding, context);
      positions.set(object.id, {
        object,
        x: resolved.x,
        y: resolved.y,
        radius: visualRadiusFor(object, 2, scaleModel),
        sortKey: computeSortKey(resolved.x, resolved.y, 2),
        anchorX: resolved.anchorX,
        anchorY: resolved.anchorY
      });
      if (resolved.anchorX !== void 0 && resolved.anchorY !== void 0) {
        leaderDrafts.push({
          object,
          groupId: relationships.groupIds.get(object.id) ?? null,
          x1: resolved.anchorX,
          y1: resolved.anchorY,
          x2: resolved.x,
          y2: resolved.y,
          mode: "at"
        });
      }
      placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, context, 2);
    });
    const objects = [...positions.values()].map((position) => createSceneObject(position, scaleModel, relationships));
    const orbitVisuals = orbitDrafts.map((draft) => createOrbitVisual(draft, relationships.groupIds.get(draft.object.id) ?? null));
    const leaders = leaderDrafts.map((draft) => createLeaderLine(draft));
    const labels = createSceneLabels(objects, height, scaleModel.labelMultiplier);
    const layers = createSceneLayers(orbitVisuals, leaders, objects, labels);
    const groups = createSceneGroups(objects, orbitVisuals, leaders, labels, relationships);
    const viewpoints = createSceneViewpoints(document2, projection, frame.preset, relationships, objectMap);
    const contentBounds = calculateContentBounds(width, height, objects, orbitVisuals, leaders, labels);
    return {
      width,
      height,
      padding,
      renderPreset: frame.preset,
      projection,
      scaleModel,
      title: String(document2.system?.properties.title ?? document2.system?.id ?? "WorldOrbit") || "WorldOrbit",
      subtitle: `${capitalizeLabel(projection)} view - ${capitalizeLabel(layoutPreset)} layout`,
      systemId,
      viewMode: projection,
      layoutPreset,
      metadata: {
        format: document2.format,
        version: document2.version,
        view: projection,
        scale: String(document2.system?.properties.scale ?? layoutPreset),
        units: String(document2.system?.properties.units ?? "mixed"),
        preset: frame.preset ?? "custom"
      },
      contentBounds,
      layers,
      groups,
      viewpoints,
      objects,
      orbitVisuals,
      leaders,
      labels
    };
  }
  function rotatePoint(point, center, rotationDeg) {
    const radians = degreesToRadians(rotationDeg);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  }
  function resolveLayoutPreset(document2) {
    const rawScale = String(document2.system?.properties.scale ?? "balanced").toLowerCase();
    switch (rawScale) {
      case "compressed":
      case "compact":
        return "compact";
      case "expanded":
      case "presentation":
        return "presentation";
      default:
        return "balanced";
    }
  }
  function resolveSceneFrame(options) {
    const defaults = scenePresetDefaults(options.preset);
    return {
      width: options.width ?? defaults.width,
      height: options.height ?? defaults.height,
      padding: options.padding ?? defaults.padding,
      preset: options.preset ?? null
    };
  }
  function scenePresetDefaults(preset) {
    switch (preset) {
      case "presentation":
        return { width: 1440, height: 900, padding: 88 };
      case "atlas-card":
        return { width: 960, height: 560, padding: 56 };
      case "markdown":
        return { width: 920, height: 540, padding: 48 };
      case "diagram":
      default:
        return { width: 1200, height: 780, padding: 72 };
    }
  }
  function resolveProjection(document2, projection) {
    if (projection === "topdown" || projection === "isometric") {
      return projection;
    }
    return String(document2.system?.properties.view ?? "topdown").toLowerCase() === "isometric" ? "isometric" : "topdown";
  }
  function resolveScaleModel(layoutPreset, overrides) {
    const defaults = defaultScaleModel(layoutPreset);
    return {
      ...defaults,
      ...overrides
    };
  }
  function defaultScaleModel(layoutPreset) {
    switch (layoutPreset) {
      case "compact":
        return {
          orbitDistanceMultiplier: 0.84,
          bodyRadiusMultiplier: 0.92,
          labelMultiplier: 0.9,
          freePlacementMultiplier: 0.9,
          ringThicknessMultiplier: 0.92,
          minBodyRadius: 4,
          maxBodyRadius: 36
        };
      case "presentation":
        return {
          orbitDistanceMultiplier: 1.2,
          bodyRadiusMultiplier: 1.18,
          labelMultiplier: 1.08,
          freePlacementMultiplier: 1.05,
          ringThicknessMultiplier: 1.16,
          minBodyRadius: 5,
          maxBodyRadius: 48
        };
      default:
        return {
          orbitDistanceMultiplier: 1,
          bodyRadiusMultiplier: 1,
          labelMultiplier: 1,
          freePlacementMultiplier: 1,
          ringThicknessMultiplier: 1,
          minBodyRadius: 4,
          maxBodyRadius: 40
        };
    }
  }
  function layoutPresetSpacing(layoutPreset) {
    switch (layoutPreset) {
      case "compact":
        return 0.84;
      case "presentation":
        return 1.2;
      default:
        return 1;
    }
  }
  function createSceneObject(position, scaleModel, relationships) {
    const { object, x, y, radius, sortKey, anchorX, anchorY } = position;
    return {
      renderId: createRenderId(object.id),
      objectId: object.id,
      object,
      parentId: relationships.parentIds.get(object.id) ?? null,
      ancestorIds: relationships.ancestorIds.get(object.id) ?? [],
      childIds: relationships.childIds.get(object.id) ?? [],
      groupId: relationships.groupIds.get(object.id) ?? null,
      x,
      y,
      radius,
      visualRadius: visualExtentForObject(object, radius, scaleModel),
      sortKey,
      anchorX,
      anchorY,
      label: object.id,
      secondaryLabel: object.type === "structure" ? String(object.properties.kind ?? object.type) : object.type,
      fillColor: customColorFor(object.properties.color),
      imageHref: typeof object.properties.image === "string" && object.properties.image.trim() ? object.properties.image : void 0,
      hidden: object.properties.hidden === true
    };
  }
  function createOrbitVisual(draft, groupId) {
    return {
      renderId: `${createRenderId(draft.object.id)}-orbit`,
      objectId: draft.object.id,
      object: draft.object,
      parentId: draft.parentId,
      groupId,
      kind: draft.kind,
      cx: draft.cx,
      cy: draft.cy,
      radius: draft.radius,
      rx: draft.rx,
      ry: draft.ry,
      rotationDeg: draft.rotationDeg,
      band: draft.band,
      bandThickness: draft.bandThickness,
      frontArcPath: draft.frontArcPath,
      backArcPath: draft.backArcPath,
      hidden: draft.object.properties.hidden === true
    };
  }
  function createLeaderLine(draft) {
    return {
      renderId: `${createRenderId(draft.object.id)}-leader-${draft.mode}`,
      objectId: draft.object.id,
      object: draft.object,
      groupId: draft.groupId,
      x1: draft.x1,
      y1: draft.y1,
      x2: draft.x2,
      y2: draft.y2,
      mode: draft.mode,
      hidden: draft.object.properties.hidden === true
    };
  }
  function createSceneLabels(objects, sceneHeight, labelMultiplier) {
    const labels = [];
    const occupied = [];
    const visibleObjects = [...objects].filter((object) => !object.hidden).sort((left, right) => left.sortKey - right.sortKey);
    for (const object of visibleObjects) {
      const direction = object.y > sceneHeight * 0.62 ? -1 : 1;
      const labelHalfWidth = estimateLabelHalfWidth(object, labelMultiplier);
      let labelY = object.y + direction * (object.radius + 18 * labelMultiplier);
      let secondaryY = labelY + direction * (16 * labelMultiplier);
      let bounds = createLabelRect(object.x, labelY, secondaryY, labelHalfWidth, direction);
      let attempts = 0;
      while (occupied.some((entry) => rectsOverlap(entry, bounds)) && attempts < 10) {
        labelY += direction * 14 * labelMultiplier;
        secondaryY += direction * 14 * labelMultiplier;
        bounds = createLabelRect(object.x, labelY, secondaryY, labelHalfWidth, direction);
        attempts += 1;
      }
      occupied.push(bounds);
      labels.push({
        renderId: `${object.renderId}-label`,
        objectId: object.objectId,
        object: object.object,
        groupId: object.groupId,
        label: object.label,
        secondaryLabel: object.secondaryLabel,
        x: object.x,
        y: labelY,
        secondaryY,
        textAnchor: "middle",
        direction: direction < 0 ? "above" : "below",
        hidden: object.hidden
      });
    }
    return labels;
  }
  function createSceneLayers(orbitVisuals, leaders, objects, labels) {
    const backOrbitIds = orbitVisuals.filter((visual) => !visual.hidden && Boolean(visual.backArcPath)).map((visual) => visual.renderId);
    const frontOrbitIds = orbitVisuals.filter((visual) => !visual.hidden).map((visual) => visual.renderId);
    return [
      { id: "background", renderIds: ["wo-bg", "wo-bg-glow", "wo-grid"] },
      {
        id: "guides",
        renderIds: leaders.filter((leader) => !leader.hidden).map((leader) => leader.renderId)
      },
      { id: "orbits-back", renderIds: backOrbitIds },
      { id: "orbits-front", renderIds: frontOrbitIds },
      {
        id: "objects",
        renderIds: objects.filter((object) => !object.hidden).map((object) => object.renderId)
      },
      {
        id: "labels",
        renderIds: labels.filter((label) => !label.hidden).map((label) => label.renderId)
      },
      { id: "metadata", renderIds: ["wo-title", "wo-subtitle", "wo-meta"] }
    ];
  }
  function createSceneGroups(objects, orbitVisuals, leaders, labels, relationships) {
    const groups = /* @__PURE__ */ new Map();
    const ensureGroup = (groupId) => {
      if (!groupId) {
        return null;
      }
      const existing = groups.get(groupId);
      if (existing) {
        return existing;
      }
      const rootObjectId = relationships.groupRoots.get(groupId) ?? null;
      const created = {
        renderId: groupId,
        rootObjectId,
        label: rootObjectId ?? groupId,
        objectIds: [],
        orbitIds: [],
        labelIds: [],
        leaderIds: [],
        contentBounds: createBounds(0, 0, 0, 0)
      };
      groups.set(groupId, created);
      return created;
    };
    for (const object of objects) {
      const group = ensureGroup(object.groupId);
      if (group && !object.hidden) {
        group.objectIds.push(object.objectId);
      }
    }
    for (const orbit of orbitVisuals) {
      const group = ensureGroup(orbit.groupId);
      if (group && !orbit.hidden) {
        group.orbitIds.push(orbit.objectId);
      }
    }
    for (const leader of leaders) {
      const group = ensureGroup(leader.groupId);
      if (group && !leader.hidden) {
        group.leaderIds.push(leader.objectId);
      }
    }
    for (const label of labels) {
      const group = ensureGroup(label.groupId);
      if (group && !label.hidden) {
        group.labelIds.push(label.objectId);
      }
    }
    for (const group of groups.values()) {
      group.contentBounds = calculateGroupBounds(group, objects, orbitVisuals, leaders, labels);
    }
    return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label));
  }
  function createSceneViewpoints(document2, projection, preset, relationships, objectMap) {
    const generatedOverview = createGeneratedOverviewViewpoint(document2, projection, preset);
    const drafts = /* @__PURE__ */ new Map();
    for (const [key, value] of Object.entries(document2.system?.info ?? {})) {
      if (!key.startsWith("viewpoint.")) {
        continue;
      }
      const [prefix, rawId, ...fieldParts] = key.split(".");
      if (prefix !== "viewpoint" || !rawId || fieldParts.length === 0) {
        continue;
      }
      const id = normalizeViewpointId(rawId);
      if (!id) {
        continue;
      }
      const field = fieldParts.join(".").toLowerCase();
      const draft = drafts.get(id) ?? { id };
      applyViewpointField(draft, field, value, projection, preset, relationships, objectMap);
      drafts.set(id, draft);
    }
    const viewpoints = [...drafts.values()].map((draft) => finalizeViewpointDraft(draft, projection, preset, objectMap)).filter(Boolean);
    const overviewIndex = viewpoints.findIndex((viewpoint) => viewpoint.id === generatedOverview.id);
    if (overviewIndex >= 0) {
      viewpoints.splice(overviewIndex, 1, {
        ...generatedOverview,
        ...viewpoints[overviewIndex],
        layers: {
          ...generatedOverview.layers,
          ...viewpoints[overviewIndex].layers
        },
        filter: viewpoints[overviewIndex].filter ?? generatedOverview.filter,
        generated: false
      });
    } else {
      viewpoints.unshift(generatedOverview);
    }
    return viewpoints.sort((left, right) => {
      if (left.id === "overview")
        return -1;
      if (right.id === "overview")
        return 1;
      return left.label.localeCompare(right.label);
    });
  }
  function createGeneratedOverviewViewpoint(document2, projection, preset) {
    const label = document2.system?.properties.title ? `${String(document2.system.properties.title)} Overview` : "Overview";
    return {
      id: "overview",
      label,
      summary: "Fit the whole system with the current atlas defaults.",
      objectId: null,
      selectedObjectId: null,
      projection,
      preset,
      rotationDeg: 0,
      scale: null,
      layers: {},
      filter: null,
      generated: true
    };
  }
  function applyViewpointField(draft, field, value, projection, preset, relationships, objectMap) {
    const normalizedValue = value.trim();
    switch (field) {
      case "label":
      case "title":
        if (normalizedValue) {
          draft.label = normalizedValue;
        }
        return;
      case "summary":
      case "description":
        if (normalizedValue) {
          draft.summary = normalizedValue;
        }
        return;
      case "focus":
      case "object":
        if (normalizedValue) {
          draft.focus = normalizedValue;
        }
        return;
      case "select":
      case "selection":
        if (normalizedValue) {
          draft.select = normalizedValue;
        }
        return;
      case "projection":
      case "view":
        draft.projection = parseViewProjection(normalizedValue) ?? projection;
        return;
      case "preset":
        draft.preset = parseRenderPreset(normalizedValue) ?? preset;
        return;
      case "rotation":
      case "angle":
        draft.rotationDeg = parseFiniteNumber(normalizedValue) ?? draft.rotationDeg ?? 0;
        return;
      case "zoom":
      case "scale":
        draft.scale = parsePositiveNumber(normalizedValue);
        return;
      case "layers":
        draft.layers = parseViewpointLayers(normalizedValue);
        return;
      case "query":
        draft.filter = {
          ...draft.filter ?? createEmptyViewpointFilter(),
          query: normalizedValue || null
        };
        return;
      case "types":
      case "objecttypes":
        draft.filter = {
          ...draft.filter ?? createEmptyViewpointFilter(),
          objectTypes: parseViewpointObjectTypes(normalizedValue)
        };
        return;
      case "tags":
        draft.filter = {
          ...draft.filter ?? createEmptyViewpointFilter(),
          tags: splitListValue(normalizedValue)
        };
        return;
      case "groups":
        draft.filter = {
          ...draft.filter ?? createEmptyViewpointFilter(),
          groupIds: parseViewpointGroups(normalizedValue, relationships, objectMap)
        };
        return;
    }
  }
  function finalizeViewpointDraft(draft, projection, preset, objectMap) {
    const objectId = draft.focus && objectMap.has(draft.focus) ? draft.focus : null;
    const selectedObjectId = draft.select && objectMap.has(draft.select) ? draft.select : objectId;
    const filter = normalizeViewpointFilter(draft.filter);
    const label = draft.label?.trim() || humanizeIdentifier(draft.id);
    return {
      id: draft.id,
      label,
      summary: draft.summary?.trim() || createViewpointSummary(label, objectId, filter),
      objectId,
      selectedObjectId,
      projection: draft.projection ?? projection,
      preset: draft.preset ?? preset,
      rotationDeg: draft.rotationDeg ?? 0,
      scale: draft.scale ?? null,
      layers: draft.layers ?? {},
      filter,
      generated: false
    };
  }
  function createEmptyViewpointFilter() {
    return {
      query: null,
      objectTypes: [],
      tags: [],
      groupIds: []
    };
  }
  function normalizeViewpointFilter(filter) {
    if (!filter) {
      return null;
    }
    const normalized = {
      query: filter.query?.trim() || null,
      objectTypes: [...new Set(filter.objectTypes)],
      tags: [...new Set(filter.tags)],
      groupIds: [...new Set(filter.groupIds)]
    };
    return normalized.query || normalized.objectTypes.length > 0 || normalized.tags.length > 0 || normalized.groupIds.length > 0 ? normalized : null;
  }
  function parseViewProjection(value) {
    return value.toLowerCase() === "isometric" ? "isometric" : value.toLowerCase() === "topdown" ? "topdown" : null;
  }
  function parseRenderPreset(value) {
    const normalized = value.toLowerCase();
    if (normalized === "diagram" || normalized === "presentation" || normalized === "atlas-card" || normalized === "markdown") {
      return normalized;
    }
    return null;
  }
  function parseFiniteNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  function parsePositiveNumber(value) {
    const parsed = parseFiniteNumber(value);
    return parsed !== null && parsed > 0 ? parsed : null;
  }
  function parseViewpointLayers(value) {
    const next = {};
    for (const token of splitListValue(value)) {
      const enabled = !token.startsWith("-") && !token.startsWith("!");
      const rawLayer = token.replace(/^[-!]+/, "").toLowerCase();
      if (rawLayer === "orbits") {
        next["orbits-back"] = enabled;
        next["orbits-front"] = enabled;
        continue;
      }
      if (rawLayer === "background" || rawLayer === "guides" || rawLayer === "orbits-back" || rawLayer === "orbits-front" || rawLayer === "objects" || rawLayer === "labels" || rawLayer === "metadata") {
        next[rawLayer] = enabled;
      }
    }
    return next;
  }
  function parseViewpointObjectTypes(value) {
    return splitListValue(value).filter((entry) => entry === "star" || entry === "planet" || entry === "moon" || entry === "belt" || entry === "asteroid" || entry === "comet" || entry === "ring" || entry === "structure" || entry === "phenomenon");
  }
  function parseViewpointGroups(value, relationships, objectMap) {
    return splitListValue(value).map((entry) => {
      if (entry.startsWith("wo-") && entry.endsWith("-group")) {
        return entry;
      }
      if (relationships.groupIds.has(entry)) {
        return relationships.groupIds.get(entry) ?? createGroupId(entry);
      }
      return objectMap.has(entry) ? createGroupId(entry) : createGroupId(entry);
    });
  }
  function splitListValue(value) {
    return value.split(/[\s,]+/).map((entry) => entry.trim()).filter(Boolean);
  }
  function normalizeViewpointId(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function humanizeIdentifier(value) {
    return value.split(/[-_]+/).filter(Boolean).map((segment) => segment[0].toUpperCase() + segment.slice(1)).join(" ");
  }
  function createViewpointSummary(label, objectId, filter) {
    const parts = [label];
    if (objectId) {
      parts.push(`focus ${objectId}`);
    }
    if (filter?.objectTypes.length) {
      parts.push(filter.objectTypes.join("/"));
    }
    if (filter?.tags.length) {
      parts.push(`tags ${filter.tags.join(", ")}`);
    }
    if (filter?.query) {
      parts.push(`query "${filter.query}"`);
    }
    return parts.join(" - ");
  }
  function calculateContentBounds(width, height, objects, orbitVisuals, leaders, labels) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    const include = (x, y) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    };
    for (const orbit of orbitVisuals) {
      if (orbit.hidden)
        continue;
      includeOrbitBounds(orbit, include);
    }
    for (const leader of leaders) {
      if (leader.hidden)
        continue;
      include(leader.x1, leader.y1);
      include(leader.x2, leader.y2);
    }
    for (const object of objects) {
      if (object.hidden)
        continue;
      includeObjectBounds(object, include);
    }
    for (const label of labels) {
      if (label.hidden)
        continue;
      includeLabelBounds(label, include);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return createBounds(0, 0, width, height);
    }
    return createBounds(minX, minY, maxX, maxY);
  }
  function includeOrbitBounds(orbit, include) {
    const strokePadding = orbit.bandThickness !== void 0 ? orbit.bandThickness / 2 + 4 : orbit.band ? 10 : 3;
    if (orbit.kind === "circle" && orbit.radius !== void 0) {
      include(orbit.cx - orbit.radius - strokePadding, orbit.cy - orbit.radius - strokePadding);
      include(orbit.cx + orbit.radius + strokePadding, orbit.cy + orbit.radius + strokePadding);
      return;
    }
    const rx = orbit.rx ?? orbit.radius ?? 0;
    const ry = orbit.ry ?? orbit.radius ?? 0;
    const points = sampleEllipseArcPoints(orbit.cx, orbit.cy, rx, ry, orbit.rotationDeg, 0, Math.PI * 2, ARC_SAMPLE_COUNT * 2);
    for (const point of points) {
      include(point.x - strokePadding, point.y - strokePadding);
      include(point.x + strokePadding, point.y + strokePadding);
    }
  }
  function createBounds(minX, minY, maxX, maxY) {
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: minX + (maxX - minX) / 2,
      centerY: minY + (maxY - minY) / 2
    };
  }
  function includeObjectBounds(object, include) {
    include(object.x - object.visualRadius - 24, object.y - object.visualRadius - 16);
    include(object.x + object.visualRadius + 24, object.y + object.visualRadius + 36);
  }
  function includeLabelBounds(label, include) {
    const labelScale = 1;
    const labelHalfWidth = estimateLabelHalfWidthFromText(label.label, label.secondaryLabel, labelScale);
    include(label.x - labelHalfWidth, label.y - 18);
    include(label.x + labelHalfWidth, label.y + 8);
    include(label.x - labelHalfWidth, label.secondaryY - 14);
    include(label.x + labelHalfWidth, label.secondaryY + 8);
  }
  function placeObject(object, x, y, depth, positions, orbitDrafts, leaderDrafts, context) {
    if (positions.has(object.id)) {
      return;
    }
    positions.set(object.id, {
      object,
      x,
      y,
      radius: visualRadiusFor(object, depth, context.scaleModel),
      sortKey: computeSortKey(x, y, depth)
    });
    placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, context, depth + 1);
  }
  function placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, context, depth) {
    const parent = positions.get(object.id);
    if (!parent) {
      return;
    }
    const orbiting = [...context.orbitChildren.get(object.id) ?? []].sort(compareOrbiting);
    const orbitMetricContext = computeOrbitMetricContext(orbiting, parent.radius, context.spacingFactor, context.scaleModel);
    orbiting.forEach((child, index) => {
      const orbitGeometry = resolveOrbitGeometry(child, index, orbiting.length, parent, orbitMetricContext, context);
      orbitDrafts.push({
        object: child,
        parentId: object.id,
        kind: orbitGeometry.kind,
        cx: orbitGeometry.cx,
        cy: orbitGeometry.cy,
        radius: orbitGeometry.radius,
        rx: orbitGeometry.rx,
        ry: orbitGeometry.ry,
        rotationDeg: orbitGeometry.rotationDeg,
        band: orbitGeometry.band,
        bandThickness: orbitGeometry.bandThickness,
        frontArcPath: orbitGeometry.frontArcPath,
        backArcPath: orbitGeometry.backArcPath
      });
      placeObject(child, orbitGeometry.objectX, orbitGeometry.objectY, depth, positions, orbitDrafts, leaderDrafts, context);
    });
    const surfaceObjects = [...context.surfaceChildren.get(object.id) ?? []];
    surfaceObjects.forEach((child, index) => {
      const angle = angleForIndex(index, surfaceObjects.length, -Math.PI / 3);
      const leaderDistance = 28 * context.spacingFactor;
      const anchorOffset = projectPolarOffset(angle, parent.radius, context.projection, context.projection === "isometric" ? 0.9 : 1);
      const bodyOffset = projectPolarOffset(angle, parent.radius + leaderDistance, context.projection, context.projection === "isometric" ? 0.9 : 1);
      const anchorX = parent.x + anchorOffset.x;
      const anchorY = parent.y + anchorOffset.y;
      const x = parent.x + bodyOffset.x;
      const y = parent.y + bodyOffset.y;
      positions.set(child.id, {
        object: child,
        x,
        y,
        radius: visualRadiusFor(child, depth + 1, context.scaleModel),
        sortKey: computeSortKey(x, y, depth + 1),
        anchorX,
        anchorY
      });
      leaderDrafts.push({
        object: child,
        groupId: context.objectMap.has(child.id) ? createGroupId(resolveGroupRootObjectId(child, context.objectMap)) : null,
        x1: anchorX,
        y1: anchorY,
        x2: x,
        y2: y,
        mode: "surface"
      });
      placeOrbitingChildren(child, positions, orbitDrafts, leaderDrafts, context, depth + 1);
    });
  }
  function compareOrbiting(left, right) {
    const leftMetric = orbitMetric(left);
    const rightMetric = orbitMetric(right);
    if (leftMetric !== null && rightMetric !== null && leftMetric !== rightMetric) {
      return leftMetric - rightMetric;
    }
    if (leftMetric !== null && rightMetric === null)
      return -1;
    if (leftMetric === null && rightMetric !== null)
      return 1;
    return left.id.localeCompare(right.id);
  }
  function computeOrbitMetricContext(objects, parentRadius, spacingFactor, scaleModel) {
    const metrics = objects.map((object) => orbitMetric(object));
    const presentMetrics = metrics.filter((value) => value !== null);
    const innerPx = parentRadius + 56 * spacingFactor * scaleModel.orbitDistanceMultiplier;
    const stepPx = (objects.length > 2 ? 54 : 64) * spacingFactor * scaleModel.orbitDistanceMultiplier;
    if (presentMetrics.length === 0) {
      return {
        metrics,
        minMetric: 0,
        maxMetric: 0,
        metricSpread: 0,
        innerPx,
        stepPx,
        pixelSpread: Math.max(stepPx * Math.max(objects.length - 1, 1), stepPx)
      };
    }
    const minMetric = Math.min(...presentMetrics);
    const maxMetric = Math.max(...presentMetrics);
    const metricSpread = maxMetric - minMetric;
    return {
      metrics,
      minMetric,
      maxMetric,
      metricSpread,
      innerPx,
      stepPx,
      pixelSpread: Math.max(stepPx * Math.max(objects.length - 1, 1), stepPx)
    };
  }
  function resolveOrbitGeometry(object, index, count, parent, metricContext, context) {
    const placement = object.placement;
    const band = object.type === "belt" || object.type === "ring";
    if (!placement || placement.mode !== "orbit") {
      const fallbackRadius = metricContext.innerPx + index * metricContext.stepPx;
      return {
        kind: "circle",
        cx: parent.x,
        cy: parent.y,
        radius: fallbackRadius,
        rotationDeg: 0,
        band,
        bandThickness: band ? 12 * context.scaleModel.ringThicknessMultiplier : void 0,
        objectX: parent.x,
        objectY: parent.y - fallbackRadius
      };
    }
    const eccentricity = clampNumber(typeof placement.eccentricity === "number" ? placement.eccentricity : 0, 0, 0.92);
    const semiMajor = resolveOrbitRadiusPx(object, index, metricContext);
    const baseMinor = Math.max(semiMajor * Math.sqrt(1 - eccentricity * eccentricity), semiMajor * 0.18);
    const inclinationDeg = unitValueToDegrees(placement.inclination) ?? 0;
    const inclinationScale = context.projection === "isometric" ? Math.max(MIN_ISO_MINOR_SCALE, Math.cos(degreesToRadians(inclinationDeg))) * ISO_FLATTENING : 1;
    const semiMinor = Math.max(baseMinor * inclinationScale, semiMajor * 0.14);
    const rotationDeg = unitValueToDegrees(placement.angle) ?? 0;
    const focusOffset = semiMajor * eccentricity;
    const centerOffset = rotateOffset(-focusOffset, 0, rotationDeg);
    const cx = parent.x + centerOffset.x;
    const cy = parent.y + centerOffset.y;
    const phase = resolveOrbitPhase(placement.phase, index, count);
    const objectPoint = ellipsePoint(cx, cy, semiMajor, semiMinor, rotationDeg, phase);
    const useCircle = context.projection === "topdown" && eccentricity <= 1e-4 && Math.abs(rotationDeg) <= 1e-4;
    const bandThickness = band ? resolveBandThickness(object, semiMajor, metricContext, context.scaleModel) : void 0;
    return {
      kind: useCircle ? "circle" : "ellipse",
      cx: useCircle ? parent.x : cx,
      cy: useCircle ? parent.y : cy,
      radius: useCircle ? semiMajor : void 0,
      rx: useCircle ? void 0 : semiMajor,
      ry: useCircle ? void 0 : semiMinor,
      rotationDeg,
      band,
      bandThickness,
      frontArcPath: context.projection === "isometric" || band ? buildEllipseArcPath(cx, cy, semiMajor, semiMinor, rotationDeg, 0, Math.PI) : void 0,
      backArcPath: context.projection === "isometric" || band ? buildEllipseArcPath(cx, cy, semiMajor, semiMinor, rotationDeg, Math.PI, Math.PI * 2) : void 0,
      objectX: objectPoint.x,
      objectY: objectPoint.y
    };
  }
  function resolveOrbitRadiusPx(object, index, metricContext) {
    const metric = orbitMetric(object);
    if (metric === null) {
      return metricContext.innerPx + index * metricContext.stepPx;
    }
    if (metricContext.metricSpread > 0) {
      return metricContext.innerPx + (metric - metricContext.minMetric) / metricContext.metricSpread * metricContext.pixelSpread;
    }
    return metricContext.innerPx + Math.log10(metric + 1) * metricContext.stepPx;
  }
  function orbitMetric(object) {
    if (!object.placement || object.placement.mode !== "orbit") {
      return null;
    }
    return toDistanceMetric(object.placement.semiMajor ?? object.placement.distance ?? null);
  }
  function resolveOrbitPhase(phase, index, count) {
    const degreeValue = phase ? unitValueToDegrees(phase) : null;
    if (degreeValue !== null) {
      return degreesToRadians(degreeValue - 90);
    }
    return angleForIndex(index, count, -Math.PI / 2);
  }
  function resolveBandThickness(object, orbitRadius, metricContext, scaleModel) {
    const innerMetric = toDistanceMetric(toUnitValue(object.properties.inner));
    const outerMetric = toDistanceMetric(toUnitValue(object.properties.outer));
    if (innerMetric !== null && outerMetric !== null) {
      const thicknessMetric = Math.abs(outerMetric - innerMetric);
      if (metricContext.metricSpread > 0) {
        return clampNumber(thicknessMetric / metricContext.metricSpread * metricContext.pixelSpread * scaleModel.ringThicknessMultiplier, 8, 54);
      }
      const referenceMetric = Math.max(Math.max(innerMetric, outerMetric), 1e-4);
      return clampNumber(thicknessMetric / referenceMetric * orbitRadius * 0.75 * scaleModel.ringThicknessMultiplier, 8, 48);
    }
    const fallbackBase = object.type === "belt" ? 18 : 12;
    return fallbackBase * scaleModel.ringThicknessMultiplier;
  }
  function resolveAtPosition(reference, positions, objectMap, index, count, width, height, padding, context) {
    if (reference.kind === "lagrange") {
      return resolveLagrangePosition(reference, positions, objectMap, width, height);
    }
    if (reference.kind === "anchor") {
      const anchor = positions.get(reference.objectId);
      if (anchor) {
        const angle = angleForIndex(index, count, Math.PI / 5);
        const distance = (anchor.radius + 36) * context.scaleModel.labelMultiplier;
        const offset = projectPolarOffset(angle, distance, context.projection, context.projection === "isometric" ? 0.92 : 1);
        return {
          x: anchor.x + offset.x,
          y: anchor.y + offset.y,
          anchorX: anchor.x,
          anchorY: anchor.y
        };
      }
    }
    if (reference.kind === "named") {
      const anchor = positions.get(reference.name);
      if (anchor) {
        const angle = angleForIndex(index, count, Math.PI / 6);
        const distance = (anchor.radius + 36) * context.scaleModel.labelMultiplier;
        const offset = projectPolarOffset(angle, distance, context.projection, context.projection === "isometric" ? 0.92 : 1);
        return {
          x: anchor.x + offset.x,
          y: anchor.y + offset.y,
          anchorX: anchor.x,
          anchorY: anchor.y
        };
      }
    }
    return {
      x: width - padding - 170,
      y: height - padding - 86 - index * 58 * context.scaleModel.freePlacementMultiplier
    };
  }
  function resolveLagrangePosition(reference, positions, objectMap, width, height) {
    const primary = reference.secondary ? positions.get(reference.primary) : deriveParentAnchor(reference.primary, positions, objectMap);
    const secondary = positions.get(reference.secondary ?? reference.primary);
    if (!primary || !secondary) {
      return {
        x: width * 0.7,
        y: height * 0.25
      };
    }
    const dx = secondary.x - primary.x;
    const dy = secondary.y - primary.y;
    const distance = Math.hypot(dx, dy) || 1;
    const ux = dx / distance;
    const uy = dy / distance;
    const nx = -uy;
    const ny = ux;
    const offset = clampNumber(distance * 0.25, 24, 68);
    switch (reference.point) {
      case "L1":
        return {
          x: secondary.x - ux * offset,
          y: secondary.y - uy * offset,
          anchorX: secondary.x,
          anchorY: secondary.y
        };
      case "L2":
        return {
          x: secondary.x + ux * offset,
          y: secondary.y + uy * offset,
          anchorX: secondary.x,
          anchorY: secondary.y
        };
      case "L3":
        return {
          x: primary.x - ux * offset,
          y: primary.y - uy * offset,
          anchorX: primary.x,
          anchorY: primary.y
        };
      case "L4":
        return {
          x: secondary.x + (ux * 0.5 - nx * 0.8660254) * offset,
          y: secondary.y + (uy * 0.5 - ny * 0.8660254) * offset,
          anchorX: secondary.x,
          anchorY: secondary.y
        };
      case "L5":
        return {
          x: secondary.x + (ux * 0.5 + nx * 0.8660254) * offset,
          y: secondary.y + (uy * 0.5 + ny * 0.8660254) * offset,
          anchorX: secondary.x,
          anchorY: secondary.y
        };
    }
  }
  function buildSceneRelationships(objects, objectMap) {
    const parentIds = /* @__PURE__ */ new Map();
    const childIds = /* @__PURE__ */ new Map();
    for (const object of objects) {
      const parentId = resolveParentId(object, objectMap);
      parentIds.set(object.id, parentId);
      if (parentId) {
        const existing = childIds.get(parentId);
        if (existing) {
          existing.push(object.id);
        } else {
          childIds.set(parentId, [object.id]);
        }
      }
      if (!childIds.has(object.id)) {
        childIds.set(object.id, []);
      }
    }
    const ancestorIds = /* @__PURE__ */ new Map();
    const groupIds = /* @__PURE__ */ new Map();
    const groupRoots = /* @__PURE__ */ new Map();
    const buildAncestors = (objectId) => {
      const cached = ancestorIds.get(objectId);
      if (cached) {
        return cached;
      }
      const seen = /* @__PURE__ */ new Set();
      const results = [];
      let cursor = parentIds.get(objectId) ?? null;
      while (cursor && !seen.has(cursor)) {
        results.push(cursor);
        seen.add(cursor);
        cursor = parentIds.get(cursor) ?? null;
      }
      ancestorIds.set(objectId, results);
      return results;
    };
    const resolveGroupRootObjectId2 = (objectId) => {
      const cached = groupRoots.get(groupIds.get(objectId) ?? "");
      if (cached) {
        return cached;
      }
      const parentId = parentIds.get(objectId) ?? null;
      const object = objectMap.get(objectId);
      let rootObjectId = objectId;
      if (object?.placement && object.placement.mode !== "free" && parentId) {
        rootObjectId = resolveGroupRootObjectId2(parentId);
      }
      return rootObjectId;
    };
    for (const object of objects) {
      buildAncestors(object.id);
      const rootObjectId = resolveGroupRootObjectId2(object.id);
      const groupId = createGroupId(rootObjectId);
      groupIds.set(object.id, groupId);
      groupRoots.set(groupId, rootObjectId);
    }
    return {
      parentIds,
      childIds,
      ancestorIds,
      groupIds,
      groupRoots
    };
  }
  function resolveParentId(object, objectMap) {
    const placement = object.placement;
    if (!placement) {
      return null;
    }
    switch (placement.mode) {
      case "orbit":
      case "surface":
        return objectMap.has(placement.target) ? placement.target : null;
      case "at":
        switch (placement.reference.kind) {
          case "anchor":
            return objectMap.has(placement.reference.objectId) ? placement.reference.objectId : null;
          case "named":
            return objectMap.has(placement.reference.name) ? placement.reference.name : null;
          case "lagrange":
            if (placement.reference.secondary && objectMap.has(placement.reference.secondary)) {
              return placement.reference.secondary;
            }
            return objectMap.has(placement.reference.primary) ? placement.reference.primary : null;
        }
      case "free":
        return null;
    }
  }
  function calculateGroupBounds(group, objects, orbitVisuals, leaders, labels) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    const include = (x, y) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    };
    for (const object of objects) {
      if (!object.hidden && group.objectIds.includes(object.objectId)) {
        includeObjectBounds(object, include);
      }
    }
    for (const orbit of orbitVisuals) {
      if (!orbit.hidden && group.orbitIds.includes(orbit.objectId)) {
        includeOrbitBounds(orbit, include);
      }
    }
    for (const leader of leaders) {
      if (!leader.hidden && group.leaderIds.includes(leader.objectId)) {
        include(leader.x1, leader.y1);
        include(leader.x2, leader.y2);
      }
    }
    for (const label of labels) {
      if (!label.hidden && group.labelIds.includes(label.objectId)) {
        includeLabelBounds(label, include);
      }
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return createBounds(0, 0, 0, 0);
    }
    return createBounds(minX, minY, maxX, maxY);
  }
  function resolveGroupRootObjectId(object, objectMap) {
    let current = object;
    const seen = /* @__PURE__ */ new Set();
    while (current.placement && current.placement.mode !== "free" && !seen.has(current.id)) {
      seen.add(current.id);
      const parentId = resolveParentId(current, objectMap);
      if (!parentId) {
        break;
      }
      const parent = objectMap.get(parentId);
      if (!parent) {
        break;
      }
      current = parent;
    }
    return current.id;
  }
  function createLabelRect(x, labelY, secondaryY, labelHalfWidth, direction) {
    return {
      left: x - labelHalfWidth,
      right: x + labelHalfWidth,
      top: Math.min(labelY, secondaryY) - (direction < 0 ? 18 : 12),
      bottom: Math.max(labelY, secondaryY) + (direction < 0 ? 8 : 12)
    };
  }
  function rectsOverlap(left, right) {
    return !(left.right < right.left || right.right < left.left || left.bottom < right.top || right.bottom < left.top);
  }
  function deriveParentAnchor(objectId, positions, objectMap) {
    const object = objectMap.get(objectId);
    if (!object?.placement || object.placement.mode !== "orbit") {
      return positions.get(objectId);
    }
    return positions.get(object.placement.target);
  }
  function visualRadiusFor(object, depth, scaleModel) {
    const explicitRadius = toVisualSizeMetric(object.properties.radius, scaleModel);
    if (explicitRadius !== null) {
      return explicitRadius;
    }
    const multiplier = scaleModel.bodyRadiusMultiplier;
    switch (object.type) {
      case "star":
        return clampNumber((depth === 0 ? 28 : 20) * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
      case "planet":
        return clampNumber(12 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
      case "moon":
        return clampNumber(7 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
      case "belt":
        return clampNumber(5 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
      case "asteroid":
        return clampNumber(5 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
      case "comet":
        return clampNumber(6 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
      case "ring":
        return clampNumber(5 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
      case "structure":
        return clampNumber(6 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
      case "phenomenon":
        return clampNumber(8 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
    }
  }
  function visualExtentForObject(object, radius, scaleModel) {
    const atmosphereBoost = typeof object.properties.atmosphere === "string" ? 4 : 0;
    switch (object.type) {
      case "star":
        return radius * 2.4;
      case "phenomenon":
        return radius * 1.25;
      case "structure":
        return radius + 2;
      default:
        return Math.min(radius + atmosphereBoost, scaleModel.maxBodyRadius + 10);
    }
  }
  function toDistanceMetric(value) {
    if (!value)
      return null;
    switch (value.unit) {
      case "au":
        return value.value;
      case "km":
        return value.value / AU_IN_KM;
      case "re":
        return value.value * EARTH_RADIUS_IN_KM / AU_IN_KM;
      case "sol":
        return value.value * SOLAR_RADIUS_IN_KM / AU_IN_KM;
      default:
        return value.value;
    }
  }
  function freePlacementOffsetPx(distance, scaleModel) {
    const metric = toDistanceMetric(distance ?? null);
    if (metric === null || metric <= 0) {
      return 0;
    }
    return clampNumber(metric * 96 * scaleModel.freePlacementMultiplier, 0, 420);
  }
  function toVisualSizeMetric(value, scaleModel) {
    const unitValue = toUnitValue(value);
    if (!unitValue) {
      return null;
    }
    let size;
    switch (unitValue.unit) {
      case "sol":
        size = clampNumber(unitValue.value * 22, 14, 40);
        break;
      case "re":
        size = clampNumber(unitValue.value * 10, 6, 18);
        break;
      case "km":
        size = clampNumber(Math.log10(Math.max(unitValue.value, 1)) * 2.6, 4, 16);
        break;
      default:
        size = clampNumber(unitValue.value * 4, 4, 20);
        break;
    }
    return clampNumber(size * scaleModel.bodyRadiusMultiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
  }
  function toUnitValue(value) {
    if (!value || typeof value !== "object" || !("value" in value)) {
      return null;
    }
    return value;
  }
  function unitValueToDegrees(value) {
    if (!value) {
      return null;
    }
    return value.unit === "deg" || value.unit === null ? value.value : null;
  }
  function angleForIndex(index, count, startAngle) {
    if (count <= 1)
      return startAngle;
    return startAngle + index * Math.PI * 2 / count;
  }
  function buildEllipseArcPath(cx, cy, rx, ry, rotationDeg, start, end) {
    const points = sampleEllipseArcPoints(cx, cy, rx, ry, rotationDeg, start, end, ARC_SAMPLE_COUNT);
    if (points.length === 0) {
      return "";
    }
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${formatNumber(point.x)} ${formatNumber(point.y)}`).join(" ");
  }
  function sampleEllipseArcPoints(cx, cy, rx, ry, rotationDeg, start, end, segments) {
    const points = [];
    for (let index = 0; index <= segments; index += 1) {
      const t = start + (end - start) * index / segments;
      points.push(ellipsePoint(cx, cy, rx, ry, rotationDeg, t));
    }
    return points;
  }
  function ellipsePoint(cx, cy, rx, ry, rotationDeg, angle) {
    const localX = rx * Math.cos(angle);
    const localY = ry * Math.sin(angle);
    const rotated = rotateOffset(localX, localY, rotationDeg);
    return {
      x: cx + rotated.x,
      y: cy + rotated.y
    };
  }
  function rotateOffset(x, y, rotationDeg) {
    const radians = degreesToRadians(rotationDeg);
    return {
      x: x * Math.cos(radians) - y * Math.sin(radians),
      y: x * Math.sin(radians) + y * Math.cos(radians)
    };
  }
  function projectPolarOffset(angle, distance, projection, verticalFactor) {
    const yScale = projection === "isometric" ? ISO_FLATTENING * verticalFactor : verticalFactor;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance * yScale
    };
  }
  function computeSortKey(x, y, depth) {
    return y * 1e3 + x + depth * 0.01;
  }
  function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function pushGrouped(map, key, value) {
    const existing = map.get(key);
    if (existing) {
      existing.push(value);
    } else {
      map.set(key, [value]);
    }
  }
  function createRenderId(objectId) {
    const normalized = objectId.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "object";
    return `wo-${normalized}`;
  }
  function createGroupId(objectId) {
    return `${createRenderId(objectId)}-group`;
  }
  function customColorFor(value) {
    return typeof value === "string" && value.trim() ? value : void 0;
  }
  function estimateLabelHalfWidth(object, labelMultiplier) {
    const primaryWidth = object.label.length * 4.6 * labelMultiplier + 18;
    const secondaryWidth = object.secondaryLabel.length * 3.9 * labelMultiplier + 18;
    return Math.max(primaryWidth, secondaryWidth, object.visualRadius + 18);
  }
  function estimateLabelHalfWidthFromText(label, secondaryLabel, labelMultiplier) {
    const primaryWidth = label.length * 4.6 * labelMultiplier + 18;
    const secondaryWidth = secondaryLabel.length * 3.9 * labelMultiplier + 18;
    return Math.max(primaryWidth, secondaryWidth, 24);
  }
  function capitalizeLabel(value) {
    return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
  }
  function degreesToRadians(value) {
    return value * Math.PI / 180;
  }
  function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  // packages/core/dist/draft.js
  function upgradeDocumentToV2(document2, options = {}) {
    const scene = renderDocumentToScene(document2, options);
    const diagnostics = [];
    const atlasMetadata = collectAtlasMetadata(document2, diagnostics);
    const annotations = collectDraftAnnotations(document2, diagnostics);
    const defaults = createDraftDefaults(document2, scene.renderPreset ?? options.preset ?? null, scene.projection);
    const system = document2.system ? createDraftSystem(document2, defaults, atlasMetadata, annotations, diagnostics, scene.renderPreset ?? options.preset ?? null) : null;
    if (scene.viewpoints.some((viewpoint) => !viewpoint.generated)) {
      diagnostics.push({
        code: "upgrade.viewpoints.structured",
        severity: "info",
        source: "upgrade",
        message: `Promoted ${scene.viewpoints.filter((viewpoint) => !viewpoint.generated).length} document-defined viewpoint(s) into the 2.0 atlas section.`
      });
    }
    return {
      format: "worldorbit",
      version: "2.0",
      sourceVersion: document2.version,
      system,
      objects: document2.objects.map(cloneWorldOrbitObject),
      diagnostics
    };
  }
  function upgradeDocumentToDraftV2(document2, options = {}) {
    return convertAtlasDocumentToLegacyDraft(upgradeDocumentToV2(document2, options));
  }
  function materializeAtlasDocument(document2) {
    const system = document2.system ? {
      type: "system",
      id: document2.system.id,
      properties: materializeDraftSystemProperties(document2.system),
      info: materializeDraftSystemInfo(document2.system)
    } : null;
    return {
      format: "worldorbit",
      version: "1.0",
      system,
      objects: document2.objects.map(cloneWorldOrbitObject)
    };
  }
  function materializeDraftDocument(document2) {
    return materializeAtlasDocument(document2);
  }
  function createDraftSystem(document2, defaults, atlasMetadata, annotations, diagnostics, preset) {
    const scene = renderDocumentToScene(document2, {
      preset: preset ?? void 0,
      projection: defaults.view
    });
    return {
      type: "system",
      id: document2.system?.id ?? "WorldOrbit",
      title: typeof document2.system?.properties.title === "string" ? document2.system.properties.title : null,
      defaults,
      atlasMetadata,
      viewpoints: scene.viewpoints.map(mapSceneViewpointToDraftViewpoint),
      annotations
    };
  }
  function createDraftDefaults(document2, preset, projection) {
    return {
      view: typeof document2.system?.properties.view === "string" && document2.system.properties.view.toLowerCase() === "topdown" ? "topdown" : projection,
      scale: typeof document2.system?.properties.scale === "string" ? document2.system.properties.scale : null,
      units: typeof document2.system?.properties.units === "string" ? document2.system.properties.units : null,
      preset,
      theme: typeof document2.system?.info["atlas.theme"] === "string" ? document2.system.info["atlas.theme"] : null
    };
  }
  function collectAtlasMetadata(document2, diagnostics) {
    const metadata = {};
    for (const [key, value] of Object.entries(document2.system?.info ?? {})) {
      if (key.startsWith("viewpoint.") || key.startsWith("annotation.")) {
        continue;
      }
      metadata[key] = value;
    }
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 0) {
      diagnostics.push({
        code: "upgrade.atlasMetadata.preserved",
        severity: "warning",
        source: "upgrade",
        message: `Preserved ${metadataKeys.length} system info entr${metadataKeys.length === 1 ? "y" : "ies"} as atlas metadata in the 2.0 atlas document.`
      });
    }
    return metadata;
  }
  function collectDraftAnnotations(document2, diagnostics) {
    const drafts = /* @__PURE__ */ new Map();
    for (const [key, value] of Object.entries(document2.system?.info ?? {})) {
      if (!key.startsWith("annotation.")) {
        continue;
      }
      const [, rawId, ...fieldParts] = key.split(".");
      if (!rawId || fieldParts.length === 0) {
        continue;
      }
      const id = normalizeIdentifier(rawId);
      if (!id) {
        continue;
      }
      const draft = drafts.get(id) ?? { id };
      const field = fieldParts.join(".").toLowerCase();
      switch (field) {
        case "label":
          draft.label = value;
          break;
        case "target":
        case "object":
          draft.targetObjectId = value.trim() || null;
          break;
        case "body":
        case "text":
        case "description":
          draft.body = value;
          break;
        case "tags":
          draft.tags = splitList(value);
          break;
      }
      drafts.set(id, draft);
    }
    for (const object of document2.objects) {
      const description = object.info.description;
      if (!description) {
        continue;
      }
      const annotationId = normalizeIdentifier(`${object.id}-notes`);
      if (drafts.has(annotationId)) {
        continue;
      }
      drafts.set(annotationId, {
        id: annotationId,
        label: `${object.id} Notes`,
        targetObjectId: object.id,
        body: description,
        tags: Array.isArray(object.properties.tags) ? object.properties.tags.filter((entry) => typeof entry === "string") : []
      });
      diagnostics.push({
        code: "upgrade.annotation.objectDescription",
        severity: "info",
        source: "upgrade",
        message: `Lifted ${object.id}.info.description into structured atlas annotation "${annotationId}".`,
        objectId: object.id,
        field: "description"
      });
    }
    return [...drafts.values()].filter((draft) => draft.body || draft.label).map((draft) => ({
      id: draft.id,
      label: draft.label ?? humanizeIdentifier2(draft.id),
      targetObjectId: draft.targetObjectId ?? null,
      body: draft.body ?? "",
      tags: draft.tags ?? [],
      sourceObjectId: draft.targetObjectId ?? null
    })).sort((left, right) => left.label.localeCompare(right.label));
  }
  function mapSceneViewpointToDraftViewpoint(viewpoint) {
    return {
      id: viewpoint.id,
      label: viewpoint.label,
      summary: viewpoint.summary,
      focusObjectId: viewpoint.objectId,
      selectedObjectId: viewpoint.selectedObjectId,
      projection: viewpoint.projection,
      preset: viewpoint.preset,
      zoom: viewpoint.scale,
      rotationDeg: viewpoint.rotationDeg,
      layers: { ...viewpoint.layers },
      filter: viewpoint.filter ? {
        query: viewpoint.filter.query,
        objectTypes: [...viewpoint.filter.objectTypes],
        tags: [...viewpoint.filter.tags],
        groupIds: [...viewpoint.filter.groupIds]
      } : null
    };
  }
  function cloneWorldOrbitObject(object) {
    return {
      ...object,
      properties: cloneProperties(object.properties),
      placement: object.placement ? structuredClone(object.placement) : null,
      info: { ...object.info }
    };
  }
  function cloneProperties(properties) {
    const next = {};
    for (const [key, value] of Object.entries(properties)) {
      if (Array.isArray(value)) {
        next[key] = [...value];
        continue;
      }
      if (value && typeof value === "object" && "value" in value) {
        next[key] = {
          value: value.value,
          unit: value.unit
        };
        continue;
      }
      next[key] = value;
    }
    return next;
  }
  function splitList(value) {
    return value.split(/[\s,]+/).map((entry) => entry.trim()).filter(Boolean);
  }
  function normalizeIdentifier(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function humanizeIdentifier2(value) {
    return value.split(/[-_]+/).filter(Boolean).map((segment) => segment[0].toUpperCase() + segment.slice(1)).join(" ");
  }
  function materializeDraftSystemProperties(system) {
    const properties = {};
    if (system.title) {
      properties.title = system.title;
    }
    properties.view = system.defaults.view;
    if (system.defaults.scale) {
      properties.scale = system.defaults.scale;
    }
    if (system.defaults.units) {
      properties.units = system.defaults.units;
    }
    return properties;
  }
  function materializeDraftSystemInfo(system) {
    const info = {
      ...system.atlasMetadata
    };
    if (system.defaults.theme) {
      info["atlas.theme"] = system.defaults.theme;
    }
    for (const viewpoint of system.viewpoints) {
      const prefix = `viewpoint.${viewpoint.id}`;
      info[`${prefix}.label`] = viewpoint.label;
      if (viewpoint.summary) {
        info[`${prefix}.summary`] = viewpoint.summary;
      }
      if (viewpoint.focusObjectId) {
        info[`${prefix}.focus`] = viewpoint.focusObjectId;
      }
      if (viewpoint.selectedObjectId) {
        info[`${prefix}.select`] = viewpoint.selectedObjectId;
      }
      if (viewpoint.projection) {
        info[`${prefix}.projection`] = viewpoint.projection;
      }
      if (viewpoint.preset) {
        info[`${prefix}.preset`] = viewpoint.preset;
      }
      if (viewpoint.zoom !== null) {
        info[`${prefix}.zoom`] = String(viewpoint.zoom);
      }
      if (viewpoint.rotationDeg !== 0) {
        info[`${prefix}.rotation`] = String(viewpoint.rotationDeg);
      }
      const serializedLayers = serializeViewpointLayers(viewpoint.layers);
      if (serializedLayers) {
        info[`${prefix}.layers`] = serializedLayers;
      }
      if (viewpoint.filter?.query) {
        info[`${prefix}.query`] = viewpoint.filter.query;
      }
      if ((viewpoint.filter?.objectTypes.length ?? 0) > 0) {
        info[`${prefix}.types`] = viewpoint.filter?.objectTypes.join(" ") ?? "";
      }
      if ((viewpoint.filter?.tags.length ?? 0) > 0) {
        info[`${prefix}.tags`] = viewpoint.filter?.tags.join(" ") ?? "";
      }
      if ((viewpoint.filter?.groupIds.length ?? 0) > 0) {
        info[`${prefix}.groups`] = viewpoint.filter?.groupIds.join(" ") ?? "";
      }
    }
    for (const annotation of system.annotations) {
      const prefix = `annotation.${annotation.id}`;
      info[`${prefix}.label`] = annotation.label;
      if (annotation.targetObjectId) {
        info[`${prefix}.target`] = annotation.targetObjectId;
      }
      info[`${prefix}.body`] = annotation.body;
      if (annotation.tags.length > 0) {
        info[`${prefix}.tags`] = annotation.tags.join(" ");
      }
      if (annotation.sourceObjectId) {
        info[`${prefix}.source`] = annotation.sourceObjectId;
      }
    }
    return info;
  }
  function serializeViewpointLayers(layers) {
    const tokens = [];
    const orbitFront = layers["orbits-front"];
    const orbitBack = layers["orbits-back"];
    if (orbitFront !== void 0 || orbitBack !== void 0) {
      tokens.push(orbitFront !== false || orbitBack !== false ? "orbits" : "-orbits");
    }
    for (const key of ["background", "guides", "objects", "labels", "metadata"]) {
      if (layers[key] !== void 0) {
        tokens.push(layers[key] ? key : `-${key}`);
      }
    }
    return tokens.join(" ");
  }
  function convertAtlasDocumentToLegacyDraft(document2) {
    return {
      ...document2,
      version: "2.0-draft"
    };
  }

  // packages/core/dist/format.js
  var CANONICAL_FIELD_ORDER = [
    "title",
    "view",
    "scale",
    "units",
    "kind",
    "class",
    "tags",
    "color",
    "image",
    "hidden",
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
    "cycle"
  ];
  function formatDocument(document2, options = {}) {
    const schema = options.schema ?? "auto";
    const useDraft = schema === "2.0" || schema === "2.0-draft" || document2.version === "2.0" || document2.version === "2.0-draft";
    if (useDraft) {
      if (schema === "2.0-draft") {
        const legacyDraftDocument = document2.version === "2.0-draft" ? document2 : document2.version === "2.0" ? {
          ...document2,
          version: "2.0-draft"
        } : upgradeDocumentToDraftV2(document2);
        return formatDraftDocument(legacyDraftDocument);
      }
      const atlasDocument = document2.version === "2.0" ? document2 : document2.version === "2.0-draft" ? {
        ...document2,
        version: "2.0"
      } : upgradeDocumentToV2(document2);
      return formatAtlasDocument(atlasDocument);
    }
    const lines = [];
    const stableDocument = document2;
    if (stableDocument.system) {
      lines.push(...formatSystem(stableDocument.system));
    }
    const sortedObjects = [...stableDocument.objects].sort(compareObjects);
    for (const object of sortedObjects) {
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push(...formatObject(object));
    }
    return lines.join("\n");
  }
  function formatAtlasDocument(document2) {
    const lines = ["schema 2.0", ""];
    if (document2.system) {
      lines.push(...formatAtlasSystem(document2.system));
    }
    const sortedObjects = [...document2.objects].sort(compareObjects);
    if (sortedObjects.length > 0 && lines.at(-1) !== "") {
      lines.push("");
    }
    sortedObjects.forEach((object, index) => {
      if (index > 0) {
        lines.push("");
      }
      lines.push(...formatAtlasObject(object));
    });
    return lines.join("\n");
  }
  function formatDraftDocument(document2) {
    const legacy = document2.version === "2.0-draft" ? document2 : {
      ...document2,
      version: "2.0-draft"
    };
    const lines = ["schema 2.0-draft", ""];
    if (legacy.system) {
      lines.push(...formatAtlasSystem(legacy.system));
    }
    const sortedObjects = [...legacy.objects].sort(compareObjects);
    if (sortedObjects.length > 0 && lines.at(-1) !== "") {
      lines.push("");
    }
    sortedObjects.forEach((object, index) => {
      if (index > 0) {
        lines.push("");
      }
      lines.push(...formatAtlasObject(object));
    });
    return lines.join("\n");
  }
  function formatSystem(system) {
    return formatLines("system", system.id, system.properties, null, system.info);
  }
  function formatAtlasSystem(system) {
    const lines = [`system ${system.id}`];
    if (system.title) {
      lines.push(`  title ${quoteIfNeeded(system.title)}`);
    }
    lines.push("");
    lines.push("defaults");
    lines.push(`  view ${system.defaults.view}`);
    if (system.defaults.scale) {
      lines.push(`  scale ${quoteIfNeeded(system.defaults.scale)}`);
    }
    if (system.defaults.units) {
      lines.push(`  units ${quoteIfNeeded(system.defaults.units)}`);
    }
    if (system.defaults.preset) {
      lines.push(`  preset ${system.defaults.preset}`);
    }
    if (system.defaults.theme) {
      lines.push(`  theme ${quoteIfNeeded(system.defaults.theme)}`);
    }
    if (Object.keys(system.atlasMetadata).length > 0) {
      lines.push("");
      lines.push("atlas");
      lines.push("  metadata");
      for (const [key, value] of Object.entries(system.atlasMetadata).sort(([left], [right]) => left.localeCompare(right))) {
        lines.push(`    ${key} ${quoteIfNeeded(value)}`);
      }
    }
    for (const viewpoint of system.viewpoints) {
      lines.push("");
      lines.push(...formatAtlasViewpoint(viewpoint));
    }
    for (const annotation of system.annotations) {
      lines.push("");
      lines.push(...formatAtlasAnnotation(annotation));
    }
    return lines;
  }
  function formatObject(object) {
    return formatLines(object.type, object.id, object.properties, object.placement, object.info);
  }
  function formatAtlasObject(object) {
    return formatLines(`object ${object.type}`, object.id, object.properties, object.placement, object.info);
  }
  function formatLines(objectType, id, properties, placement, info) {
    const lines = [`${objectType} ${id}`];
    const fieldLines = [...formatPlacement(placement), ...formatProperties(properties)];
    for (const fieldLine of fieldLines) {
      lines.push(`  ${fieldLine}`);
    }
    const infoEntries = Object.entries(info).sort(([left], [right]) => left.localeCompare(right));
    if (infoEntries.length > 0) {
      if (fieldLines.length > 0) {
        lines.push("");
      }
      lines.push("  info");
      for (const [key, value] of infoEntries) {
        lines.push(`    ${key} ${quoteIfNeeded(value)}`);
      }
    }
    return lines;
  }
  function formatPlacement(placement) {
    if (!placement)
      return [];
    switch (placement.mode) {
      case "orbit":
        return [
          `orbit ${placement.target}`,
          ...formatOptionalUnit("distance", placement.distance),
          ...formatOptionalUnit("semiMajor", placement.semiMajor),
          ...formatOptionalNumber("eccentricity", placement.eccentricity),
          ...formatOptionalUnit("period", placement.period),
          ...formatOptionalUnit("angle", placement.angle),
          ...formatOptionalUnit("inclination", placement.inclination),
          ...formatOptionalUnit("phase", placement.phase)
        ];
      case "at":
        return [`at ${formatAtReference(placement.reference)}`];
      case "surface":
        return [`surface ${placement.target}`];
      case "free":
        return [`free ${placement.distance ? formatUnitValue(placement.distance) : placement.descriptor ?? ""}`.trim()];
    }
  }
  function formatProperties(properties) {
    return Object.keys(properties).sort(compareFieldKeys).map((key) => `${key} ${formatValue(properties[key])}`);
  }
  function formatAtlasViewpoint(viewpoint) {
    const lines = [`viewpoint ${viewpoint.id}`, `  label ${quoteIfNeeded(viewpoint.label)}`];
    if (viewpoint.focusObjectId) {
      lines.push(`  focus ${viewpoint.focusObjectId}`);
    }
    if (viewpoint.selectedObjectId && viewpoint.selectedObjectId !== viewpoint.focusObjectId) {
      lines.push(`  select ${viewpoint.selectedObjectId}`);
    }
    if (viewpoint.summary) {
      lines.push(`  summary ${quoteIfNeeded(viewpoint.summary)}`);
    }
    if (viewpoint.projection) {
      lines.push(`  projection ${viewpoint.projection}`);
    }
    if (viewpoint.preset) {
      lines.push(`  preset ${viewpoint.preset}`);
    }
    if (viewpoint.zoom !== null) {
      lines.push(`  zoom ${viewpoint.zoom}`);
    }
    if (viewpoint.rotationDeg !== 0) {
      lines.push(`  rotation ${viewpoint.rotationDeg}`);
    }
    const layerTokens = formatDraftLayers(viewpoint.layers);
    if (layerTokens.length > 0) {
      lines.push(`  layers ${layerTokens.join(" ")}`);
    }
    if (viewpoint.filter) {
      lines.push("  filter");
      if (viewpoint.filter.query) {
        lines.push(`    query ${quoteIfNeeded(viewpoint.filter.query)}`);
      }
      if (viewpoint.filter.objectTypes.length > 0) {
        lines.push(`    objectTypes ${viewpoint.filter.objectTypes.join(" ")}`);
      }
      if (viewpoint.filter.tags.length > 0) {
        lines.push(`    tags ${viewpoint.filter.tags.map(quoteIfNeeded).join(" ")}`);
      }
      if (viewpoint.filter.groupIds.length > 0) {
        lines.push(`    groups ${viewpoint.filter.groupIds.join(" ")}`);
      }
    }
    return lines;
  }
  function formatAtlasAnnotation(annotation) {
    const lines = [`annotation ${annotation.id}`, `  label ${quoteIfNeeded(annotation.label)}`];
    if (annotation.targetObjectId) {
      lines.push(`  target ${annotation.targetObjectId}`);
    }
    lines.push(`  body ${quoteIfNeeded(annotation.body)}`);
    if (annotation.tags.length > 0) {
      lines.push(`  tags ${annotation.tags.map(quoteIfNeeded).join(" ")}`);
    }
    return lines;
  }
  function formatValue(value) {
    if (Array.isArray(value)) {
      return value.map((item) => quoteIfNeeded(item)).join(" ");
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    if (typeof value === "number") {
      return String(value);
    }
    if (typeof value === "string") {
      return quoteIfNeeded(value);
    }
    return formatUnitValue(value);
  }
  function formatUnitValue(value) {
    return `${value.value}${value.unit ?? ""}`;
  }
  function formatOptionalUnit(key, value) {
    return value ? [`${key} ${formatUnitValue(value)}`] : [];
  }
  function formatOptionalNumber(key, value) {
    return value === void 0 ? [] : [`${key} ${value}`];
  }
  function formatAtReference(reference) {
    switch (reference.kind) {
      case "lagrange":
        return reference.secondary ? `${reference.primary}-${reference.secondary}:${reference.point}` : `${reference.primary}:${reference.point}`;
      case "anchor":
        return `${reference.objectId}:${reference.anchor}`;
      case "named":
        return reference.name;
    }
  }
  function formatDraftLayers(layers) {
    const tokens = [];
    const orbitFront = layers["orbits-front"];
    const orbitBack = layers["orbits-back"];
    if (orbitFront !== void 0 || orbitBack !== void 0) {
      tokens.push(orbitFront !== false || orbitBack !== false ? "orbits" : "-orbits");
    }
    for (const key of ["background", "guides", "objects", "labels", "metadata"]) {
      if (layers[key] !== void 0) {
        tokens.push(layers[key] ? key : `-${key}`);
      }
    }
    return tokens;
  }
  function compareFieldKeys(left, right) {
    const leftIndex = CANONICAL_FIELD_ORDER.indexOf(left);
    const rightIndex = CANONICAL_FIELD_ORDER.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1)
      return left.localeCompare(right);
    if (leftIndex === -1)
      return 1;
    if (rightIndex === -1)
      return -1;
    return leftIndex - rightIndex;
  }
  function compareObjects(left, right) {
    const leftIndex = objectTypeIndex(left.type);
    const rightIndex = objectTypeIndex(right.type);
    if (leftIndex !== rightIndex)
      return leftIndex - rightIndex;
    return left.id.localeCompare(right.id);
  }
  function objectTypeIndex(objectType) {
    switch (objectType) {
      case "star":
        return 0;
      case "planet":
        return 1;
      case "moon":
        return 2;
      case "belt":
        return 3;
      case "asteroid":
        return 4;
      case "comet":
        return 5;
      case "ring":
        return 6;
      case "structure":
        return 7;
      case "phenomenon":
        return 8;
    }
  }
  function quoteIfNeeded(value) {
    if (!/\s/.test(value) && !value.includes('"')) {
      return value;
    }
    return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
  }

  // packages/core/dist/draft-parse.js
  function parseWorldOrbitAtlas(source) {
    return parseAtlasSource(source, "2.0");
  }
  function parseWorldOrbitDraft(source) {
    return parseAtlasSource(source, "2.0-draft");
  }
  function parseAtlasSource(source, outputVersion) {
    const lines = source.split(/\r?\n/);
    let sawSchemaHeader = false;
    let schemaVersion = "2.0";
    let system = null;
    let section = null;
    const objectNodes = [];
    let sawDefaults = false;
    let sawAtlas = false;
    const viewpointIds = /* @__PURE__ */ new Set();
    const annotationIds = /* @__PURE__ */ new Set();
    for (let index = 0; index < lines.length; index++) {
      const rawLine = lines[index];
      const lineNumber = index + 1;
      if (!rawLine.trim()) {
        continue;
      }
      const indent = getIndent(rawLine);
      const tokens = tokenizeLineDetailed(rawLine.slice(indent), {
        line: lineNumber,
        columnOffset: indent
      });
      if (tokens.length === 0) {
        continue;
      }
      if (!sawSchemaHeader) {
        schemaVersion = assertDraftSchemaHeader(tokens, lineNumber);
        sawSchemaHeader = true;
        continue;
      }
      if (indent === 0) {
        section = startTopLevelSection(tokens, lineNumber, system, objectNodes, viewpointIds, annotationIds, {
          sawDefaults,
          sawAtlas
        });
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
        throw new WorldOrbitError("Indented line without parent atlas section", lineNumber, indent + 1);
      }
      handleSectionLine(section, indent, tokens, lineNumber);
    }
    if (!sawSchemaHeader) {
      throw new WorldOrbitError('Missing required atlas schema header "schema 2.0"');
    }
    const ast = {
      type: "document",
      objects: objectNodes
    };
    const normalizedObjects = normalizeDocument(ast).objects;
    validateDocument({
      format: "worldorbit",
      version: "1.0",
      system: null,
      objects: normalizedObjects
    });
    const diagnostics = schemaVersion === "2.0-draft" && outputVersion === "2.0" ? [
      {
        code: "load.schema.deprecatedDraft",
        severity: "warning",
        source: "upgrade",
        message: 'Source header "schema 2.0-draft" is deprecated; canonical v2 documents now use "schema 2.0".'
      }
    ] : [];
    return {
      format: "worldorbit",
      version: outputVersion,
      sourceVersion: "1.0",
      system,
      objects: normalizedObjects,
      diagnostics
    };
  }
  function assertDraftSchemaHeader(tokens, line) {
    if (tokens.length !== 2 || tokens[0].value.toLowerCase() !== "schema" || tokens[1].value.toLowerCase() !== "2.0-draft" && tokens[1].value.toLowerCase() !== "2.0") {
      throw new WorldOrbitError('Expected atlas header "schema 2.0" or legacy "schema 2.0-draft"', line, tokens[0]?.column ?? 1);
    }
    return tokens[1].value.toLowerCase() === "2.0-draft" ? "2.0-draft" : "2.0";
  }
  function startTopLevelSection(tokens, line, system, objectNodes, viewpointIds, annotationIds, flags) {
    const keyword = tokens[0]?.value.toLowerCase();
    switch (keyword) {
      case "system":
        if (system) {
          throw new WorldOrbitError('Atlas section "system" may only appear once', line, tokens[0].column);
        }
        return startSystemSection(tokens, line);
      case "defaults":
        if (!system) {
          throw new WorldOrbitError('Atlas section "defaults" requires a preceding system declaration', line, tokens[0].column);
        }
        if (flags.sawDefaults) {
          throw new WorldOrbitError('Atlas section "defaults" may only appear once', line, tokens[0].column);
        }
        return {
          kind: "defaults",
          system,
          seenFields: /* @__PURE__ */ new Set()
        };
      case "atlas":
        if (!system) {
          throw new WorldOrbitError('Atlas section "atlas" requires a preceding system declaration', line, tokens[0].column);
        }
        if (flags.sawAtlas) {
          throw new WorldOrbitError('Atlas section "atlas" may only appear once', line, tokens[0].column);
        }
        return {
          kind: "atlas",
          system,
          inMetadata: false,
          metadataIndent: null
        };
      case "viewpoint":
        if (!system) {
          throw new WorldOrbitError('Atlas section "viewpoint" requires a preceding system declaration', line, tokens[0].column);
        }
        return startViewpointSection(tokens, line, system, viewpointIds);
      case "annotation":
        if (!system) {
          throw new WorldOrbitError('Atlas section "annotation" requires a preceding system declaration', line, tokens[0].column);
        }
        return startAnnotationSection(tokens, line, system, annotationIds);
      case "object":
        return startObjectSection(tokens, line, objectNodes);
      default:
        throw new WorldOrbitError(`Unknown atlas section "${tokens[0]?.value ?? ""}"`, line, tokens[0]?.column ?? 1);
    }
  }
  function startSystemSection(tokens, line) {
    if (tokens.length !== 2) {
      throw new WorldOrbitError("Invalid atlas system declaration", line, tokens[0]?.column ?? 1);
    }
    const system = {
      type: "system",
      id: tokens[1].value,
      title: null,
      defaults: {
        view: "topdown",
        scale: null,
        units: null,
        preset: null,
        theme: null
      },
      atlasMetadata: {},
      viewpoints: [],
      annotations: []
    };
    return {
      kind: "system",
      system,
      seenFields: /* @__PURE__ */ new Set()
    };
  }
  function startViewpointSection(tokens, line, system, viewpointIds) {
    if (tokens.length !== 2) {
      throw new WorldOrbitError("Invalid viewpoint declaration", line, tokens[0]?.column ?? 1);
    }
    const id = normalizeIdentifier2(tokens[1].value);
    if (!id) {
      throw new WorldOrbitError("Viewpoint id must not be empty", line, tokens[1].column);
    }
    if (viewpointIds.has(id)) {
      throw new WorldOrbitError(`Duplicate viewpoint id "${id}"`, line, tokens[1].column);
    }
    const viewpoint = {
      id,
      label: humanizeIdentifier3(id),
      summary: "",
      focusObjectId: null,
      selectedObjectId: null,
      projection: system.defaults.view,
      preset: system.defaults.preset,
      zoom: null,
      rotationDeg: 0,
      layers: {},
      filter: null
    };
    system.viewpoints.push(viewpoint);
    viewpointIds.add(id);
    return {
      kind: "viewpoint",
      viewpoint,
      seenFields: /* @__PURE__ */ new Set(),
      inFilter: false,
      filterIndent: null,
      seenFilterFields: /* @__PURE__ */ new Set()
    };
  }
  function startAnnotationSection(tokens, line, system, annotationIds) {
    if (tokens.length !== 2) {
      throw new WorldOrbitError("Invalid annotation declaration", line, tokens[0]?.column ?? 1);
    }
    const id = normalizeIdentifier2(tokens[1].value);
    if (!id) {
      throw new WorldOrbitError("Annotation id must not be empty", line, tokens[1].column);
    }
    if (annotationIds.has(id)) {
      throw new WorldOrbitError(`Duplicate annotation id "${id}"`, line, tokens[1].column);
    }
    const annotation = {
      id,
      label: humanizeIdentifier3(id),
      targetObjectId: null,
      body: "",
      tags: [],
      sourceObjectId: null
    };
    system.annotations.push(annotation);
    annotationIds.add(id);
    return {
      kind: "annotation",
      annotation,
      seenFields: /* @__PURE__ */ new Set()
    };
  }
  function startObjectSection(tokens, line, objectNodes) {
    if (tokens.length < 3) {
      throw new WorldOrbitError("Invalid atlas object declaration", line, tokens[0]?.column ?? 1);
    }
    const objectTypeToken = tokens[1];
    const idToken = tokens[2];
    const objectType = objectTypeToken.value;
    if (!WORLDORBIT_OBJECT_TYPES.has(objectType) || objectType === "system") {
      throw new WorldOrbitError(`Unknown object type "${objectTypeToken.value}"`, line, objectTypeToken.column);
    }
    const objectNode = {
      type: "object",
      objectType,
      name: idToken.value,
      inlineFields: parseInlineFields2(tokens.slice(3), line),
      blockFields: [],
      infoEntries: [],
      location: {
        line,
        column: objectTypeToken.column
      }
    };
    objectNodes.push(objectNode);
    return {
      kind: "object",
      objectNode,
      inInfoBlock: false,
      infoIndent: null
    };
  }
  function handleSectionLine(section, indent, tokens, line) {
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
        applyViewpointField2(section, indent, tokens, line);
        return;
      case "annotation":
        applyAnnotationField(section, tokens, line);
        return;
      case "object":
        applyObjectField(section, indent, tokens, line);
        return;
    }
  }
  function applySystemField(section, tokens, line) {
    const key = requireUniqueField(tokens, section.seenFields, line);
    if (key !== "title") {
      throw new WorldOrbitError(`Unknown system atlas field "${tokens[0].value}"`, line, tokens[0].column);
    }
    section.system.title = joinFieldValue(tokens, line);
  }
  function applyDefaultsField(section, tokens, line) {
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
        throw new WorldOrbitError(`Unknown defaults field "${tokens[0].value}"`, line, tokens[0].column);
    }
  }
  function applyAtlasField(section, indent, tokens, line) {
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
        throw new WorldOrbitError(`Duplicate atlas metadata key "${key}"`, line, tokens[0].column);
      }
      section.system.atlasMetadata[key] = joinFieldValue(tokens, line);
      return;
    }
    if (tokens.length === 1 && tokens[0].value.toLowerCase() === "metadata") {
      section.inMetadata = true;
      section.metadataIndent = indent;
      return;
    }
    throw new WorldOrbitError(`Unknown atlas field "${tokens[0].value}"`, line, tokens[0].column);
  }
  function applyViewpointField2(section, indent, tokens, line) {
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
        section.viewpoint.zoom = parsePositiveNumber2(value, line, tokens[0].column, "zoom");
        return;
      case "rotation":
        section.viewpoint.rotationDeg = parseFiniteNumber2(value, line, tokens[0].column, "rotation");
        return;
      case "layers":
        section.viewpoint.layers = parseLayerTokens(tokens.slice(1), line);
        return;
      default:
        throw new WorldOrbitError(`Unknown viewpoint field "${tokens[0].value}"`, line, tokens[0].column);
    }
  }
  function applyViewpointFilterField(section, tokens, line) {
    const key = requireUniqueField(tokens, section.seenFilterFields, line);
    const filter = section.viewpoint.filter ?? createEmptyViewpointFilter2();
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
        throw new WorldOrbitError(`Unknown viewpoint filter field "${tokens[0].value}"`, line, tokens[0].column);
    }
    section.viewpoint.filter = filter;
  }
  function applyAnnotationField(section, tokens, line) {
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
        throw new WorldOrbitError(`Unknown annotation field "${tokens[0].value}"`, line, tokens[0].column);
    }
  }
  function applyObjectField(section, indent, tokens, line) {
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
      section.objectNode.infoEntries.push(parseInfoEntry2(tokens, line));
      return;
    }
    section.objectNode.blockFields.push(parseField2(tokens, line));
  }
  function requireUniqueField(tokens, seenFields, line) {
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
  function joinFieldValue(tokens, line) {
    if (tokens.length < 2) {
      throw new WorldOrbitError("Missing value for atlas field", line, tokens[0]?.column ?? 1);
    }
    return tokens.slice(1).map((token) => token.value).join(" ").trim();
  }
  function parseObjectTypeTokens(tokens, line) {
    if (tokens.length === 0) {
      throw new WorldOrbitError("Missing value for atlas field", line);
    }
    return tokens.map((token) => {
      const value = token.value;
      if (value !== "star" && value !== "planet" && value !== "moon" && value !== "belt" && value !== "asteroid" && value !== "comet" && value !== "ring" && value !== "structure" && value !== "phenomenon") {
        throw new WorldOrbitError(`Unknown viewpoint object type "${token.value}"`, line, token.column);
      }
      return value;
    });
  }
  function parseTokenList(tokens, line, field) {
    if (tokens.length === 0) {
      throw new WorldOrbitError(`Missing value for field "${field}"`, line);
    }
    return tokens.map((token) => token.value);
  }
  function parseLayerTokens(tokens, line) {
    if (tokens.length === 0) {
      throw new WorldOrbitError('Missing value for field "layers"', line);
    }
    const next = {};
    for (const token of tokens) {
      const enabled = !token.value.startsWith("-") && !token.value.startsWith("!");
      const rawLayer = token.value.replace(/^[-!]+/, "").toLowerCase();
      if (rawLayer === "orbits") {
        next["orbits-back"] = enabled;
        next["orbits-front"] = enabled;
        continue;
      }
      if (rawLayer === "background" || rawLayer === "guides" || rawLayer === "orbits-back" || rawLayer === "orbits-front" || rawLayer === "objects" || rawLayer === "labels" || rawLayer === "metadata") {
        next[rawLayer] = enabled;
        continue;
      }
      throw new WorldOrbitError(`Unknown layer token "${token.value}"`, line, token.column);
    }
    return next;
  }
  function parseProjectionValue(value, line, column) {
    const normalized = value.toLowerCase();
    if (normalized === "topdown" || normalized === "isometric") {
      return normalized;
    }
    throw new WorldOrbitError(`Unknown projection "${value}"`, line, column);
  }
  function parsePresetValue(value, line, column) {
    const normalized = value.toLowerCase();
    if (normalized === "diagram" || normalized === "presentation" || normalized === "atlas-card" || normalized === "markdown") {
      return normalized;
    }
    throw new WorldOrbitError(`Unknown render preset "${value}"`, line, column);
  }
  function parsePositiveNumber2(value, line, column, field) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new WorldOrbitError(`Field "${field}" expects a positive number`, line, column);
    }
    return parsed;
  }
  function parseFiniteNumber2(value, line, column, field) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new WorldOrbitError(`Field "${field}" expects a finite number`, line, column);
    }
    return parsed;
  }
  function createEmptyViewpointFilter2() {
    return {
      query: null,
      objectTypes: [],
      tags: [],
      groupIds: []
    };
  }
  function parseInlineFields2(tokens, line) {
    const fields = [];
    let index = 0;
    while (index < tokens.length) {
      const keyToken = tokens[index];
      const schema = getFieldSchema(keyToken.value);
      if (!schema) {
        throw new WorldOrbitError(`Unknown field "${keyToken.value}"`, line, keyToken.column);
      }
      index++;
      const valueTokens = [];
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
        throw new WorldOrbitError(`Missing value for field "${keyToken.value}"`, line, keyToken.column);
      }
      fields.push({
        type: "field",
        key: keyToken.value,
        values: valueTokens.map((token) => token.value),
        location: { line, column: keyToken.column }
      });
    }
    return fields;
  }
  function parseField2(tokens, line) {
    if (tokens.length < 2) {
      throw new WorldOrbitError("Invalid field line", line, tokens[0]?.column ?? 1);
    }
    if (!getFieldSchema(tokens[0].value)) {
      throw new WorldOrbitError(`Unknown field "${tokens[0].value}"`, line, tokens[0].column);
    }
    return {
      type: "field",
      key: tokens[0].value,
      values: tokens.slice(1).map((token) => token.value),
      location: { line, column: tokens[0].column }
    };
  }
  function parseInfoEntry2(tokens, line) {
    if (tokens.length < 2) {
      throw new WorldOrbitError("Invalid info entry", line, tokens[0]?.column ?? 1);
    }
    return {
      type: "info-entry",
      key: tokens[0].value,
      value: tokens.slice(1).map((token) => token.value).join(" "),
      location: { line, column: tokens[0].column }
    };
  }
  function normalizeIdentifier2(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function humanizeIdentifier3(value) {
    return value.split(/[-_]+/).filter(Boolean).map((segment) => segment[0].toUpperCase() + segment.slice(1)).join(" ");
  }

  // packages/core/dist/atlas-edit.js
  function createEmptyAtlasDocument(systemId = "WorldOrbit") {
    return {
      format: "worldorbit",
      version: "2.0",
      sourceVersion: "1.0",
      system: {
        type: "system",
        id: systemId,
        title: systemId,
        defaults: {
          view: "topdown",
          scale: null,
          units: null,
          preset: null,
          theme: null
        },
        atlasMetadata: {},
        viewpoints: [],
        annotations: []
      },
      objects: [],
      diagnostics: []
    };
  }
  function cloneAtlasDocument(document2) {
    return structuredClone(document2);
  }
  function listAtlasDocumentPaths(document2) {
    const paths = [{ kind: "system" }, { kind: "defaults" }];
    if (document2.system) {
      for (const key of Object.keys(document2.system.atlasMetadata).sort()) {
        paths.push({ kind: "metadata", key });
      }
      for (const viewpoint of [...document2.system.viewpoints].sort(compareIdLike)) {
        paths.push({ kind: "viewpoint", id: viewpoint.id });
      }
      for (const annotation of [...document2.system.annotations].sort(compareIdLike)) {
        paths.push({ kind: "annotation", id: annotation.id });
      }
    }
    for (const object of [...document2.objects].sort(compareIdLike)) {
      paths.push({ kind: "object", id: object.id });
    }
    return paths;
  }
  function getAtlasDocumentNode(document2, path) {
    switch (path.kind) {
      case "system":
        return document2.system;
      case "defaults":
        return document2.system?.defaults ?? null;
      case "metadata":
        return path.key ? document2.system?.atlasMetadata[path.key] ?? null : null;
      case "object":
        return path.id ? findObject(document2, path.id) : null;
      case "viewpoint":
        return path.id ? findViewpoint(document2.system, path.id) : null;
      case "annotation":
        return path.id ? findAnnotation(document2.system, path.id) : null;
    }
  }
  function upsertAtlasDocumentNode(document2, path, value) {
    const next = cloneAtlasDocument(document2);
    const system = ensureSystem(next);
    switch (path.kind) {
      case "system":
        next.system = value;
        return next;
      case "defaults":
        system.defaults = {
          ...system.defaults,
          ...value
        };
        return next;
      case "metadata":
        if (!path.key) {
          throw new Error('Metadata updates require a "key" value.');
        }
        if (value === null || value === void 0 || value === "") {
          delete system.atlasMetadata[path.key];
        } else {
          system.atlasMetadata[path.key] = String(value);
        }
        return next;
      case "object":
        if (!path.id) {
          throw new Error('Object updates require an "id" value.');
        }
        upsertById(next.objects, value);
        return next;
      case "viewpoint":
        if (!path.id) {
          throw new Error('Viewpoint updates require an "id" value.');
        }
        upsertById(system.viewpoints, value);
        return next;
      case "annotation":
        if (!path.id) {
          throw new Error('Annotation updates require an "id" value.');
        }
        upsertById(system.annotations, value);
        return next;
    }
  }
  function updateAtlasDocumentNode(document2, path, updater) {
    return upsertAtlasDocumentNode(document2, path, updater(getAtlasDocumentNode(document2, path)));
  }
  function removeAtlasDocumentNode(document2, path) {
    const next = cloneAtlasDocument(document2);
    const system = ensureSystem(next);
    switch (path.kind) {
      case "metadata":
        if (path.key) {
          delete system.atlasMetadata[path.key];
        }
        return next;
      case "object":
        if (path.id) {
          next.objects = next.objects.filter((object) => object.id !== path.id);
        }
        return next;
      case "viewpoint":
        if (path.id) {
          system.viewpoints = system.viewpoints.filter((viewpoint) => viewpoint.id !== path.id);
        }
        return next;
      case "annotation":
        if (path.id) {
          system.annotations = system.annotations.filter((annotation) => annotation.id !== path.id);
        }
        return next;
      default:
        return next;
    }
  }
  function resolveAtlasDiagnostics(document2, diagnostics) {
    return diagnostics.map((diagnostic) => ({
      diagnostic,
      path: resolveAtlasDiagnosticPath(document2, diagnostic)
    }));
  }
  function resolveAtlasDiagnosticPath(document2, diagnostic) {
    if (diagnostic.objectId && findObject(document2, diagnostic.objectId)) {
      return {
        kind: "object",
        id: diagnostic.objectId
      };
    }
    if (diagnostic.field?.startsWith("viewpoint.")) {
      const parts = diagnostic.field.split(".");
      if (parts[1] && findViewpoint(document2.system, parts[1])) {
        return {
          kind: "viewpoint",
          id: parts[1]
        };
      }
    }
    if (diagnostic.field?.startsWith("annotation.")) {
      const parts = diagnostic.field.split(".");
      if (parts[1] && findAnnotation(document2.system, parts[1])) {
        return {
          kind: "annotation",
          id: parts[1]
        };
      }
    }
    if (diagnostic.field && diagnostic.field in ensureSystem(document2).atlasMetadata) {
      return {
        kind: "metadata",
        key: diagnostic.field
      };
    }
    return null;
  }
  function validateAtlasDocumentWithDiagnostics(document2) {
    const materialized = materializeAtlasDocument(document2);
    const result = validateDocumentWithDiagnostics(materialized);
    return resolveAtlasDiagnostics(document2, result.diagnostics);
  }
  function ensureSystem(document2) {
    if (document2.system) {
      return document2.system;
    }
    document2.system = createEmptyAtlasDocument().system;
    return document2.system;
  }
  function findObject(document2, objectId) {
    return document2.objects.find((object) => object.id === objectId) ?? null;
  }
  function findViewpoint(system, viewpointId) {
    return system?.viewpoints.find((viewpoint) => viewpoint.id === viewpointId) ?? null;
  }
  function findAnnotation(system, annotationId) {
    return system?.annotations.find((annotation) => annotation.id === annotationId) ?? null;
  }
  function upsertById(items, value) {
    const index = items.findIndex((item) => item.id === value.id);
    if (index === -1) {
      items.push(value);
      items.sort(compareIdLike);
      return;
    }
    items[index] = value;
  }
  function compareIdLike(left, right) {
    return left.id.localeCompare(right.id);
  }

  // packages/core/dist/load.js
  var ATLAS_SCHEMA_PATTERN = /^schema\s+2(?:\.0)?$/i;
  var LEGACY_DRAFT_SCHEMA_PATTERN = /^schema\s+2\.0-draft$/i;
  function detectWorldOrbitSchemaVersion(source) {
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
  function loadWorldOrbitSource(source) {
    const result = loadWorldOrbitSourceWithDiagnostics(source);
    if (!result.ok || !result.value) {
      const diagnostic = result.diagnostics[0];
      throw new WorldOrbitError(diagnostic?.message ?? "Failed to load WorldOrbit source", diagnostic?.line, diagnostic?.column);
    }
    return result.value;
  }
  function loadWorldOrbitSourceWithDiagnostics(source) {
    const schemaVersion = detectWorldOrbitSchemaVersion(source);
    if (schemaVersion === "2.0" || schemaVersion === "2.0-draft") {
      return loadAtlasSourceWithDiagnostics(source, schemaVersion);
    }
    let ast;
    try {
      ast = parseWorldOrbit(source);
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "parse")]
      };
    }
    let document2;
    try {
      document2 = normalizeDocument(ast);
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "normalize")]
      };
    }
    try {
      validateDocument(document2);
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "validate")]
      };
    }
    return {
      ok: true,
      value: {
        schemaVersion,
        ast,
        document: document2,
        atlasDocument: null,
        draftDocument: null,
        diagnostics: []
      },
      diagnostics: []
    };
  }
  function loadAtlasSourceWithDiagnostics(source, schemaVersion) {
    let atlasDocument;
    try {
      atlasDocument = parseWorldOrbitAtlas(source);
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "parse", "load.atlas.failed")]
      };
    }
    let document2;
    try {
      document2 = materializeAtlasDocument(atlasDocument);
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "normalize", "load.atlas.materialize.failed")]
      };
    }
    try {
      validateDocument(document2);
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "validate", "load.atlas.validate.failed")]
      };
    }
    const loaded = {
      schemaVersion,
      ast: null,
      document: document2,
      atlasDocument,
      draftDocument: atlasDocument,
      diagnostics: [...atlasDocument.diagnostics]
    };
    return {
      ok: true,
      value: loaded,
      diagnostics: [...atlasDocument.diagnostics]
    };
  }

  // packages/core/dist/markdown.js
  var FENCE_PATTERN = /^```worldorbit(?:\s+(.*))?\s*$/;
  function extractWorldOrbitBlocks(markdown) {
    const lines = markdown.split(/\r?\n/);
    const blocks = [];
    let active = false;
    let activeInfo = null;
    let activeStartLine = 0;
    let buffer = [];
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      if (!active) {
        const match = line.match(FENCE_PATTERN);
        if (match) {
          active = true;
          activeInfo = match[1] ?? null;
          activeStartLine = lineNumber;
          buffer = [];
        }
        return;
      }
      if (line.trim() === "```") {
        blocks.push({
          source: buffer.join("\n"),
          info: activeInfo,
          startLine: activeStartLine,
          endLine: lineNumber
        });
        active = false;
        activeInfo = null;
        activeStartLine = 0;
        buffer = [];
        return;
      }
      buffer.push(line);
    });
    return blocks;
  }

  // packages/core/dist/index.js
  function parse(source) {
    const ast = parseWorldOrbit(source);
    const document2 = normalizeDocument(ast);
    validateDocument(document2);
    return { ast, document: document2 };
  }
  function render(source) {
    const result = parse(source);
    return {
      ...result,
      scene: renderDocumentToScene(result.document)
    };
  }
  function load(source) {
    return loadWorldOrbitSource(source);
  }
  function parseSafe(source) {
    return parseWithDiagnostics(source);
  }
  function stringify(document2, options = {}) {
    return formatDocument(document2, options);
  }

  // packages/viewer/dist/theme.js
  var DEFAULT_LAYERS = {
    background: true,
    guides: true,
    orbits: true,
    objects: true,
    labels: true,
    structures: true,
    metadata: true
  };
  var THEME_PRESETS = {
    atlas: {
      name: "atlas",
      backgroundStart: "#041018",
      backgroundEnd: "#0a2331",
      backgroundGlow: "rgba(240, 180, 100, 0.18)",
      panel: "rgba(7, 17, 27, 0.9)",
      panelLine: "rgba(168, 207, 242, 0.18)",
      orbit: "rgba(163, 209, 255, 0.24)",
      orbitBand: "rgba(255, 190, 120, 0.28)",
      guide: "rgba(255, 255, 255, 0.04)",
      leader: "rgba(225, 238, 255, 0.4)",
      ink: "#e8f0ff",
      muted: "rgba(232, 240, 255, 0.7)",
      accent: "#f0b464",
      accentStrong: "#ff7f5f",
      selected: "rgba(255, 214, 139, 0.92)",
      starCore: "#ffcc67",
      starStroke: "rgba(255, 245, 203, 0.85)",
      starGlow: "#ffe8a3",
      fontFamily: '"Segoe UI Variable", "Bahnschrift", sans-serif',
      displayFont: '"Bahnschrift", "Segoe UI Variable", sans-serif'
    },
    nightglass: {
      name: "nightglass",
      backgroundStart: "#07131f",
      backgroundEnd: "#13283a",
      backgroundGlow: "rgba(120, 255, 215, 0.16)",
      panel: "rgba(7, 20, 30, 0.9)",
      panelLine: "rgba(120, 255, 215, 0.16)",
      orbit: "rgba(120, 255, 215, 0.2)",
      orbitBand: "rgba(137, 185, 255, 0.24)",
      guide: "rgba(255, 255, 255, 0.035)",
      leader: "rgba(192, 255, 233, 0.42)",
      ink: "#edfff8",
      muted: "rgba(237, 255, 248, 0.68)",
      accent: "#78ffd7",
      accentStrong: "#9ce7ff",
      selected: "rgba(120, 255, 215, 0.9)",
      starCore: "#e5f98c",
      starStroke: "rgba(246, 255, 217, 0.9)",
      starGlow: "#fffab4",
      fontFamily: '"Segoe UI Variable", "Bahnschrift", sans-serif',
      displayFont: '"Bahnschrift", "Segoe UI Variable", sans-serif'
    },
    ember: {
      name: "ember",
      backgroundStart: "#17090b",
      backgroundEnd: "#31111a",
      backgroundGlow: "rgba(255, 127, 95, 0.18)",
      panel: "rgba(24, 9, 13, 0.9)",
      panelLine: "rgba(255, 166, 149, 0.16)",
      orbit: "rgba(255, 188, 164, 0.22)",
      orbitBand: "rgba(255, 214, 139, 0.24)",
      guide: "rgba(255, 255, 255, 0.03)",
      leader: "rgba(255, 223, 209, 0.42)",
      ink: "#fff3ee",
      muted: "rgba(255, 243, 238, 0.68)",
      accent: "#ffb27d",
      accentStrong: "#ff7f5f",
      selected: "rgba(255, 178, 125, 0.9)",
      starCore: "#ffb766",
      starStroke: "rgba(255, 236, 205, 0.88)",
      starGlow: "#ffe2ad",
      fontFamily: '"Segoe UI Variable", "Bahnschrift", sans-serif',
      displayFont: '"Bahnschrift", "Segoe UI Variable", sans-serif'
    }
  };
  function resolveTheme(theme) {
    if (!theme) {
      return THEME_PRESETS.atlas;
    }
    if (typeof theme === "string") {
      return THEME_PRESETS[theme] ?? THEME_PRESETS.atlas;
    }
    return {
      ...THEME_PRESETS.atlas,
      ...theme
    };
  }
  function resolveLayers(layers) {
    return {
      ...DEFAULT_LAYERS,
      ...layers
    };
  }
  function getThemePreset(name) {
    return THEME_PRESETS[name];
  }

  // packages/viewer/dist/atlas-state.js
  function normalizeViewerFilter(filter) {
    if (!filter) {
      return null;
    }
    const normalized = {
      query: filter.query?.trim() || void 0,
      objectTypes: dedupeList(filter.objectTypes ?? []),
      tags: dedupeList((filter.tags ?? []).map((tag) => tag.trim()).filter(Boolean)),
      groupIds: dedupeList((filter.groupIds ?? []).map((groupId) => groupId.trim()).filter(Boolean)),
      includeAncestors: filter.includeAncestors ?? true
    };
    return isViewerFilterActive(normalized) ? normalized : null;
  }
  function isViewerFilterActive(filter) {
    return Boolean(filter && (filter.query?.trim() || filter.objectTypes?.length || filter.tags?.length || filter.groupIds?.length));
  }
  function computeVisibleObjectIds(scene, filter) {
    const normalized = normalizeViewerFilter(filter);
    const visible = /* @__PURE__ */ new Set();
    for (const object of scene.objects) {
      if (object.hidden) {
        continue;
      }
      if (matchesObjectFilter(object, normalized)) {
        visible.add(object.objectId);
        if (normalized?.includeAncestors !== false) {
          for (const ancestorId of object.ancestorIds) {
            visible.add(ancestorId);
          }
        }
      }
    }
    if (!normalized) {
      return new Set(scene.objects.filter((object) => !object.hidden).map((object) => object.objectId));
    }
    return visible;
  }
  function searchSceneObjects(scene, query, limit = 12) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return scene.objects.filter((object) => !object.hidden).slice().sort((left, right) => left.label.localeCompare(right.label)).slice(0, limit).map((object) => createSearchResult(object, 1));
    }
    return scene.objects.filter((object) => !object.hidden).map((object) => ({
      object,
      score: scoreSearchMatch(object, normalizedQuery)
    })).filter((entry) => entry.score > 0).sort((left, right) => right.score - left.score || left.object.label.localeCompare(right.object.label)).slice(0, limit).map((entry) => createSearchResult(entry.object, entry.score));
  }
  function createAtlasStateSnapshot(viewerState, renderOptions, filter, viewpointId) {
    return {
      version: "2.0",
      viewpointId,
      viewerState: { ...viewerState },
      renderOptions: {
        preset: renderOptions.preset,
        projection: renderOptions.projection,
        layers: renderOptions.layers ? { ...renderOptions.layers } : void 0,
        scaleModel: renderOptions.scaleModel ? { ...renderOptions.scaleModel } : void 0
      },
      filter: normalizeViewerFilter(filter)
    };
  }
  function serializeViewerAtlasState(state) {
    return encodeURIComponent(JSON.stringify(state));
  }
  function deserializeViewerAtlasState(serialized) {
    const raw = JSON.parse(decodeURIComponent(serialized));
    return {
      version: "2.0",
      viewpointId: raw.viewpointId ?? null,
      viewerState: {
        scale: raw.viewerState?.scale ?? 1,
        rotationDeg: raw.viewerState?.rotationDeg ?? 0,
        translateX: raw.viewerState?.translateX ?? 0,
        translateY: raw.viewerState?.translateY ?? 0,
        selectedObjectId: raw.viewerState?.selectedObjectId ?? null
      },
      renderOptions: {
        preset: raw.renderOptions?.preset,
        projection: raw.renderOptions?.projection,
        layers: raw.renderOptions?.layers ? { ...raw.renderOptions.layers } : void 0,
        scaleModel: raw.renderOptions?.scaleModel ? { ...raw.renderOptions.scaleModel } : void 0
      },
      filter: normalizeViewerFilter(raw.filter ?? null)
    };
  }
  function createViewerBookmark(name, label, atlasState) {
    const normalizedName = name.trim() || "bookmark";
    return {
      id: normalizedName.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "bookmark",
      label: label?.trim() || normalizedName,
      atlasState: {
        ...atlasState,
        viewerState: { ...atlasState.viewerState },
        renderOptions: {
          ...atlasState.renderOptions,
          layers: atlasState.renderOptions.layers ? { ...atlasState.renderOptions.layers } : void 0,
          scaleModel: atlasState.renderOptions.scaleModel ? { ...atlasState.renderOptions.scaleModel } : void 0
        },
        filter: atlasState.filter ? { ...atlasState.filter } : null
      }
    };
  }
  function sceneViewpointToLayerOptions(viewpoint) {
    if (!viewpoint) {
      return void 0;
    }
    const hasLayerState = Object.keys(viewpoint.layers).length > 0;
    if (!hasLayerState) {
      return void 0;
    }
    return {
      background: viewpoint.layers.background,
      guides: viewpoint.layers.guides,
      orbits: viewpoint.layers["orbits-front"] === void 0 && viewpoint.layers["orbits-back"] === void 0 ? void 0 : viewpoint.layers["orbits-front"] !== false || viewpoint.layers["orbits-back"] !== false,
      objects: viewpoint.layers.objects,
      labels: viewpoint.layers.labels,
      metadata: viewpoint.layers.metadata
    };
  }
  function viewpointToViewerFilter(viewpoint) {
    if (!viewpoint?.filter) {
      return null;
    }
    return normalizeViewerFilter({
      query: viewpoint.filter.query ?? void 0,
      objectTypes: viewpoint.filter.objectTypes,
      tags: viewpoint.filter.tags,
      groupIds: viewpoint.filter.groupIds,
      includeAncestors: true
    });
  }
  function createSearchResult(object, score) {
    return {
      objectId: object.objectId,
      label: object.label,
      type: object.object.type,
      score,
      groupId: object.groupId,
      parentId: object.parentId,
      tags: Array.isArray(object.object.properties.tags) ? object.object.properties.tags.filter((entry) => typeof entry === "string") : []
    };
  }
  function matchesObjectFilter(object, filter) {
    if (!filter) {
      return true;
    }
    if (filter.objectTypes?.length && !filter.objectTypes.includes(object.object.type)) {
      return false;
    }
    if (filter.groupIds?.length && (!object.groupId || !filter.groupIds.includes(object.groupId))) {
      return false;
    }
    if (filter.tags?.length) {
      const objectTags = Array.isArray(object.object.properties.tags) ? object.object.properties.tags.filter((entry) => typeof entry === "string") : [];
      if (!filter.tags.every((tag) => objectTags.includes(tag))) {
        return false;
      }
    }
    if (filter.query?.trim()) {
      const haystack = buildSearchText(object.object, object.label).toLowerCase();
      const tokens = filter.query.toLowerCase().split(/\s+/).filter(Boolean);
      if (!tokens.every((token) => haystack.includes(token))) {
        return false;
      }
    }
    return true;
  }
  function scoreSearchMatch(object, query) {
    const id = object.objectId.toLowerCase();
    const label = object.label.toLowerCase();
    const haystack = buildSearchText(object.object, object.label).toLowerCase();
    let score = 0;
    if (id === query || label === query) {
      score += 120;
    } else if (id.startsWith(query) || label.startsWith(query)) {
      score += 96;
    } else if (id.includes(query) || label.includes(query)) {
      score += 72;
    }
    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.every((token) => haystack.includes(token))) {
      score += 32;
    }
    if (object.object.type === query) {
      score += 24;
    }
    const tags = Array.isArray(object.object.properties.tags) ? object.object.properties.tags.filter((entry) => typeof entry === "string") : [];
    if (tags.some((tag) => tag.toLowerCase() === query)) {
      score += 18;
    }
    return score;
  }
  function buildSearchText(object, label) {
    const infoValues = Object.values(object.info);
    const propertyValues = Object.values(object.properties).flatMap((value) => {
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === "object" && value && "value" in value) {
        return [String(value.value), String(value.unit ?? "")];
      }
      return [String(value)];
    }).filter(Boolean);
    return [
      object.id,
      label,
      object.type,
      ...propertyValues,
      ...infoValues
    ].join(" ");
  }
  function dedupeList(values) {
    return [...new Set(values)];
  }

  // packages/viewer/dist/viewer-state.js
  var DEFAULT_VIEWER_STATE = {
    scale: 1,
    rotationDeg: 0,
    translateX: 0,
    translateY: 0,
    selectedObjectId: null
  };
  function normalizeRotation(rotationDeg) {
    let normalized = rotationDeg % 360;
    if (normalized > 180) {
      normalized -= 360;
    }
    if (normalized <= -180) {
      normalized += 360;
    }
    return normalized;
  }
  function clampScale(scale, constraints) {
    return Math.min(Math.max(scale, constraints.minScale), constraints.maxScale);
  }
  function panViewerState(state, dx, dy) {
    return {
      ...state,
      translateX: state.translateX + dx,
      translateY: state.translateY + dy
    };
  }
  function rotateViewerState(state, deltaDeg) {
    return {
      ...state,
      rotationDeg: normalizeRotation(state.rotationDeg + deltaDeg)
    };
  }
  function zoomViewerStateAt(scene, state, factor, anchor, constraints) {
    if (!Number.isFinite(factor) || factor <= 0) {
      return state;
    }
    const center = getSceneCenter(scene);
    const nextScale = clampScale(state.scale * factor, constraints);
    if (nextScale === state.scale) {
      return state;
    }
    const zoomRatio = nextScale / state.scale;
    const anchorDx = anchor.x - center.x;
    const anchorDy = anchor.y - center.y;
    return {
      ...state,
      scale: nextScale,
      translateX: (1 - zoomRatio) * anchorDx + zoomRatio * state.translateX,
      translateY: (1 - zoomRatio) * anchorDy + zoomRatio * state.translateY
    };
  }
  function fitViewerState(scene, state, constraints) {
    const center = getSceneCenter(scene);
    const rotatedBounds = rotateBounds(scene.contentBounds, center, state.rotationDeg);
    const availableWidth = Math.max(scene.width - constraints.fitPadding * 2, 1);
    const availableHeight = Math.max(scene.height - constraints.fitPadding * 2, 1);
    const safeWidth = Math.max(rotatedBounds.width, 1);
    const safeHeight = Math.max(rotatedBounds.height, 1);
    const nextScale = clampScale(Math.min(availableWidth / safeWidth, availableHeight / safeHeight), constraints);
    const rotatedCenter = rotatePoint({
      x: scene.contentBounds.centerX,
      y: scene.contentBounds.centerY
    }, center, state.rotationDeg);
    return {
      ...state,
      scale: nextScale,
      translateX: center.x - (center.x + (rotatedCenter.x - center.x) * nextScale),
      translateY: center.y - (center.y + (rotatedCenter.y - center.y) * nextScale)
    };
  }
  function focusViewerState(scene, state, objectId, constraints) {
    const target = scene.objects.find((object) => object.objectId === objectId && !object.hidden);
    if (!target) {
      return state;
    }
    const center = getSceneCenter(scene);
    const nextScale = clampScale(Math.max(state.scale, 1.8), constraints);
    const rotatedPoint = rotatePoint({ x: target.x, y: target.y }, center, state.rotationDeg);
    return {
      ...state,
      scale: nextScale,
      translateX: center.x - (center.x + (rotatedPoint.x - center.x) * nextScale),
      translateY: center.y - (center.y + (rotatedPoint.y - center.y) * nextScale),
      selectedObjectId: objectId
    };
  }
  function composeViewerTransform(scene, state) {
    const center = getSceneCenter(scene);
    return `translate(${state.translateX} ${state.translateY}) translate(${center.x} ${center.y}) rotate(${state.rotationDeg}) scale(${state.scale}) translate(${-center.x} ${-center.y})`;
  }
  function invertViewerPoint(scene, state, point) {
    const center = getSceneCenter(scene);
    const translated = {
      x: point.x - state.translateX,
      y: point.y - state.translateY
    };
    const centered = {
      x: translated.x - center.x,
      y: translated.y - center.y
    };
    const scaled = {
      x: centered.x / Math.max(state.scale, 1e-4),
      y: centered.y / Math.max(state.scale, 1e-4)
    };
    const unrotated = rotatePoint({ x: scaled.x, y: scaled.y }, { x: 0, y: 0 }, -state.rotationDeg);
    return {
      x: center.x + unrotated.x,
      y: center.y + unrotated.y
    };
  }
  function getViewerVisibleBounds(scene, state) {
    const corners = [
      { x: 0, y: 0 },
      { x: scene.width, y: 0 },
      { x: scene.width, y: scene.height },
      { x: 0, y: scene.height }
    ].map((point) => invertViewerPoint(scene, state, point));
    const minX = Math.min(...corners.map((corner) => corner.x));
    const minY = Math.min(...corners.map((corner) => corner.y));
    const maxX = Math.max(...corners.map((corner) => corner.x));
    const maxY = Math.max(...corners.map((corner) => corner.y));
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: minX + (maxX - minX) / 2,
      centerY: minY + (maxY - minY) / 2
    };
  }
  function getSceneCenter(scene) {
    return {
      x: scene.width / 2,
      y: scene.height / 2
    };
  }
  function rotateBounds(bounds, center, rotationDeg) {
    const corners = [
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.maxY },
      { x: bounds.minX, y: bounds.maxY }
    ].map((corner) => rotatePoint(corner, center, rotationDeg));
    const minX = Math.min(...corners.map((corner) => corner.x));
    const minY = Math.min(...corners.map((corner) => corner.y));
    const maxX = Math.max(...corners.map((corner) => corner.x));
    const maxY = Math.max(...corners.map((corner) => corner.y));
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: minX + (maxX - minX) / 2,
      centerY: minY + (maxY - minY) / 2
    };
  }

  // packages/viewer/dist/render.js
  var WORLD_LAYER_ID = "worldorbit-camera-root";
  function renderSceneToSvg(scene, options = {}) {
    const theme = resolveTheme(options.theme);
    const presetDefaults = resolveRenderPreset(options.preset ?? scene.renderPreset ?? void 0);
    const layers = resolveLayers({
      ...presetDefaults.layers,
      ...options.layers
    });
    const subtitle = options.subtitle ?? scene.subtitle;
    const visibleObjectIds = computeVisibleObjectIds(scene, options.filter ?? null);
    const visibleObjects = scene.objects.filter((object) => !object.hidden).filter((object) => visibleObjectIds.has(object.objectId)).filter((object) => layers.structures || !isStructureLike(object.object)).sort((left, right) => left.sortKey - right.sortKey);
    const visibleLabels = scene.labels.filter((label) => !label.hidden).filter((label) => visibleObjectIds.has(label.objectId)).filter((label) => layers.structures || !isStructureLike(label.object));
    const imageDefinitions = buildImageDefinitions(visibleObjects);
    const orbitMarkup = layers.orbits ? renderOrbitLayer(scene, visibleObjectIds, layers.structures) : { back: "", front: "" };
    const leaderMarkup = layers.guides ? scene.leaders.filter((leader) => !leader.hidden).filter((leader) => visibleObjectIds.has(leader.objectId)).filter((leader) => layers.structures || !isStructureLike(leader.object)).map((leader) => `<line class="wo-leader wo-leader-${leader.mode}" x1="${leader.x1}" y1="${leader.y1}" x2="${leader.x2}" y2="${leader.y2}" data-render-id="${escapeXml(leader.renderId)}" data-group-id="${escapeAttribute(leader.groupId ?? "")}" />`).join("") : "";
    const objectMarkup = layers.objects ? visibleObjects.map((object) => renderSceneObject(object, options.selectedObjectId ?? null, theme)).join("") : "";
    const labelMarkup = layers.labels ? visibleLabels.map((label) => renderSceneLabel(scene, label, options.selectedObjectId ?? null)).join("") : "";
    const metadataMarkup = layers.metadata ? `<text class="wo-title" x="56" y="64">${escapeXml(scene.title)}</text>
  <text class="wo-subtitle" x="56" y="88">${escapeXml(subtitle)}</text>
  <text class="wo-meta" x="56" y="${scene.height - 42}">${escapeXml(renderMetadata(scene))}</text>` : "";
    const backgroundMarkup = layers.background ? `<rect class="wo-bg" x="0" y="0" width="${scene.width}" height="${scene.height}" rx="28" ry="28" />
  <rect class="wo-bg-glow" x="0" y="0" width="${scene.width}" height="${scene.height}" rx="28" ry="28" />
  ${layers.guides ? renderBackdrop(scene.width, scene.height) : ""}` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" data-worldorbit-svg="true" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="worldorbit-title worldorbit-desc">
  <title id="worldorbit-title">${escapeXml(scene.title)}</title>
  <desc id="worldorbit-desc">A ${escapeXml(scene.viewMode)} WorldOrbit render with ${visibleObjects.length} visible objects.</desc>
  <defs>
    <linearGradient id="wo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.backgroundStart}" />
      <stop offset="100%" stop-color="${theme.backgroundEnd}" />
    </linearGradient>
    <radialGradient id="wo-star-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${theme.starGlow}" stop-opacity="0.95" />
      <stop offset="100%" stop-color="${theme.starCore}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="wo-bg-glow" cx="20%" cy="10%" r="90%">
      <stop offset="0%" stop-color="${theme.backgroundGlow}" />
      <stop offset="100%" stop-color="transparent" />
    </radialGradient>
    ${imageDefinitions}
  </defs>
  <style>
    .wo-bg { fill: url(#wo-bg); }
    .wo-bg-glow { fill: url(#wo-bg-glow); }
    .wo-grid { fill: none; stroke: ${theme.guide}; stroke-width: 1; }
    .wo-orbit { fill: none; stroke: ${theme.orbit}; stroke-width: 1.5; }
    .wo-orbit-back { opacity: 0.38; stroke-dasharray: 8 6; }
    .wo-orbit-front { opacity: 0.9; }
    .wo-orbit-band { stroke: ${theme.orbitBand}; stroke-linecap: round; }
    .wo-leader { stroke: ${theme.leader}; stroke-width: 1.5; stroke-dasharray: 6 5; }
    .wo-label { fill: ${theme.ink}; font-family: ${theme.fontFamily}; font-weight: 600; letter-spacing: 0.02em; }
    .wo-label-secondary { fill: ${theme.muted}; font-family: ${theme.fontFamily}; font-weight: 500; }
    .wo-title { fill: ${theme.ink}; font: 700 24px ${theme.displayFont}; letter-spacing: 0.06em; text-transform: uppercase; }
    .wo-subtitle { fill: ${theme.muted}; font: 500 12px ${theme.fontFamily}; letter-spacing: 0.14em; text-transform: uppercase; }
    .wo-meta { fill: ${theme.muted}; font: 500 11px ${theme.fontFamily}; letter-spacing: 0.06em; }
    .wo-object { cursor: pointer; outline: none; }
    .wo-object:focus-visible .wo-selection-ring,
    .wo-object:hover .wo-selection-ring,
    .wo-object-selected .wo-selection-ring { display: block; }
    .wo-object-selected .wo-selection-ring { stroke: ${theme.selected}; }
    .wo-object-label-selected .wo-label { fill: ${theme.accent}; }
    .wo-object-label-selected .wo-label-secondary { fill: ${theme.selected}; }
    .wo-chain-selected .wo-selection-ring,
    .wo-chain-hover .wo-selection-ring { display: block; }
    .wo-ancestor-selected .wo-selection-ring,
    .wo-ancestor-hover .wo-selection-ring { display: block; opacity: 0.66; }
    .wo-chain-selected .wo-label,
    .wo-chain-hover .wo-label { fill: ${theme.accent}; }
    .wo-ancestor-selected .wo-label,
    .wo-ancestor-hover .wo-label { fill: ${theme.ink}; opacity: 0.82; }
    .wo-orbit-related-selected,
    .wo-orbit-related-hover { stroke: ${theme.accentStrong}; opacity: 1; }
    .wo-selection-ring { display: none; fill: none; stroke-width: 2; stroke-dasharray: 6 5; }
    .wo-object-image { pointer-events: none; }
  </style>
  ${backgroundMarkup}
  ${metadataMarkup}
  <g data-worldorbit-world="true">
    <g data-worldorbit-camera-root="${WORLD_LAYER_ID}" id="${WORLD_LAYER_ID}">
      <g data-worldorbit-world-content="true">
        ${layers.orbits ? `<g data-layer-id="orbits-back">${orbitMarkup.back}</g>` : ""}
        ${layers.guides ? `<g data-layer-id="guides">${leaderMarkup}</g>` : ""}
        ${layers.objects ? `<g data-layer-id="objects">${objectMarkup}</g>` : ""}
        ${layers.orbits ? `<g data-layer-id="orbits-front">${orbitMarkup.front}</g>` : ""}
        ${layers.labels ? `<g data-layer-id="labels">${labelMarkup}</g>` : ""}
      </g>
    </g>
  </g>
</svg>`;
  }
  function renderDocumentToSvg(document2, options = {}) {
    return renderSceneToSvg(renderDocumentToScene(document2, options), options);
  }
  function renderSourceToSvg(source, options = {}) {
    const loaded = loadWorldOrbitSource(source);
    return renderDocumentToSvg(loaded.document, resolveSourceRenderOptions(loaded, options));
  }
  function resolveSourceRenderOptions(loaded, options) {
    const atlasDocument = loaded.atlasDocument ?? loaded.draftDocument;
    if (options.preset || !atlasDocument?.system?.defaults.preset) {
      return options;
    }
    return {
      ...options,
      preset: atlasDocument.system.defaults.preset
    };
  }
  function renderOrbitLayer(scene, visibleObjectIds, includeStructures) {
    const backParts = [];
    const frontParts = [];
    for (const visual of scene.orbitVisuals.filter((entry) => !entry.hidden && visibleObjectIds.has(entry.objectId) && (includeStructures || !isStructureLike(entry.object)))) {
      const strokeWidth = visual.bandThickness ?? (visual.band ? 10 : 1.5);
      const orbitClass = visual.band ? "wo-orbit wo-orbit-band wo-orbit-node" : "wo-orbit wo-orbit-node";
      const dataAttributes = `data-render-id="${escapeXml(visual.renderId)}" data-orbit-object-id="${escapeAttribute(visual.objectId)}" data-parent-id="${escapeAttribute(visual.parentId)}" data-group-id="${escapeAttribute(visual.groupId ?? "")}"`;
      if (visual.backArcPath || visual.frontArcPath) {
        if (visual.backArcPath) {
          backParts.push(`<path class="${orbitClass} wo-orbit-back" d="${visual.backArcPath}" stroke-width="${strokeWidth}" ${dataAttributes} />`);
        }
        if (visual.frontArcPath) {
          frontParts.push(`<path class="${orbitClass} wo-orbit-front" d="${visual.frontArcPath}" stroke-width="${strokeWidth}" ${dataAttributes} />`);
        }
        continue;
      }
      if (visual.kind === "ellipse") {
        const rx = visual.rx ?? visual.radius ?? 0;
        const ry = visual.ry ?? visual.radius ?? 0;
        frontParts.push(`<ellipse class="${orbitClass} wo-orbit-front" cx="${visual.cx}" cy="${visual.cy}" rx="${rx}" ry="${ry}" transform="rotate(${visual.rotationDeg} ${visual.cx} ${visual.cy})" stroke-width="${strokeWidth}" ${dataAttributes} />`);
        continue;
      }
      frontParts.push(`<circle class="${orbitClass} wo-orbit-front" cx="${visual.cx}" cy="${visual.cy}" r="${visual.radius ?? 0}" stroke-width="${strokeWidth}" ${dataAttributes} />`);
    }
    return {
      back: backParts.join(""),
      front: frontParts.join("")
    };
  }
  function buildImageDefinitions(objects) {
    return objects.filter((object) => Boolean(object.imageHref)).map((object) => renderImageClipPath(object)).join("");
  }
  function renderSceneObject(sceneObject, selectedObjectId, theme) {
    const { object, x, y, radius, visualRadius } = sceneObject;
    const selectionClass = selectedObjectId === sceneObject.objectId ? " wo-object-selected" : "";
    const kindClass = object.properties.kind ? ` wo-kind-${String(object.properties.kind).toLowerCase().replace(/[^a-z0-9-]/g, "-")}` : "";
    const palette = resolveObjectPalette(sceneObject, theme);
    const imageMarkup = renderObjectImage(sceneObject);
    const outlineMarkup = imageMarkup ? renderObjectBody(object, x, y, radius, palette, { outlineOnly: true }) : "";
    return `<g class="wo-object wo-object-${object.type}${kindClass}${selectionClass}" data-object-id="${escapeXml(sceneObject.objectId)}" data-parent-id="${escapeAttribute(sceneObject.parentId ?? "")}" data-group-id="${escapeAttribute(sceneObject.groupId ?? "")}" data-render-id="${escapeXml(sceneObject.renderId)}" tabindex="0" role="button" aria-label="${escapeXml(`${object.type} ${sceneObject.objectId}`)}">
    <circle class="wo-selection-ring" cx="${x}" cy="${y}" r="${visualRadius + 8}" />
    ${renderAtmosphere(sceneObject, palette)}
    ${renderObjectBody(object, x, y, radius, palette)}
    ${imageMarkup}
    ${outlineMarkup}
  </g>`;
  }
  function renderSceneLabel(scene, label, selectedObjectId) {
    const selectionClass = selectedObjectId === label.objectId ? " wo-object-label-selected" : "";
    const labelScale = scene.scaleModel.labelMultiplier;
    return `<g class="wo-object-label${selectionClass}" data-object-id="${escapeXml(label.objectId)}" data-group-id="${escapeAttribute(label.groupId ?? "")}" data-render-id="${escapeXml(label.renderId)}">
    <text class="wo-label" x="${label.x}" y="${label.y}" text-anchor="${label.textAnchor}" font-size="${14 * labelScale}">${escapeXml(label.label)}</text>
    <text class="wo-label-secondary" x="${label.x}" y="${label.secondaryY}" text-anchor="${label.textAnchor}" font-size="${11 * labelScale}">${escapeXml(label.secondaryLabel)}</text>
  </g>`;
  }
  function renderObjectBody(object, x, y, radius, palette, options = {}) {
    const fill = options.outlineOnly ? "transparent" : palette.fill;
    const tail = palette.tail ?? palette.fill;
    switch (object.type) {
      case "star":
        return options.outlineOnly ? `<circle cx="${x}" cy="${y}" r="${radius}" fill="transparent" stroke="${palette.stroke}" stroke-width="2" />` : `<circle cx="${x}" cy="${y}" r="${radius * 2.4}" fill="${palette.glow ?? "url(#wo-star-glow)"}" opacity="0.84" />
<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${palette.stroke}" stroke-width="2" />`;
      case "planet":
      case "moon":
      case "belt":
      case "asteroid":
      case "ring":
        return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${palette.stroke}" stroke-width="${options.outlineOnly ? 1.5 : 1.4}" />`;
      case "comet":
        return options.outlineOnly ? `<circle cx="${x}" cy="${y}" r="${radius}" fill="transparent" stroke="${palette.stroke}" stroke-width="1.4" />` : `<path d="M ${x - radius * 2} ${y + radius * 1.3} Q ${x - radius * 0.7} ${y + radius * 0.3} ${x - radius * 0.45} ${y}" fill="none" stroke="${tail}" stroke-width="${Math.max(2, radius * 0.8)}" stroke-linecap="round" opacity="0.85" />
<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1.4" />`;
      case "structure":
        return `<polygon points="${diamondPoints(x, y, radius)}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1.4" />`;
      case "phenomenon":
        return `<polygon points="${phenomenonPoints(x, y, radius)}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1.4" />`;
    }
  }
  function renderAtmosphere(sceneObject, palette) {
    if (!palette.atmosphere) {
      return "";
    }
    const { object, x, y, radius } = sceneObject;
    if (object.type !== "planet" && object.type !== "moon" && object.type !== "asteroid") {
      return "";
    }
    return `<circle cx="${x}" cy="${y}" r="${radius + 4}" fill="none" stroke="${palette.atmosphere}" stroke-width="4" opacity="0.45" />`;
  }
  function renderObjectImage(sceneObject) {
    if (!sceneObject.imageHref) {
      return "";
    }
    const bounds = imageBoundsForObject(sceneObject);
    return `<image class="wo-object-image" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" href="${escapeAttribute(sceneObject.imageHref)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${escapeAttribute(getObjectClipPathId(sceneObject))})" />`;
  }
  function renderImageClipPath(sceneObject) {
    const { x, y, radius } = sceneObject;
    let content = "";
    switch (sceneObject.object.type) {
      case "star":
      case "planet":
      case "moon":
      case "asteroid":
      case "comet":
        content = `<circle cx="${x}" cy="${y}" r="${radius}" />`;
        break;
      case "structure":
        content = `<polygon points="${diamondPoints(x, y, radius)}" />`;
        break;
      case "phenomenon":
        content = `<polygon points="${phenomenonPoints(x, y, radius)}" />`;
        break;
      default:
        return "";
    }
    return `<clipPath id="${escapeAttribute(getObjectClipPathId(sceneObject))}" clipPathUnits="userSpaceOnUse">${content}</clipPath>`;
  }
  function imageBoundsForObject(sceneObject) {
    const { object, x, y, radius } = sceneObject;
    switch (object.type) {
      case "structure":
        return {
          x: x - radius,
          y: y - radius,
          width: radius * 2,
          height: radius * 2
        };
      case "phenomenon":
        return {
          x: x - radius * 1.2,
          y: y - radius * 1.2,
          width: radius * 2.4,
          height: radius * 2.4
        };
      default:
        return {
          x: x - radius,
          y: y - radius,
          width: radius * 2,
          height: radius * 2
        };
    }
  }
  function resolveObjectPalette(sceneObject, theme) {
    const kind = String(sceneObject.object.properties.kind ?? "").toLowerCase().replace(/_/g, "-");
    const base = basePaletteForType(sceneObject.object.type, kind, theme);
    const customFill = sceneObject.fillColor && isColorLike(sceneObject.fillColor) ? sceneObject.fillColor : base.fill;
    const albedo = numericValue(sceneObject.object.properties.albedo);
    const temperature = numericValue(sceneObject.object.properties.temperature);
    const fill = applyTemperatureAndAlbedo(customFill, temperature, albedo, sceneObject.object.type);
    const stroke = mixColors(fill, "#ffffff", 0.4) ?? base.stroke;
    const atmosphere = atmosphereColor(sceneObject.object.properties.atmosphere);
    const glow = sceneObject.object.type === "star" ? rgbaString(mixColors(fill, "#fff2cb", 0.4) ?? fill, 0.82) : void 0;
    return {
      fill,
      stroke,
      glow,
      atmosphere,
      tail: sceneObject.object.type === "comet" ? rgbaString(mixColors(fill, "#ffffff", 0.5) ?? fill, 0.72) : void 0
    };
  }
  function basePaletteForType(type, kind, theme) {
    switch (type) {
      case "star":
        return {
          fill: theme.starCore,
          stroke: theme.starStroke
        };
      case "planet":
        return { fill: "#72b7ff", stroke: "#d8efff" };
      case "moon":
        return { fill: "#c7d7ea", stroke: "#f2f8ff" };
      case "belt":
        return { fill: "#d9aa74", stroke: "#f7d5aa" };
      case "asteroid":
        return { fill: "#a7a5b8", stroke: "#ebe5ff" };
      case "comet":
        return { fill: "#9ce7ff", stroke: "#e7fbff" };
      case "ring":
        return { fill: "#e59f7d", stroke: "#fff0d3" };
      case "structure":
        return { fill: theme.accentStrong, stroke: "#fff2ea" };
      case "phenomenon":
        return kindPhenomenonPalette(kind);
    }
  }
  function kindPhenomenonPalette(kind) {
    if (kind === "galaxy") {
      return { fill: "rgba(165,125,255,0.55)", stroke: "rgba(210,185,255,0.75)", halo: "rgba(160,120,255,0.10)", core: "#ede0ff" };
    }
    if (kind === "dwarf-galaxy") {
      return { fill: "rgba(190,165,255,0.45)", stroke: "rgba(220,205,255,0.75)", core: "#ddd0ff" };
    }
    if (kind === "black-hole") {
      return { fill: "#040408", stroke: "#ff6a00", accentRing: "rgba(255,140,20,0.72)" };
    }
    if (kind === "nebula") {
      return { fill: "rgba(105,205,255,0.45)", stroke: "rgba(180,235,255,0.72)", halo: "rgba(100,200,255,0.08)" };
    }
    if (kind === "void") {
      return { fill: "#05080f", stroke: "rgba(130,160,255,0.4)" };
    }
    return { fill: "#78ffd7", stroke: "#e9fff7" };
  }
  function applyTemperatureAndAlbedo(baseColor, temperature, albedo, type) {
    let nextColor = baseColor;
    if (temperature !== null) {
      const tint = temperatureTint(temperature, type);
      nextColor = mixColors(nextColor, tint, type === "star" ? 0.42 : 0.2) ?? nextColor;
    }
    if (albedo !== null) {
      const clamped = Math.min(Math.max(albedo, 0), 1);
      nextColor = mixColors(nextColor, clamped >= 0.5 ? "#ffffff" : "#0f1520", Math.abs(clamped - 0.5) * 0.7) ?? nextColor;
    }
    return nextColor;
  }
  function temperatureTint(value, type) {
    if (type === "star") {
      if (value >= 8e3)
        return "#d7ebff";
      if (value >= 6e3)
        return "#fff3d8";
      if (value >= 4e3)
        return "#ffd39a";
      return "#ff9d76";
    }
    if (value <= 180)
      return "#8fd8ff";
    if (value >= 600)
      return "#ffb56e";
    return "#fff1c4";
  }
  function atmosphereColor(value) {
    if (typeof value !== "string" || !value.trim()) {
      return void 0;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized.includes("methane"))
      return "rgba(134, 236, 255, 0.75)";
    if (normalized.includes("nitrogen") || normalized.includes("oxygen") || normalized.includes("air")) {
      return "rgba(122, 194, 255, 0.75)";
    }
    if (normalized.includes("carbon") || normalized.includes("co2")) {
      return "rgba(255, 198, 138, 0.75)";
    }
    if (normalized.includes("sulfur")) {
      return "rgba(255, 233, 138, 0.75)";
    }
    return "rgba(180, 222, 255, 0.68)";
  }
  function resolveRenderPreset(preset) {
    switch (preset) {
      case "presentation":
        return {
          layers: {
            background: true,
            guides: true,
            orbits: true,
            objects: true,
            labels: true,
            structures: true,
            metadata: true
          }
        };
      case "atlas-card":
        return {
          layers: {
            background: true,
            guides: false,
            orbits: true,
            objects: true,
            labels: true,
            structures: true,
            metadata: true
          }
        };
      case "markdown":
        return {
          layers: {
            background: true,
            guides: false,
            orbits: true,
            objects: true,
            labels: true,
            structures: true,
            metadata: false
          }
        };
      case "diagram":
      default:
        return {
          layers: {
            background: true,
            guides: true,
            orbits: true,
            objects: true,
            labels: true,
            structures: true,
            metadata: true
          }
        };
    }
  }
  function numericValue(value) {
    if (typeof value === "number") {
      return value;
    }
    if (value && typeof value === "object" && "value" in value) {
      return value.value;
    }
    return null;
  }
  function getObjectClipPathId(sceneObject) {
    return `${sceneObject.renderId}-clip`;
  }
  function diamondPoints(x, y, radius) {
    return `${x},${y - radius} ${x + radius},${y} ${x},${y + radius} ${x - radius},${y}`;
  }
  function phenomenonPoints(x, y, radius) {
    return `${x},${y - radius * 1.2} ${x + radius * 0.9},${y - radius * 0.3} ${x + radius * 1.2},${y + radius * 0.8} ${x},${y + radius * 1.2} ${x - radius * 1.1},${y + radius * 0.3} ${x - radius * 0.8},${y - radius * 0.8}`;
  }
  function renderBackdrop(width, height) {
    const verticalLines = Array.from({ length: 10 }, (_, index) => {
      const x = 90 + index * ((width - 180) / 9);
      return `<line class="wo-grid" x1="${x}" y1="120" x2="${x}" y2="${height - 70}" />`;
    }).join("");
    const horizontalLines = Array.from({ length: 6 }, (_, index) => {
      const y = 150 + index * ((height - 240) / 5);
      return `<line class="wo-grid" x1="56" y1="${y}" x2="${width - 56}" y2="${y}" />`;
    }).join("");
    return `${verticalLines}${horizontalLines}`;
  }
  function renderMetadata(scene) {
    return [
      `${scene.layoutPreset} layout`,
      `${scene.viewMode} view`,
      `${scene.renderPreset ?? "custom"} preset`,
      `schema ${scene.metadata.version ?? "1.0"}`
    ].join(" - ");
  }
  function isStructureLike(object) {
    return object.type === "structure" || object.type === "phenomenon";
  }
  function mixColors(left, right, amount) {
    const leftRgb = parseColor(left);
    const rightRgb = parseColor(right);
    if (!leftRgb || !rightRgb) {
      return void 0;
    }
    const clamped = Math.min(Math.max(amount, 0), 1);
    return rgbToHex({
      r: Math.round(leftRgb.r + (rightRgb.r - leftRgb.r) * clamped),
      g: Math.round(leftRgb.g + (rightRgb.g - leftRgb.g) * clamped),
      b: Math.round(leftRgb.b + (rightRgb.b - leftRgb.b) * clamped)
    });
  }
  function rgbaString(color, alpha) {
    const rgb = parseColor(color);
    if (!rgb) {
      return color;
    }
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }
  function parseColor(value) {
    const hex = value.trim();
    if (/^#[0-9a-f]{6}$/i.test(hex)) {
      return {
        r: Number.parseInt(hex.slice(1, 3), 16),
        g: Number.parseInt(hex.slice(3, 5), 16),
        b: Number.parseInt(hex.slice(5, 7), 16)
      };
    }
    if (/^#[0-9a-f]{3}$/i.test(hex)) {
      return {
        r: Number.parseInt(hex[1] + hex[1], 16),
        g: Number.parseInt(hex[2] + hex[2], 16),
        b: Number.parseInt(hex[3] + hex[3], 16)
      };
    }
    return null;
  }
  function rgbToHex(color) {
    const part = (value) => value.toString(16).padStart(2, "0");
    return `#${part(color.r)}${part(color.g)}${part(color.b)}`;
  }
  function isColorLike(value) {
    return Boolean(value.trim());
  }
  function escapeXml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
  }
  function escapeAttribute(value) {
    return escapeXml(value);
  }

  // packages/viewer/dist/minimap.js
  var MINIMAP_WIDTH = 180;
  var MINIMAP_HEIGHT = 120;
  var MINIMAP_PADDING = 10;
  function renderViewerMinimap(scene, state, visibleObjects) {
    const bounds = scene.contentBounds.width > 0 && scene.contentBounds.height > 0 ? scene.contentBounds : {
      minX: 0,
      minY: 0,
      maxX: scene.width,
      maxY: scene.height,
      width: scene.width,
      height: scene.height,
      centerX: scene.width / 2,
      centerY: scene.height / 2
    };
    const scale = Math.min((MINIMAP_WIDTH - MINIMAP_PADDING * 2) / Math.max(bounds.width, 1), (MINIMAP_HEIGHT - MINIMAP_PADDING * 2) / Math.max(bounds.height, 1));
    const translateX = (MINIMAP_WIDTH - bounds.width * scale) / 2 - bounds.minX * scale;
    const translateY = (MINIMAP_HEIGHT - bounds.height * scale) / 2 - bounds.minY * scale;
    const viewport = getViewerVisibleBounds(scene, state);
    const objectsMarkup = visibleObjects.map((object) => {
      const x = object.x * scale + translateX;
      const y = object.y * scale + translateY;
      const radius = Math.max(1.4, Math.min(object.visualRadius * scale, 5.2));
      const fill = object.fillColor ?? minimapColorForObject(object.object.type);
      return `<circle cx="${formatNumber2(x)}" cy="${formatNumber2(y)}" r="${formatNumber2(radius)}" fill="${fill}" fill-opacity="0.92" />`;
    }).join("");
    return `<div data-worldorbit-minimap="true" style="position:absolute;right:16px;bottom:16px;width:${MINIMAP_WIDTH}px;height:${MINIMAP_HEIGHT}px;padding:8px;border-radius:16px;background:rgba(5, 14, 22, 0.78);border:1px solid rgba(179, 216, 255, 0.16);box-shadow:0 14px 28px rgba(0, 0, 0, 0.24);backdrop-filter:blur(8px);pointer-events:none;">
  <svg width="${MINIMAP_WIDTH}" height="${MINIMAP_HEIGHT}" viewBox="0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}" role="presentation" aria-hidden="true">
    <rect x="0.5" y="0.5" width="${MINIMAP_WIDTH - 1}" height="${MINIMAP_HEIGHT - 1}" rx="12" ry="12" fill="rgba(7, 17, 27, 0.85)" stroke="rgba(179, 216, 255, 0.18)" />
    <rect x="${formatNumber2(bounds.minX * scale + translateX)}" y="${formatNumber2(bounds.minY * scale + translateY)}" width="${formatNumber2(bounds.width * scale)}" height="${formatNumber2(bounds.height * scale)}" rx="10" ry="10" fill="rgba(163, 209, 255, 0.04)" stroke="rgba(163, 209, 255, 0.16)" />
    ${objectsMarkup}
    <rect x="${formatNumber2(viewport.minX * scale + translateX)}" y="${formatNumber2(viewport.minY * scale + translateY)}" width="${formatNumber2(viewport.width * scale)}" height="${formatNumber2(viewport.height * scale)}" rx="8" ry="8" fill="rgba(255, 180, 100, 0.09)" stroke="rgba(255, 180, 100, 0.88)" stroke-width="1.4" />
  </svg>
</div>`;
  }
  function minimapColorForObject(type) {
    switch (type) {
      case "star":
        return "#ffcc67";
      case "planet":
        return "#72b7ff";
      case "moon":
        return "#c7d7ea";
      case "belt":
      case "ring":
        return "#d9aa74";
      case "asteroid":
        return "#a7a5b8";
      case "comet":
        return "#9ce7ff";
      case "structure":
        return "#ff7f5f";
      case "phenomenon":
        return "#78ffd7";
    }
  }
  function formatNumber2(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  // packages/viewer/dist/tooltip.js
  var FIELD_ORDER = [
    "radius",
    "temperature",
    "atmosphere",
    "period",
    "semiMajor",
    "distance",
    "eccentricity",
    "angle",
    "inclination",
    "phase",
    "albedo",
    "mass",
    "density",
    "gravity"
  ];
  function buildViewerTooltipDetails(details) {
    return {
      objectId: details.objectId,
      title: details.objectId,
      typeLabel: humanizeType(details.object.type),
      imageHref: details.renderObject.imageHref ?? null,
      description: readTooltipDescription(details),
      tags: normalizeTags(details.object.properties.tags),
      fields: buildTooltipFields(details),
      parentLabel: details.parent?.objectId ?? null,
      orbitLabel: details.orbit?.parentId ?? null,
      details
    };
  }
  function renderDefaultTooltipContent(details, mode) {
    const tagMarkup = details.tags.length ? `<div class="wo-tooltip-tags">${details.tags.map((tag) => `<span class="wo-tooltip-tag">${escapeHtml(tag)}</span>`).join("")}</div>` : "";
    const fieldMarkup = details.fields.length ? `<dl class="wo-tooltip-fields">${details.fields.map((field) => `<div class="wo-tooltip-field"><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(field.value)}</dd></div>`).join("")}</dl>` : "";
    const relationBits = [
      details.parentLabel ? `Parent: ${details.parentLabel}` : null,
      details.orbitLabel ? `Orbit: ${details.orbitLabel}` : null,
      mode === "pinned" ? "Pinned tooltip" : "Hover tooltip"
    ].filter(Boolean);
    return `<article class="wo-tooltip-card" data-tooltip-object-id="${escapeHtml(details.objectId)}">
    <div class="wo-tooltip-head">
      ${details.imageHref ? `<img class="wo-tooltip-image" src="${escapeAttribute2(details.imageHref)}" alt="" />` : `<div class="wo-tooltip-image wo-tooltip-image-placeholder">${escapeHtml(details.typeLabel.slice(0, 1))}</div>`}
      <div class="wo-tooltip-heading">
        <strong>${escapeHtml(details.title)}</strong>
        <span>${escapeHtml(details.typeLabel)}</span>
      </div>
    </div>
    ${details.description ? `<p class="wo-tooltip-description">${escapeHtml(details.description)}</p>` : ""}
    ${tagMarkup}
    ${fieldMarkup}
    ${relationBits.length ? `<p class="wo-tooltip-relations">${escapeHtml(relationBits.join(" - "))}</p>` : ""}
  </article>`;
  }
  function buildTooltipFields(details) {
    const fields = /* @__PURE__ */ new Map();
    for (const key of FIELD_ORDER) {
      const value = details.object.properties[key];
      if (value === void 0) {
        continue;
      }
      fields.set(key, {
        key,
        label: humanizeField(key),
        value: formatTooltipValue(value)
      });
    }
    const placement = details.object.placement;
    if (placement?.mode === "at") {
      fields.set("placement", {
        key: "placement",
        label: "Placement",
        value: `At ${placement.target}`
      });
    } else if (placement?.mode === "surface") {
      fields.set("placement", {
        key: "placement",
        label: "Placement",
        value: `Surface ${placement.target}`
      });
    } else if (placement?.mode === "free") {
      fields.set("placement", {
        key: "placement",
        label: "Placement",
        value: placement.distance ? `Free ${formatTooltipValue(placement.distance)}` : `Free ${placement.descriptor ?? "custom"}`
      });
    }
    return [...fields.values()];
  }
  function normalizeTags(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((entry) => typeof entry === "string");
  }
  function readTooltipDescription(details) {
    const direct = details.object.info.description?.trim();
    if (direct) {
      return direct;
    }
    const summary = details.group?.label?.trim();
    return summary && summary !== details.objectId ? summary : null;
  }
  function formatTooltipValue(value) {
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return formatUnitValue2(value);
  }
  function formatUnitValue2(value) {
    return `${value.value}${value.unit ?? ""}`;
  }
  function humanizeType(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  function humanizeField(value) {
    return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ").replace(/^./, (match) => match.toUpperCase());
  }
  function escapeHtml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  function escapeAttribute2(value) {
    return escapeHtml(value);
  }

  // packages/viewer/dist/viewer.js
  var DEFAULT_VIEWER_LIMITS = {
    minScale: 0.2,
    maxScale: 8,
    fitPadding: 48,
    panStep: 40,
    zoomStep: 1.2,
    rotationStep: 15
  };
  var TOOLTIP_STYLE_ID = "worldorbit-viewer-tooltip-style";
  function createInteractiveViewer(container, options) {
    ensureBrowserEnvironment(container);
    const inputCount = Number(Boolean(options.source)) + Number(Boolean(options.document)) + Number(Boolean(options.scene));
    if (inputCount !== 1) {
      throw new Error('Interactive viewer requires exactly one of "source", "document", or "scene".');
    }
    const constraints = {
      minScale: options.minScale ?? DEFAULT_VIEWER_LIMITS.minScale,
      maxScale: options.maxScale ?? DEFAULT_VIEWER_LIMITS.maxScale,
      fitPadding: options.fitPadding ?? DEFAULT_VIEWER_LIMITS.fitPadding
    };
    const behavior = {
      keyboard: options.keyboard ?? true,
      pointer: options.pointer ?? true,
      touch: options.touch ?? true,
      selection: options.selection ?? true,
      tooltipMode: options.tooltipMode ?? "hover",
      minimap: options.minimap ?? false,
      panStep: options.panStep ?? DEFAULT_VIEWER_LIMITS.panStep,
      zoomStep: options.zoomStep ?? DEFAULT_VIEWER_LIMITS.zoomStep,
      rotationStep: options.rotationStep ?? DEFAULT_VIEWER_LIMITS.rotationStep
    };
    let renderOptions = {
      width: options.width,
      height: options.height,
      padding: options.padding,
      preset: options.preset,
      projection: options.projection,
      scaleModel: options.scaleModel ? { ...options.scaleModel } : void 0,
      theme: options.theme,
      layers: options.layers,
      filter: normalizeViewerFilter(options.initialFilter),
      subtitle: options.subtitle
    };
    const previousTabIndex = container.getAttribute("tabindex");
    const previousTouchAction = container.style.touchAction;
    const previousPosition = container.style.position;
    let currentInput = resolveInitialInput(options);
    let scene = renderSceneFromInput(currentInput, renderOptions);
    let state = { ...DEFAULT_VIEWER_STATE };
    let svgElement = null;
    let cameraRoot = null;
    let minimapRoot = null;
    let tooltipRoot = null;
    let suppressClick = false;
    let activePointerId = null;
    let lastPointerPoint = null;
    let dragDistance = 0;
    let destroyed = false;
    let touchPoints = /* @__PURE__ */ new Map();
    let touchGesture = null;
    let hoveredObjectId = null;
    let pinnedTooltipObjectId = null;
    let activeTooltipObjectId = null;
    let activeTooltipDetails = null;
    let activeViewpointId = null;
    if (previousTabIndex === null) {
      container.tabIndex = 0;
    }
    installViewerTooltipStyles();
    container.classList.add("wo-viewer-container");
    container.style.touchAction = behavior.touch ? "none" : previousTouchAction;
    if (!container.style.position) {
      container.style.position = "relative";
    }
    const handleWheel = (event) => {
      if (!behavior.pointer || destroyed) {
        return;
      }
      event.preventDefault();
      container.focus();
      const anchor = getWorldPointFromClient(event.clientX, event.clientY);
      const factor = clampValue(Math.exp(-event.deltaY * 2e-3), 0.6, 1.6);
      updateState(zoomViewerStateAt(scene, state, factor, anchor, constraints));
    };
    const handlePointerDown = (event) => {
      if (destroyed) {
        return;
      }
      const isTouch = event.pointerType === "touch";
      if (isTouch && !behavior.touch || !isTouch && !behavior.pointer) {
        return;
      }
      if (!isTouch && event.button !== 0) {
        return;
      }
      container.focus();
      container.setPointerCapture?.(event.pointerId);
      const point = getViewportPointFromClient(event.clientX, event.clientY);
      if (isTouch) {
        touchPoints.set(event.pointerId, point);
        if (touchPoints.size === 2) {
          touchGesture = createTouchGestureState(scene, state, touchPoints);
        }
        return;
      }
      activePointerId = event.pointerId;
      lastPointerPoint = point;
      dragDistance = 0;
      suppressClick = false;
    };
    const handlePointerMove = (event) => {
      if (destroyed) {
        return;
      }
      const isTouch = event.pointerType === "touch";
      if (isTouch) {
        if (!behavior.touch || !touchPoints.has(event.pointerId)) {
          return;
        }
        touchPoints.set(event.pointerId, getViewportPointFromClient(event.clientX, event.clientY));
        if (touchPoints.size === 2) {
          if (!touchGesture) {
            touchGesture = createTouchGestureState(scene, state, touchPoints);
          }
          const current = getTouchCenterAndDistance(touchPoints);
          const factor = current.distance / Math.max(touchGesture.startDistance, 1);
          const zoomedState = zoomViewerStateAt(scene, touchGesture.startState, factor, touchGesture.startCenter, constraints);
          const deltaX2 = current.center.x - touchGesture.startViewportCenter.x;
          const deltaY2 = current.center.y - touchGesture.startViewportCenter.y;
          updateState(panViewerState(zoomedState, deltaX2, deltaY2));
        }
        return;
      }
      if (!behavior.pointer || activePointerId !== event.pointerId || !lastPointerPoint) {
        return;
      }
      const nextPoint = getViewportPointFromClient(event.clientX, event.clientY);
      const deltaX = nextPoint.x - lastPointerPoint.x;
      const deltaY = nextPoint.y - lastPointerPoint.y;
      dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
      lastPointerPoint = nextPoint;
      if (dragDistance > 2) {
        suppressClick = true;
      }
      updateState(panViewerState(state, deltaX, deltaY));
    };
    const handlePointerEnd = (event) => {
      if (event.pointerType === "touch") {
        touchPoints.delete(event.pointerId);
        if (touchPoints.size < 2) {
          touchGesture = null;
        }
        return;
      }
      if (activePointerId === event.pointerId) {
        activePointerId = null;
        lastPointerPoint = null;
      }
    };
    const handleClick = (event) => {
      if (!behavior.selection || destroyed) {
        return;
      }
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      const objectId = getClosestObjectId(event.target);
      applySelection(objectId);
      if (behavior.tooltipMode === "pinned") {
        pinnedTooltipObjectId = objectId;
        updateTooltip();
      }
    };
    const handleMouseOver = (event) => {
      const objectId = getClosestObjectId(event.target);
      applyHover(objectId);
    };
    const handleMouseLeave = () => {
      applyHover(null);
    };
    const handleFocusIn = (event) => {
      const objectId = getClosestObjectId(event.target);
      if (!objectId) {
        return;
      }
      applyHover(objectId);
    };
    const handleFocusOut = () => {
      applyHover(null);
    };
    const handleKeyDown = (event) => {
      if (!behavior.keyboard || destroyed) {
        return;
      }
      const objectId = getClosestObjectId(event.target);
      if ((event.key === "Enter" || event.key === " ") && objectId) {
        event.preventDefault();
        applySelection(objectId);
        if (behavior.tooltipMode === "pinned") {
          pinnedTooltipObjectId = objectId;
          updateTooltip();
        }
        return;
      }
      switch (event.key) {
        case "Escape":
          if (behavior.tooltipMode === "pinned" && pinnedTooltipObjectId) {
            event.preventDefault();
            pinnedTooltipObjectId = null;
            updateTooltip();
          }
          return;
        case "+":
        case "=":
          event.preventDefault();
          api.zoomBy(behavior.zoomStep);
          return;
        case "-":
          event.preventDefault();
          api.zoomBy(1 / behavior.zoomStep);
          return;
        case "ArrowLeft":
          event.preventDefault();
          api.panBy(-behavior.panStep, 0);
          return;
        case "ArrowRight":
          event.preventDefault();
          api.panBy(behavior.panStep, 0);
          return;
        case "ArrowUp":
          event.preventDefault();
          api.panBy(0, -behavior.panStep);
          return;
        case "ArrowDown":
          event.preventDefault();
          api.panBy(0, behavior.panStep);
          return;
        case "[":
          event.preventDefault();
          api.rotateBy(-behavior.rotationStep);
          return;
        case "]":
          event.preventDefault();
          api.rotateBy(behavior.rotationStep);
          return;
        case "f":
        case "F":
          event.preventDefault();
          api.fitToSystem();
          return;
        case "0":
          event.preventDefault();
          api.resetView();
          return;
      }
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerEnd);
    container.addEventListener("pointercancel", handlePointerEnd);
    container.addEventListener("click", handleClick);
    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("focusin", handleFocusIn);
    container.addEventListener("focusout", handleFocusOut);
    container.addEventListener("keydown", handleKeyDown);
    const api = {
      setSource(source) {
        currentInput = { kind: "source", value: source };
        scene = renderSceneFromInput(currentInput, renderOptions);
        activeViewpointId = null;
        rerenderScene(true);
      },
      setDocument(document2) {
        currentInput = { kind: "document", value: document2 };
        scene = renderSceneFromInput(currentInput, renderOptions);
        activeViewpointId = null;
        rerenderScene(true);
      },
      setScene(nextScene) {
        currentInput = { kind: "scene", value: nextScene };
        scene = nextScene;
        activeViewpointId = null;
        rerenderScene(true);
      },
      getScene() {
        return scene;
      },
      getRenderOptions() {
        return cloneRenderOptions(renderOptions);
      },
      listViewpoints() {
        return scene.viewpoints.slice();
      },
      getActiveViewpoint() {
        return getViewpointById(activeViewpointId);
      },
      goToViewpoint(id) {
        const viewpoint = getViewpointById(id);
        if (!viewpoint) {
          return false;
        }
        const nextRenderOptions = {};
        const viewpointLayers = sceneViewpointToLayerOptions(viewpoint);
        if (viewpoint.preset !== null) {
          nextRenderOptions.preset = viewpoint.preset;
        }
        if (currentInput.kind !== "scene" && viewpoint.projection !== scene.projection) {
          nextRenderOptions.projection = viewpoint.projection;
        }
        if (viewpointLayers) {
          nextRenderOptions.layers = viewpointLayers;
        }
        activeViewpointId = viewpoint.id;
        if (Object.keys(nextRenderOptions).length > 0) {
          const sceneAffecting = hasSceneAffectingRenderOptions(nextRenderOptions);
          renderOptions = mergeRenderOptions(renderOptions, nextRenderOptions);
          if (currentInput.kind !== "scene" && sceneAffecting) {
            scene = renderSceneFromInput(currentInput, renderOptions);
          }
          rerenderScene(sceneAffecting);
        }
        setFilterInternal(viewpointToViewerFilter(viewpoint), false, false);
        const nextState = createViewpointState(viewpoint);
        updateState(nextState);
        applySelection(viewpoint.selectedObjectId ?? viewpoint.objectId ?? null, false);
        options.onSelectionChange?.(getSelectedObject());
        options.onSelectionDetailsChange?.(buildObjectDetails(state.selectedObjectId));
        notifyViewpointChange();
        emitAtlasStateChange();
        return true;
      },
      search(query, limit = 12) {
        return searchSceneObjects(scene, query, limit);
      },
      getFilter() {
        return renderOptions.filter ? { ...renderOptions.filter } : null;
      },
      setFilter(filter) {
        setFilterInternal(filter, true, true);
      },
      getVisibleObjects() {
        return getVisibleSceneObjects();
      },
      getFocusPath(id) {
        return buildFocusPath(id);
      },
      getObjectDetails(id) {
        return buildObjectDetails(id);
      },
      getSelectionDetails() {
        return buildObjectDetails(state.selectedObjectId);
      },
      getTooltipDetails() {
        return activeTooltipDetails;
      },
      getAtlasState() {
        return createAtlasStateSnapshot(state, renderOptions, renderOptions.filter ?? null, activeViewpointId);
      },
      setAtlasState(nextAtlasState) {
        const atlasState = typeof nextAtlasState === "string" ? deserializeViewerAtlasState(nextAtlasState) : nextAtlasState;
        if (atlasState.viewpointId) {
          api.goToViewpoint(atlasState.viewpointId);
        }
        api.setRenderOptions(atlasState.renderOptions);
        setFilterInternal(atlasState.filter ?? null, false, false);
        updateState(sanitizeState({ ...state, ...atlasState.viewerState }));
        applySelection(atlasState.viewerState.selectedObjectId ?? null, false);
        notifyViewpointChange();
        options.onSelectionChange?.(getSelectedObject());
        options.onSelectionDetailsChange?.(buildObjectDetails(state.selectedObjectId));
        emitAtlasStateChange();
      },
      serializeAtlasState() {
        return serializeViewerAtlasState(api.getAtlasState());
      },
      captureBookmark(name, label) {
        return createViewerBookmark(name, label, api.getAtlasState());
      },
      applyBookmark(bookmark) {
        if (typeof bookmark === "string") {
          api.setAtlasState(bookmark);
          return true;
        }
        api.setAtlasState(bookmark.atlasState);
        return true;
      },
      setRenderOptions(options2) {
        const sceneAffecting = hasSceneAffectingRenderOptions(options2);
        renderOptions = mergeRenderOptions(renderOptions, options2);
        if (currentInput.kind !== "scene" && sceneAffecting) {
          scene = renderSceneFromInput(currentInput, renderOptions);
        }
        rerenderScene(sceneAffecting);
      },
      getState() {
        return { ...state };
      },
      setState(nextState) {
        updateState(sanitizeState({ ...state, ...nextState }));
      },
      zoomBy(factor, anchor) {
        updateState(zoomViewerStateAt(scene, state, factor, anchor ?? { x: scene.width / 2, y: scene.height / 2 }, constraints));
      },
      panBy(dx, dy) {
        updateState(panViewerState(state, dx, dy));
      },
      rotateBy(deg) {
        updateState(rotateViewerState(state, deg));
      },
      fitToSystem() {
        updateState(fitViewerState(scene, state, constraints));
      },
      focusObject(id) {
        activeViewpointId = null;
        updateState(focusViewerState(scene, state, id, constraints));
        applySelection(id);
        if (behavior.tooltipMode === "pinned") {
          pinnedTooltipObjectId = getObjectById(id)?.objectId ?? null;
          updateTooltip();
        }
      },
      pinTooltip(id) {
        pinnedTooltipObjectId = getObjectById(id)?.objectId ?? null;
        updateTooltip();
      },
      resetView() {
        const resetState = fitViewerState(scene, { ...DEFAULT_VIEWER_STATE }, constraints);
        activeViewpointId = null;
        updateState(resetState);
        applySelection(null);
        pinnedTooltipObjectId = null;
        updateTooltip();
      },
      exportSvg() {
        return renderSceneToSvg(scene, {
          ...renderOptions,
          filter: renderOptions.filter ?? null,
          selectedObjectId: state.selectedObjectId
        });
      },
      destroy() {
        if (destroyed) {
          return;
        }
        destroyed = true;
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("pointerdown", handlePointerDown);
        container.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerup", handlePointerEnd);
        container.removeEventListener("pointercancel", handlePointerEnd);
        container.removeEventListener("click", handleClick);
        container.removeEventListener("mouseover", handleMouseOver);
        container.removeEventListener("mouseleave", handleMouseLeave);
        container.removeEventListener("focusin", handleFocusIn);
        container.removeEventListener("focusout", handleFocusOut);
        container.removeEventListener("keydown", handleKeyDown);
        tooltipRoot?.remove();
        tooltipRoot = null;
        minimapRoot?.remove();
        minimapRoot = null;
        container.classList.remove("wo-viewer-container");
        container.style.touchAction = previousTouchAction;
        container.style.position = previousPosition;
        if (previousTabIndex === null) {
          container.removeAttribute("tabindex");
        } else {
          container.setAttribute("tabindex", previousTabIndex);
        }
      }
    };
    rerenderScene(true);
    if (options.initialViewpointId) {
      api.goToViewpoint(options.initialViewpointId);
    } else if (options.initialSelectionObjectId) {
      api.focusObject(options.initialSelectionObjectId);
    } else {
      emitAtlasStateChange();
    }
    return api;
    function rerenderScene(resetView) {
      container.innerHTML = renderSceneToSvg(scene, {
        ...renderOptions,
        filter: renderOptions.filter ?? null,
        selectedObjectId: state.selectedObjectId
      });
      svgElement = container.querySelector('[data-worldorbit-svg="true"]');
      cameraRoot = container.querySelector("#worldorbit-camera-root");
      minimapRoot = null;
      tooltipRoot = null;
      if (behavior.minimap) {
        minimapRoot = document.createElement("div");
        minimapRoot.dataset.worldorbitMinimapRoot = "true";
        container.append(minimapRoot);
      }
      if (behavior.tooltipMode !== "disabled") {
        tooltipRoot = document.createElement("div");
        tooltipRoot.className = "wo-viewer-tooltip-root";
        tooltipRoot.dataset.worldorbitTooltip = "true";
        tooltipRoot.hidden = true;
        tooltipRoot.addEventListener("click", handleTooltipClick);
        container.append(tooltipRoot);
      }
      if (!svgElement || !cameraRoot) {
        throw new Error("Interactive viewer could not locate the rendered SVG camera root.");
      }
      state = resetView ? fitViewerState(scene, { ...DEFAULT_VIEWER_STATE }, constraints) : sanitizeState(state);
      applySelection(state.selectedObjectId && getObjectById(state.selectedObjectId) ? state.selectedObjectId : null, false);
      applyHover(hoveredObjectId && getObjectById(hoveredObjectId) ? hoveredObjectId : null, false);
      pinnedTooltipObjectId = pinnedTooltipObjectId && getObjectById(pinnedTooltipObjectId) ? pinnedTooltipObjectId : null;
      updateCameraTransform();
      notifyFilterChange();
      notifyViewpointChange();
      options.onViewChange?.({ ...state });
      emitAtlasStateChange();
    }
    function updateState(nextState) {
      state = sanitizeState(nextState);
      updateCameraTransform();
      options.onViewChange?.({ ...state });
      emitAtlasStateChange();
    }
    function sanitizeState(nextState) {
      return {
        scale: clampValue(nextState.scale, constraints.minScale, constraints.maxScale),
        rotationDeg: normalizeRotation2(nextState.rotationDeg),
        translateX: Number.isFinite(nextState.translateX) ? nextState.translateX : state.translateX,
        translateY: Number.isFinite(nextState.translateY) ? nextState.translateY : state.translateY,
        selectedObjectId: nextState.selectedObjectId && getObjectById(nextState.selectedObjectId) ? nextState.selectedObjectId : null
      };
    }
    function updateCameraTransform() {
      if (!cameraRoot) {
        return;
      }
      cameraRoot.setAttribute("transform", composeViewerTransform(scene, state));
      updateMinimap();
      updateTooltip();
    }
    function applySelection(objectId, emitCallback = true) {
      if (state.selectedObjectId) {
        container.querySelector(`[data-object-id="${cssEscape(state.selectedObjectId)}"]`)?.classList.remove("wo-object-selected");
      }
      state = {
        ...state,
        selectedObjectId: objectId && getObjectById(objectId) ? objectId : null
      };
      if (state.selectedObjectId) {
        container.querySelector(`[data-object-id="${cssEscape(state.selectedObjectId)}"]`)?.classList.add("wo-object-selected");
      }
      syncAtlasHighlights();
      updateTooltip();
      if (emitCallback) {
        options.onSelectionChange?.(getSelectedObject());
        options.onSelectionDetailsChange?.(buildObjectDetails(state.selectedObjectId));
        options.onViewChange?.({ ...state });
        emitAtlasStateChange();
      }
    }
    function applyHover(objectId, emitCallback = true) {
      if (hoveredObjectId === objectId && emitCallback) {
        return;
      }
      hoveredObjectId = objectId && getObjectById(objectId) ? objectId : null;
      syncAtlasHighlights();
      updateTooltip();
      if (emitCallback) {
        options.onHoverChange?.(getObjectById(hoveredObjectId));
        options.onHoverDetailsChange?.(buildObjectDetails(hoveredObjectId));
      }
    }
    function getSelectedObject() {
      return getObjectById(state.selectedObjectId);
    }
    function getObjectById(objectId) {
      if (!objectId) {
        return null;
      }
      const visibleObjectIds = getVisibleObjectIds();
      return scene.objects.find((object) => object.objectId === objectId && !object.hidden && visibleObjectIds.has(object.objectId)) ?? null;
    }
    function buildObjectDetails(objectId) {
      const renderObject = getObjectById(objectId);
      if (!renderObject) {
        return null;
      }
      return {
        objectId: renderObject.objectId,
        object: renderObject.object,
        renderObject,
        label: scene.labels.find((label) => label.objectId === renderObject.objectId && !label.hidden) ?? null,
        group: scene.groups.find((group) => group.renderId === renderObject.groupId) ?? null,
        orbit: scene.orbitVisuals.find((orbit) => orbit.objectId === renderObject.objectId && !orbit.hidden) ?? null,
        relatedOrbits: scene.orbitVisuals.filter((orbit) => !orbit.hidden && (orbit.objectId === renderObject.objectId || renderObject.ancestorIds.includes(orbit.objectId) || renderObject.childIds.includes(orbit.objectId))),
        parent: getObjectById(renderObject.parentId),
        children: renderObject.childIds.map((childId) => getObjectById(childId)).filter(Boolean),
        ancestors: renderObject.ancestorIds.map((ancestorId) => getObjectById(ancestorId)).filter(Boolean),
        focusPath: buildFocusPath(renderObject.objectId)
      };
    }
    function syncAtlasHighlights() {
      for (const element of container.querySelectorAll(".wo-chain-selected, .wo-chain-hover, .wo-ancestor-selected, .wo-ancestor-hover, .wo-orbit-related-selected, .wo-orbit-related-hover")) {
        element.classList.remove("wo-chain-selected", "wo-chain-hover", "wo-ancestor-selected", "wo-ancestor-hover", "wo-orbit-related-selected", "wo-orbit-related-hover");
      }
      applyChainClasses(state.selectedObjectId, {
        objectClass: "wo-chain-selected",
        ancestorClass: "wo-ancestor-selected",
        orbitClass: "wo-orbit-related-selected"
      });
      applyChainClasses(hoveredObjectId, {
        objectClass: "wo-chain-hover",
        ancestorClass: "wo-ancestor-hover",
        orbitClass: "wo-orbit-related-hover"
      });
    }
    function applyChainClasses(objectId, classes) {
      const details = buildObjectDetails(objectId);
      if (!details) {
        return;
      }
      const chainIds = /* @__PURE__ */ new Set([
        details.objectId,
        ...details.renderObject.childIds,
        ...details.renderObject.ancestorIds
      ]);
      for (const id of chainIds) {
        for (const element of container.querySelectorAll(`[data-object-id="${cssEscape(id)}"]`)) {
          element.classList.add(classes.objectClass);
        }
      }
      for (const ancestor of details.ancestors) {
        for (const element of container.querySelectorAll(`[data-object-id="${cssEscape(ancestor.objectId)}"]`)) {
          element.classList.add(classes.ancestorClass);
        }
      }
      for (const orbit of details.relatedOrbits) {
        for (const element of container.querySelectorAll(`[data-orbit-object-id="${cssEscape(orbit.objectId)}"]`)) {
          element.classList.add(classes.orbitClass);
        }
      }
    }
    function getViewportPointFromClient(clientX, clientY) {
      if (!svgElement) {
        return {
          x: scene.width / 2,
          y: scene.height / 2
        };
      }
      const rect = svgElement.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return {
          x: scene.width / 2,
          y: scene.height / 2
        };
      }
      return {
        x: (clientX - rect.left) / rect.width * scene.width,
        y: (clientY - rect.top) / rect.height * scene.height
      };
    }
    function getWorldPointFromClient(clientX, clientY) {
      return invertViewerPoint(scene, state, getViewportPointFromClient(clientX, clientY));
    }
    function getVisibleObjectIds() {
      return computeVisibleObjectIds(scene, renderOptions.filter ?? null);
    }
    function getVisibleSceneObjects() {
      const visibleObjectIds = getVisibleObjectIds();
      return scene.objects.filter((object) => !object.hidden && visibleObjectIds.has(object.objectId));
    }
    function buildFocusPath(objectId) {
      const object = scene.objects.find((entry) => entry.objectId === objectId && !entry.hidden);
      if (!object) {
        return [];
      }
      return [...object.ancestorIds, object.objectId].map((entryId) => getObjectById(entryId)).filter(Boolean);
    }
    function getViewpointById(id) {
      return scene.viewpoints.find((viewpoint) => viewpoint.id === id) ?? null;
    }
    function createViewpointState(viewpoint) {
      const rotationDeg = normalizeRotation2(viewpoint.rotationDeg);
      const scale = viewpoint.scale !== null && viewpoint.scale !== void 0 ? clampValue(viewpoint.scale, constraints.minScale, constraints.maxScale) : null;
      const targetObject = viewpoint.objectId && scene.objects.find((object) => object.objectId === viewpoint.objectId && !object.hidden);
      if (targetObject) {
        return createCenteredState({ x: targetObject.x, y: targetObject.y }, scale ?? Math.max(1.8, DEFAULT_VIEWER_STATE.scale), rotationDeg, viewpoint.selectedObjectId ?? targetObject.objectId);
      }
      const baseState = fitViewerState(scene, { ...DEFAULT_VIEWER_STATE, rotationDeg }, constraints);
      if (scale === null) {
        return {
          ...baseState,
          rotationDeg,
          selectedObjectId: viewpoint.selectedObjectId ?? null
        };
      }
      return createCenteredState({
        x: scene.contentBounds.centerX,
        y: scene.contentBounds.centerY
      }, scale, rotationDeg, viewpoint.selectedObjectId ?? null);
    }
    function createCenteredState(target, scale, rotationDeg, selectedObjectId) {
      const center = {
        x: scene.width / 2,
        y: scene.height / 2
      };
      const rotatedTarget = rotatePoint(target, center, rotationDeg);
      return {
        scale,
        rotationDeg,
        translateX: center.x - (center.x + (rotatedTarget.x - center.x) * scale),
        translateY: center.y - (center.y + (rotatedTarget.y - center.y) * scale),
        selectedObjectId
      };
    }
    function setFilterInternal(filter, emitCallbacks, clearActiveViewpoint) {
      renderOptions = {
        ...renderOptions,
        filter: normalizeViewerFilter(filter)
      };
      if (clearActiveViewpoint) {
        activeViewpointId = null;
      }
      rerenderScene(false);
      if (!emitCallbacks) {
        return;
      }
    }
    function notifyFilterChange() {
      options.onFilterChange?.(renderOptions.filter ?? null, getVisibleSceneObjects());
    }
    function notifyViewpointChange() {
      options.onViewpointChange?.(getViewpointById(activeViewpointId));
    }
    function emitAtlasStateChange() {
      options.onAtlasStateChange?.(api.getAtlasState());
    }
    function updateMinimap() {
      if (!behavior.minimap || !minimapRoot) {
        return;
      }
      minimapRoot.innerHTML = renderViewerMinimap(scene, state, getVisibleSceneObjects());
    }
    function updateTooltip() {
      if (behavior.tooltipMode === "disabled" || !tooltipRoot) {
        setTooltipDetails(null);
        return;
      }
      const resolved = resolveTooltipTarget();
      if (!resolved) {
        tooltipRoot.hidden = true;
        tooltipRoot.innerHTML = "";
        tooltipRoot.removeAttribute("data-mode");
        setTooltipDetails(null);
        return;
      }
      const details = buildObjectDetails(resolved.objectId);
      if (!details) {
        tooltipRoot.hidden = true;
        tooltipRoot.innerHTML = "";
        tooltipRoot.removeAttribute("data-mode");
        setTooltipDetails(null);
        return;
      }
      const tooltipDetails = buildViewerTooltipDetails(details);
      activeTooltipObjectId = resolved.objectId;
      tooltipRoot.hidden = false;
      tooltipRoot.dataset.mode = resolved.mode;
      tooltipRoot.classList.toggle("is-pinned", resolved.mode === "pinned");
      tooltipRoot.style.pointerEvents = "auto";
      tooltipRoot.style.visibility = "hidden";
      renderTooltipContent(tooltipRoot, tooltipDetails, resolved.mode);
      positionTooltip(tooltipRoot, details.renderObject);
      tooltipRoot.style.visibility = "visible";
      setTooltipDetails(tooltipDetails);
    }
    function resolveTooltipTarget() {
      if (pinnedTooltipObjectId && getObjectById(pinnedTooltipObjectId)) {
        return {
          objectId: pinnedTooltipObjectId,
          mode: "pinned"
        };
      }
      if (hoveredObjectId && getObjectById(hoveredObjectId)) {
        return {
          objectId: hoveredObjectId,
          mode: "hover"
        };
      }
      return null;
    }
    function renderTooltipContent(element, details, mode) {
      const customMarkup = options.tooltipRenderer?.(details, mode);
      element.innerHTML = "";
      if (typeof customMarkup === "string") {
        element.innerHTML = customMarkup;
      } else if (customMarkup instanceof HTMLElement) {
        element.append(customMarkup);
      } else {
        element.innerHTML = renderDefaultTooltipContent(details, mode);
      }
      const actions = document.createElement("div");
      actions.className = "wo-tooltip-actions";
      if (mode === "pinned") {
        const unpinButton = document.createElement("button");
        unpinButton.type = "button";
        unpinButton.className = "wo-tooltip-action";
        unpinButton.dataset.tooltipAction = "unpin";
        unpinButton.textContent = "Unpin";
        actions.append(unpinButton);
      } else {
        const pinButton = document.createElement("button");
        pinButton.type = "button";
        pinButton.className = "wo-tooltip-action";
        pinButton.dataset.tooltipAction = "pin";
        pinButton.dataset.objectId = details.objectId;
        pinButton.textContent = "Pin";
        actions.append(pinButton);
      }
      if (actions.childElementCount > 0) {
        element.append(actions);
      }
    }
    function positionTooltip(element, renderObject) {
      if (!svgElement) {
        return;
      }
      const anchor = {
        x: renderObject.anchorX ?? renderObject.x,
        y: renderObject.anchorY ?? renderObject.y - Math.max(renderObject.visualRadius, renderObject.radius)
      };
      const viewportPoint = projectWorldPoint(anchor);
      const svgRect = svgElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const pointX = svgRect.left - containerRect.left + viewportPoint.x / Math.max(scene.width, 1) * svgRect.width;
      const pointY = svgRect.top - containerRect.top + viewportPoint.y / Math.max(scene.height, 1) * svgRect.height;
      const maxLeft = Math.max(container.clientWidth - element.offsetWidth - 12, 12);
      const maxTop = Math.max(container.clientHeight - element.offsetHeight - 12, 12);
      const preferAbove = pointY > container.clientHeight * 0.48;
      const nextLeft = clampValue(pointX + 18, 12, maxLeft);
      const nextTop = clampValue(preferAbove ? pointY - element.offsetHeight - 18 : pointY + 18, 12, maxTop);
      element.style.left = `${nextLeft}px`;
      element.style.top = `${nextTop}px`;
    }
    function projectWorldPoint(point) {
      const center = {
        x: scene.width / 2,
        y: scene.height / 2
      };
      const rotated = rotatePoint(point, center, state.rotationDeg);
      return {
        x: center.x + (rotated.x - center.x) * state.scale + state.translateX,
        y: center.y + (rotated.y - center.y) * state.scale + state.translateY
      };
    }
    function handleTooltipClick(event) {
      const target = event.target?.closest("[data-tooltip-action]");
      if (!target) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      switch (target.dataset.tooltipAction) {
        case "pin":
          pinnedTooltipObjectId = target.dataset.objectId ?? activeTooltipObjectId;
          break;
        case "unpin":
          pinnedTooltipObjectId = null;
          break;
      }
      updateTooltip();
    }
    function setTooltipDetails(details) {
      const changed = activeTooltipDetails?.objectId !== details?.objectId || activeTooltipDetails?.description !== details?.description || activeTooltipDetails?.imageHref !== details?.imageHref;
      activeTooltipDetails = details;
      activeTooltipObjectId = details?.objectId ?? null;
      if (changed) {
        options.onTooltipChange?.(details);
      }
    }
  }
  function resolveInitialInput(options) {
    if (options.scene) {
      return { kind: "scene", value: options.scene };
    }
    if (options.document) {
      return { kind: "document", value: options.document };
    }
    if (options.source) {
      return { kind: "source", value: options.source };
    }
    throw new Error("Interactive viewer requires an initial render input.");
  }
  function renderSceneFromInput(input, renderOptions) {
    switch (input.kind) {
      case "scene":
        return input.value;
      case "document":
        return renderDocumentToScene(input.value, renderOptions);
      case "source": {
        const loaded = loadWorldOrbitSource(input.value);
        return renderDocumentToScene(loaded.document, resolveSourceRenderOptions2(loaded, renderOptions));
      }
    }
  }
  function cloneRenderOptions(renderOptions) {
    return {
      ...renderOptions,
      filter: renderOptions.filter ? { ...renderOptions.filter } : void 0,
      scaleModel: renderOptions.scaleModel ? { ...renderOptions.scaleModel } : void 0,
      layers: renderOptions.layers ? { ...renderOptions.layers } : void 0,
      theme: renderOptions.theme && typeof renderOptions.theme === "object" ? { ...renderOptions.theme } : renderOptions.theme
    };
  }
  function mergeRenderOptions(current, next) {
    return {
      ...current,
      ...next,
      filter: next.filter !== void 0 ? normalizeViewerFilter(next.filter) : current.filter ? { ...current.filter } : void 0,
      scaleModel: next.scaleModel ? {
        ...current.scaleModel ?? {},
        ...next.scaleModel
      } : current.scaleModel ? { ...current.scaleModel } : void 0,
      layers: next.layers ? {
        ...current.layers ?? {},
        ...next.layers
      } : current.layers ? { ...current.layers } : void 0,
      theme: next.theme && typeof next.theme === "object" ? { ...next.theme } : next.theme ?? current.theme
    };
  }
  function hasSceneAffectingRenderOptions(options) {
    return options.width !== void 0 || options.height !== void 0 || options.padding !== void 0 || options.preset !== void 0 || options.projection !== void 0 || options.scaleModel !== void 0;
  }
  function resolveSourceRenderOptions2(loaded, renderOptions) {
    const atlasDocument = loaded.atlasDocument ?? loaded.draftDocument;
    if (renderOptions.preset || !atlasDocument?.system?.defaults.preset) {
      return renderOptions;
    }
    return {
      ...renderOptions,
      preset: atlasDocument.system.defaults.preset
    };
  }
  function createTouchGestureState(scene, state, touchPoints) {
    const { center, distance } = getTouchCenterAndDistance(touchPoints);
    return {
      startState: { ...state },
      startCenter: invertViewerPoint(scene, state, center),
      startViewportCenter: center,
      startDistance: distance
    };
  }
  function getTouchCenterAndDistance(touchPoints) {
    const points = [...touchPoints.values()];
    if (points.length < 2) {
      return {
        center: points[0] ?? { x: 0, y: 0 },
        distance: 1
      };
    }
    const [first, second] = points;
    return {
      center: {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2
      },
      distance: Math.hypot(second.x - first.x, second.y - first.y)
    };
  }
  function getClosestObjectId(target) {
    if (!(target instanceof Element)) {
      return null;
    }
    return target.closest("[data-object-id]")?.dataset.objectId ?? null;
  }
  function ensureBrowserEnvironment(container) {
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error("createInteractiveViewer can only run in a browser environment.");
    }
    if (!(container instanceof HTMLElement)) {
      throw new Error("Interactive viewer requires an HTMLElement container.");
    }
  }
  function clampValue(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function normalizeRotation2(rotationDeg) {
    let normalized = rotationDeg % 360;
    if (normalized > 180) {
      normalized -= 360;
    }
    if (normalized <= -180) {
      normalized += 360;
    }
    return normalized;
  }
  function cssEscape(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return value.replace(/["\\]/g, "\\$&");
  }
  function installViewerTooltipStyles() {
    if (typeof document === "undefined" || document.getElementById(TOOLTIP_STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = TOOLTIP_STYLE_ID;
    style.textContent = `
    .wo-viewer-tooltip-root {
      position: absolute;
      z-index: 12;
      min-width: 220px;
      max-width: min(320px, calc(100% - 24px));
      padding: 14px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(7, 16, 25, 0.92);
      box-shadow: 0 18px 32px rgba(0,0,0,0.28);
      color: #edf6ff;
      backdrop-filter: blur(12px);
      font: 500 13px/1.5 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
    .wo-viewer-tooltip-root[data-mode="hover"] { pointer-events: auto; }
    .wo-viewer-tooltip-root[data-mode="pinned"] { pointer-events: auto; }
    .wo-tooltip-card { display: grid; gap: 10px; }
    .wo-tooltip-head { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 12px; align-items: center; }
    .wo-tooltip-heading { display: grid; gap: 3px; }
    .wo-tooltip-heading strong { font: 700 16px/1.2 "Segoe UI Variable Display", "Segoe UI", sans-serif; }
    .wo-tooltip-heading span, .wo-tooltip-relations { color: rgba(237, 246, 255, 0.7); }
    .wo-tooltip-image {
      width: 52px;
      height: 52px;
      object-fit: cover;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
    }
    .wo-tooltip-image-placeholder {
      display: grid;
      place-items: center;
      font: 700 18px/1 "Segoe UI Variable Display", "Segoe UI", sans-serif;
      color: #ffce8a;
    }
    .wo-tooltip-description { margin: 0; }
    .wo-tooltip-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .wo-tooltip-tag {
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      color: #ffdda9;
      font: 600 11px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .wo-tooltip-fields { display: grid; gap: 6px; margin: 0; }
    .wo-tooltip-field {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: baseline;
    }
    .wo-tooltip-field dt { color: rgba(237, 246, 255, 0.68); }
    .wo-tooltip-field dd { margin: 0; font-weight: 600; text-align: right; }
    .wo-tooltip-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
    .wo-tooltip-action {
      border: 1px solid rgba(240, 180, 100, 0.24);
      border-radius: 999px;
      background: rgba(240, 180, 100, 0.12);
      color: #edf6ff;
      cursor: pointer;
      padding: 6px 12px;
      font: 600 12px/1.3 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
  `;
    document.head.append(style);
  }

  // packages/viewer/dist/embed.js
  var EMBED_SELECTOR = "[data-worldorbit-embed]";
  function serializeWorldOrbitEmbedPayload(payload) {
    return encodeURIComponent(JSON.stringify(payload));
  }
  function deserializeWorldOrbitEmbedPayload(serialized) {
    const raw = JSON.parse(decodeURIComponent(serialized));
    return {
      version: "2.0",
      mode: raw.mode ?? "interactive",
      scene: raw.scene,
      options: raw.options ? {
        ...raw.options,
        initialFilter: raw.options.initialFilter ?? null,
        atlasState: raw.options.atlasState ?? null
      } : void 0
    };
  }
  function createEmbedPayload(scene, mode, options = {}) {
    return {
      version: "2.0",
      mode,
      scene,
      options: {
        initialViewpointId: options.initialViewpointId,
        initialSelectionObjectId: options.initialSelectionObjectId,
        initialFilter: options.initialFilter ?? null,
        atlasState: options.atlasState ?? null,
        minimap: options.minimap
      }
    };
  }
  function createWorldOrbitEmbedMarkup(payload, options = {}) {
    const mergedPayload = {
      ...payload,
      options: {
        ...payload.options,
        theme: options.theme ?? payload.options?.theme,
        layers: options.layers ?? payload.options?.layers,
        subtitle: options.subtitle ?? payload.options?.subtitle,
        preset: options.preset ?? payload.options?.preset,
        initialViewpointId: options.initialViewpointId ?? payload.options?.initialViewpointId,
        initialSelectionObjectId: options.initialSelectionObjectId ?? payload.options?.initialSelectionObjectId,
        initialFilter: options.initialFilter ?? payload.options?.initialFilter ?? null,
        atlasState: options.atlasState ?? payload.options?.atlasState ?? null,
        minimap: options.minimap ?? payload.options?.minimap
      }
    };
    const html = renderSceneToSvg(payload.scene, {
      theme: mergedPayload.options?.theme,
      layers: mergedPayload.options?.layers,
      filter: mergedPayload.options?.initialFilter ?? null,
      selectedObjectId: mergedPayload.options?.initialSelectionObjectId ?? null,
      subtitle: mergedPayload.options?.subtitle,
      preset: mergedPayload.options?.preset
    });
    return `<div class="${escapeAttribute3(options.className ?? "worldorbit-embed")}" data-worldorbit-embed="true" data-worldorbit-mode="${payload.mode}" data-worldorbit-preset="${escapeAttribute3(mergedPayload.options?.preset ?? payload.scene.renderPreset ?? "custom")}" data-worldorbit-viewpoint="${escapeAttribute3(mergedPayload.options?.initialViewpointId ?? "")}" data-worldorbit-payload="${escapeAttribute3(serializeWorldOrbitEmbedPayload(mergedPayload))}">${html}</div>`;
  }
  function mountWorldOrbitEmbeds(root = document, options = {}) {
    const viewers = /* @__PURE__ */ new Map();
    const elements = [...root.querySelectorAll(EMBED_SELECTOR)];
    for (const element of elements) {
      const payload = deserializePayloadFromElement(element);
      const mode = options.mode ?? payload.mode;
      const theme = options.theme ?? payload.options?.theme;
      const layers = options.layers ?? payload.options?.layers;
      const subtitle = options.subtitle ?? payload.options?.subtitle;
      const preset = options.preset ?? payload.options?.preset ?? payload.scene.renderPreset ?? void 0;
      const initialFilter = options.viewer?.initialFilter ?? payload.options?.initialFilter ?? null;
      const initialViewpointId = options.viewer?.initialViewpointId ?? payload.options?.initialViewpointId;
      const initialSelectionObjectId = options.viewer?.initialSelectionObjectId ?? payload.options?.initialSelectionObjectId;
      const minimap = options.viewer?.minimap ?? payload.options?.minimap;
      if (mode === "interactive") {
        const viewer = createInteractiveViewer(element, {
          ...options.viewer,
          scene: payload.scene,
          width: options.width ?? payload.scene.width,
          height: options.height ?? payload.scene.height,
          padding: options.padding ?? payload.scene.padding,
          preset,
          theme,
          layers,
          subtitle,
          initialFilter,
          initialViewpointId,
          initialSelectionObjectId,
          minimap
        });
        if (payload.options?.atlasState) {
          viewer.setAtlasState(payload.options.atlasState);
        }
        viewers.set(element, viewer);
        options.onMount?.(viewer, element);
      } else {
        element.innerHTML = renderSceneToSvg(payload.scene, {
          width: options.width ?? payload.scene.width,
          height: options.height ?? payload.scene.height,
          padding: options.padding ?? payload.scene.padding,
          preset,
          theme,
          layers,
          filter: initialFilter,
          selectedObjectId: initialSelectionObjectId ?? null,
          subtitle
        });
        options.onMount?.(null, element);
      }
      element.dataset.worldorbitMounted = "true";
    }
    return {
      viewers: [...viewers.values()],
      destroy() {
        for (const [element, viewer] of viewers.entries()) {
          viewer.destroy();
          element.removeAttribute("data-worldorbit-mounted");
        }
        viewers.clear();
      }
    };
  }
  function deserializePayloadFromElement(element) {
    const serialized = element.dataset.worldorbitPayload;
    if (!serialized) {
      throw new Error("WorldOrbit embed is missing data-worldorbit-payload.");
    }
    return deserializeWorldOrbitEmbedPayload(serialized);
  }
  function escapeAttribute3(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  // packages/viewer/dist/atlas-viewer.js
  var STYLE_ID = "worldorbit-atlas-viewer-style";
  function createAtlasViewer(container, options) {
    if (typeof document === "undefined") {
      throw new Error("Atlas viewer requires a browser environment.");
    }
    installAtlasViewerStyles();
    const controls = {
      search: options.controls?.search ?? true,
      typeFilter: options.controls?.typeFilter ?? true,
      viewpointSelect: options.controls?.viewpointSelect ?? true,
      inspector: options.controls?.inspector ?? true,
      bookmarks: options.controls?.bookmarks ?? true
    };
    container.classList.add("wo-atlas-viewer");
    container.innerHTML = buildAtlasViewerMarkup(controls);
    const toolbar = container.querySelector("[data-atlas-toolbar]");
    const searchInput = container.querySelector("[data-atlas-search]");
    const typeFilterSelect = container.querySelector("[data-atlas-type-filter]");
    const viewpointSelect = container.querySelector("[data-atlas-viewpoint]");
    const bookmarkButton = container.querySelector("[data-atlas-bookmark]");
    const bookmarkList = container.querySelector("[data-atlas-bookmarks]");
    const searchResults = container.querySelector("[data-atlas-results]");
    const inspector = container.querySelector("[data-atlas-inspector]");
    const stage = container.querySelector("[data-atlas-stage]");
    if (!stage) {
      throw new Error("Atlas viewer failed to initialize its stage container.");
    }
    const baseFilter = normalizeViewerFilter(options.initialFilter ?? null);
    let searchQuery = options.initialQuery?.trim() ?? baseFilter?.query ?? "";
    let objectTypeFilter = options.initialObjectType ?? (baseFilter?.objectTypes?.length === 1 ? baseFilter.objectTypes[0] : null);
    let bookmarks = [];
    let viewer;
    viewer = createInteractiveViewer(stage, {
      ...options,
      initialFilter: null,
      onSelectionChange(selection) {
        if (viewer) {
          updateInspector();
        }
        options.onSelectionChange?.(selection);
      },
      onSelectionDetailsChange(details) {
        if (viewer) {
          updateInspector();
        }
        options.onSelectionDetailsChange?.(details);
      },
      onFilterChange(filter, visibleObjects) {
        if (viewer) {
          syncControlsFromFilter(filter);
          updateSearchResults();
          updateInspector();
        }
        options.onFilterChange?.(filter, visibleObjects);
      },
      onViewpointChange(viewpoint) {
        if (viewer) {
          syncViewpointControl();
          updateInspector();
        }
        options.onViewpointChange?.(viewpoint);
      },
      onAtlasStateChange(state) {
        if (viewer) {
          updateInspector();
        }
        options.onAtlasStateChange?.(state);
      },
      onViewChange(state) {
        if (viewer) {
          updateInspector();
        }
        options.onViewChange?.(state);
      }
    });
    applyCurrentFilter();
    populateViewpoints();
    syncControlsFromFilter(viewer.getFilter());
    renderBookmarks();
    updateSearchResults();
    updateInspector();
    searchInput?.addEventListener("input", () => {
      searchQuery = searchInput.value.trim();
      applyCurrentFilter();
    });
    typeFilterSelect?.addEventListener("change", () => {
      objectTypeFilter = typeFilterSelect.value || null;
      applyCurrentFilter();
    });
    viewpointSelect?.addEventListener("change", () => {
      const activeViewer = requireViewer();
      if (!viewpointSelect.value) {
        activeViewer.resetView();
        applyCurrentFilter();
        return;
      }
      activeViewer.goToViewpoint(viewpointSelect.value);
      updateInspector();
    });
    bookmarkButton?.addEventListener("click", () => {
      const activeViewer = requireViewer();
      const label = activeViewer.getActiveViewpoint()?.label ?? activeViewer.getSelectionDetails()?.objectId ?? `Bookmark ${bookmarks.length + 1}`;
      bookmarks = [...bookmarks, activeViewer.captureBookmark(label, label)];
      renderBookmarks();
      updateInspector();
    });
    bookmarkList?.addEventListener("click", (event) => {
      const button = event.target?.closest("[data-bookmark-id]");
      if (!button) {
        return;
      }
      const bookmark = bookmarks.find((entry) => entry.id === button.dataset.bookmarkId);
      if (!bookmark) {
        return;
      }
      const activeViewer = requireViewer();
      activeViewer.applyBookmark(bookmark);
      syncControlsFromFilter(activeViewer.getFilter());
      updateSearchResults();
      updateInspector();
    });
    searchResults?.addEventListener("click", (event) => {
      const button = event.target?.closest("[data-object-id]");
      if (!button) {
        return;
      }
      requireViewer().focusObject(button.dataset.objectId ?? "");
      updateInspector();
    });
    function requireViewer() {
      if (!viewer) {
        throw new Error("Atlas viewer is not initialized.");
      }
      return viewer;
    }
    const api = {
      element: container,
      get viewer() {
        return requireViewer();
      },
      getViewer() {
        return requireViewer();
      },
      setSource(source) {
        requireViewer().setSource(source);
        refreshAfterInputChange();
      },
      setDocument(document2) {
        requireViewer().setDocument(document2);
        refreshAfterInputChange();
      },
      setScene(scene) {
        requireViewer().setScene(scene);
        refreshAfterInputChange();
      },
      getAtlasState() {
        return requireViewer().getAtlasState();
      },
      setAtlasState(state) {
        const activeViewer = requireViewer();
        activeViewer.setAtlasState(state);
        syncControlsFromFilter(activeViewer.getFilter());
        updateSearchResults();
        updateInspector();
      },
      getInspectorSnapshot() {
        return buildInspectorSnapshot();
      },
      getSearchQuery() {
        return searchQuery;
      },
      setSearchQuery(query) {
        searchQuery = query.trim();
        if (searchInput) {
          searchInput.value = searchQuery;
        }
        applyCurrentFilter();
      },
      getObjectTypeFilter() {
        return objectTypeFilter;
      },
      setObjectTypeFilter(type) {
        objectTypeFilter = type;
        if (typeFilterSelect) {
          typeFilterSelect.value = type ?? "";
        }
        applyCurrentFilter();
      },
      listSearchResults(limit = 6) {
        return requireViewer().search(searchQuery, limit);
      },
      listBookmarks() {
        return bookmarks.map(cloneBookmark);
      },
      captureBookmark(name, label) {
        const bookmark = requireViewer().captureBookmark(name, label);
        bookmarks = [...bookmarks, bookmark];
        renderBookmarks();
        updateInspector();
        return cloneBookmark(bookmark);
      },
      applyBookmark(bookmark) {
        const activeViewer = requireViewer();
        const result = activeViewer.applyBookmark(bookmark);
        if (result) {
          syncControlsFromFilter(activeViewer.getFilter());
          updateSearchResults();
          updateInspector();
        }
        return result;
      },
      goToViewpoint(id) {
        const result = requireViewer().goToViewpoint(id);
        if (result) {
          updateInspector();
        }
        return result;
      },
      exportSvg() {
        return requireViewer().exportSvg();
      },
      destroy() {
        requireViewer().destroy();
        container.innerHTML = "";
        container.classList.remove("wo-atlas-viewer");
      }
    };
    return api;
    function refreshAfterInputChange() {
      populateViewpoints();
      applyCurrentFilter();
      renderBookmarks();
      updateSearchResults();
      updateInspector();
    }
    function applyCurrentFilter() {
      requireViewer().setFilter(buildComposedFilter());
      populateViewpoints();
      updateSearchResults();
      updateInspector();
    }
    function buildComposedFilter() {
      return normalizeViewerFilter({
        query: searchQuery || void 0,
        objectTypes: objectTypeFilter ? [objectTypeFilter] : void 0,
        tags: baseFilter?.tags,
        groupIds: baseFilter?.groupIds,
        includeAncestors: baseFilter?.includeAncestors ?? true
      });
    }
    function syncControlsFromFilter(filter) {
      searchQuery = filter?.query?.trim() ?? "";
      objectTypeFilter = filter?.objectTypes?.length === 1 ? filter.objectTypes[0] : null;
      if (searchInput && document.activeElement !== searchInput) {
        searchInput.value = searchQuery;
      }
      if (typeFilterSelect) {
        typeFilterSelect.value = objectTypeFilter ?? "";
      }
    }
    function populateViewpoints() {
      if (!viewpointSelect) {
        return;
      }
      const activeViewer = requireViewer();
      const active = activeViewer.getActiveViewpoint()?.id ?? "";
      viewpointSelect.innerHTML = [
        `<option value="">Scene default</option>`,
        ...activeViewer.listViewpoints().map((viewpoint) => `<option value="${escapeHtml2(viewpoint.id)}">${escapeHtml2(viewpoint.label)}</option>`)
      ].join("");
      viewpointSelect.value = active;
    }
    function syncViewpointControl() {
      if (!viewpointSelect) {
        return;
      }
      viewpointSelect.value = requireViewer().getActiveViewpoint()?.id ?? "";
    }
    function updateSearchResults() {
      if (!searchResults) {
        return;
      }
      const results = requireViewer().search(searchQuery, 6);
      searchResults.innerHTML = results.map((result) => `<button type="button" class="wo-atlas-pill" data-object-id="${escapeHtml2(result.objectId)}">${escapeHtml2(result.objectId)} - ${escapeHtml2(result.type)}</button>`).join("");
    }
    function updateInspector() {
      const snapshot = buildInspectorSnapshot();
      if (inspector) {
        inspector.textContent = JSON.stringify(snapshot, null, 2);
      }
      options.onInspectorChange?.(snapshot);
    }
    function buildInspectorSnapshot() {
      const activeViewer = requireViewer();
      return {
        selection: activeViewer.getSelectionDetails(),
        activeViewpoint: activeViewer.getActiveViewpoint(),
        filter: activeViewer.getFilter(),
        atlasState: activeViewer.getAtlasState(),
        visibleObjectIds: activeViewer.getVisibleObjects().map((object) => object.objectId),
        scene: {
          title: activeViewer.getScene().title,
          projection: activeViewer.getScene().projection,
          renderPreset: activeViewer.getScene().renderPreset,
          groupCount: activeViewer.getScene().groups.length,
          viewpointCount: activeViewer.getScene().viewpoints.length
        }
      };
    }
    function renderBookmarks() {
      if (!bookmarkList) {
        return;
      }
      bookmarkList.innerHTML = bookmarks.map((bookmark) => `<button type="button" class="wo-atlas-pill" data-bookmark-id="${escapeHtml2(bookmark.id)}">${escapeHtml2(bookmark.label)}</button>`).join("");
    }
  }
  function buildAtlasViewerMarkup(controls) {
    const toolbarItems = [
      controls.search ? `<label class="wo-atlas-field">
          <span>Search</span>
          <input data-atlas-search type="text" placeholder="Search objects, tags, or types" />
        </label>` : "",
      controls.typeFilter ? `<label class="wo-atlas-field">
          <span>Type</span>
          <select data-atlas-type-filter>
            <option value="">All types</option>
            <option value="star">Star</option>
            <option value="planet">Planet</option>
            <option value="moon">Moon</option>
            <option value="belt">Belt</option>
            <option value="asteroid">Asteroid</option>
            <option value="comet">Comet</option>
            <option value="ring">Ring</option>
            <option value="structure">Structure</option>
            <option value="phenomenon">Phenomenon</option>
          </select>
        </label>` : "",
      controls.viewpointSelect ? `<label class="wo-atlas-field">
          <span>Viewpoint</span>
          <select data-atlas-viewpoint>
            <option value="">Scene default</option>
          </select>
        </label>` : "",
      controls.bookmarks ? `<button type="button" class="wo-atlas-button" data-atlas-bookmark>Save bookmark</button>` : ""
    ].filter(Boolean).join("");
    return `<section class="wo-atlas-shell">
    ${toolbarItems ? `<div class="wo-atlas-toolbar" data-atlas-toolbar>${toolbarItems}</div>` : ""}
    <div class="wo-atlas-workspace">
      <div class="wo-atlas-stage" data-atlas-stage></div>
      ${controls.inspector ? `<pre class="wo-atlas-inspector" data-atlas-inspector></pre>` : ""}
    </div>
    <div class="wo-atlas-footer">
      <div class="wo-atlas-results" data-atlas-results></div>
      ${controls.bookmarks ? `<div class="wo-atlas-bookmarks" data-atlas-bookmarks></div>` : ""}
    </div>
  </section>`;
  }
  function installAtlasViewerStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    .wo-atlas-shell { display: grid; gap: 16px; min-width: 0; }
    .wo-atlas-toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: end; }
    .wo-atlas-workspace { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr) minmax(260px, 320px); }
    .wo-atlas-stage { min-height: 420px; min-width: 0; }
    .wo-atlas-inspector {
      margin: 0;
      min-height: 420px;
      padding: 16px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(7, 16, 25, 0.72);
      color: #edf6ff;
      overflow: auto;
      font: 12px/1.5 "Cascadia Code", "Consolas", monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .wo-atlas-footer { display: grid; gap: 12px; }
    .wo-atlas-results, .wo-atlas-bookmarks { display: flex; gap: 8px; flex-wrap: wrap; }
    .wo-atlas-field { display: grid; gap: 6px; min-width: 180px; color: #edf6ff; font: 600 12px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif; text-transform: uppercase; letter-spacing: 0.08em; }
    .wo-atlas-field input, .wo-atlas-field select, .wo-atlas-button, .wo-atlas-pill {
      border: 1px solid rgba(240, 180, 100, 0.2);
      border-radius: 999px;
      background: rgba(240, 180, 100, 0.08);
      color: #edf6ff;
      font: 500 13px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif;
      padding: 10px 14px;
    }
    .wo-atlas-button, .wo-atlas-pill { cursor: pointer; }
    @media (max-width: 1080px) {
      .wo-atlas-workspace { grid-template-columns: 1fr; }
      .wo-atlas-inspector { min-height: 220px; }
    }
  `;
    document.head.append(style);
  }
  function cloneBookmark(bookmark) {
    return {
      ...bookmark,
      atlasState: {
        ...bookmark.atlasState,
        viewerState: { ...bookmark.atlasState.viewerState },
        renderOptions: {
          ...bookmark.atlasState.renderOptions,
          layers: bookmark.atlasState.renderOptions.layers ? { ...bookmark.atlasState.renderOptions.layers } : void 0,
          scaleModel: bookmark.atlasState.renderOptions.scaleModel ? { ...bookmark.atlasState.renderOptions.scaleModel } : void 0
        },
        filter: bookmark.atlasState.filter ? { ...bookmark.atlasState.filter } : null
      }
    };
  }
  function escapeHtml2(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  // packages/viewer/dist/custom-element.js
  function defineWorldOrbitViewerElement(tagName = "worldorbit-viewer") {
    if (typeof window === "undefined" || typeof customElements === "undefined") {
      return;
    }
    if (customElements.get(tagName)) {
      return;
    }
    class WorldOrbitViewerElement extends HTMLElement {
      static get observedAttributes() {
        return ["source", "mode", "theme"];
      }
      viewer = null;
      connectedCallback() {
        this.renderCurrent();
      }
      disconnectedCallback() {
        this.viewer?.destroy();
        this.viewer = null;
      }
      attributeChangedCallback() {
        if (this.isConnected) {
          this.renderCurrent();
        }
      }
      renderCurrent() {
        this.viewer?.destroy();
        this.viewer = null;
        const source = this.getAttribute("source") ?? this.textContent ?? "";
        const mode = this.getAttribute("mode") ?? "interactive";
        if (!source.trim()) {
          this.innerHTML = "";
          return;
        }
        const documentModel = parseSource(source);
        const scene = renderDocumentToScene(documentModel);
        const theme = this.getAttribute("theme") ?? void 0;
        if (mode === "static") {
          this.innerHTML = renderSceneToSvg(scene, {
            theme
          });
          return;
        }
        if (mode === "atlas") {
          this.viewer = createAtlasViewer(this, {
            scene,
            theme
          });
          return;
        }
        this.viewer = createInteractiveViewer(this, {
          scene,
          theme
        });
      }
    }
    customElements.define(tagName, WorldOrbitViewerElement);
  }
  function parseSource(source) {
    return loadWorldOrbitSource(source).document;
  }
  return __toCommonJS(worldorbit_esm_exports);
})();
