import { MarkdownView, TFile, } from "obsidian";
import { inferFenceContentStartLine, resolveDiagnosticEditorPosition, } from "./positions.js";
export function resolveFenceNavigationContext(ctx, el) {
    if (!ctx.sourcePath) {
        return null;
    }
    const sectionInfo = ctx.getSectionInfo(el);
    if (!sectionInfo) {
        return null;
    }
    return {
        sourcePath: ctx.sourcePath,
        contentStartLine: inferFenceContentStartLine(sectionInfo),
    };
}
export function createDiagnosticNavigationTarget(contentStartLine, diagnostic) {
    return {
        diagnostic,
        position: contentStartLine === null
            ? null
            : resolveDiagnosticEditorPosition(contentStartLine, diagnostic),
    };
}
export async function navigateToWorldOrbitDiagnostic(app, sourcePath, contentStartLine, diagnostic) {
    const position = resolveDiagnosticEditorPosition(contentStartLine, diagnostic);
    if (!position) {
        return false;
    }
    const file = app.vault.getAbstractFileByPath(sourcePath);
    if (!(file instanceof TFile)) {
        return false;
    }
    const leaf = app.workspace.getMostRecentLeaf() ?? app.workspace.getLeaf(true);
    await leaf.openFile(file);
    const view = leaf.view instanceof MarkdownView
        ? leaf.view
        : app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
        return false;
    }
    view.editor.setCursor(position);
    view.editor.focus();
    return true;
}
