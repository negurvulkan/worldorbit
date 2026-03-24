import { WorldOrbitError } from "./errors.js";
import { getFieldSchema, isKnownFieldKey, WORLDORBIT_OBJECT_TYPES } from "./schema.js";
import { getIndent, tokenizeLineDetailed } from "./tokenize.js";
export function parseWorldOrbit(source) {
    const lines = source.split(/\r?\n/);
    const objects = [];
    let themeNode = null;
    let currentObject = null;
    let inInfoBlock = false;
    let inThemeBlock = false;
    let infoIndent = null;
    let themeIndent = null;
    let themeBlockIndent = null;
    let currentThemeBlock = null;
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
            inThemeBlock = false;
            infoIndent = null;
            themeIndent = null;
            themeBlockIndent = null;
            currentThemeBlock = null;
            if (tokens.length >= 1 && tokens[0].value === "theme") {
                inThemeBlock = true;
                themeIndent = 0;
                themeNode = {
                    type: "theme",
                    preset: tokens.length >= 2 ? tokens[1].value : null,
                    blocks: [],
                    location: { line: lineNumber, column: tokens[0].column },
                };
                continue;
            }
            const objectNode = parseObjectHeader(tokens, lineNumber);
            objects.push(objectNode);
            currentObject = objectNode;
            continue;
        }
        if (inThemeBlock) {
            if (tokens.length >= 2 && tokens[0].value === "preset" && (!themeBlockIndent || indent <= themeBlockIndent)) {
                if (themeNode) {
                    themeNode.preset = tokens[1].value;
                }
                continue;
            }
            if (currentThemeBlock && themeBlockIndent !== null && indent > themeBlockIndent) {
                currentThemeBlock.fields.push(parseThemeField(tokens, lineNumber));
            }
            else {
                themeBlockIndent = indent;
                currentThemeBlock = {
                    type: "theme-block",
                    target: tokens[0].value,
                    fields: [],
                    location: { line: lineNumber, column: tokens[0].column },
                };
                themeNode?.blocks.push(currentThemeBlock);
            }
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
        }
        else {
            currentObject.blockFields.push(parseField(tokens, lineNumber));
        }
    }
    return {
        type: "document",
        theme: themeNode,
        objects,
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
        location: { line, column: objectTypeToken.column },
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
        }
        else {
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
            location: { line, column: keyToken.column },
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
        location: { line, column: tokens[0].column },
    };
}
function parseThemeField(tokens, line) {
    if (tokens.length < 2) {
        throw new WorldOrbitError("Invalid theme field line", line, tokens[0]?.column ?? 1);
    }
    return {
        type: "field",
        key: tokens[0].value,
        values: tokens.slice(1).map((token) => token.value),
        location: { line, column: tokens[0].column },
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
        location: { line, column: tokens[0].column },
    };
}
