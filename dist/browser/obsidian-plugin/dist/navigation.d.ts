import type { WorldOrbitDiagnostic } from "@worldorbit/core/types";
import { type App, type MarkdownPostProcessorContext } from "obsidian";
import type { BlockNavigationContext, DiagnosticNavigationTarget } from "./types.js";
export declare function resolveFenceNavigationContext(ctx: MarkdownPostProcessorContext, el: HTMLElement): BlockNavigationContext | null;
export declare function createDiagnosticNavigationTarget(contentStartLine: number | null, diagnostic: WorldOrbitDiagnostic): DiagnosticNavigationTarget;
export declare function navigateToWorldOrbitDiagnostic(app: App, sourcePath: string, contentStartLine: number, diagnostic: WorldOrbitDiagnostic): Promise<boolean>;
