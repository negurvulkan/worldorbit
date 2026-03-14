import type { AstSourceLocation } from "./types.js";

export class WorldOrbitError extends Error {
  public readonly line?: number;
  public readonly column?: number;

  constructor(message: string, line?: number, column?: number) {
    const locationSuffix =
      line === undefined
        ? ""
        : ` (line ${line}${column === undefined ? "" : `, column ${column}`})`;

    super(`${message}${locationSuffix}`);
    this.name = "WorldOrbitError";
    this.line = line;
    this.column = column;
  }

  static fromLocation(
    message: string,
    location?: AstSourceLocation,
  ): WorldOrbitError {
    return new WorldOrbitError(message, location?.line, location?.column);
  }
}
