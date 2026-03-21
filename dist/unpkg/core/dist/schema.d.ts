import type { UnitFamily, WorldOrbitFieldSchema, WorldOrbitObjectType } from "./types.js";
export declare const WORLDORBIT_OBJECT_TYPES: Set<WorldOrbitObjectType>;
export declare const WORLDORBIT_FIELD_SCHEMAS: ReadonlyMap<string, WorldOrbitFieldSchema>;
export declare const WORLDORBIT_FIELD_KEYS: Set<string>;
export declare function getFieldSchema(key: string): WorldOrbitFieldSchema | undefined;
export declare function isKnownFieldKey(key: string): boolean;
export declare function supportsObjectType(schema: WorldOrbitFieldSchema, objectType: WorldOrbitObjectType): boolean;
export declare function unitFamilyAllowsUnit(family: UnitFamily, unit: string | null): boolean;
