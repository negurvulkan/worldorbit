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

  // packages/markdown/dist/index.js
  var index_exports = {};
  __export(index_exports, {
    rehypeWorldOrbit: () => rehypeWorldOrbit,
    remarkWorldOrbit: () => remarkWorldOrbit,
    renderWorldOrbitBlock: () => renderWorldOrbitBlock,
    renderWorldOrbitError: () => renderWorldOrbitError
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
        return unit === null || ["au", "km", "m", "ly", "pc", "kpc", "re", "sol"].includes(unit);
      case "radius":
        return unit === null || ["km", "m", "re", "rj", "sol"].includes(unit);
      case "mass":
        return unit === null || ["me", "mj", "sol"].includes(unit);
      case "duration":
        return unit === null || ["s", "min", "h", "d", "y", "ky", "my", "gy"].includes(unit);
      case "angle":
        return unit === null || unit === "deg";
      case "generic":
        return true;
    }
  }

  // packages/core/dist/tokenize.js
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
  var UNIT_PATTERN = /^(-?\d+(?:\.\d+)?)(kpc|min|mj|rj|ky|my|gy|au|km|me|re|pc|ly|deg|sol|K|m|s|h|d|y)?$/;
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
      schemaVersion: "1.0",
      system,
      groups: [],
      relations: [],
      events: [],
      objects
    };
  }
  function normalizeObject(node) {
    const mergedFields = [...node.inlineFields, ...node.blockFields];
    validateFieldCompatibility(node.objectType, mergedFields);
    const fieldMap = collectFields(mergedFields);
    const placement = extractPlacement(node.objectType, fieldMap);
    const properties = normalizeProperties(fieldMap);
    const info2 = normalizeInfo(node.infoEntries);
    if (node.objectType === "system") {
      return {
        type: "system",
        id: node.name,
        title: typeof properties.title === "string" ? properties.title : null,
        description: null,
        epoch: null,
        referencePlane: null,
        properties,
        info: info2
      };
    }
    return {
      type: node.objectType,
      id: node.name,
      properties,
      placement,
      info: info2
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
    const info2 = {};
    for (const entry of entries) {
      if (entry.key in info2) {
        throw WorldOrbitError.fromLocation(`Duplicate info key "${entry.key}"`, entry.location);
      }
      info2[entry.key] = entry.value;
    }
    return info2;
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
  function diagnosticFromError(error2, source, code = `${source}.failed`) {
    if (error2 instanceof WorldOrbitError) {
      return {
        code,
        severity: "error",
        source,
        message: error2.message,
        line: error2.line,
        column: error2.column
      };
    }
    if (error2 instanceof Error) {
      return {
        code,
        severity: "error",
        source,
        message: error2.message
      };
    }
    return {
      code,
      severity: "error",
      source,
      message: String(error2)
    };
  }

  // packages/core/dist/scene.js
  var AU_IN_KM = 1495978707e-1;
  var EARTH_RADIUS_IN_KM = 6371;
  var JUPITER_RADIUS_IN_KM = 71492;
  var SOLAR_RADIUS_IN_KM = 695700;
  var LY_IN_AU = 63241.077;
  var PC_IN_AU = 206264.806;
  var KPC_IN_AU = 206264806;
  var ISO_FLATTENING = 0.68;
  var MIN_ISO_MINOR_SCALE = 0.2;
  var ARC_SAMPLE_COUNT = 28;
  function renderDocumentToScene(document2, options = {}) {
    const frame = resolveSceneFrame(options);
    const width = frame.width;
    const height = frame.height;
    const padding = frame.padding;
    const layoutPreset = resolveLayoutPreset(document2);
    const schemaProjection = resolveProjection(document2, options.projection);
    const camera = normalizeViewCamera(options.camera ?? null);
    const renderProjection = resolveRenderProjection(schemaProjection, camera);
    const scaleModel = resolveScaleModel(layoutPreset, options.scaleModel);
    const spacingFactor = layoutPresetSpacing(layoutPreset);
    const systemId = document2.system?.id ?? null;
    const activeEventId = options.activeEventId ?? null;
    const effectiveObjects = createEffectiveObjects(document2.objects, document2.events ?? [], activeEventId);
    const objectMap = new Map(effectiveObjects.map((object) => [object.id, object]));
    const relationships = buildSceneRelationships(effectiveObjects, objectMap);
    const positions = /* @__PURE__ */ new Map();
    const orbitDrafts = [];
    const leaderDrafts = [];
    const rootObjects = [];
    const freeObjects = [];
    const atObjects = [];
    const surfaceChildren = /* @__PURE__ */ new Map();
    const orbitChildren = /* @__PURE__ */ new Map();
    for (const object of effectiveObjects) {
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
      projection: renderProjection,
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
        const offset = projectPolarOffset(angle, rootRingRadius, renderProjection, 1);
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
    const labels = createSceneLabels(objects, width, height, scaleModel.labelMultiplier);
    const relations = createSceneRelations(document2, objects);
    const events = createSceneEvents(document2.events ?? [], objects, activeEventId);
    const layers = createSceneLayers(orbitVisuals, relations, events, leaders, objects, labels);
    const groups = createSceneGroups(objects, orbitVisuals, leaders, labels, relationships, scaleModel.labelMultiplier);
    const semanticGroups = createSceneSemanticGroups(document2, objects);
    const viewpoints = createSceneViewpoints(document2, schemaProjection, frame.preset, relationships, objectMap);
    const contentBounds = calculateContentBounds(width, height, objects, orbitVisuals, leaders, labels, scaleModel.labelMultiplier);
    return {
      width,
      height,
      padding,
      renderPreset: frame.preset,
      projection: schemaProjection,
      renderProjection,
      camera,
      scaleModel,
      title: String(document2.system?.title ?? document2.system?.properties.title ?? document2.system?.id ?? "WorldOrbit") || "WorldOrbit",
      subtitle: buildSceneSubtitle(schemaProjection, renderProjection, layoutPreset, camera),
      systemId,
      viewMode: schemaProjection,
      layoutPreset,
      metadata: {
        format: document2.format,
        version: document2.version,
        view: schemaProjection,
        renderProjection,
        scale: String(document2.system?.properties.scale ?? layoutPreset),
        units: String(document2.system?.properties.units ?? "mixed"),
        preset: frame.preset ?? "custom",
        ...camera?.azimuth !== null ? { "camera.azimuth": String(camera?.azimuth) } : {},
        ...camera?.elevation !== null ? { "camera.elevation": String(camera?.elevation) } : {},
        ...camera?.roll !== null ? { "camera.roll": String(camera?.roll) } : {},
        ...camera?.distance !== null ? { "camera.distance": String(camera?.distance) } : {}
      },
      contentBounds,
      layers,
      groups,
      semanticGroups,
      viewpoints,
      events,
      activeEventId,
      objects,
      orbitVisuals,
      relations,
      leaders,
      labels
    };
  }
  function createEffectiveObjects(objects, events, activeEventId) {
    const cloned = objects.map((object) => structuredClone(object));
    if (!activeEventId) {
      return cloned;
    }
    const activeEvent = events.find((event) => event.id === activeEventId);
    if (!activeEvent) {
      return cloned;
    }
    const objectMap = new Map(cloned.map((object) => [object.id, object]));
    const referencedIds = /* @__PURE__ */ new Set([
      ...activeEvent.targetObjectId ? [activeEvent.targetObjectId] : [],
      ...activeEvent.participantObjectIds,
      ...activeEvent.positions.map((pose) => pose.objectId)
    ]);
    for (const objectId of referencedIds) {
      const object = objectMap.get(objectId);
      if (!object) {
        continue;
      }
      if (activeEvent.epoch) {
        object.epoch = activeEvent.epoch;
      }
      if (activeEvent.referencePlane) {
        object.referencePlane = activeEvent.referencePlane;
      }
    }
    for (const pose of activeEvent.positions) {
      const object = objectMap.get(pose.objectId);
      if (!object) {
        continue;
      }
      if (pose.placement) {
        object.placement = structuredClone(pose.placement);
      }
      if (pose.inner) {
        object.properties.inner = { ...pose.inner };
      }
      if (pose.outer) {
        object.properties.outer = { ...pose.outer };
      }
      if (pose.epoch) {
        object.epoch = pose.epoch;
      }
      if (pose.referencePlane) {
        object.referencePlane = pose.referencePlane;
      }
    }
    return cloned;
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
    if (projection === "topdown" || projection === "isometric" || projection === "orthographic" || projection === "perspective") {
      return projection;
    }
    const documentView = String(document2.system?.properties.view ?? "topdown").toLowerCase();
    return parseViewProjection(documentView) ?? "topdown";
  }
  function resolveRenderProjection(projection, camera) {
    switch (projection) {
      case "topdown":
        return "topdown";
      case "isometric":
        return "isometric";
      case "orthographic":
        return camera && (camera.azimuth !== null || camera.elevation !== null || camera.roll !== null) ? "isometric" : "topdown";
      case "perspective":
        return "isometric";
    }
  }
  function normalizeViewCamera(camera) {
    if (!camera) {
      return null;
    }
    const normalized = {
      azimuth: normalizeFiniteCameraValue(camera.azimuth),
      elevation: normalizeFiniteCameraValue(camera.elevation),
      roll: normalizeFiniteCameraValue(camera.roll),
      distance: normalizePositiveCameraDistance(camera.distance)
    };
    return normalized.azimuth !== null || normalized.elevation !== null || normalized.roll !== null || normalized.distance !== null ? normalized : null;
  }
  function normalizeFiniteCameraValue(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
  function normalizePositiveCameraDistance(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
  }
  function buildSceneSubtitle(projection, renderProjection, layoutPreset, camera) {
    const parts = [`${capitalizeLabel(projection)} view`, `${capitalizeLabel(layoutPreset)} layout`];
    if (projection !== renderProjection) {
      parts.push(`2D ${renderProjection} fallback`);
    }
    if (camera) {
      const cameraParts = [
        camera.azimuth !== null ? `az ${camera.azimuth}` : null,
        camera.elevation !== null ? `el ${camera.elevation}` : null,
        camera.roll !== null ? `roll ${camera.roll}` : null,
        camera.distance !== null ? `dist ${camera.distance}` : null
      ].filter(Boolean);
      if (cameraParts.length > 0) {
        parts.push(`camera ${cameraParts.join(" / ")}`);
      }
    }
    return parts.join(" - ");
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
    const renderPriority = object.renderHints?.renderPriority ?? 0;
    return {
      renderId: createRenderId(object.id),
      objectId: object.id,
      object,
      parentId: relationships.parentIds.get(object.id) ?? null,
      ancestorIds: relationships.ancestorIds.get(object.id) ?? [],
      childIds: relationships.childIds.get(object.id) ?? [],
      groupId: relationships.groupIds.get(object.id) ?? null,
      semanticGroupIds: [...object.groups ?? []],
      x,
      y,
      radius,
      visualRadius: visualExtentForObject(object, radius, scaleModel),
      sortKey: sortKey + renderPriority * 1e-3,
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
      semanticGroupIds: [...draft.object.groups ?? []],
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
      hidden: draft.object.properties.hidden === true || draft.object.renderHints?.renderOrbit === false
    };
  }
  function createLeaderLine(draft) {
    return {
      renderId: `${createRenderId(draft.object.id)}-leader-${draft.mode}`,
      objectId: draft.object.id,
      object: draft.object,
      groupId: draft.groupId,
      semanticGroupIds: [...draft.object.groups ?? []],
      x1: draft.x1,
      y1: draft.y1,
      x2: draft.x2,
      y2: draft.y2,
      mode: draft.mode,
      hidden: draft.object.properties.hidden === true
    };
  }
  function createSceneLabels(objects, sceneWidth, sceneHeight, labelMultiplier) {
    const labels = [];
    const occupied = [];
    const objectMap = new Map(objects.map((object) => [object.objectId, object]));
    const visibleObjects = [...objects].filter((object) => !object.hidden && object.object.renderHints?.renderLabel !== false).sort(compareLabelPlacementOrder);
    for (const object of visibleObjects) {
      const placement = selectLabelPlacement(object, objectMap, occupied, sceneWidth, sceneHeight, labelMultiplier) ?? createLabelPlacement(object, defaultVerticalDirection(object, objectMap.get(object.parentId ?? "") ?? null, sceneHeight), 0, labelMultiplier);
      occupied.push(createLabelRect(object, placement, labelMultiplier));
      labels.push({
        renderId: `${object.renderId}-label`,
        objectId: object.objectId,
        object: object.object,
        groupId: object.groupId,
        semanticGroupIds: [...object.semanticGroupIds],
        label: object.label,
        secondaryLabel: object.secondaryLabel,
        x: placement.x,
        y: placement.labelY,
        secondaryY: placement.secondaryY,
        textAnchor: placement.textAnchor,
        direction: placement.direction,
        hidden: object.hidden
      });
    }
    return labels;
  }
  function compareLabelPlacementOrder(left, right) {
    const priorityDiff = labelPlacementPriority(left) - labelPlacementPriority(right);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    const renderPriorityDiff = (right.object.renderHints?.renderPriority ?? 0) - (left.object.renderHints?.renderPriority ?? 0);
    if (renderPriorityDiff !== 0) {
      return renderPriorityDiff;
    }
    return left.sortKey - right.sortKey;
  }
  function labelPlacementPriority(object) {
    switch (object.object.type) {
      case "star":
        return 0;
      case "planet":
        return 1;
      case "moon":
        return 2;
      case "belt":
      case "ring":
        return 3;
      case "asteroid":
      case "comet":
        return 4;
      case "structure":
      case "phenomenon":
        return 5;
    }
  }
  function selectLabelPlacement(object, objectMap, occupied, sceneWidth, sceneHeight, labelMultiplier) {
    for (const direction of preferredLabelDirections(object, objectMap, sceneWidth, sceneHeight)) {
      const maxAttempts = direction === "left" || direction === "right" ? 4 : 6;
      for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
        const placement = createLabelPlacement(object, direction, attempt, labelMultiplier);
        const rect = createLabelRect(object, placement, labelMultiplier);
        if (!occupied.some((entry) => rectsOverlap(entry, rect))) {
          return placement;
        }
      }
    }
    return null;
  }
  function preferredLabelDirections(object, objectMap, sceneWidth, sceneHeight) {
    const parent = object.parentId ? objectMap.get(object.parentId) ?? null : null;
    const vertical = defaultVerticalDirection(object, parent, sceneHeight);
    const oppositeVertical = vertical === "below" ? "above" : "below";
    const horizontal = defaultHorizontalDirection(object, parent, sceneWidth);
    const oppositeHorizontal = horizontal === "right" ? "left" : "right";
    const preferHorizontal = object.object.type === "structure" || object.object.type === "phenomenon" || object.object.placement?.mode === "at" || object.object.placement?.mode === "surface" || object.object.placement?.mode === "free";
    return preferHorizontal ? [horizontal, vertical, oppositeHorizontal, oppositeVertical] : [vertical, horizontal, oppositeVertical, oppositeHorizontal];
  }
  function defaultVerticalDirection(object, parent, sceneHeight) {
    if (parent && Math.abs(object.y - parent.y) > 6) {
      return object.y >= parent.y ? "below" : "above";
    }
    return object.y > sceneHeight * 0.62 ? "above" : "below";
  }
  function defaultHorizontalDirection(object, parent, sceneWidth) {
    if (parent && Math.abs(object.x - parent.x) > 6) {
      return object.x >= parent.x ? "right" : "left";
    }
    return object.x >= sceneWidth / 2 ? "right" : "left";
  }
  function createLabelPlacement(object, direction, attempt, labelMultiplier) {
    const step = 14 * labelMultiplier;
    switch (direction) {
      case "above": {
        const labelY = object.y - (object.radius + 18 * labelMultiplier + attempt * step);
        return {
          x: object.x,
          labelY,
          secondaryY: labelY - 16 * labelMultiplier,
          textAnchor: "middle",
          direction
        };
      }
      case "below": {
        const labelY = object.y + object.radius + 18 * labelMultiplier + attempt * step;
        return {
          x: object.x,
          labelY,
          secondaryY: labelY + 16 * labelMultiplier,
          textAnchor: "middle",
          direction
        };
      }
      case "left": {
        const x = object.x - (object.visualRadius + 16 * labelMultiplier + attempt * step);
        const labelY = object.y - 4 * labelMultiplier;
        return {
          x,
          labelY,
          secondaryY: labelY + 16 * labelMultiplier,
          textAnchor: "end",
          direction
        };
      }
      case "right": {
        const x = object.x + object.visualRadius + 16 * labelMultiplier + attempt * step;
        const labelY = object.y - 4 * labelMultiplier;
        return {
          x,
          labelY,
          secondaryY: labelY + 16 * labelMultiplier,
          textAnchor: "start",
          direction
        };
      }
    }
  }
  function createSceneLayers(orbitVisuals, relations, events, leaders, objects, labels) {
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
        id: "relations",
        renderIds: relations.filter((relation) => !relation.hidden).map((relation) => relation.renderId)
      },
      {
        id: "events",
        renderIds: events.filter((event) => !event.hidden).map((event) => event.renderId)
      },
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
  function createSceneGroups(objects, orbitVisuals, leaders, labels, relationships, labelMultiplier) {
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
      group.contentBounds = calculateGroupBounds(group, objects, orbitVisuals, leaders, labels, labelMultiplier);
    }
    return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label));
  }
  function createSceneSemanticGroups(document2, objects) {
    return [...document2.groups].map((group) => ({
      id: group.id,
      label: group.label,
      summary: group.summary,
      color: group.color,
      tags: [...group.tags],
      hidden: group.hidden,
      objectIds: objects.filter((object) => !object.hidden && object.semanticGroupIds.includes(group.id)).map((object) => object.objectId)
    })).sort((left, right) => left.label.localeCompare(right.label));
  }
  function createSceneRelations(document2, objects) {
    const objectMap = new Map(objects.map((object) => [object.objectId, object]));
    return document2.relations.map((relation) => {
      const from = objectMap.get(relation.from);
      const to = objectMap.get(relation.to);
      return {
        renderId: `${createRenderId(relation.id)}-relation`,
        relationId: relation.id,
        relation,
        fromObjectId: relation.from,
        toObjectId: relation.to,
        x1: from?.x ?? 0,
        y1: from?.y ?? 0,
        x2: to?.x ?? 0,
        y2: to?.y ?? 0,
        hidden: relation.hidden || !from || !to || from.hidden || to.hidden
      };
    }).sort((left, right) => left.relation.id.localeCompare(right.relation.id));
  }
  function createSceneEvents(events, objects, activeEventId) {
    const objectMap = new Map(objects.map((object) => [object.objectId, object]));
    return events.map((event) => {
      const objectIds = [.../* @__PURE__ */ new Set([
        ...event.targetObjectId ? [event.targetObjectId] : [],
        ...event.participantObjectIds
      ])];
      const positions = objectIds.map((objectId) => objectMap.get(objectId)).filter(Boolean);
      const centroidX = positions.length > 0 ? positions.reduce((sum, object) => sum + object.x, 0) / positions.length : 0;
      const centroidY = positions.length > 0 ? positions.reduce((sum, object) => sum + object.y, 0) / positions.length : 0;
      return {
        renderId: `${createRenderId(event.id)}-event`,
        eventId: event.id,
        event,
        objectIds,
        participantIds: [...event.participantObjectIds],
        targetObjectId: event.targetObjectId,
        x: centroidX,
        y: centroidY,
        hidden: event.hidden || positions.length === 0 || positions.every((object) => object.hidden) || activeEventId !== null && event.id !== activeEventId
      };
    }).sort((left, right) => left.event.id.localeCompare(right.event.id));
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
      applyViewpointField(draft, field, value, document2, projection, preset, relationships, objectMap);
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
    const title = document2.system?.title ?? document2.system?.properties.title;
    const label = title ? `${String(title)} Overview` : "Overview";
    const camera = normalizeViewCamera(null);
    const renderProjection = resolveRenderProjection(projection, camera);
    return {
      id: "overview",
      label,
      summary: "Fit the whole system with the current atlas defaults.",
      objectId: null,
      selectedObjectId: null,
      eventIds: [],
      projection,
      renderProjection,
      camera,
      preset,
      rotationDeg: 0,
      scale: null,
      layers: {},
      filter: null,
      generated: true
    };
  }
  function applyViewpointField(draft, field, value, document2, projection, preset, relationships, objectMap) {
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
      case "events":
        draft.eventIds = splitListValue(normalizedValue);
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
      case "camera.azimuth":
        draft.camera = {
          ...draft.camera ?? createEmptyViewCamera(),
          azimuth: parseFiniteNumber(normalizedValue)
        };
        return;
      case "camera.elevation":
        draft.camera = {
          ...draft.camera ?? createEmptyViewCamera(),
          elevation: parseFiniteNumber(normalizedValue)
        };
        return;
      case "camera.roll":
        draft.camera = {
          ...draft.camera ?? createEmptyViewCamera(),
          roll: parseFiniteNumber(normalizedValue)
        };
        return;
      case "camera.distance":
        draft.camera = {
          ...draft.camera ?? createEmptyViewCamera(),
          distance: parsePositiveNumber(normalizedValue)
        };
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
          groupIds: parseViewpointGroups(normalizedValue, document2, relationships, objectMap)
        };
        return;
    }
  }
  function finalizeViewpointDraft(draft, projection, preset, objectMap) {
    const objectId = draft.focus && objectMap.has(draft.focus) ? draft.focus : null;
    const selectedObjectId = draft.select && objectMap.has(draft.select) ? draft.select : objectId;
    const filter = normalizeViewpointFilter(draft.filter);
    const label = draft.label?.trim() || humanizeIdentifier(draft.id);
    const resolvedProjection = draft.projection ?? projection;
    const camera = normalizeViewCamera(draft.camera ?? null);
    const renderProjection = resolveRenderProjection(resolvedProjection, camera);
    return {
      id: draft.id,
      label,
      summary: draft.summary?.trim() || createViewpointSummary(label, objectId, filter),
      objectId,
      selectedObjectId,
      eventIds: [...new Set(draft.eventIds ?? [])],
      projection: resolvedProjection,
      renderProjection,
      camera,
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
  function createEmptyViewCamera() {
    return {
      azimuth: null,
      elevation: null,
      roll: null,
      distance: null
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
    switch (value.toLowerCase()) {
      case "topdown":
        return "topdown";
      case "isometric":
        return "isometric";
      case "orthographic":
        return "orthographic";
      case "perspective":
        return "perspective";
      default:
        return null;
    }
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
      if (rawLayer === "background" || rawLayer === "guides" || rawLayer === "orbits-back" || rawLayer === "orbits-front" || rawLayer === "relations" || rawLayer === "events" || rawLayer === "objects" || rawLayer === "labels" || rawLayer === "metadata") {
        next[rawLayer] = enabled;
      }
    }
    return next;
  }
  function parseViewpointObjectTypes(value) {
    return splitListValue(value).filter((entry) => entry === "star" || entry === "planet" || entry === "moon" || entry === "belt" || entry === "asteroid" || entry === "comet" || entry === "ring" || entry === "structure" || entry === "phenomenon");
  }
  function parseViewpointGroups(value, document2, relationships, objectMap) {
    return splitListValue(value).map((entry) => {
      if (document2.schemaVersion === "2.1" || document2.schemaVersion === "2.5" || document2.groups.some((group) => group.id === entry)) {
        return entry;
      }
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
  function calculateContentBounds(width, height, objects, orbitVisuals, leaders, labels, labelMultiplier) {
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
      includeLabelBounds(label, include, labelMultiplier);
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
  function includeLabelBounds(label, include, labelMultiplier) {
    const bounds = createLabelRectFromText(label.x, label.y, label.secondaryY, label.textAnchor, label.direction, label.label, label.secondaryLabel, labelMultiplier);
    include(bounds.left, bounds.top);
    include(bounds.right, bounds.bottom);
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
    const orbitRadiiPx = resolveOrbitRadiiPx(orbiting, orbitMetricContext);
    orbiting.forEach((child, index) => {
      const orbitGeometry = resolveOrbitGeometry(child, index, orbiting.length, parent, orbitMetricContext, orbitRadiiPx[index] ?? orbitMetricContext.innerPx, context);
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
        pixelSpread: Math.max(stepPx * Math.max(objects.length - 1, 1), stepPx),
        minimumGapPx: stepPx * 0.42
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
      pixelSpread: Math.max(stepPx * Math.max(objects.length - 1, 1), stepPx),
      minimumGapPx: stepPx * 0.42
    };
  }
  function resolveOrbitGeometry(object, index, count, parent, metricContext, orbitRadiusPx, context) {
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
    const semiMajor = orbitRadiusPx;
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
  function resolveOrbitRadiusPx(metric, metricContext) {
    return metricContext.innerPx + metricContext.stepPx * log2(Math.max(metric, 0) + 1);
  }
  function resolveOrbitRadiiPx(objects, metricContext) {
    const radii = [];
    objects.forEach((object, index) => {
      const metric = orbitMetric(object);
      const fallbackRadius = metricContext.innerPx + index * metricContext.stepPx;
      const baseRadius = metric === null ? fallbackRadius : resolveOrbitRadiusPx(metric, metricContext);
      const minimumRadius = index === 0 ? metricContext.innerPx : (radii[index - 1] ?? metricContext.innerPx) + metricContext.minimumGapPx;
      radii.push(Math.max(baseRadius, minimumRadius));
    });
    return radii;
  }
  function orbitMetric(object) {
    if (!object.placement || object.placement.mode !== "orbit") {
      return null;
    }
    return toDistanceMetric(object.placement.semiMajor ?? object.placement.distance ?? null);
  }
  function log2(value) {
    return Math.log(value) / Math.log(2);
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
  function calculateGroupBounds(group, objects, orbitVisuals, leaders, labels, labelMultiplier) {
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
        includeLabelBounds(label, include, labelMultiplier);
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
  function createLabelRect(object, placement, labelMultiplier) {
    return createLabelRectFromText(placement.x, placement.labelY, placement.secondaryY, placement.textAnchor, placement.direction, object.label, object.secondaryLabel, labelMultiplier);
  }
  function createLabelRectFromText(x, labelY, secondaryY, textAnchor, direction, label, secondaryLabel, labelMultiplier) {
    const labelHalfWidth = estimateLabelHalfWidthFromText(label, secondaryLabel, labelMultiplier);
    const labelWidth = labelHalfWidth * 2;
    const topPadding = direction === "above" ? 18 : 12;
    const bottomPadding = direction === "above" ? 8 : 12;
    let left = x - labelHalfWidth;
    let right = x + labelHalfWidth;
    if (textAnchor === "start") {
      left = x;
      right = x + labelWidth;
    } else if (textAnchor === "end") {
      left = x - labelWidth;
      right = x;
    }
    return {
      left,
      right,
      top: Math.min(labelY, secondaryY) - topPadding,
      bottom: Math.max(labelY, secondaryY) + bottomPadding
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
      case "m":
        return value.value / 1e3 / AU_IN_KM;
      case "ly":
        return value.value * LY_IN_AU;
      case "pc":
        return value.value * PC_IN_AU;
      case "kpc":
        return value.value * KPC_IN_AU;
      case "re":
        return value.value * EARTH_RADIUS_IN_KM / AU_IN_KM;
      case "rj":
        return value.value * JUPITER_RADIUS_IN_KM / AU_IN_KM;
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
  function materializeAtlasDocument(document2, options = {}) {
    const system = document2.system ? {
      type: "system",
      id: document2.system.id,
      title: document2.system.title,
      description: document2.system.description,
      epoch: document2.system.epoch,
      referencePlane: document2.system.referencePlane,
      properties: materializeDraftSystemProperties(document2.system),
      info: materializeDraftSystemInfo(document2.system)
    } : null;
    const objects = document2.objects.map(cloneWorldOrbitObject);
    applyEventPoseOverrides(objects, document2.events ?? [], options.activeEventId ?? null);
    return {
      format: "worldorbit",
      version: "1.0",
      schemaVersion: document2.version,
      system,
      groups: structuredClone(document2.groups ?? []),
      relations: structuredClone(document2.relations ?? []),
      events: document2.events.map(cloneWorldOrbitEvent),
      objects
    };
  }
  function cloneWorldOrbitObject(object) {
    return {
      ...object,
      groups: object.groups ? [...object.groups] : void 0,
      resonance: object.resonance ? { ...object.resonance } : object.resonance,
      renderHints: object.renderHints ? { ...object.renderHints } : object.renderHints,
      deriveRules: object.deriveRules ? object.deriveRules.map((rule) => ({ ...rule })) : void 0,
      validationRules: object.validationRules ? object.validationRules.map((rule) => ({ ...rule })) : void 0,
      lockedFields: object.lockedFields ? [...object.lockedFields] : void 0,
      tolerances: object.tolerances ? object.tolerances.map((entry) => ({
        field: entry.field,
        value: entry.value && typeof entry.value === "object" && "value" in entry.value ? { value: entry.value.value, unit: entry.value.unit } : Array.isArray(entry.value) ? [...entry.value] : entry.value
      })) : void 0,
      typedBlocks: object.typedBlocks ? Object.fromEntries(Object.entries(object.typedBlocks).map(([key, block]) => [key, { ...block ?? {} }])) : void 0,
      properties: cloneProperties(object.properties),
      placement: object.placement ? structuredClone(object.placement) : null,
      info: { ...object.info }
    };
  }
  function cloneWorldOrbitEvent(event) {
    return {
      ...event,
      participantObjectIds: [...event.participantObjectIds],
      tags: [...event.tags],
      positions: event.positions.map(cloneWorldOrbitEventPose)
    };
  }
  function cloneWorldOrbitEventPose(pose) {
    return {
      objectId: pose.objectId,
      placement: clonePlacement(pose.placement),
      inner: pose.inner ? { ...pose.inner } : void 0,
      outer: pose.outer ? { ...pose.outer } : void 0,
      epoch: pose.epoch ?? null,
      referencePlane: pose.referencePlane ?? null
    };
  }
  function clonePlacement(placement) {
    return placement ? structuredClone(placement) : null;
  }
  function applyEventPoseOverrides(objects, events, activeEventId) {
    if (!activeEventId) {
      return;
    }
    const event = events.find((entry) => entry.id === activeEventId);
    if (!event) {
      return;
    }
    const objectMap = new Map(objects.map((object) => [object.id, object]));
    const referencedIds = /* @__PURE__ */ new Set([
      ...event.targetObjectId ? [event.targetObjectId] : [],
      ...event.participantObjectIds,
      ...event.positions.map((pose) => pose.objectId)
    ]);
    for (const objectId of referencedIds) {
      const object = objectMap.get(objectId);
      if (!object) {
        continue;
      }
      if (event.epoch) {
        object.epoch = event.epoch;
      }
      if (event.referencePlane) {
        object.referencePlane = event.referencePlane;
      }
    }
    for (const pose of event.positions) {
      const object = objectMap.get(pose.objectId);
      if (!object) {
        continue;
      }
      if (pose.placement) {
        object.placement = clonePlacement(pose.placement);
      }
      if (pose.inner) {
        object.properties.inner = { ...pose.inner };
      }
      if (pose.outer) {
        object.properties.outer = { ...pose.outer };
      }
      if (pose.epoch) {
        object.epoch = pose.epoch;
      }
      if (pose.referencePlane) {
        object.referencePlane = pose.referencePlane;
      }
    }
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
    if (system.description) {
      properties.description = system.description;
    }
    if (system.epoch) {
      properties.epoch = system.epoch;
    }
    if (system.referencePlane) {
      properties.referencePlane = system.referencePlane;
    }
    return properties;
  }
  function materializeDraftSystemInfo(system) {
    const info2 = {
      ...system.atlasMetadata
    };
    if (system.defaults.theme) {
      info2["atlas.theme"] = system.defaults.theme;
    }
    for (const viewpoint of system.viewpoints) {
      const prefix = `viewpoint.${viewpoint.id}`;
      info2[`${prefix}.label`] = viewpoint.label;
      if (viewpoint.summary) {
        info2[`${prefix}.summary`] = viewpoint.summary;
      }
      if (viewpoint.focusObjectId) {
        info2[`${prefix}.focus`] = viewpoint.focusObjectId;
      }
      if (viewpoint.selectedObjectId) {
        info2[`${prefix}.select`] = viewpoint.selectedObjectId;
      }
      if (viewpoint.projection) {
        info2[`${prefix}.projection`] = viewpoint.projection;
      }
      if (viewpoint.preset) {
        info2[`${prefix}.preset`] = viewpoint.preset;
      }
      if (viewpoint.zoom !== null) {
        info2[`${prefix}.zoom`] = String(viewpoint.zoom);
      }
      if (viewpoint.rotationDeg !== 0) {
        info2[`${prefix}.rotation`] = String(viewpoint.rotationDeg);
      }
      if (viewpoint.camera?.azimuth !== null) {
        info2[`${prefix}.camera.azimuth`] = String(viewpoint.camera?.azimuth);
      }
      if (viewpoint.camera?.elevation !== null) {
        info2[`${prefix}.camera.elevation`] = String(viewpoint.camera?.elevation);
      }
      if (viewpoint.camera?.roll !== null) {
        info2[`${prefix}.camera.roll`] = String(viewpoint.camera?.roll);
      }
      if (viewpoint.camera?.distance !== null) {
        info2[`${prefix}.camera.distance`] = String(viewpoint.camera?.distance);
      }
      const serializedLayers = serializeViewpointLayers(viewpoint.layers);
      if (serializedLayers) {
        info2[`${prefix}.layers`] = serializedLayers;
      }
      if (viewpoint.filter?.query) {
        info2[`${prefix}.query`] = viewpoint.filter.query;
      }
      if ((viewpoint.filter?.objectTypes.length ?? 0) > 0) {
        info2[`${prefix}.types`] = viewpoint.filter?.objectTypes.join(" ") ?? "";
      }
      if ((viewpoint.filter?.tags.length ?? 0) > 0) {
        info2[`${prefix}.tags`] = viewpoint.filter?.tags.join(" ") ?? "";
      }
      if ((viewpoint.filter?.groupIds.length ?? 0) > 0) {
        info2[`${prefix}.groups`] = viewpoint.filter?.groupIds.join(" ") ?? "";
      }
      if (viewpoint.events.length > 0) {
        info2[`${prefix}.events`] = viewpoint.events.join(" ");
      }
    }
    for (const annotation of system.annotations) {
      const prefix = `annotation.${annotation.id}`;
      info2[`${prefix}.label`] = annotation.label;
      if (annotation.targetObjectId) {
        info2[`${prefix}.target`] = annotation.targetObjectId;
      }
      info2[`${prefix}.body`] = annotation.body;
      if (annotation.tags.length > 0) {
        info2[`${prefix}.tags`] = annotation.tags.join(" ");
      }
      if (annotation.sourceObjectId) {
        info2[`${prefix}.source`] = annotation.sourceObjectId;
      }
    }
    return info2;
  }
  function serializeViewpointLayers(layers) {
    const tokens = [];
    const orbitFront = layers["orbits-front"];
    const orbitBack = layers["orbits-back"];
    if (orbitFront !== void 0 || orbitBack !== void 0) {
      tokens.push(orbitFront !== false || orbitBack !== false ? "orbits" : "-orbits");
    }
    for (const key of ["background", "guides", "relations", "events", "objects", "labels", "metadata"]) {
      if (layers[key] !== void 0) {
        tokens.push(layers[key] ? key : `-${key}`);
      }
    }
    return tokens.join(" ");
  }

  // packages/core/dist/atlas-utils.js
  var UNIT_PATTERN2 = /^(-?\d+(?:\.\d+)?)(kpc|min|mj|rj|ky|my|gy|au|km|me|re|pc|ly|deg|sol|K|m|s|h|d|y)?$/;
  var BOOLEAN_VALUES2 = /* @__PURE__ */ new Map([
    ["true", true],
    ["false", false],
    ["yes", true],
    ["no", false]
  ]);
  var URL_SCHEME_PATTERN2 = /^[A-Za-z][A-Za-z0-9+.-]*:/;
  function normalizeIdentifier(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function humanizeIdentifier2(value) {
    return value.split(/[-_]+/).filter(Boolean).map((segment) => segment[0].toUpperCase() + segment.slice(1)).join(" ");
  }
  function parseAtlasUnitValue(input, location, fieldKey) {
    const match = input.match(UNIT_PATTERN2);
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
  function tryParseAtlasUnitValue(input) {
    const match = input.match(UNIT_PATTERN2);
    if (!match) {
      return null;
    }
    return {
      value: Number(match[1]),
      unit: match[2] ?? null
    };
  }
  function parseAtlasNumber(input, key, location) {
    const value = Number(input);
    if (!Number.isFinite(value)) {
      throw WorldOrbitError.fromLocation(`Invalid numeric value "${input}" for "${key}"`, location);
    }
    return value;
  }
  function parseAtlasBoolean(input, key, location) {
    const parsed = BOOLEAN_VALUES2.get(input.toLowerCase());
    if (parsed === void 0) {
      throw WorldOrbitError.fromLocation(`Invalid boolean value "${input}" for "${key}"`, location);
    }
    return parsed;
  }
  function parseAtlasAtReference(target, location) {
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
  function validateAtlasImageSource(value, location) {
    if (!value) {
      throw WorldOrbitError.fromLocation('Field "image" must not be empty', location);
    }
    if (value.startsWith("//")) {
      throw WorldOrbitError.fromLocation('Field "image" must use a relative path, root-relative path, or an http/https URL', location);
    }
    const schemeMatch = value.match(URL_SCHEME_PATTERN2);
    if (!schemeMatch) {
      return;
    }
    const scheme = schemeMatch[0].slice(0, -1).toLowerCase();
    if (scheme !== "http" && scheme !== "https") {
      throw WorldOrbitError.fromLocation(`Field "image" does not support the "${scheme}" scheme`, location);
    }
  }
  function normalizeLegacyScalarValue(key, values, location) {
    const schema = getFieldSchema(key);
    if (!schema) {
      throw WorldOrbitError.fromLocation(`Unknown field "${key}"`, location);
    }
    if (schema.arity === "single" && values.length !== 1) {
      throw WorldOrbitError.fromLocation(`Field "${key}" expects exactly one value`, location);
    }
    switch (schema.kind) {
      case "list":
        return values;
      case "boolean":
        return parseAtlasBoolean(singleAtlasValue(values, key, location), key, location);
      case "number":
        return parseAtlasNumber(singleAtlasValue(values, key, location), key, location);
      case "unit":
        return parseAtlasUnitValue(singleAtlasValue(values, key, location), location, key);
      case "string": {
        const value = values.join(" ").trim();
        if (key === "image") {
          validateAtlasImageSource(value, location);
        }
        return value;
      }
    }
  }
  function ensureAtlasFieldSupported(key, objectType, location) {
    const schema = getFieldSchema(key);
    if (!schema) {
      throw WorldOrbitError.fromLocation(`Unknown field "${key}"`, location);
    }
    if (!schema.objectTypes.includes(objectType)) {
      throw WorldOrbitError.fromLocation(`Field "${key}" is not valid on "${objectType}"`, location);
    }
  }
  function singleAtlasValue(values, key, location) {
    if (values.length !== 1) {
      throw WorldOrbitError.fromLocation(`Field "${key}" expects exactly one value`, location);
    }
    return values[0];
  }

  // packages/core/dist/atlas-validate.js
  var SURFACE_TARGET_TYPES2 = /* @__PURE__ */ new Set(["star", "planet", "moon", "asteroid", "comet"]);
  var EARTH_MASSES_PER_SOLAR = 332946.0487;
  var JUPITER_MASSES_PER_SOLAR = 1047.3486;
  var AU_IN_KM2 = 1495978707e-1;
  var EARTH_RADIUS_IN_KM2 = 6371;
  var SOLAR_RADIUS_IN_KM2 = 695700;
  var LY_IN_AU2 = 63241.077;
  var PC_IN_AU2 = 206264.806;
  var KPC_IN_AU2 = 206264806;
  function collectAtlasDiagnostics(document2, sourceSchemaVersion) {
    const diagnostics = [];
    const objectMap = new Map(document2.objects.map((object) => [object.id, object]));
    const groupIds = new Set(document2.groups.map((group) => group.id));
    const eventIds = new Set(document2.events.map((event) => event.id));
    if (!document2.system) {
      diagnostics.push(error("validate.system.required", "Atlas documents must declare exactly one system."));
    }
    const knownIds = /* @__PURE__ */ new Map();
    for (const [kind, ids] of [
      ["group", document2.groups.map((group) => group.id)],
      ["viewpoint", document2.system?.viewpoints.map((viewpoint) => viewpoint.id) ?? []],
      ["annotation", document2.system?.annotations.map((annotation) => annotation.id) ?? []],
      ["relation", document2.relations.map((relation) => relation.id)],
      ["event", document2.events.map((event) => event.id)],
      ["object", document2.objects.map((object) => object.id)]
    ]) {
      for (const id of ids) {
        const previous = knownIds.get(id);
        if (previous) {
          diagnostics.push(error("validate.id.duplicate", `Duplicate ${kind} id "${id}" already used by ${previous}.`));
        } else {
          knownIds.set(id, kind);
        }
      }
    }
    for (const relation of document2.relations) {
      validateRelation(relation, objectMap, diagnostics);
    }
    for (const viewpoint of document2.system?.viewpoints ?? []) {
      validateViewpoint(viewpoint, groupIds, eventIds, sourceSchemaVersion, diagnostics, objectMap);
    }
    for (const object of document2.objects) {
      validateObject(object, document2.system, objectMap, groupIds, diagnostics);
    }
    for (const event of document2.events) {
      validateEvent(event, document2.system, objectMap, diagnostics);
    }
    return diagnostics;
  }
  function validateRelation(relation, objectMap, diagnostics) {
    if (!relation.from) {
      diagnostics.push(error("validate.relation.from.required", `Relation "${relation.id}" is missing a "from" target.`));
    } else if (!objectMap.has(relation.from)) {
      diagnostics.push(error("validate.relation.from.unknown", `Unknown relation source "${relation.from}" on "${relation.id}".`));
    }
    if (!relation.to) {
      diagnostics.push(error("validate.relation.to.required", `Relation "${relation.id}" is missing a "to" target.`));
    } else if (!objectMap.has(relation.to)) {
      diagnostics.push(error("validate.relation.to.unknown", `Unknown relation target "${relation.to}" on "${relation.id}".`));
    }
    if (!relation.kind) {
      diagnostics.push(error("validate.relation.kind.required", `Relation "${relation.id}" is missing a "kind" value.`));
    }
  }
  function validateViewpoint(viewpoint, groupIds, eventIds, sourceSchemaVersion, diagnostics, objectMap) {
    const filter = viewpoint.filter;
    if (sourceSchemaVersion === "2.1" || sourceSchemaVersion === "2.5") {
      if (filter) {
        for (const groupId of filter.groupIds) {
          if (!groupIds.has(groupId)) {
            diagnostics.push(warn("validate.viewpoint.group.unknown", `Unknown group "${groupId}" in viewpoint "${viewpoint.id}".`, void 0, `viewpoint.${viewpoint.id}.groups`));
          }
        }
      }
      for (const eventId of viewpoint.events ?? []) {
        if (!eventIds.has(eventId)) {
          diagnostics.push(warn("validate.viewpoint.event.unknown", `Unknown event "${eventId}" in viewpoint "${viewpoint.id}".`, void 0, `viewpoint.${viewpoint.id}.events`));
        }
      }
    }
    validateProjection(viewpoint.projection, diagnostics, `viewpoint.${viewpoint.id}.projection`, viewpoint.id);
    validateCamera(viewpoint.camera, viewpoint.projection, viewpoint.rotationDeg, diagnostics, viewpoint.id, viewpoint.focusObjectId, viewpoint.selectedObjectId, filter, objectMap);
  }
  function validateObject(object, system, objectMap, groupIds, diagnostics) {
    const placement = object.placement;
    const orbitPlacement = placement?.mode === "orbit" ? placement : null;
    const parentObject = placement?.mode === "orbit" ? objectMap.get(placement.target) ?? null : null;
    if (object.groups) {
      for (const groupId of object.groups) {
        if (!groupIds.has(groupId)) {
          diagnostics.push(warn("validate.group.unknown", `Unknown group "${groupId}" on "${object.id}".`, object.id, "groups"));
        }
      }
    }
    if (typeof object.epoch === "string" && !object.epoch.trim()) {
      diagnostics.push(warn("validate.epoch.empty", `Object "${object.id}" defines an empty epoch string.`, object.id, "epoch"));
    }
    if (typeof object.referencePlane === "string" && !object.referencePlane.trim()) {
      diagnostics.push(warn("validate.referencePlane.empty", `Object "${object.id}" defines an empty reference plane string.`, object.id, "referencePlane"));
    }
    if (orbitPlacement) {
      if (!objectMap.has(orbitPlacement.target)) {
        diagnostics.push(error("validate.orbit.target.unknown", `Unknown placement target "${orbitPlacement.target}" on "${object.id}".`, object.id, "orbit"));
      }
      if (orbitPlacement.distance && orbitPlacement.semiMajor) {
        diagnostics.push(error("validate.orbit.distanceConflict", `Object "${object.id}" cannot declare both "distance" and "semiMajor".`, object.id, "distance"));
      }
      if (orbitPlacement.phase && !object.epoch && !system?.epoch) {
        diagnostics.push(warn("validate.phase.epochMissing", `Object "${object.id}" sets "phase" without an object or system epoch.`, object.id, "phase"));
      }
      if (orbitPlacement.inclination && !object.referencePlane && !system?.referencePlane) {
        diagnostics.push(warn("validate.inclination.referencePlaneMissing", `Object "${object.id}" sets "inclination" without an object or system reference plane.`, object.id, "inclination"));
      }
      if (orbitPlacement.period && !massInSolar(parentObject?.properties.mass)) {
        diagnostics.push(warn("validate.period.massMissing", `Object "${object.id}" sets "period" but its central mass cannot be derived.`, object.id, "period"));
      }
    }
    if (placement?.mode === "surface") {
      const target = objectMap.get(placement.target);
      if (!target) {
        diagnostics.push(error("validate.surface.target.unknown", `Unknown placement target "${placement.target}" on "${object.id}".`, object.id, "surface"));
      } else if (!SURFACE_TARGET_TYPES2.has(target.type)) {
        diagnostics.push(error("validate.surface.target.invalid", `Surface target "${placement.target}" on "${object.id}" is not surface-capable.`, object.id, "surface"));
      }
    }
    if (placement?.mode === "at") {
      if (object.type !== "structure" && object.type !== "phenomenon") {
        diagnostics.push(error("validate.at.objectType", `Only structures and phenomena may use "at" placement; found "${object.type}" on "${object.id}".`, object.id, "at"));
      }
      if (!validateAtTarget(object, objectMap, diagnostics)) {
        diagnostics.push(error("validate.at.target.unknown", `Unknown at-reference target "${placement.target}" on "${object.id}".`, object.id, "at"));
      }
    }
    if (object.resonance) {
      const target = objectMap.get(object.resonance.targetObjectId);
      if (!target) {
        diagnostics.push(error("validate.resonance.target.unknown", `Unknown resonance target "${object.resonance.targetObjectId}" on "${object.id}".`, object.id, "resonance"));
      } else if (object.placement?.mode !== "orbit" || target.placement?.mode !== "orbit" || object.placement.target !== target.placement.target) {
        diagnostics.push(warn("validate.resonance.orbitMismatch", `Resonance target "${object.resonance.targetObjectId}" on "${object.id}" does not share a compatible orbital parent.`, object.id, "resonance"));
      }
    }
    for (const rule of object.deriveRules ?? []) {
      if (rule.field !== "period" || rule.strategy !== "kepler") {
        diagnostics.push(warn("validate.derive.unsupported", `Unsupported derive rule "${rule.field} ${rule.strategy}" on "${object.id}".`, object.id, "derive"));
        continue;
      }
      const derivedPeriodDays = keplerPeriodDays(object, parentObject);
      if (derivedPeriodDays === null) {
        diagnostics.push(warn("validate.derive.inputsMissing", `Object "${object.id}" requests "derive period kepler" but lacks enough input data.`, object.id, "derive"));
        continue;
      }
      if (!orbitPlacement?.period) {
        diagnostics.push(info("validate.derive.period.available", `Object "${object.id}" can derive a Kepler period of ${formatDays(derivedPeriodDays)}.`, object.id, "derive"));
      }
    }
    for (const rule of object.validationRules ?? []) {
      if (rule.rule !== "kepler") {
        diagnostics.push(warn("validate.rule.unsupported", `Unsupported validation rule "${rule.rule}" on "${object.id}".`, object.id, "validate"));
        continue;
      }
      const actualPeriodDays = durationInDays(orbitPlacement?.period);
      const derivedPeriodDays = keplerPeriodDays(object, parentObject);
      if (actualPeriodDays === null || derivedPeriodDays === null) {
        continue;
      }
      const toleranceDays = toleranceForField(object, "period");
      if (Math.abs(actualPeriodDays - derivedPeriodDays) > toleranceDays) {
        diagnostics.push(error("validate.kepler.mismatch", `Object "${object.id}" fails Kepler validation for "period".`, object.id, "validate"));
      }
    }
  }
  function validateEvent(event, system, objectMap, diagnostics) {
    const fieldPrefix = `event.${event.id}`;
    const referencedIds = /* @__PURE__ */ new Set();
    if (!event.kind.trim()) {
      diagnostics.push(error("validate.event.kind.required", `Event "${event.id}" is missing a "kind" value.`, void 0, `${fieldPrefix}.kind`));
    }
    if (typeof event.epoch === "string" && !event.epoch.trim()) {
      diagnostics.push(warn("validate.event.epoch.empty", `Event "${event.id}" defines an empty epoch string.`, void 0, `${fieldPrefix}.epoch`));
    }
    if (typeof event.referencePlane === "string" && !event.referencePlane.trim()) {
      diagnostics.push(warn("validate.event.referencePlane.empty", `Event "${event.id}" defines an empty reference plane string.`, void 0, `${fieldPrefix}.referencePlane`));
    }
    if (!event.targetObjectId && event.participantObjectIds.length === 0) {
      diagnostics.push(error("validate.event.references.required", `Event "${event.id}" must define a "target" or at least one participant.`, void 0, `${fieldPrefix}.participants`));
    }
    if (event.targetObjectId) {
      referencedIds.add(event.targetObjectId);
      if (!objectMap.has(event.targetObjectId)) {
        diagnostics.push(error("validate.event.target.unknown", `Unknown event target "${event.targetObjectId}" on "${event.id}".`, void 0, `${fieldPrefix}.target`));
      }
    }
    const seenParticipants = /* @__PURE__ */ new Set();
    for (const participantId of event.participantObjectIds) {
      referencedIds.add(participantId);
      if (seenParticipants.has(participantId)) {
        diagnostics.push(warn("validate.event.participants.duplicate", `Event "${event.id}" repeats participant "${participantId}".`, void 0, `${fieldPrefix}.participants`));
        continue;
      }
      seenParticipants.add(participantId);
      if (!objectMap.has(participantId)) {
        diagnostics.push(error("validate.event.participants.unknown", `Unknown event participant "${participantId}" on "${event.id}".`, void 0, `${fieldPrefix}.participants`));
      }
    }
    if (event.targetObjectId && event.participantObjectIds.length > 0 && !event.participantObjectIds.includes(event.targetObjectId)) {
      diagnostics.push(warn("validate.event.target.notParticipant", `Event "${event.id}" defines a target outside its participants list.`, void 0, `${fieldPrefix}.target`));
    }
    if (event.positions.length === 0) {
      diagnostics.push(warn("validate.event.positions.missing", `Event "${event.id}" has no positions block and cannot drive a scene snapshot.`, void 0, `${fieldPrefix}.positions`));
    }
    if (/(?:^|[-_])(solar-eclipse|lunar-eclipse|transit|occultation)(?:$|[-_])/.test(event.kind) && referencedIds.size < 3) {
      diagnostics.push(warn("validate.event.kind.participants", `Event "${event.id}" looks like an eclipse or transit but references fewer than three bodies.`, void 0, `${fieldPrefix}.participants`));
    }
    const poseIds = /* @__PURE__ */ new Set();
    for (const pose of event.positions) {
      const poseFieldPrefix = `${fieldPrefix}.pose.${pose.objectId}`;
      if (poseIds.has(pose.objectId)) {
        diagnostics.push(error("validate.event.pose.duplicate", `Event "${event.id}" defines "${pose.objectId}" more than once in positions.`, void 0, poseFieldPrefix));
        continue;
      }
      poseIds.add(pose.objectId);
      const object = objectMap.get(pose.objectId);
      if (!object) {
        diagnostics.push(error("validate.event.pose.object.unknown", `Unknown event pose object "${pose.objectId}" on "${event.id}".`, void 0, poseFieldPrefix));
        continue;
      }
      if (!referencedIds.has(pose.objectId)) {
        diagnostics.push(warn("validate.event.pose.unreferenced", `Event pose "${pose.objectId}" on "${event.id}" is not listed in target/participants.`, void 0, poseFieldPrefix));
      }
      validateEventPose(pose, object, event, system, objectMap, diagnostics, poseFieldPrefix, event.id);
    }
    const missingPoseIds = [...referencedIds].filter((objectId) => !poseIds.has(objectId));
    if (event.positions.length > 0 && missingPoseIds.length > 0) {
      diagnostics.push(warn("validate.event.positions.partial", `Event "${event.id}" leaves ${missingPoseIds.length} referenced object(s) on their base placement.`, void 0, `${fieldPrefix}.positions`));
    }
  }
  function validateEventPose(pose, object, event, system, objectMap, diagnostics, fieldPrefix, eventId) {
    const placement = pose.placement;
    if (!placement) {
      diagnostics.push(error("validate.event.pose.placement.required", `Event "${eventId}" pose "${pose.objectId}" is missing a placement mode.`, void 0, fieldPrefix));
      return;
    }
    if (placement.mode === "orbit") {
      if (!objectMap.has(placement.target)) {
        diagnostics.push(error("validate.event.pose.orbit.target.unknown", `Unknown event orbit target "${placement.target}" on "${eventId}:${pose.objectId}".`, void 0, `${fieldPrefix}.orbit`));
      }
      if (placement.distance && placement.semiMajor) {
        diagnostics.push(error("validate.event.pose.orbit.distanceConflict", `Event "${eventId}" pose "${pose.objectId}" cannot declare both "distance" and "semiMajor".`, void 0, `${fieldPrefix}.distance`));
      }
      if (placement.phase && !resolveEffectiveEpoch(system, object, event, pose)) {
        diagnostics.push(warn("validate.event.pose.phase.epochMissing", `Event "${eventId}" pose "${pose.objectId}" sets "phase" without an effective epoch.`, void 0, `${fieldPrefix}.phase`));
      }
      if (placement.inclination && !resolveEffectiveReferencePlane(system, object, event, pose)) {
        diagnostics.push(warn("validate.event.pose.inclination.referencePlaneMissing", `Event "${eventId}" pose "${pose.objectId}" sets "inclination" without an effective reference plane.`, void 0, `${fieldPrefix}.inclination`));
      }
      if (placement.period && !massInSolar(objectMap.get(placement.target)?.properties.mass)) {
        diagnostics.push(warn("validate.event.pose.period.massMissing", `Event "${eventId}" pose "${pose.objectId}" sets "period" but its central mass cannot be derived.`, void 0, `${fieldPrefix}.period`));
      }
      return;
    }
    if (placement.mode === "surface") {
      const target = objectMap.get(placement.target);
      if (!target) {
        diagnostics.push(error("validate.event.pose.surface.target.unknown", `Unknown event surface target "${placement.target}" on "${eventId}:${pose.objectId}".`, void 0, `${fieldPrefix}.surface`));
      } else if (!SURFACE_TARGET_TYPES2.has(target.type)) {
        diagnostics.push(error("validate.event.pose.surface.target.invalid", `Event surface target "${placement.target}" on "${eventId}:${pose.objectId}" is not surface-capable.`, void 0, `${fieldPrefix}.surface`));
      }
      return;
    }
    if (placement.mode === "at") {
      if (object.type !== "structure" && object.type !== "phenomenon") {
        diagnostics.push(error("validate.event.pose.at.objectType", `Only structures and phenomena may use "at" placement in events; found "${object.type}" on "${eventId}:${pose.objectId}".`, void 0, `${fieldPrefix}.at`));
      }
      const reference = placement.reference;
      if (reference.kind === "named" && !objectMap.has(reference.name)) {
        diagnostics.push(error("validate.event.pose.at.target.unknown", `Unknown event at-reference target "${placement.target}" on "${eventId}:${pose.objectId}".`, void 0, `${fieldPrefix}.at`));
      } else if (reference.kind === "anchor" && !objectMap.has(reference.objectId)) {
        diagnostics.push(error("validate.event.pose.anchor.target.unknown", `Unknown event anchor target "${reference.objectId}" on "${eventId}:${pose.objectId}".`, void 0, `${fieldPrefix}.at`));
      } else if (reference.kind === "lagrange") {
        if (!objectMap.has(reference.primary)) {
          diagnostics.push(error("validate.event.pose.lagrange.primary.unknown", `Unknown event Lagrange target "${reference.primary}" on "${eventId}:${pose.objectId}".`, void 0, `${fieldPrefix}.at`));
        } else if (reference.secondary && !objectMap.has(reference.secondary)) {
          diagnostics.push(error("validate.event.pose.lagrange.secondary.unknown", `Unknown event Lagrange target "${reference.secondary}" on "${eventId}:${pose.objectId}".`, void 0, `${fieldPrefix}.at`));
        }
      }
    }
  }
  function validateAtTarget(object, objectMap, diagnostics) {
    const reference = object.placement?.mode === "at" ? object.placement.reference : null;
    if (!reference) {
      return true;
    }
    if (reference.kind === "named") {
      return objectMap.has(reference.name);
    }
    if (reference.kind === "anchor") {
      if (!objectMap.has(reference.objectId)) {
        diagnostics.push(error("validate.anchor.target.unknown", `Unknown anchor target "${reference.objectId}" on "${object.id}".`, object.id, "at"));
        return false;
      }
      return true;
    }
    if (!objectMap.has(reference.primary)) {
      diagnostics.push(error("validate.lagrange.primary.unknown", `Unknown Lagrange reference "${reference.primary}" on "${object.id}".`, object.id, "at"));
      return false;
    }
    if (reference.secondary && !objectMap.has(reference.secondary)) {
      diagnostics.push(error("validate.lagrange.secondary.unknown", `Unknown Lagrange reference "${reference.secondary}" on "${object.id}".`, object.id, "at"));
      return false;
    }
    return true;
  }
  function keplerPeriodDays(object, parentObject) {
    const placement = object.placement;
    if (!placement || placement.mode !== "orbit") {
      return null;
    }
    const semiMajorAu = distanceInAu(placement.semiMajor ?? placement.distance);
    const centralMassSolar = massInSolar(parentObject?.properties.mass);
    if (semiMajorAu === null || centralMassSolar === null || centralMassSolar <= 0) {
      return null;
    }
    const periodYears = Math.sqrt(semiMajorAu ** 3 / centralMassSolar);
    return periodYears * 365.25;
  }
  function distanceInAu(value) {
    if (!value)
      return null;
    switch (value.unit) {
      case null:
      case "au":
        return value.value;
      case "km":
        return value.value / AU_IN_KM2;
      case "m":
        return value.value / (AU_IN_KM2 * 1e3);
      case "ly":
        return value.value * LY_IN_AU2;
      case "pc":
        return value.value * PC_IN_AU2;
      case "kpc":
        return value.value * KPC_IN_AU2;
      case "re":
        return value.value * EARTH_RADIUS_IN_KM2 / AU_IN_KM2;
      case "sol":
        return value.value * SOLAR_RADIUS_IN_KM2 / AU_IN_KM2;
      default:
        return null;
    }
  }
  function massInSolar(value) {
    if (!value || typeof value !== "object" || !("value" in value)) {
      return null;
    }
    const unitValue = value;
    switch (unitValue.unit) {
      case null:
      case "sol":
        return unitValue.value;
      case "me":
        return unitValue.value / EARTH_MASSES_PER_SOLAR;
      case "mj":
        return unitValue.value / JUPITER_MASSES_PER_SOLAR;
      default:
        return null;
    }
  }
  function durationInDays(value) {
    if (!value)
      return null;
    switch (value.unit) {
      case null:
      case "d":
        return value.value;
      case "s":
        return value.value / 86400;
      case "min":
        return value.value / 1440;
      case "h":
        return value.value / 24;
      case "y":
        return value.value * 365.25;
      case "ky":
        return value.value * 365250;
      case "my":
        return value.value * 36525e4;
      case "gy":
        return value.value * 36525e7;
      default:
        return null;
    }
  }
  function validateProjection(projection, diagnostics, field, viewpointId) {
    if (projection !== "topdown" && projection !== "isometric" && projection !== "orthographic" && projection !== "perspective") {
      diagnostics.push(error("validate.viewpoint.projection.invalid", `Unknown projection "${String(projection)}" in viewpoint "${viewpointId}".`, void 0, field));
    }
  }
  function validateCamera(camera, projection, rotationDeg, diagnostics, viewpointId, focusObjectId, selectedObjectId, filter, objectMap) {
    if (!camera) {
      return;
    }
    const prefix = `viewpoint.${viewpointId}.camera`;
    for (const [key, value] of [
      ["azimuth", camera.azimuth],
      ["elevation", camera.elevation],
      ["roll", camera.roll],
      ["distance", camera.distance]
    ]) {
      if (value !== null && (!Number.isFinite(value) || key === "distance" && value <= 0)) {
        diagnostics.push(error("validate.viewpoint.camera.invalid", `Invalid camera ${key} "${String(value)}" in viewpoint "${viewpointId}".`, void 0, `${prefix}.${key}`));
      }
    }
    if (camera.distance !== null && projection !== "perspective") {
      diagnostics.push(warn("validate.viewpoint.camera.distance.partialEffect", `Camera "distance" only has a semantic effect in perspective viewpoints; "${viewpointId}" uses "${projection}".`, void 0, `${prefix}.distance`));
    }
    if (projection === "topdown" && (camera.elevation !== null || camera.roll !== null)) {
      diagnostics.push(warn("validate.viewpoint.camera.topdownPartial", `Camera elevation/roll on topdown viewpoint "${viewpointId}" are currently stored for future 3D use and only partially affect 2D rendering.`, void 0, prefix));
    }
    if (projection === "isometric" && camera.elevation !== null) {
      diagnostics.push(info("validate.viewpoint.camera.isometricStored", `Camera elevation on isometric viewpoint "${viewpointId}" is preserved semantically for future 3D rendering.`, void 0, `${prefix}.elevation`));
    }
    if (camera.azimuth !== null && camera.azimuth !== 0 && rotationDeg !== 0) {
      diagnostics.push(warn("validate.viewpoint.rotation.cameraOverlap", `Viewpoint "${viewpointId}" uses camera.azimuth; keep "rotation" only for 2D screen rotation to avoid ambiguity.`, void 0, `${prefix}.azimuth`));
    }
    const hasAnchor = focusObjectId !== null && objectMap.has(focusObjectId) || selectedObjectId !== null && objectMap.has(selectedObjectId) || !!filter;
    if (!hasAnchor) {
      diagnostics.push(info("validate.viewpoint.camera.anchorMissing", `Viewpoint "${viewpointId}" stores camera settings without a focus object, selection, or filter anchor.`, void 0, prefix));
    }
  }
  function resolveEffectiveEpoch(system, object, event, pose) {
    return normalizeOptionalContextString(pose?.epoch) ?? normalizeOptionalContextString(event?.epoch) ?? normalizeOptionalContextString(object.epoch) ?? normalizeOptionalContextString(system?.epoch) ?? null;
  }
  function resolveEffectiveReferencePlane(system, object, event, pose) {
    return normalizeOptionalContextString(pose?.referencePlane) ?? normalizeOptionalContextString(event?.referencePlane) ?? normalizeOptionalContextString(object.referencePlane) ?? normalizeOptionalContextString(system?.referencePlane) ?? null;
  }
  function normalizeOptionalContextString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }
  function toleranceForField(object, field) {
    const tolerance = object.tolerances?.find((entry) => entry.field === field)?.value;
    if (typeof tolerance === "number") {
      return tolerance;
    }
    if (tolerance && typeof tolerance === "object" && "value" in tolerance) {
      return durationInDays(tolerance) ?? 0;
    }
    return 0;
  }
  function formatDays(days) {
    return `${Math.round(days * 100) / 100}d`;
  }
  function error(code, message, objectId, field) {
    return { code, severity: "error", source: "validate", message, objectId, field };
  }
  function warn(code, message, objectId, field) {
    return { code, severity: "warning", source: "validate", message, objectId, field };
  }
  function info(code, message, objectId, field) {
    return { code, severity: "info", source: "validate", message, objectId, field };
  }

  // packages/core/dist/draft-parse.js
  var STRUCTURED_TYPED_BLOCKS = /* @__PURE__ */ new Set([
    "climate",
    "habitability",
    "settlement"
  ]);
  var DRAFT_OBJECT_FIELD_SPECS = /* @__PURE__ */ new Map();
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
    "cycle"
  ]) {
    const schema = getFieldSchema(key);
    if (schema) {
      DRAFT_OBJECT_FIELD_SPECS.set(key, {
        key,
        version: "2.0",
        inlineMode: schema.arity === "multiple" ? "multiple" : "single",
        allowRepeat: false,
        legacySchema: schema
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
    { key: "tolerance", inlineMode: "pair", allowRepeat: true }
  ]) {
    DRAFT_OBJECT_FIELD_SPECS.set(spec.key, {
      key: spec.key,
      version: "2.1",
      inlineMode: spec.inlineMode,
      allowRepeat: spec.allowRepeat
    });
  }
  var DRAFT_OBJECT_FIELD_KEYS = new Set(DRAFT_OBJECT_FIELD_SPECS.keys());
  var EVENT_POSE_FIELD_KEYS = /* @__PURE__ */ new Set([
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
    "referencePlane"
  ]);
  function parseWorldOrbitAtlas(source) {
    return parseAtlasSource(source);
  }
  function parseAtlasSource(source, forcedOutputVersion) {
    const prepared = preprocessAtlasSource(source);
    const lines = prepared.source.split(/\r?\n/);
    const diagnostics = [];
    let sawSchemaHeader = false;
    let sourceSchemaVersion = "2.0";
    let system = null;
    let section = null;
    const objectNodes = [];
    const groups = [];
    const relations = [];
    const events = [];
    const eventPoseNodes = /* @__PURE__ */ new Map();
    let sawDefaults = false;
    let sawAtlas = false;
    const viewpointIds = /* @__PURE__ */ new Set();
    const annotationIds = /* @__PURE__ */ new Set();
    const groupIds = /* @__PURE__ */ new Set();
    const relationIds = /* @__PURE__ */ new Set();
    const eventIds = /* @__PURE__ */ new Set();
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
        sourceSchemaVersion = assertDraftSchemaHeader(tokens, lineNumber);
        sawSchemaHeader = true;
        if (prepared.comments.length > 0 && isSchemaOlderThan(sourceSchemaVersion, "2.1")) {
          diagnostics.push({
            code: "parse.schema21.commentCompatibility",
            severity: "warning",
            source: "parse",
            message: `Comments require schema 2.1; parsed in compatibility mode because the document header is "schema ${sourceSchemaVersion}".`,
            line: prepared.comments[0].line,
            column: prepared.comments[0].column
          });
        }
        continue;
      }
      if (indent === 0) {
        section = startTopLevelSection(tokens, lineNumber, sourceSchemaVersion, diagnostics, system, objectNodes, groups, relations, events, eventPoseNodes, viewpointIds, annotationIds, groupIds, relationIds, eventIds, { sawDefaults, sawAtlas });
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
    const objects = objectNodes.map((node) => normalizeDraftObject(node, sourceSchemaVersion, diagnostics));
    const normalizedEvents = events.map((event) => normalizeDraftEvent(event, eventPoseNodes.get(event.id) ?? []));
    const outputVersion = forcedOutputVersion ?? (sourceSchemaVersion === "2.0-draft" ? "2.0" : sourceSchemaVersion);
    const baseDocument = {
      format: "worldorbit",
      sourceVersion: "1.0",
      system,
      groups,
      relations,
      events: normalizedEvents,
      objects,
      diagnostics
    };
    if (outputVersion === "2.0-draft") {
      const document3 = {
        ...baseDocument,
        version: "2.0-draft",
        schemaVersion: "2.0-draft"
      };
      document3.diagnostics.push(...collectAtlasDiagnostics(document3, sourceSchemaVersion));
      return document3;
    }
    const document2 = {
      ...baseDocument,
      version: outputVersion,
      schemaVersion: outputVersion
    };
    if (sourceSchemaVersion === "2.0-draft") {
      document2.diagnostics.push({
        code: "load.schema.deprecatedDraft",
        severity: "warning",
        source: "upgrade",
        message: 'Source header "schema 2.0-draft" is deprecated; canonical v2 documents now use "schema 2.0".'
      });
    }
    document2.diagnostics.push(...collectAtlasDiagnostics(document2, sourceSchemaVersion));
    return document2;
  }
  function assertDraftSchemaHeader(tokens, line) {
    if (tokens.length !== 2 || tokens[0].value.toLowerCase() !== "schema" || !["2.0-draft", "2.0", "2.1", "2.5"].includes(tokens[1].value.toLowerCase())) {
      throw new WorldOrbitError('Expected atlas header "schema 2.0", "schema 2.1", "schema 2.5", or legacy "schema 2.0-draft"', line, tokens[0]?.column ?? 1);
    }
    const version = tokens[1].value.toLowerCase();
    return version === "2.5" ? "2.5" : version === "2.1" ? "2.1" : version === "2.0-draft" ? "2.0-draft" : "2.0";
  }
  function startTopLevelSection(tokens, line, sourceSchemaVersion, diagnostics, system, objectNodes, groups, relations, events, eventPoseNodes, viewpointIds, annotationIds, groupIds, relationIds, eventIds, flags) {
    const keyword = tokens[0]?.value.toLowerCase();
    switch (keyword) {
      case "system":
        if (system) {
          throw new WorldOrbitError('Atlas section "system" may only appear once', line, tokens[0].column);
        }
        return startSystemSection(tokens, line, sourceSchemaVersion, diagnostics);
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
          sourceSchemaVersion,
          diagnostics,
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
        return startViewpointSection(tokens, line, system, viewpointIds, sourceSchemaVersion, diagnostics);
      case "annotation":
        if (!system) {
          throw new WorldOrbitError('Atlas section "annotation" requires a preceding system declaration', line, tokens[0].column);
        }
        return startAnnotationSection(tokens, line, system, annotationIds);
      case "group":
        warnIfSchema21Feature(sourceSchemaVersion, diagnostics, "group", { line, column: tokens[0].column });
        return startGroupSection(tokens, line, groups, groupIds);
      case "relation":
        warnIfSchema21Feature(sourceSchemaVersion, diagnostics, "relation", { line, column: tokens[0].column });
        return startRelationSection(tokens, line, relations, relationIds);
      case "event":
        warnIfSchema21Feature(sourceSchemaVersion, diagnostics, "event", { line, column: tokens[0].column });
        return startEventSection(tokens, line, events, eventPoseNodes, eventIds, sourceSchemaVersion, diagnostics);
      case "object":
        return startObjectSection(tokens, line, sourceSchemaVersion, diagnostics, objectNodes);
      default:
        throw new WorldOrbitError(`Unknown atlas section "${tokens[0]?.value ?? ""}"`, line, tokens[0]?.column ?? 1);
    }
  }
  function startSystemSection(tokens, line, sourceSchemaVersion, diagnostics) {
    if (tokens.length !== 2) {
      throw new WorldOrbitError("Invalid atlas system declaration", line, tokens[0]?.column ?? 1);
    }
    const system = {
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
        theme: null
      },
      atlasMetadata: {},
      viewpoints: [],
      annotations: []
    };
    return {
      kind: "system",
      system,
      sourceSchemaVersion,
      diagnostics,
      seenFields: /* @__PURE__ */ new Set()
    };
  }
  function startViewpointSection(tokens, line, system, viewpointIds, sourceSchemaVersion, diagnostics) {
    if (tokens.length !== 2) {
      throw new WorldOrbitError("Invalid viewpoint declaration", line, tokens[0]?.column ?? 1);
    }
    const id = normalizeIdentifier(tokens[1].value);
    if (!id) {
      throw new WorldOrbitError("Viewpoint id must not be empty", line, tokens[1].column);
    }
    if (viewpointIds.has(id)) {
      throw new WorldOrbitError(`Duplicate viewpoint id "${id}"`, line, tokens[1].column);
    }
    const viewpoint = {
      id,
      label: humanizeIdentifier2(id),
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
      filter: null
    };
    system.viewpoints.push(viewpoint);
    viewpointIds.add(id);
    return {
      kind: "viewpoint",
      viewpoint,
      sourceSchemaVersion,
      diagnostics,
      seenFields: /* @__PURE__ */ new Set(),
      inFilter: false,
      filterIndent: null,
      seenFilterFields: /* @__PURE__ */ new Set(),
      inCamera: false,
      cameraIndent: null,
      seenCameraFields: /* @__PURE__ */ new Set()
    };
  }
  function startAnnotationSection(tokens, line, system, annotationIds) {
    if (tokens.length !== 2) {
      throw new WorldOrbitError("Invalid annotation declaration", line, tokens[0]?.column ?? 1);
    }
    const id = normalizeIdentifier(tokens[1].value);
    if (!id) {
      throw new WorldOrbitError("Annotation id must not be empty", line, tokens[1].column);
    }
    if (annotationIds.has(id)) {
      throw new WorldOrbitError(`Duplicate annotation id "${id}"`, line, tokens[1].column);
    }
    const annotation = {
      id,
      label: humanizeIdentifier2(id),
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
  function startGroupSection(tokens, line, groups, groupIds) {
    if (tokens.length !== 2) {
      throw new WorldOrbitError("Invalid group declaration", line, tokens[0]?.column ?? 1);
    }
    const id = normalizeIdentifier(tokens[1].value);
    if (!id) {
      throw new WorldOrbitError("Group id must not be empty", line, tokens[1].column);
    }
    if (groupIds.has(id)) {
      throw new WorldOrbitError(`Duplicate group id "${id}"`, line, tokens[1].column);
    }
    const group = {
      id,
      label: humanizeIdentifier2(id),
      summary: "",
      color: null,
      tags: [],
      hidden: false
    };
    groups.push(group);
    groupIds.add(id);
    return {
      kind: "group",
      group,
      seenFields: /* @__PURE__ */ new Set()
    };
  }
  function startRelationSection(tokens, line, relations, relationIds) {
    if (tokens.length !== 2) {
      throw new WorldOrbitError("Invalid relation declaration", line, tokens[0]?.column ?? 1);
    }
    const id = normalizeIdentifier(tokens[1].value);
    if (!id) {
      throw new WorldOrbitError("Relation id must not be empty", line, tokens[1].column);
    }
    if (relationIds.has(id)) {
      throw new WorldOrbitError(`Duplicate relation id "${id}"`, line, tokens[1].column);
    }
    const relation = {
      id,
      from: "",
      to: "",
      kind: "",
      label: null,
      summary: null,
      tags: [],
      color: null,
      hidden: false
    };
    relations.push(relation);
    relationIds.add(id);
    return {
      kind: "relation",
      relation,
      seenFields: /* @__PURE__ */ new Set()
    };
  }
  function startEventSection(tokens, line, events, eventPoseNodes, eventIds, sourceSchemaVersion, diagnostics) {
    if (tokens.length !== 2) {
      throw new WorldOrbitError("Invalid event declaration", line, tokens[0]?.column ?? 1);
    }
    const id = normalizeIdentifier(tokens[1].value);
    if (!id) {
      throw new WorldOrbitError("Event id must not be empty", line, tokens[1].column);
    }
    if (eventIds.has(id)) {
      throw new WorldOrbitError(`Duplicate event id "${id}"`, line, tokens[1].column);
    }
    const event = {
      id,
      kind: "",
      label: humanizeIdentifier2(id),
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
      positions: []
    };
    const rawPoses = [];
    events.push(event);
    eventPoseNodes.set(id, rawPoses);
    eventIds.add(id);
    return {
      kind: "event",
      event,
      sourceSchemaVersion,
      diagnostics,
      seenFields: /* @__PURE__ */ new Set(),
      rawPoses,
      inPositions: false,
      positionsIndent: null,
      activePose: null,
      poseIndent: null,
      activePoseSeenFields: /* @__PURE__ */ new Set()
    };
  }
  function startObjectSection(tokens, line, sourceSchemaVersion, diagnostics, objectNodes) {
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
      objectType,
      id: idToken.value,
      fields: parseInlineObjectFields(tokens.slice(3), line, objectType, sourceSchemaVersion, diagnostics),
      infoEntries: [],
      typedBlockEntries: {},
      location: {
        line,
        column: objectTypeToken.column
      }
    };
    objectNodes.push(objectNode);
    return {
      kind: "object",
      objectNode,
      sourceSchemaVersion,
      diagnostics,
      activeBlock: null,
      blockIndent: null,
      seenInfoKeys: /* @__PURE__ */ new Set(),
      seenTypedBlockKeys: {}
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
  function applySystemField(section, tokens, line) {
    const key = requireUniqueField(tokens, section.seenFields, line);
    const value = joinFieldValue(tokens, line);
    switch (key) {
      case "title":
        section.system.title = value;
        return;
      case "description":
        warnIfSchema21Feature(section.sourceSchemaVersion, section.diagnostics, key, {
          line,
          column: tokens[0].column
        });
        section.system.description = value;
        return;
      case "epoch":
        warnIfSchema21Feature(section.sourceSchemaVersion, section.diagnostics, key, {
          line,
          column: tokens[0].column
        });
        section.system.epoch = value;
        return;
      case "referenceplane":
        warnIfSchema21Feature(section.sourceSchemaVersion, section.diagnostics, "referencePlane", {
          line,
          column: tokens[0].column
        });
        section.system.referencePlane = value;
        return;
      default:
        throw new WorldOrbitError(`Unknown system atlas field "${tokens[0].value}"`, line, tokens[0].column);
    }
  }
  function applyDefaultsField(section, tokens, line) {
    const key = requireUniqueField(tokens, section.seenFields, line);
    const value = joinFieldValue(tokens, line);
    switch (key) {
      case "view":
        if (isSchema25Projection(value)) {
          warnIfSchema25Feature(section.sourceSchemaVersion, section.diagnostics, "defaults.view", {
            line,
            column: tokens[0].column
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
        throw new WorldOrbitError(`Unknown defaults field "${tokens[0].value}"`, line, tokens[0].column);
    }
  }
  function applyAtlasField(section, indent, tokens, line) {
    if (section.inMetadata && indent <= (section.metadataIndent ?? 0)) {
      section.inMetadata = false;
      section.metadataIndent = null;
    }
    if (section.inMetadata) {
      const entry = parseInfoLikeEntry(tokens, line, "Invalid atlas metadata entry");
      if (entry.key in section.system.atlasMetadata) {
        throw new WorldOrbitError(`Duplicate atlas metadata key "${entry.key}"`, line, tokens[0].column);
      }
      section.system.atlasMetadata[entry.key] = entry.value;
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
        column: tokens[0].column
      });
      if (section.seenFields.has("camera")) {
        throw new WorldOrbitError('Duplicate viewpoint field "camera"', line, tokens[0].column);
      }
      section.seenFields.add("camera");
      section.inCamera = true;
      section.cameraIndent = indent;
      section.viewpoint.camera = section.viewpoint.camera ?? createEmptyViewCamera2();
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
            column: tokens[0].column
          });
        }
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
      case "camera":
        warnIfSchema25Feature(section.sourceSchemaVersion, section.diagnostics, "viewpoint.camera", {
          line,
          column: tokens[0].column
        });
        section.viewpoint.camera = parseInlineViewCamera(tokens.slice(1), line, section.viewpoint.camera);
        return;
      case "layers":
        section.viewpoint.layers = parseLayerTokens(tokens.slice(1), line, section.sourceSchemaVersion, section.diagnostics);
        return;
      case "events":
        warnIfSchema21Feature(section.sourceSchemaVersion, section.diagnostics, "viewpoint.events", {
          line,
          column: tokens[0].column
        });
        section.viewpoint.events = parseTokenList(tokens.slice(1), line, "events");
        return;
      default:
        throw new WorldOrbitError(`Unknown viewpoint field "${tokens[0].value}"`, line, tokens[0].column);
    }
  }
  function applyViewpointCameraField(section, tokens, line) {
    const key = requireUniqueField(tokens, section.seenCameraFields, line);
    const value = joinFieldValue(tokens, line);
    const camera = section.viewpoint.camera ?? createEmptyViewCamera2();
    switch (key) {
      case "azimuth":
        camera.azimuth = parseFiniteNumber2(value, line, tokens[0].column, "camera.azimuth");
        break;
      case "elevation":
        camera.elevation = parseFiniteNumber2(value, line, tokens[0].column, "camera.elevation");
        break;
      case "roll":
        camera.roll = parseFiniteNumber2(value, line, tokens[0].column, "camera.roll");
        break;
      case "distance":
        camera.distance = parsePositiveNumber2(value, line, tokens[0].column, "camera.distance");
        break;
      default:
        throw new WorldOrbitError(`Unknown viewpoint camera field "${tokens[0].value}"`, line, tokens[0].column);
    }
    section.viewpoint.camera = camera;
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
  function applyGroupField(section, tokens, line) {
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
          column: tokens[0].column
        });
        return;
      default:
        throw new WorldOrbitError(`Unknown group field "${tokens[0].value}"`, line, tokens[0].column);
    }
  }
  function applyRelationField(section, tokens, line) {
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
          column: tokens[0].column
        });
        return;
      default:
        throw new WorldOrbitError(`Unknown relation field "${tokens[0].value}"`, line, tokens[0].column);
    }
  }
  function applyEventField(section, indent, tokens, line) {
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
      if (tokens[0]?.value === "epoch" || tokens[0]?.value === "referencePlane") {
        warnIfSchema25Feature(section.sourceSchemaVersion, section.diagnostics, `pose.${tokens[0].value}`, {
          line,
          column: tokens[0]?.column ?? 1
        });
      }
      section.activePose.fields.push(parseEventPoseField(tokens, line, section.activePoseSeenFields));
      return;
    }
    if (section.inPositions) {
      if (tokens.length !== 2 || tokens[0].value.toLowerCase() !== "pose") {
        throw new WorldOrbitError(`Unknown event positions field "${tokens[0].value}"`, line, tokens[0]?.column ?? 1);
      }
      const objectId = tokens[1].value;
      if (!objectId.trim()) {
        throw new WorldOrbitError("Event pose object id must not be empty", line, tokens[1].column);
      }
      const rawPose = {
        objectId,
        fields: [],
        location: { line, column: tokens[0].column }
      };
      section.rawPoses.push(rawPose);
      section.activePose = rawPose;
      section.poseIndent = indent;
      section.activePoseSeenFields = /* @__PURE__ */ new Set();
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
          column: tokens[0].column
        });
        section.event.epoch = joinFieldValue(tokens, line);
        return;
      case "referenceplane":
        warnIfSchema25Feature(section.sourceSchemaVersion, section.diagnostics, "event.referencePlane", {
          line,
          column: tokens[0].column
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
          column: tokens[0].column
        });
        return;
      default:
        throw new WorldOrbitError(`Unknown event field "${tokens[0].value}"`, line, tokens[0].column);
    }
  }
  function parseEventPoseField(tokens, line, seenFields) {
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
      location: { line, column: tokens[0].column }
    };
  }
  function applyObjectField(section, indent, tokens, line) {
    if (section.activeBlock && indent <= (section.blockIndent ?? 0)) {
      section.activeBlock = null;
      section.blockIndent = null;
    }
    if (tokens.length === 1) {
      const blockName = tokens[0].value.toLowerCase();
      if (blockName === "info" || STRUCTURED_TYPED_BLOCKS.has(blockName)) {
        if (blockName !== "info") {
          warnIfSchema21Feature(section.sourceSchemaVersion, section.diagnostics, blockName, { line, column: tokens[0].column });
        }
        section.activeBlock = blockName;
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
      const typedBlock = section.activeBlock;
      const seenKeys = section.seenTypedBlockKeys[typedBlock] ?? (section.seenTypedBlockKeys[typedBlock] = /* @__PURE__ */ new Set());
      if (seenKeys.has(entry.key)) {
        throw new WorldOrbitError(`Duplicate ${typedBlock} key "${entry.key}"`, line, tokens[0].column);
      }
      seenKeys.add(entry.key);
      const entries = section.objectNode.typedBlockEntries[typedBlock] ?? (section.objectNode.typedBlockEntries[typedBlock] = []);
      entries.push(entry);
      return;
    }
    section.objectNode.fields.push(parseObjectField(tokens, line, section.objectNode.objectType, section.sourceSchemaVersion, section.diagnostics));
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
    return parseTokenList(tokens, line, "objectTypes").filter((value) => value === "star" || value === "planet" || value === "moon" || value === "belt" || value === "asteroid" || value === "comet" || value === "ring" || value === "structure" || value === "phenomenon");
  }
  function parseLayerTokens(tokens, line, sourceSchemaVersion, diagnostics) {
    const layers = {};
    for (const token of parseTokenList(tokens, line, "layers")) {
      const enabled = !token.startsWith("-") && !token.startsWith("!");
      const raw = token.replace(/^[-!]+/, "").toLowerCase();
      if (raw === "orbits") {
        layers["orbits-back"] = enabled;
        layers["orbits-front"] = enabled;
        continue;
      }
      if (raw === "background" || raw === "guides" || raw === "orbits-back" || raw === "orbits-front" || raw === "relations" || raw === "events" || raw === "objects" || raw === "labels" || raw === "metadata") {
        if (raw === "events" && sourceSchemaVersion && diagnostics) {
          warnIfSchema21Feature(sourceSchemaVersion, diagnostics, "layers.events", {
            line,
            column: tokens[0]?.column ?? 1
          });
        }
        layers[raw] = enabled;
      }
    }
    return layers;
  }
  function parseTokenList(tokens, line, fieldName) {
    if (tokens.length === 0) {
      throw new WorldOrbitError(`Missing value for atlas field "${fieldName}"`, line, 1);
    }
    const values = tokens.map((token) => token.value).filter(Boolean);
    if (values.length === 0) {
      throw new WorldOrbitError(`Missing value for atlas field "${fieldName}"`, line, tokens[0]?.column ?? 1);
    }
    return values;
  }
  function parseProjectionValue(value, line, column) {
    const normalized = value.toLowerCase();
    if (normalized !== "topdown" && normalized !== "isometric" && normalized !== "orthographic" && normalized !== "perspective") {
      throw new WorldOrbitError(`Unknown projection "${value}"`, line, column);
    }
    return normalized;
  }
  function isSchema25Projection(value) {
    const normalized = value.toLowerCase();
    return normalized === "orthographic" || normalized === "perspective";
  }
  function parsePresetValue(value, line, column) {
    const normalized = value.toLowerCase();
    if (normalized === "diagram" || normalized === "presentation" || normalized === "atlas-card" || normalized === "markdown") {
      return normalized;
    }
    throw new WorldOrbitError(`Unknown render preset "${value}"`, line, column);
  }
  function parsePositiveNumber2(value, line, column, field) {
    const parsed = parseFiniteNumber2(value, line, column, field);
    if (parsed <= 0) {
      throw new WorldOrbitError(`Field "${field}" must be greater than zero`, line, column);
    }
    return parsed;
  }
  function parseFiniteNumber2(value, line, column, field) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new WorldOrbitError(`Invalid numeric value "${value}" for "${field}"`, line, column);
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
  function createEmptyViewCamera2() {
    return {
      azimuth: null,
      elevation: null,
      roll: null,
      distance: null
    };
  }
  function parseInlineViewCamera(tokens, line, current) {
    if (tokens.length === 0 || tokens.length % 2 !== 0) {
      throw new WorldOrbitError('Field "camera" expects "<field> <value>" pairs', line, tokens[0]?.column ?? 1);
    }
    const camera = current ? { ...current } : createEmptyViewCamera2();
    const seen = /* @__PURE__ */ new Set();
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
          camera.azimuth = parseFiniteNumber2(value, line, fieldToken.column, "camera.azimuth");
          break;
        case "elevation":
          camera.elevation = parseFiniteNumber2(value, line, fieldToken.column, "camera.elevation");
          break;
        case "roll":
          camera.roll = parseFiniteNumber2(value, line, fieldToken.column, "camera.roll");
          break;
        case "distance":
          camera.distance = parsePositiveNumber2(value, line, fieldToken.column, "camera.distance");
          break;
        default:
          throw new WorldOrbitError(`Unknown viewpoint camera field "${fieldToken.value}"`, line, fieldToken.column);
      }
    }
    return camera;
  }
  function parseInlineObjectFields(tokens, line, objectType, sourceSchemaVersion, diagnostics) {
    const fields = [];
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
          column: keyToken.column
        });
      }
      index++;
      const valueTokens = [];
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
        throw new WorldOrbitError(`Missing value for field "${keyToken.value}"`, line, keyToken.column);
      }
      fields.push({
        type: "field",
        key: keyToken.value,
        values: valueTokens.map((token) => token.value),
        location: { line, column: keyToken.column }
      });
    }
    validateDraftObjectFieldCompatibility(fields, objectType);
    return fields;
  }
  function parseObjectField(tokens, line, objectType, sourceSchemaVersion, diagnostics) {
    if (tokens.length < 2) {
      throw new WorldOrbitError("Invalid field line", line, tokens[0]?.column ?? 1);
    }
    const spec = getDraftObjectFieldSpec(tokens[0].value);
    if (!spec) {
      throw new WorldOrbitError(`Unknown field "${tokens[0].value}"`, line, tokens[0].column);
    }
    if (spec.version === "2.1") {
      warnIfSchema21Feature(sourceSchemaVersion, diagnostics, tokens[0].value, {
        line,
        column: tokens[0].column
      });
    }
    const field = {
      type: "field",
      key: tokens[0].value,
      values: tokens.slice(1).map((token) => token.value),
      location: { line, column: tokens[0].column }
    };
    validateDraftObjectFieldCompatibility([field], objectType);
    return field;
  }
  function parseInfoLikeEntry(tokens, line, errorMessage) {
    if (tokens.length < 2) {
      throw new WorldOrbitError(errorMessage, line, tokens[0]?.column ?? 1);
    }
    return {
      type: "info-entry",
      key: tokens[0].value,
      value: tokens.slice(1).map((token) => token.value).join(" "),
      location: { line, column: tokens[0].column }
    };
  }
  function normalizeDraftObject(node, sourceSchemaVersion, diagnostics) {
    const fieldMap = collectDraftFields(node.fields);
    const placement = extractPlacementFromFieldMap(fieldMap);
    const properties = normalizeDraftProperties(node.objectType, fieldMap);
    const groups = parseOptionalTokenList(fieldMap.get("groups")?.[0]);
    const epoch = parseOptionalJoinedValue(fieldMap.get("epoch")?.[0]);
    const referencePlane = parseOptionalJoinedValue(fieldMap.get("referencePlane")?.[0]);
    const tidalLock = fieldMap.has("tidalLock") ? parseAtlasBoolean(singleFieldValue2(fieldMap.get("tidalLock")[0]), "tidalLock", fieldMap.get("tidalLock")[0].location) : void 0;
    const resonance = fieldMap.has("resonance") ? parseResonanceField(fieldMap.get("resonance")[0]) : void 0;
    const renderHints = extractRenderHints(fieldMap);
    const deriveRules = fieldMap.get("derive")?.map((field) => parseDeriveField(field));
    const validationRules = fieldMap.get("validate")?.map((field) => ({
      rule: singleFieldValue2(field)
    }));
    const lockedFields = fieldMap.has("locked") ? [...new Set(fieldMap.get("locked").flatMap((field) => field.values))] : void 0;
    const tolerances = fieldMap.get("tolerance")?.map((field) => parseToleranceField(field));
    const typedBlocks = normalizeTypedBlocks(node.typedBlockEntries);
    const info2 = normalizeInfoEntries(node.infoEntries, "info");
    const object = {
      type: node.objectType,
      id: node.id,
      properties,
      placement,
      info: info2
    };
    if (groups.length > 0)
      object.groups = groups;
    if (epoch)
      object.epoch = epoch;
    if (referencePlane)
      object.referencePlane = referencePlane;
    if (tidalLock !== void 0)
      object.tidalLock = tidalLock;
    if (resonance)
      object.resonance = resonance;
    if (renderHints)
      object.renderHints = renderHints;
    if (deriveRules?.length)
      object.deriveRules = deriveRules;
    if (validationRules?.length)
      object.validationRules = validationRules;
    if (lockedFields?.length)
      object.lockedFields = lockedFields;
    if (tolerances?.length)
      object.tolerances = tolerances;
    if (typedBlocks && Object.keys(typedBlocks).length > 0)
      object.typedBlocks = typedBlocks;
    if (isSchemaOlderThan(sourceSchemaVersion, "2.1")) {
      if (object.groups || object.epoch || object.referencePlane || object.tidalLock !== void 0 || object.resonance || object.renderHints || object.deriveRules?.length || object.validationRules?.length || object.lockedFields?.length || object.tolerances?.length || object.typedBlocks) {
        warnIfSchema21Feature(sourceSchemaVersion, diagnostics, node.id, node.location);
      }
    }
    return object;
  }
  function normalizeDraftEvent(event, rawPoses) {
    return {
      ...event,
      participantObjectIds: [...new Set(event.participantObjectIds)],
      tags: [...new Set(event.tags)],
      positions: rawPoses.map((pose) => normalizeDraftEventPose(pose))
    };
  }
  function normalizeDraftEventPose(rawPose) {
    const fieldMap = collectDraftFields(rawPose.fields, "event-pose");
    const placement = extractPlacementFromFieldMap(fieldMap);
    return {
      objectId: rawPose.objectId,
      placement,
      inner: parseOptionalUnitField(fieldMap.get("inner")?.[0], "inner"),
      outer: parseOptionalUnitField(fieldMap.get("outer")?.[0], "outer"),
      epoch: parseOptionalJoinedValue(fieldMap.get("epoch")?.[0]),
      referencePlane: parseOptionalJoinedValue(fieldMap.get("referencePlane")?.[0])
    };
  }
  function collectDraftFields(fields, _mode = "object") {
    const grouped = /* @__PURE__ */ new Map();
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
  function extractPlacementFromFieldMap(fieldMap) {
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
        target: singleFieldValue2(orbitField),
        distance: parseOptionalUnitField(fieldMap.get("distance")?.[0], "distance"),
        semiMajor: parseOptionalUnitField(fieldMap.get("semiMajor")?.[0], "semiMajor"),
        eccentricity: parseOptionalNumberField(fieldMap.get("eccentricity")?.[0], "eccentricity"),
        period: parseOptionalUnitField(fieldMap.get("period")?.[0], "period"),
        angle: parseOptionalUnitField(fieldMap.get("angle")?.[0], "angle"),
        inclination: parseOptionalUnitField(fieldMap.get("inclination")?.[0], "inclination"),
        phase: parseOptionalUnitField(fieldMap.get("phase")?.[0], "phase")
      };
    }
    if (atField) {
      const target = singleFieldValue2(atField);
      return {
        mode: "at",
        target,
        reference: parseAtlasAtReference(target, atField.location)
      };
    }
    if (surfaceField) {
      return {
        mode: "surface",
        target: singleFieldValue2(surfaceField)
      };
    }
    if (freeField) {
      const raw = singleFieldValue2(freeField);
      const distance = tryParseAtlasUnitValue(raw);
      return {
        mode: "free",
        distance: distance ?? void 0,
        descriptor: distance ? void 0 : raw
      };
    }
    return null;
  }
  function normalizeDraftProperties(objectType, fieldMap) {
    const properties = {};
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
  function normalizeInfoEntries(entries, label) {
    const normalized = {};
    for (const entry of entries) {
      if (entry.key in normalized) {
        throw WorldOrbitError.fromLocation(`Duplicate ${label} key "${entry.key}"`, entry.location);
      }
      normalized[entry.key] = entry.value;
    }
    return normalized;
  }
  function normalizeTypedBlocks(typedBlockEntries) {
    const typedBlocks = {};
    for (const blockName of Object.keys(typedBlockEntries)) {
      const entries = typedBlockEntries[blockName];
      if (entries?.length) {
        typedBlocks[blockName] = normalizeInfoEntries(entries, blockName);
      }
    }
    return typedBlocks;
  }
  function extractRenderHints(fieldMap) {
    const renderHints = {};
    const renderLabelField = fieldMap.get("renderLabel")?.[0];
    const renderOrbitField = fieldMap.get("renderOrbit")?.[0];
    const renderPriorityField = fieldMap.get("renderPriority")?.[0];
    if (renderLabelField) {
      renderHints.renderLabel = parseAtlasBoolean(singleFieldValue2(renderLabelField), "renderLabel", renderLabelField.location);
    }
    if (renderOrbitField) {
      renderHints.renderOrbit = parseAtlasBoolean(singleFieldValue2(renderOrbitField), "renderOrbit", renderOrbitField.location);
    }
    if (renderPriorityField) {
      renderHints.renderPriority = parseAtlasNumber(singleFieldValue2(renderPriorityField), "renderPriority", renderPriorityField.location);
    }
    return Object.keys(renderHints).length > 0 ? renderHints : void 0;
  }
  function parseResonanceField(field) {
    if (field.values.length !== 2) {
      throw WorldOrbitError.fromLocation('Field "resonance" expects "<targetObjectId> <ratio>"', field.location);
    }
    const ratio = field.values[1];
    if (!/^\d+:\d+$/.test(ratio)) {
      throw WorldOrbitError.fromLocation(`Invalid resonance ratio "${ratio}"`, field.location);
    }
    return {
      targetObjectId: field.values[0],
      ratio
    };
  }
  function parseDeriveField(field) {
    if (field.values.length !== 2) {
      throw WorldOrbitError.fromLocation('Field "derive" expects "<field> <strategy>"', field.location);
    }
    return {
      field: field.values[0],
      strategy: field.values[1]
    };
  }
  function parseToleranceField(field) {
    if (field.values.length !== 2) {
      throw WorldOrbitError.fromLocation('Field "tolerance" expects "<field> <value>"', field.location);
    }
    const rawValue = field.values[1];
    const unitValue = tryParseAtlasUnitValue(rawValue);
    const numericValue2 = Number(rawValue);
    return {
      field: field.values[0],
      value: unitValue ?? (Number.isFinite(numericValue2) ? numericValue2 : rawValue)
    };
  }
  function parseOptionalTokenList(field) {
    return field ? [...new Set(field.values)] : [];
  }
  function parseOptionalJoinedValue(field) {
    if (!field) {
      return null;
    }
    return field.values.join(" ").trim() || null;
  }
  function parseOptionalUnitField(field, key) {
    return field ? parseAtlasUnitValue(singleFieldValue2(field), field.location, key) : void 0;
  }
  function parseOptionalNumberField(field, key) {
    return field ? parseAtlasNumber(singleFieldValue2(field), key, field.location) : void 0;
  }
  function singleFieldValue2(field) {
    return singleAtlasValue(field.values, field.key, field.location);
  }
  function getDraftObjectFieldSpec(key) {
    return DRAFT_OBJECT_FIELD_SPECS.get(key);
  }
  function validateDraftObjectFieldCompatibility(fields, objectType) {
    for (const field of fields) {
      const spec = getDraftObjectFieldSpec(field.key);
      if (!spec) {
        throw WorldOrbitError.fromLocation(`Unknown field "${field.key}"`, field.location);
      }
      if (spec.legacySchema) {
        ensureAtlasFieldSupported(field.key, objectType, field.location);
        continue;
      }
      if ((field.key === "renderLabel" || field.key === "renderOrbit" || field.key === "tidalLock") && field.values.length !== 1) {
        throw WorldOrbitError.fromLocation(`Field "${field.key}" expects exactly one value`, field.location);
      }
    }
  }
  function warnIfSchema21Feature(sourceSchemaVersion, diagnostics, featureName, location) {
    if (!isSchemaOlderThan(sourceSchemaVersion, "2.1")) {
      return;
    }
    diagnostics.push({
      code: "parse.schema21.featureCompatibility",
      severity: "warning",
      source: "parse",
      message: `Feature "${featureName}" requires schema 2.1; parsed in compatibility mode because the document header is "schema ${sourceSchemaVersion}".`,
      line: location.line,
      column: location.column
    });
  }
  function warnIfSchema25Feature(sourceSchemaVersion, diagnostics, featureName, location) {
    if (!isSchemaOlderThan(sourceSchemaVersion, "2.5")) {
      return;
    }
    diagnostics.push({
      code: "parse.schema25.featureCompatibility",
      severity: "warning",
      source: "parse",
      message: `Feature "${featureName}" requires schema 2.5; parsed in compatibility mode because the document header is "schema ${sourceSchemaVersion}".`,
      line: location.line,
      column: location.column
    });
  }
  function isSchemaOlderThan(sourceSchemaVersion, requiredVersion) {
    return schemaVersionRank(sourceSchemaVersion) < schemaVersionRank(requiredVersion);
  }
  function schemaVersionRank(version) {
    switch (version) {
      case "2.0-draft":
        return 0;
      case "2.0":
        return 1;
      case "2.1":
        return 2;
      case "2.5":
        return 3;
    }
  }
  function preprocessAtlasSource(source) {
    const chars = [...source];
    const comments = [];
    let inString = false;
    let inBlockComment = false;
    let blockCommentStart = null;
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
      throw WorldOrbitError.fromLocation("Unclosed block comment", blockCommentStart ?? void 0);
    }
    return {
      source: chars.join(""),
      comments
    };
  }
  function isHexColorLiteral(chars, start) {
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
    return next === void 0 || next === " " || next === "	" || next === "\r" || next === "\n";
  }

  // packages/core/dist/load.js
  var ATLAS_SCHEMA_PATTERN = /^schema\s+2(?:\.0|\.1|\.5)?$/i;
  var ATLAS_SCHEMA_21_PATTERN = /^schema\s+2\.1$/i;
  var ATLAS_SCHEMA_25_PATTERN = /^schema\s+2\.5$/i;
  var LEGACY_DRAFT_SCHEMA_PATTERN = /^schema\s+2\.0-draft$/i;
  function detectWorldOrbitSchemaVersion(source) {
    for (const line of stripCommentsForSchemaDetection(source).split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      if (LEGACY_DRAFT_SCHEMA_PATTERN.test(trimmed)) {
        return "2.0-draft";
      }
      if (ATLAS_SCHEMA_21_PATTERN.test(trimmed)) {
        return "2.1";
      }
      if (ATLAS_SCHEMA_25_PATTERN.test(trimmed)) {
        return "2.5";
      }
      if (ATLAS_SCHEMA_PATTERN.test(trimmed)) {
        return "2.0";
      }
      return "1.0";
    }
    return "1.0";
  }
  function stripCommentsForSchemaDetection(source) {
    const chars = [...source];
    let inString = false;
    let inBlockComment = false;
    for (let index = 0; index < chars.length; index++) {
      const ch = chars[index];
      const next = chars[index + 1];
      if (inBlockComment) {
        if (ch === "*" && next === "/") {
          chars[index] = " ";
          chars[index + 1] = " ";
          inBlockComment = false;
          index++;
          continue;
        }
        if (ch !== "\n" && ch !== "\r") {
          chars[index] = " ";
        }
        continue;
      }
      if (!inString && ch === "/" && next === "*") {
        chars[index] = " ";
        chars[index + 1] = " ";
        inBlockComment = true;
        index++;
        continue;
      }
      if (!inString && ch === "#") {
        chars[index] = " ";
        let inner = index + 1;
        while (inner < chars.length && chars[inner] !== "\n" && chars[inner] !== "\r") {
          chars[inner] = " ";
          inner++;
        }
        index = inner - 1;
        continue;
      }
      if (ch === '"' && chars[index - 1] !== "\\") {
        inString = !inString;
      }
    }
    return chars.join("");
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
    if (schemaVersion === "2.0" || schemaVersion === "2.0-draft" || schemaVersion === "2.1" || schemaVersion === "2.5") {
      return loadAtlasSourceWithDiagnostics(source, schemaVersion);
    }
    let ast;
    try {
      ast = parseWorldOrbit(source);
    } catch (error2) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error2, "parse")]
      };
    }
    let document2;
    try {
      document2 = normalizeDocument(ast);
    } catch (error2) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error2, "normalize")]
      };
    }
    try {
      validateDocument(document2);
    } catch (error2) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error2, "validate")]
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
    } catch (error2) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error2, "parse", "load.atlas.failed")]
      };
    }
    const atlasDiagnostics = [...atlasDocument.diagnostics];
    if (atlasDiagnostics.some((diagnostic) => diagnostic.severity === "error")) {
      return {
        ok: false,
        value: null,
        diagnostics: atlasDiagnostics
      };
    }
    let document2;
    try {
      document2 = materializeAtlasDocument(atlasDocument);
    } catch (error2) {
      return {
        ok: false,
        value: null,
        diagnostics: [diagnosticFromError(error2, "normalize", "load.atlas.materialize.failed")]
      };
    }
    const loaded = {
      schemaVersion,
      ast: null,
      document: document2,
      atlasDocument,
      draftDocument: atlasDocument,
      diagnostics: atlasDiagnostics
    };
    return {
      ok: true,
      value: loaded,
      diagnostics: atlasDiagnostics
    };
  }

  // packages/viewer/dist/theme.js
  var DEFAULT_LAYERS = {
    background: true,
    guides: true,
    relations: true,
    events: true,
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
      relation: "rgba(240, 180, 100, 0.42)",
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
      relation: "rgba(156, 231, 255, 0.42)",
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
      relation: "rgba(255, 178, 125, 0.42)",
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
  function matchesObjectFilter(object, filter) {
    if (!filter) {
      return true;
    }
    if (filter.objectTypes?.length && !filter.objectTypes.includes(object.object.type)) {
      return false;
    }
    if (filter.groupIds?.length && (!object.groupId || !filter.groupIds.includes(object.groupId))) {
      const hasSemanticMatch = object.semanticGroupIds.length > 0 && filter.groupIds.some((groupId) => object.semanticGroupIds.includes(groupId));
      const hasLegacyMatch = Boolean(object.groupId && filter.groupIds.includes(object.groupId));
      if (!hasSemanticMatch && !hasLegacyMatch) {
        return false;
      }
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
    const relationMarkup = layers.relations ? scene.relations.filter((relation) => !relation.hidden).filter((relation) => visibleObjectIds.has(relation.fromObjectId) && visibleObjectIds.has(relation.toObjectId)).map((relation) => `<line class="wo-relation" x1="${relation.x1}" y1="${relation.y1}" x2="${relation.x2}" y2="${relation.y2}" data-render-id="${escapeXml(relation.renderId)}" data-relation-id="${escapeAttribute(relation.relationId)}" />`).join("") : "";
    const eventMarkup = layers.events ? scene.events.filter((event) => !event.hidden).map((event) => renderSceneEventOverlay(scene, event, visibleObjectIds, theme)).join("") : "";
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
    .wo-relation { stroke: ${theme.relation}; stroke-width: 2; stroke-dasharray: 10 6; }
    .wo-event-line { stroke: ${theme.accent}; stroke-width: 1.6; stroke-dasharray: 5 5; opacity: 0.72; }
    .wo-event-node { fill: ${theme.accent}; stroke: ${theme.selected}; stroke-width: 1.4; opacity: 0.92; }
    .wo-event-label { fill: ${theme.accent}; font-family: ${theme.fontFamily}; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
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
        ${layers.relations ? `<g data-layer-id="relations">${relationMarkup}</g>` : ""}
        ${layers.events ? `<g data-layer-id="events">${eventMarkup}</g>` : ""}
        ${layers.objects ? `<g data-layer-id="objects">${objectMarkup}</g>` : ""}
        ${layers.orbits ? `<g data-layer-id="orbits-front">${orbitMarkup.front}</g>` : ""}
        ${layers.labels ? `<g data-layer-id="labels">${labelMarkup}</g>` : ""}
      </g>
    </g>
  </g>
</svg>`;
  }
  function renderSceneEventOverlay(scene, event, visibleObjectIds, theme) {
    const participants = event.objectIds.filter((objectId) => visibleObjectIds.has(objectId)).map((objectId) => scene.objects.find((object) => object.objectId === objectId && !object.hidden)).filter(Boolean);
    if (participants.length === 0) {
      return "";
    }
    const stroke = event.event.color || theme.accent;
    const label = event.event.label || event.event.id;
    const lineMarkup = participants.map((object) => `<line class="wo-event-line" x1="${event.x}" y1="${event.y}" x2="${object.x}" y2="${object.y}" stroke="${escapeAttribute(stroke)}" data-event-id="${escapeAttribute(event.eventId)}" data-object-id="${escapeAttribute(object.objectId)}" />`).join("");
    return `<g class="wo-event" data-render-id="${escapeXml(event.renderId)}" data-event-id="${escapeAttribute(event.eventId)}">
    ${lineMarkup}
    <circle class="wo-event-node" cx="${event.x}" cy="${event.y}" r="5" fill="${escapeAttribute(stroke)}" />
    <text class="wo-event-label" x="${event.x}" y="${event.y - 10}" text-anchor="middle" font-size="10">${escapeXml(label)}</text>
  </g>`;
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
      case "phenomenon": {
        const kind = String(object.properties.kind ?? "").toLowerCase().replace(/_/g, "-");
        if (options.outlineOnly) {
          if (kind === "black-hole" || kind === "nebula" || kind === "galaxy" || kind === "dwarf-galaxy") {
            return `<circle cx="${x}" cy="${y}" r="${radius}" fill="transparent" stroke="${palette.stroke}" stroke-width="1.4" />`;
          }
          return `<polygon points="${phenomenonPoints(x, y, radius)}" fill="transparent" stroke="${palette.stroke}" stroke-width="1.4" />`;
        }
        if (kind === "black-hole") {
          return `<ellipse cx="${x}" cy="${y}" rx="${radius * 2.4}" ry="${radius * 0.55}" fill="none" stroke="${palette.accentRing ?? palette.stroke}" stroke-width="3.5" />
<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${palette.stroke}" stroke-width="2" />`;
        }
        if (kind === "galaxy") {
          return `<ellipse cx="${x}" cy="${y}" rx="${radius * 2.6}" ry="${radius}" fill="${palette.halo ?? "none"}" stroke="none" />
<ellipse cx="${x}" cy="${y}" rx="${radius * 1.5}" ry="${radius * 0.42}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1.2" />
<circle cx="${x}" cy="${y}" r="${radius * 0.28}" fill="${palette.core ?? "#fff"}" stroke="none" />`;
        }
        if (kind === "dwarf-galaxy") {
          return `<ellipse cx="${x}" cy="${y}" rx="${radius * 1.6}" ry="${radius * 0.55}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1" />
<circle cx="${x}" cy="${y}" r="${radius * 0.25}" fill="${palette.core ?? "#fff"}" stroke="none" />`;
        }
        if (kind === "nebula") {
          return `<circle cx="${x}" cy="${y}" r="${radius * 2.2}" fill="${palette.halo ?? "none"}" stroke="none" />
<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1" />`;
        }
        return `<polygon points="${phenomenonPoints(x, y, radius)}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1.4" />`;
      }
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

  // packages/viewer/dist/embed.js
  function serializeWorldOrbitEmbedPayload(payload) {
    return encodeURIComponent(JSON.stringify(payload));
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
    return `<div class="${escapeAttribute2(options.className ?? "worldorbit-embed")}" data-worldorbit-embed="true" data-worldorbit-mode="${payload.mode}" data-worldorbit-preset="${escapeAttribute2(mergedPayload.options?.preset ?? payload.scene.renderPreset ?? "custom")}" data-worldorbit-viewpoint="${escapeAttribute2(mergedPayload.options?.initialViewpointId ?? "")}" data-worldorbit-payload="${escapeAttribute2(serializeWorldOrbitEmbedPayload(mergedPayload))}">${html}</div>`;
  }
  function escapeAttribute2(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  // packages/markdown/dist/html.js
  function renderWorldOrbitBlock(source, options = {}) {
    try {
      const loaded = loadWorldOrbitSource(source);
      const scene = renderDocumentToScene(loaded.document, resolveSourceRenderOptions(loaded, options));
      if ((options.mode ?? "static") === "interactive") {
        return createWorldOrbitEmbedMarkup(createEmbedPayload(scene, "interactive", {
          initialViewpointId: options.initialViewpointId,
          initialSelectionObjectId: options.initialSelectionObjectId,
          initialFilter: options.initialFilter ?? null,
          atlasState: options.atlasState ?? null,
          minimap: options.minimap
        }), {
          className: options.className ?? "worldorbit-block worldorbit-interactive",
          theme: options.theme,
          layers: options.layers,
          subtitle: options.subtitle,
          preset: options.preset,
          initialViewpointId: options.initialViewpointId,
          initialSelectionObjectId: options.initialSelectionObjectId,
          initialFilter: options.initialFilter ?? null,
          atlasState: options.atlasState ?? null,
          minimap: options.minimap
        });
      }
      return `<figure class="${escapeAttribute3(options.className ?? "worldorbit-block worldorbit-static")}">${renderSceneToSvg(scene, options)}</figure>`;
    } catch (error2) {
      if (options.strict) {
        throw error2;
      }
      return renderWorldOrbitError(error2 instanceof Error ? error2.message : String(error2));
    }
  }
  function renderWorldOrbitError(message) {
    return `<pre class="worldorbit-error">WorldOrbit error: ${escapeHtml(message)}</pre>`;
  }
  function escapeHtml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
  function escapeAttribute3(value) {
    return escapeHtml(value).replaceAll('"', "&quot;");
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

  // packages/markdown/dist/remark.js
  function remarkWorldOrbit(options = {}) {
    return function transform(tree) {
      visitMdNodes(tree, (node, index, parent) => {
        if (!parent || index === -1 || node.type !== "code" || !isWorldOrbitLanguage(node.lang)) {
          return;
        }
        parent.children[index] = {
          type: "html",
          value: renderWorldOrbitBlock(node.value ?? "", options)
        };
      });
    };
  }
  function visitMdNodes(node, visitor, parent = null) {
    const children = node.children ?? [];
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      visitor(child, index, node);
      visitMdNodes(child, visitor, node);
    }
    if (!parent) {
      visitor(node, -1, null);
    }
  }
  function isWorldOrbitLanguage(language) {
    return (language ?? "").trim().toLowerCase() === "worldorbit";
  }

  // packages/markdown/dist/rehype.js
  function rehypeWorldOrbit(options = {}) {
    return function transform(tree) {
      visitHastNodes(tree, (node, index, parent) => {
        if (!parent || index === -1 || node.type !== "element" || node.tagName !== "pre") {
          return;
        }
        const codeElement = node.children?.[0];
        if (!codeElement || codeElement.type !== "element" || codeElement.tagName !== "code") {
          return;
        }
        const classNames = normalizeClassNames(codeElement.properties?.className);
        if (!classNames.includes("language-worldorbit")) {
          return;
        }
        const source = collectText(codeElement);
        parent.children[index] = {
          type: "raw",
          value: renderWorldOrbitBlock(source, options)
        };
      });
    };
  }
  function visitHastNodes(node, visitor, parent = null) {
    const children = node.children ?? [];
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      visitor(child, index, node);
      visitHastNodes(child, visitor, node);
    }
    if (!parent) {
      visitor(node, -1, null);
    }
  }
  function normalizeClassNames(value) {
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry));
    }
    if (typeof value === "string") {
      return value.split(/\s+/).filter(Boolean);
    }
    return [];
  }
  function collectText(node) {
    if (node.type === "text") {
      return node.value ?? "";
    }
    return (node.children ?? []).map((child) => collectText(child)).join("");
  }
  return __toCommonJS(index_exports);
})();
