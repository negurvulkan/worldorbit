export class WorldOrbitError extends Error {
    line;
    column;
    constructor(message, line, column) {
        const locationSuffix = line === undefined
            ? ""
            : ` (line ${line}${column === undefined ? "" : `, column ${column}`})`;
        super(`${message}${locationSuffix}`);
        this.name = "WorldOrbitError";
        this.line = line;
        this.column = column;
    }
    static fromLocation(message, location) {
        return new WorldOrbitError(message, location?.line, location?.column);
    }
}
