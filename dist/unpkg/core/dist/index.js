"use strict";
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

  // packages/core/dist/index.js
  var dist_exports = {};
  __export(dist_exports, {
    WORLDORBIT_FIELD_KEYS: () => WORLDORBIT_FIELD_KEYS,
    WORLDORBIT_FIELD_SCHEMAS: () => WORLDORBIT_FIELD_SCHEMAS,
    WORLDORBIT_OBJECT_TYPES: () => WORLDORBIT_OBJECT_TYPES,
    WorldOrbitError: () => WorldOrbitError,
    cloneAtlasDocument: () => cloneAtlasDocument,
    createDiagnostic: () => createDiagnostic,
    createEmptyAtlasDocument: () => createEmptyAtlasDocument,
    detectWorldOrbitSchemaVersion: () => detectWorldOrbitSchemaVersion,
    diagnosticFromError: () => diagnosticFromError,
    extractWorldOrbitBlocks: () => extractWorldOrbitBlocks,
    formatAtlasDocument: () => formatAtlasDocument,
    formatDocument: () => formatDocument,
    formatDraftDocument: () => formatDraftDocument,
    getAtlasDocumentNode: () => getAtlasDocumentNode,
    getFieldSchema: () => getFieldSchema,
    isKnownFieldKey: () => isKnownFieldKey,
    listAtlasDocumentPaths: () => listAtlasDocumentPaths,
    load: () => load,
    loadWorldOrbitSource: () => loadWorldOrbitSource,
    loadWorldOrbitSourceWithDiagnostics: () => loadWorldOrbitSourceWithDiagnostics,
    materializeAtlasDocument: () => materializeAtlasDocument,
    materializeDraftDocument: () => materializeDraftDocument,
    normalizeDocument: () => normalizeDocument,
    normalizeWithDiagnostics: () => normalizeWithDiagnostics,
    parse: () => parse,
    parseSafe: () => parseSafe,
    parseWithDiagnostics: () => parseWithDiagnostics,
    parseWorldOrbit: () => parseWorldOrbit,
    parseWorldOrbitAtlas: () => parseWorldOrbitAtlas,
    parseWorldOrbitDraft: () => parseWorldOrbitDraft,
    removeAtlasDocumentNode: () => removeAtlasDocumentNode,
    render: () => render,
    renderDocumentToScene: () => renderDocumentToScene,
    resolveAtlasDiagnosticPath: () => resolveAtlasDiagnosticPath,
    resolveAtlasDiagnostics: () => resolveAtlasDiagnostics,
    rotatePoint: () => rotatePoint,
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
    validateDocumentWithDiagnostics: () => validateDocumentWithDiagnostics
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
    let document;
    try {
      document = normalizeDocument(ast);
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "normalize")]
      };
    }
    try {
      validateDocument(document);
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
        document
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
  function validateDocumentWithDiagnostics(document) {
    try {
      validateDocument(document);
      return {
        ok: true,
        value: document,
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
  function renderDocumentToScene(document, options = {}) {
    const frame = resolveSceneFrame(options);
    const width = frame.width;
    const height = frame.height;
    const padding = frame.padding;
    const layoutPreset = resolveLayoutPreset(document);
    const projection = resolveProjection(document, options.projection);
    const scaleModel = resolveScaleModel(layoutPreset, options.scaleModel);
    const spacingFactor = layoutPresetSpacing(layoutPreset);
    const systemId = document.system?.id ?? null;
    const objectMap = new Map(document.objects.map((object) => [object.id, object]));
    const relationships = buildSceneRelationships(document.objects, objectMap);
    const positions = /* @__PURE__ */ new Map();
    const orbitDrafts = [];
    const leaderDrafts = [];
    const rootObjects = [];
    const freeObjects = [];
    const atObjects = [];
    const surfaceChildren = /* @__PURE__ */ new Map();
    const orbitChildren = /* @__PURE__ */ new Map();
    for (const object of document.objects) {
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
    const viewpoints = createSceneViewpoints(document, projection, frame.preset, relationships, objectMap);
    const contentBounds = calculateContentBounds(width, height, objects, orbitVisuals, leaders, labels);
    return {
      width,
      height,
      padding,
      renderPreset: frame.preset,
      projection,
      scaleModel,
      title: String(document.system?.properties.title ?? document.system?.id ?? "WorldOrbit") || "WorldOrbit",
      subtitle: `${capitalizeLabel(projection)} view - ${capitalizeLabel(layoutPreset)} layout`,
      systemId,
      viewMode: projection,
      layoutPreset,
      metadata: {
        format: document.format,
        version: document.version,
        view: projection,
        scale: String(document.system?.properties.scale ?? layoutPreset),
        units: String(document.system?.properties.units ?? "mixed"),
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
  function resolveLayoutPreset(document) {
    const rawScale = String(document.system?.properties.scale ?? "balanced").toLowerCase();
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
  function resolveProjection(document, projection) {
    if (projection === "topdown" || projection === "isometric") {
      return projection;
    }
    return String(document.system?.properties.view ?? "topdown").toLowerCase() === "isometric" ? "isometric" : "topdown";
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
  function createSceneViewpoints(document, projection, preset, relationships, objectMap) {
    const generatedOverview = createGeneratedOverviewViewpoint(document, projection, preset);
    const drafts = /* @__PURE__ */ new Map();
    for (const [key, value] of Object.entries(document.system?.info ?? {})) {
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
  function createGeneratedOverviewViewpoint(document, projection, preset) {
    const label = document.system?.properties.title ? `${String(document.system.properties.title)} Overview` : "Overview";
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
  function upgradeDocumentToV2(document, options = {}) {
    const scene = renderDocumentToScene(document, options);
    const diagnostics = [];
    const atlasMetadata = collectAtlasMetadata(document, diagnostics);
    const annotations = collectDraftAnnotations(document, diagnostics);
    const defaults = createDraftDefaults(document, scene.renderPreset ?? options.preset ?? null, scene.projection);
    const system = document.system ? createDraftSystem(document, defaults, atlasMetadata, annotations, diagnostics, scene.renderPreset ?? options.preset ?? null) : null;
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
      sourceVersion: document.version,
      system,
      objects: document.objects.map(cloneWorldOrbitObject),
      diagnostics
    };
  }
  function upgradeDocumentToDraftV2(document, options = {}) {
    return convertAtlasDocumentToLegacyDraft(upgradeDocumentToV2(document, options));
  }
  function materializeAtlasDocument(document) {
    const system = document.system ? {
      type: "system",
      id: document.system.id,
      properties: materializeDraftSystemProperties(document.system),
      info: materializeDraftSystemInfo(document.system)
    } : null;
    return {
      format: "worldorbit",
      version: "1.0",
      system,
      objects: document.objects.map(cloneWorldOrbitObject)
    };
  }
  function materializeDraftDocument(document) {
    return materializeAtlasDocument(document);
  }
  function createDraftSystem(document, defaults, atlasMetadata, annotations, diagnostics, preset) {
    const scene = renderDocumentToScene(document, {
      preset: preset ?? void 0,
      projection: defaults.view
    });
    return {
      type: "system",
      id: document.system?.id ?? "WorldOrbit",
      title: typeof document.system?.properties.title === "string" ? document.system.properties.title : null,
      defaults,
      atlasMetadata,
      viewpoints: scene.viewpoints.map(mapSceneViewpointToDraftViewpoint),
      annotations
    };
  }
  function createDraftDefaults(document, preset, projection) {
    return {
      view: typeof document.system?.properties.view === "string" && document.system.properties.view.toLowerCase() === "topdown" ? "topdown" : projection,
      scale: typeof document.system?.properties.scale === "string" ? document.system.properties.scale : null,
      units: typeof document.system?.properties.units === "string" ? document.system.properties.units : null,
      preset,
      theme: typeof document.system?.info["atlas.theme"] === "string" ? document.system.info["atlas.theme"] : null
    };
  }
  function collectAtlasMetadata(document, diagnostics) {
    const metadata = {};
    for (const [key, value] of Object.entries(document.system?.info ?? {})) {
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
  function collectDraftAnnotations(document, diagnostics) {
    const drafts = /* @__PURE__ */ new Map();
    for (const [key, value] of Object.entries(document.system?.info ?? {})) {
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
    for (const object of document.objects) {
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
  function convertAtlasDocumentToLegacyDraft(document) {
    return {
      ...document,
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
  function formatDocument(document, options = {}) {
    const schema = options.schema ?? "auto";
    const useDraft = schema === "2.0" || schema === "2.0-draft" || document.version === "2.0" || document.version === "2.0-draft";
    if (useDraft) {
      if (schema === "2.0-draft") {
        const legacyDraftDocument = document.version === "2.0-draft" ? document : document.version === "2.0" ? {
          ...document,
          version: "2.0-draft"
        } : upgradeDocumentToDraftV2(document);
        return formatDraftDocument(legacyDraftDocument);
      }
      const atlasDocument = document.version === "2.0" ? document : document.version === "2.0-draft" ? {
        ...document,
        version: "2.0"
      } : upgradeDocumentToV2(document);
      return formatAtlasDocument(atlasDocument);
    }
    const lines = [];
    const stableDocument = document;
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
  function formatAtlasDocument(document) {
    const lines = ["schema 2.0", ""];
    if (document.system) {
      lines.push(...formatAtlasSystem(document.system));
    }
    const sortedObjects = [...document.objects].sort(compareObjects);
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
  function formatDraftDocument(document) {
    const legacy = document.version === "2.0-draft" ? document : {
      ...document,
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
  function cloneAtlasDocument(document) {
    return structuredClone(document);
  }
  function listAtlasDocumentPaths(document) {
    const paths = [{ kind: "system" }, { kind: "defaults" }];
    if (document.system) {
      for (const key of Object.keys(document.system.atlasMetadata).sort()) {
        paths.push({ kind: "metadata", key });
      }
      for (const viewpoint of [...document.system.viewpoints].sort(compareIdLike)) {
        paths.push({ kind: "viewpoint", id: viewpoint.id });
      }
      for (const annotation of [...document.system.annotations].sort(compareIdLike)) {
        paths.push({ kind: "annotation", id: annotation.id });
      }
    }
    for (const object of [...document.objects].sort(compareIdLike)) {
      paths.push({ kind: "object", id: object.id });
    }
    return paths;
  }
  function getAtlasDocumentNode(document, path) {
    switch (path.kind) {
      case "system":
        return document.system;
      case "defaults":
        return document.system?.defaults ?? null;
      case "metadata":
        return path.key ? document.system?.atlasMetadata[path.key] ?? null : null;
      case "object":
        return path.id ? findObject(document, path.id) : null;
      case "viewpoint":
        return path.id ? findViewpoint(document.system, path.id) : null;
      case "annotation":
        return path.id ? findAnnotation(document.system, path.id) : null;
    }
  }
  function upsertAtlasDocumentNode(document, path, value) {
    const next = cloneAtlasDocument(document);
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
  function updateAtlasDocumentNode(document, path, updater) {
    return upsertAtlasDocumentNode(document, path, updater(getAtlasDocumentNode(document, path)));
  }
  function removeAtlasDocumentNode(document, path) {
    const next = cloneAtlasDocument(document);
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
  function resolveAtlasDiagnostics(document, diagnostics) {
    return diagnostics.map((diagnostic) => ({
      diagnostic,
      path: resolveAtlasDiagnosticPath(document, diagnostic)
    }));
  }
  function resolveAtlasDiagnosticPath(document, diagnostic) {
    if (diagnostic.objectId && findObject(document, diagnostic.objectId)) {
      return {
        kind: "object",
        id: diagnostic.objectId
      };
    }
    if (diagnostic.field?.startsWith("viewpoint.")) {
      const parts = diagnostic.field.split(".");
      if (parts[1] && findViewpoint(document.system, parts[1])) {
        return {
          kind: "viewpoint",
          id: parts[1]
        };
      }
    }
    if (diagnostic.field?.startsWith("annotation.")) {
      const parts = diagnostic.field.split(".");
      if (parts[1] && findAnnotation(document.system, parts[1])) {
        return {
          kind: "annotation",
          id: parts[1]
        };
      }
    }
    if (diagnostic.field && diagnostic.field in ensureSystem(document).atlasMetadata) {
      return {
        kind: "metadata",
        key: diagnostic.field
      };
    }
    return null;
  }
  function validateAtlasDocumentWithDiagnostics(document) {
    const materialized = materializeAtlasDocument(document);
    const result = validateDocumentWithDiagnostics(materialized);
    return resolveAtlasDiagnostics(document, result.diagnostics);
  }
  function ensureSystem(document) {
    if (document.system) {
      return document.system;
    }
    document.system = createEmptyAtlasDocument().system;
    return document.system;
  }
  function findObject(document, objectId) {
    return document.objects.find((object) => object.id === objectId) ?? null;
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
    let document;
    try {
      document = normalizeDocument(ast);
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "normalize")]
      };
    }
    try {
      validateDocument(document);
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
        document,
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
    let document;
    try {
      document = materializeAtlasDocument(atlasDocument);
    } catch (error) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error, "normalize", "load.atlas.materialize.failed")]
      };
    }
    try {
      validateDocument(document);
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
      document,
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
    const document = normalizeDocument(ast);
    validateDocument(document);
    return { ast, document };
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
  function stringify(document, options = {}) {
    return formatDocument(document, options);
  }
  return __toCommonJS(dist_exports);
})();
