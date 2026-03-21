import { WorldOrbitError } from "./errors.js";
export function tokenizeLine(input) {
    return tokenizeLineDetailed(input).map((token) => token.value);
}
export function tokenizeLineDetailed(input, options = {}) {
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
            quoted: tokenWasQuoted,
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
            }
            else {
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
export function getIndent(rawLine) {
    return rawLine.match(/^\s*/)?.[0].length ?? 0;
}
