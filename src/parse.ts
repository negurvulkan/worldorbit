import {
  INLINE_MULTI_VALUE_KEYS,
  KNOWN_FIELD_KEYS,
  OBJECT_TYPES,
} from "./constants.js";
import { WorldOrbitError } from "./errors.js";
import { getIndent, tokenizeLineDetailed } from "./tokenize.js";
import type {
  AstDocument,
  AstFieldNode,
  AstInfoEntryNode,
  AstObjectNode,
  LineToken,
  WorldOrbitObjectType,
} from "./types.js";

export function parseWorldOrbit(source: string): AstDocument {
  const lines = source.split(/\r?\n/);
  const objects: AstObjectNode[] = [];

  let currentObject: AstObjectNode | null = null;
  let inInfoBlock = false;
  let infoIndent: number | null = null;

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

    if (indent === 0) {
      inInfoBlock = false;
      infoIndent = null;

      const objectNode = parseObjectHeader(tokens, lineNumber);
      objects.push(objectNode);
      currentObject = objectNode;
      continue;
    }

    if (!currentObject) {
      throw new WorldOrbitError(
        "Indented line without parent object",
        lineNumber,
        indent + 1,
      );
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
    objects,
  };
}

function parseObjectHeader(tokens: LineToken[], line: number): AstObjectNode {
  if (tokens.length < 2) {
    throw new WorldOrbitError(
      "Invalid object declaration",
      line,
      tokens[0]?.column ?? 1,
    );
  }

  const [objectTypeToken, nameToken, ...rest] = tokens;

  if (!OBJECT_TYPES.has(objectTypeToken.value)) {
    throw new WorldOrbitError(
      `Unknown object type "${objectTypeToken.value}"`,
      line,
      objectTypeToken.column,
    );
  }

  return {
    type: "object",
    objectType: objectTypeToken.value as WorldOrbitObjectType,
    name: nameToken.value,
    inlineFields: parseInlineFields(rest, line),
    blockFields: [],
    infoEntries: [],
    location: { line, column: objectTypeToken.column },
  };
}

function parseInlineFields(tokens: LineToken[], line: number): AstFieldNode[] {
  const fields: AstFieldNode[] = [];
  let index = 0;

  while (index < tokens.length) {
    const keyToken = tokens[index];
    index++;

    const valueTokens: LineToken[] = [];

    if (INLINE_MULTI_VALUE_KEYS.has(keyToken.value)) {
      while (index < tokens.length && !KNOWN_FIELD_KEYS.has(tokens[index].value)) {
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
