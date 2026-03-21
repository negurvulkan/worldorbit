import type { AstFieldNode, AstSourceLocation, AtReference, NormalizedValue, UnitValue, WorldOrbitObjectType } from "./types.js";
export interface AtlasFieldLike {
    key: string;
    values: string[];
    location: AstSourceLocation;
}
export declare function normalizeIdentifier(value: string): string;
export declare function humanizeIdentifier(value: string): string;
export declare function parseAtlasUnitValue(input: string, location?: AstSourceLocation, fieldKey?: string): UnitValue;
export declare function tryParseAtlasUnitValue(input: string): UnitValue | null;
export declare function parseAtlasNumber(input: string, key: string, location?: AstSourceLocation): number;
export declare function parseAtlasBoolean(input: string, key: string, location?: AstSourceLocation): boolean;
export declare function parseAtlasFieldBoolean(field: AtlasFieldLike): boolean;
export declare function parseAtlasAtReference(target: string, location?: AstSourceLocation): AtReference;
export declare function validateAtlasImageSource(value: string, location?: AstSourceLocation): void;
export declare function normalizeLegacyScalarValue(key: string, values: string[], location: AstSourceLocation): NormalizedValue;
export declare function ensureAtlasFieldSupported(key: string, objectType: WorldOrbitObjectType, location: AstSourceLocation): void;
export declare function singleAtlasFieldValue(field: Pick<AtlasFieldLike, "key" | "values" | "location">): string;
export declare function singleAtlasValue(values: string[], key: string, location?: AstSourceLocation): string;
export declare function isStructureLikeObjectType(objectType: WorldOrbitObjectType): boolean;
export declare function cloneNormalizedValue(value: NormalizedValue): NormalizedValue;
export declare function cloneFieldNode(field: AstFieldNode): AstFieldNode;
