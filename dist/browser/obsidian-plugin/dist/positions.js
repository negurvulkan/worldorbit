export function inferFenceContentStartLine(section) {
    const lines = section.text.split(/\r?\n/);
    const openerIndex = lines.findIndex((line) => /^\s*(```+|~~~+)\s*worldorbit(?:\s+.*)?$/i.test(line));
    return section.lineStart + (openerIndex >= 0 ? openerIndex + 1 : 1);
}
export function resolveDiagnosticEditorPosition(contentStartLine, diagnostic) {
    if (!diagnostic.line || diagnostic.line < 1) {
        return null;
    }
    return {
        line: contentStartLine + diagnostic.line - 1,
        ch: Math.max((diagnostic.column ?? 1) - 1, 0),
    };
}
