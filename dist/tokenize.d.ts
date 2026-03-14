import type { LineToken, TokenizeOptions } from "./types.js";
export declare function tokenizeLine(input: string): string[];
export declare function tokenizeLineDetailed(input: string, options?: TokenizeOptions): LineToken[];
export declare function getIndent(rawLine: string): number;
