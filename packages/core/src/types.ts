export type WorldOrbitObjectType =
  | "system"
  | "star"
  | "planet"
  | "moon"
  | "belt"
  | "asteroid"
  | "comet"
  | "ring"
  | "structure"
  | "phenomenon";

export type PlacementMode = "orbit" | "at" | "surface" | "free";

export type Unit =
  // Distance
  | "au"   // astronomical units
  | "km"   // kilometres
  | "m"    // metres (structures, fine detail)
  | "ly"   // light-years (galactic scale)
  | "pc"   // parsecs
  | "kpc"  // kiloparsecs
  // Radius
  | "re"   // Earth radii
  | "rj"   // Jupiter radii
  | "sol"  // solar radii
  // Mass
  | "me"   // Earth masses
  | "mj"   // Jupiter masses
  // Duration
  | "s"    // seconds
  | "min"  // minutes
  | "h"    // hours
  | "d"    // days
  | "y"    // years
  | "ky"   // kiloyears (1 000 years)
  | "my"   // megayears (1 000 000 years)
  | "gy"   // gigayears (1 000 000 000 years)
  // Temperature
  | "K"    // Kelvin
  // Angle
  | "deg"; // degrees

export type WorldOrbitDocumentVersion = "1.0";
export type WorldOrbitAtlasDocumentVersion = "2.0";
export type WorldOrbitDraftDocumentVersion = "2.0-draft";
export type WorldOrbitAnyDocumentVersion =
  | WorldOrbitDocumentVersion
  | WorldOrbitAtlasDocumentVersion
  | WorldOrbitDraftDocumentVersion;
export type ViewProjection = "topdown" | "isometric";
export type RenderPresetName = "diagram" | "presentation" | "atlas-card" | "markdown";

export interface CoordinatePoint {
  x: number;
  y: number;
}

export interface UnitValue {
  value: number;
  unit: Unit | null;
}

export interface AstSourceLocation {
  line: number;
  column: number;
}

export interface LineToken {
  value: string;
  column: number;
  quoted: boolean;
}

export interface TokenizeOptions {
  line?: number;
  columnOffset?: number;
}

export interface AstDocument {
  type: "document";
  objects: AstObjectNode[];
}

export interface AstObjectNode {
  type: "object";
  objectType: WorldOrbitObjectType;
  name: string;
  inlineFields: AstFieldNode[];
  blockFields: AstFieldNode[];
  infoEntries: AstInfoEntryNode[];
  location: AstSourceLocation;
}

export interface AstFieldNode {
  type: "field";
  key: string;
  values: string[];
  location: AstSourceLocation;
}

export interface AstInfoEntryNode {
  type: "info-entry";
  key: string;
  value: string;
  location: AstSourceLocation;
}

export interface WorldOrbitDocument {
  format: "worldorbit";
  version: WorldOrbitDocumentVersion;
  system: WorldOrbitSystem | null;
  objects: WorldOrbitObject[];
}

export interface WorldOrbitAtlasDocument {
  format: "worldorbit";
  version: WorldOrbitAtlasDocumentVersion;
  sourceVersion: WorldOrbitDocumentVersion;
  system: WorldOrbitAtlasSystem | null;
  objects: WorldOrbitObject[];
  diagnostics: WorldOrbitDiagnostic[];
}

export interface WorldOrbitDraftDocument {
  format: "worldorbit";
  version: WorldOrbitDraftDocumentVersion;
  sourceVersion: WorldOrbitDocumentVersion;
  system: WorldOrbitAtlasSystem | null;
  objects: WorldOrbitObject[];
  diagnostics: WorldOrbitDiagnostic[];
}

export interface WorldOrbitSystem {
  type: "system";
  id: string;
  properties: Record<string, NormalizedValue>;
  info: Record<string, string>;
}

export interface WorldOrbitObject {
  type: Exclude<WorldOrbitObjectType, "system">;
  id: string;
  properties: Record<string, NormalizedValue>;
  placement: Placement | null;
  info: Record<string, string>;
}

export type NormalizedValue =
  | string
  | number
  | boolean
  | string[]
  | UnitValue;

export type Placement =
  | OrbitPlacement
  | AtPlacement
  | SurfacePlacement
  | FreePlacement;

export interface OrbitPlacement {
  mode: "orbit";
  target: string;
  distance?: UnitValue;
  semiMajor?: UnitValue;
  eccentricity?: number;
  period?: UnitValue;
  angle?: UnitValue;
  inclination?: UnitValue;
  phase?: UnitValue;
}

export type SpecialPoint = "L1" | "L2" | "L3" | "L4" | "L5";

export type AtReference =
  | NamedReference
  | NamedAnchorReference
  | LagrangeReference;

export interface NamedReference {
  kind: "named";
  name: string;
}

export interface NamedAnchorReference {
  kind: "anchor";
  objectId: string;
  anchor: string;
}

export interface LagrangeReference {
  kind: "lagrange";
  point: SpecialPoint;
  primary: string;
  secondary: string | null;
}

export interface AtPlacement {
  mode: "at";
  target: string;
  reference: AtReference;
}

export interface SurfacePlacement {
  mode: "surface";
  target: string;
}

export interface FreePlacement {
  mode: "free";
  distance?: UnitValue;
  descriptor?: string;
}

export interface RenderScaleModel {
  orbitDistanceMultiplier: number;
  bodyRadiusMultiplier: number;
  labelMultiplier: number;
  freePlacementMultiplier: number;
  ringThicknessMultiplier: number;
  minBodyRadius: number;
  maxBodyRadius: number;
}

export interface SceneRenderOptions {
  width?: number;
  height?: number;
  padding?: number;
  preset?: RenderPresetName;
  projection?: "document" | ViewProjection;
  scaleModel?: Partial<RenderScaleModel>;
}

export interface RenderBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface RenderSceneObject {
  renderId: string;
  objectId: string;
  object: WorldOrbitObject;
  parentId: string | null;
  ancestorIds: string[];
  childIds: string[];
  groupId: string | null;
  x: number;
  y: number;
  radius: number;
  visualRadius: number;
  sortKey: number;
  anchorX?: number;
  anchorY?: number;
  label: string;
  secondaryLabel: string;
  fillColor?: string;
  imageHref?: string;
  hidden: boolean;
}

export interface RenderOrbitVisual {
  renderId: string;
  objectId: string;
  object: WorldOrbitObject;
  parentId: string;
  groupId: string | null;
  kind: "circle" | "ellipse";
  cx: number;
  cy: number;
  radius?: number;
  rx?: number;
  ry?: number;
  rotationDeg: number;
  band: boolean;
  bandThickness?: number;
  frontArcPath?: string;
  backArcPath?: string;
  hidden: boolean;
}

export type LeaderMode = "surface" | "at" | "free";

export interface RenderLeaderLine {
  renderId: string;
  objectId: string;
  object: WorldOrbitObject;
  groupId: string | null;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mode: LeaderMode;
  hidden: boolean;
}

export interface RenderSceneLabel {
  renderId: string;
  objectId: string;
  object: WorldOrbitObject;
  groupId: string | null;
  label: string;
  secondaryLabel: string;
  x: number;
  y: number;
  secondaryY: number;
  textAnchor: "start" | "middle" | "end";
  direction: "above" | "below" | "left" | "right";
  hidden: boolean;
}

export type SceneLayerId =
  | "background"
  | "guides"
  | "orbits-back"
  | "orbits-front"
  | "objects"
  | "labels"
  | "metadata";

export interface RenderSceneViewpointFilter {
  query: string | null;
  objectTypes: Array<Exclude<WorldOrbitObjectType, "system">>;
  tags: string[];
  groupIds: string[];
}

export interface RenderSceneViewpoint {
  id: string;
  label: string;
  summary: string;
  objectId: string | null;
  selectedObjectId: string | null;
  projection: ViewProjection;
  preset: RenderPresetName | null;
  rotationDeg: number;
  scale: number | null;
  layers: Partial<Record<SceneLayerId, boolean>>;
  filter: RenderSceneViewpointFilter | null;
  generated: boolean;
}

export interface RenderSceneLayer {
  id: SceneLayerId;
  renderIds: string[];
}

export interface RenderSceneGroup {
  renderId: string;
  rootObjectId: string | null;
  label: string;
  objectIds: string[];
  orbitIds: string[];
  labelIds: string[];
  leaderIds: string[];
  contentBounds: RenderBounds;
}

export interface RenderScene {
  width: number;
  height: number;
  padding: number;
  renderPreset: RenderPresetName | null;
  projection: ViewProjection;
  scaleModel: RenderScaleModel;
  title: string;
  subtitle: string;
  systemId: string | null;
  viewMode: string;
  layoutPreset: SceneLayoutPreset;
  metadata: Record<string, string>;
  contentBounds: RenderBounds;
  layers: RenderSceneLayer[];
  groups: RenderSceneGroup[];
  viewpoints: RenderSceneViewpoint[];
  objects: RenderSceneObject[];
  orbitVisuals: RenderOrbitVisual[];
  leaders: RenderLeaderLine[];
  labels: RenderSceneLabel[];
}

export type SceneLayoutPreset = "compact" | "balanced" | "presentation";

export type FieldValueKind =
  | "string"
  | "list"
  | "boolean"
  | "number"
  | "unit";

export type UnitFamily =
  | "distance"
  | "radius"
  | "mass"
  | "duration"
  | "angle"
  | "generic";

export interface WorldOrbitFieldSchema {
  key: string;
  kind: FieldValueKind;
  placement: boolean;
  arity: "single" | "multiple";
  objectTypes: WorldOrbitObjectType[];
  unitFamily?: UnitFamily;
}

export interface MarkdownFenceBlock {
  source: string;
  info: string | null;
  startLine: number;
  endLine: number;
}

export type WorldOrbitDiagnosticSeverity = "info" | "warning" | "error";
export type WorldOrbitDiagnosticSource = "parse" | "normalize" | "validate" | "upgrade";

export interface WorldOrbitDiagnostic {
  code: string;
  severity: WorldOrbitDiagnosticSeverity;
  source: WorldOrbitDiagnosticSource;
  message: string;
  line?: number;
  column?: number;
  objectId?: string;
  field?: string;
}

export interface DiagnosticResult<T> {
  ok: boolean;
  value: T | null;
  diagnostics: WorldOrbitDiagnostic[];
}

export interface WorldOrbitAtlasDefaults {
  view: ViewProjection;
  scale: string | null;
  units: string | null;
  preset: RenderPresetName | null;
  theme: string | null;
}

export interface WorldOrbitAtlasViewpoint {
  id: string;
  label: string;
  summary: string;
  focusObjectId: string | null;
  selectedObjectId: string | null;
  projection: ViewProjection;
  preset: RenderPresetName | null;
  zoom: number | null;
  rotationDeg: number;
  layers: Partial<Record<SceneLayerId, boolean>>;
  filter: RenderSceneViewpointFilter | null;
}

export interface WorldOrbitAtlasAnnotation {
  id: string;
  label: string;
  targetObjectId: string | null;
  body: string;
  tags: string[];
  sourceObjectId: string | null;
}

export interface WorldOrbitAtlasSystem {
  type: "system";
  id: string;
  title: string | null;
  defaults: WorldOrbitAtlasDefaults;
  atlasMetadata: Record<string, string>;
  viewpoints: WorldOrbitAtlasViewpoint[];
  annotations: WorldOrbitAtlasAnnotation[];
}

export type AtlasDocumentPathKind =
  | "system"
  | "defaults"
  | "metadata"
  | "object"
  | "viewpoint"
  | "annotation";

export interface AtlasDocumentPath {
  kind: AtlasDocumentPathKind;
  id?: string;
  key?: string;
}

export interface AtlasResolvedDiagnostic {
  diagnostic: WorldOrbitDiagnostic;
  path: AtlasDocumentPath | null;
}

export type WorldOrbitDraftDefaults = WorldOrbitAtlasDefaults;
export type WorldOrbitDraftViewpoint = WorldOrbitAtlasViewpoint;
export type WorldOrbitDraftAnnotation = WorldOrbitAtlasAnnotation;
export type WorldOrbitDraftSystem = WorldOrbitAtlasSystem;

export interface FormatDocumentOptions {
  schema?: WorldOrbitAnyDocumentVersion | "auto";
}

export type FormattableWorldOrbitDocument =
  | WorldOrbitDocument
  | WorldOrbitAtlasDocument
  | WorldOrbitDraftDocument;

export interface LoadedWorldOrbitSource {
  schemaVersion: WorldOrbitAnyDocumentVersion;
  ast: AstDocument | null;
  document: WorldOrbitDocument;
  atlasDocument: WorldOrbitAtlasDocument | null;
  draftDocument: WorldOrbitAtlasDocument | WorldOrbitDraftDocument | null;
  diagnostics: WorldOrbitDiagnostic[];
}
