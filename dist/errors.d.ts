import type { AstSourceLocation } from "./types.js";
export declare class WorldOrbitError extends Error {
    readonly line?: number;
    readonly column?: number;
    constructor(message: string, line?: number, column?: number);
    static fromLocation(message: string, location?: AstSourceLocation): WorldOrbitError;
}
