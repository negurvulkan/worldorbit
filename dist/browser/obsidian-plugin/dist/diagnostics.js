export function formatDiagnosticLocation(diagnostic) {
    if (!diagnostic.line) {
        return "No position";
    }
    if (!diagnostic.column) {
        return `Line ${diagnostic.line}`;
    }
    return `Line ${diagnostic.line}, Column ${diagnostic.column}`;
}
export function summarizeDiagnostics(diagnostics) {
    const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
    const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === "warning").length;
    if (!errors && !warnings) {
        return "Ready";
    }
    if (errors && warnings) {
        return `${errors} error${errors === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"}`;
    }
    if (errors) {
        return `${errors} error${errors === 1 ? "" : "s"}`;
    }
    return `${warnings} warning${warnings === 1 ? "" : "s"}`;
}
