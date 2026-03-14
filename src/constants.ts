export const OBJECT_TYPES: ReadonlySet<string> = new Set([
  "system",
  "star",
  "planet",
  "moon",
  "belt",
  "asteroid",
  "comet",
  "ring",
  "structure",
  "phenomenon",
]);

export const KNOWN_FIELD_KEYS: ReadonlySet<string> = new Set([
  "orbit",
  "distance",
  "semiMajor",
  "eccentricity",
  "period",
  "angle",
  "inclination",
  "phase",
  "at",
  "surface",
  "free",
  "kind",
  "class",
  "tags",
  "color",
  "hidden",
  "radius",
  "mass",
  "density",
  "gravity",
  "temperature",
  "albedo",
  "atmosphere",
  "inner",
  "outer",
  "view",
  "scale",
  "units",
  "title",
  "on",
  "source",
  "cycle",
]);

export const LIST_KEYS: ReadonlySet<string> = new Set(["tags"]);

export const BOOLEAN_KEYS: ReadonlySet<string> = new Set(["hidden"]);

export const INLINE_MULTI_VALUE_KEYS: ReadonlySet<string> = new Set([
  ...LIST_KEYS,
]);

export const UNIT_VALUE_KEYS: ReadonlySet<string> = new Set([
  "distance",
  "semiMajor",
  "inner",
  "outer",
  "radius",
  "mass",
  "density",
  "gravity",
  "temperature",
  "period",
  "angle",
  "inclination",
  "phase",
  "cycle",
]);

export const NUMBER_KEYS: ReadonlySet<string> = new Set([
  "eccentricity",
  "albedo",
]);

export const PLACEMENT_KEYS: ReadonlySet<string> = new Set([
  "orbit",
  "at",
  "surface",
  "free",
  "distance",
  "semiMajor",
  "eccentricity",
  "period",
  "angle",
  "inclination",
  "phase",
]);
