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
export type WorldOrbitAtlasDocumentVersion = "2.0" | "2.1" | "2.5" | "2.6";
export type WorldOrbitDraftDocumentVersion = "2.0-draft";
export type WorldOrbitAnyDocumentVersion =
  | WorldOrbitDocumentVersion
  | WorldOrbitAtlasDocumentVersion
  | WorldOrbitDraftDocumentVersion;
export type ViewProjection =
  | "topdown"
  | "isometric"
  | "orthographic"
  | "perspective";
export type RenderProjectionFallback = "topdown" | "isometric";
export type RenderPresetName = "diagram" | "presentation" | "atlas-card" | "markdown";
export type BodyScaleMode = "readable" | "strict";

export interface CoordinatePoint {
  x: number;
  y: number;
}

export interface CoordinatePoint3D {
  x: number;
  y: number;
  z: number;
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

export interface AstThemeNode {
  type: "theme";
  preset: string | null;
  blocks: AstThemeBlockNode[];
  location: AstSourceLocation;
}

export interface AstThemeBlockNode {
  type: "theme-block";
  target: string;
  fields: AstFieldNode[];
  location: AstSourceLocation;
}

export interface AstDocument {
  type: "document";
  theme: AstThemeNode | null;
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

export interface NormalizedTheme {
  preset: string | null;
  styles: Record<string, Record<string, NormalizedValue>>;
}

export interface WorldOrbitDocument {
  format: "worldorbit";
  version: WorldOrbitDocumentVersion;
  schemaVersion: WorldOrbitAnyDocumentVersion;
  theme: NormalizedTheme | null;
  system: WorldOrbitSystem | null;
  groups: WorldOrbitGroup[];
  relations: WorldOrbitRelation[];
  events: WorldOrbitEvent[];
  objects: WorldOrbitObject[];
}

export interface WorldOrbitAtlasDocument {
  format: "worldorbit";
  version: WorldOrbitAtlasDocumentVersion;
  schemaVersion: WorldOrbitAtlasDocumentVersion;
  sourceVersion: WorldOrbitDocumentVersion;
  theme: NormalizedTheme | null;
  system: WorldOrbitAtlasSystem | null;
  groups: WorldOrbitGroup[];
  relations: WorldOrbitRelation[];
  events: WorldOrbitEvent[];
  objects: WorldOrbitObject[];
  diagnostics: WorldOrbitDiagnostic[];
}

export interface WorldOrbitDraftDocument {
  format: "worldorbit";
  version: WorldOrbitDraftDocumentVersion;
  schemaVersion: WorldOrbitDraftDocumentVersion;
  sourceVersion: WorldOrbitDocumentVersion;
  theme: NormalizedTheme | null;
  system: WorldOrbitAtlasSystem | null;
  groups: WorldOrbitGroup[];
  relations: WorldOrbitRelation[];
  events: WorldOrbitEvent[];
  objects: WorldOrbitObject[];
  diagnostics: WorldOrbitDiagnostic[];
}

export interface WorldOrbitSystem {
  type: "system";
  id: string;
  title?: string | null;
  description?: string | null;
  epoch?: string | null;
  referencePlane?: string | null;
  properties: Record<string, NormalizedValue>;
  info: Record<string, string>;
}

export interface WorldOrbitObject {
  type: Exclude<WorldOrbitObjectType, "system">;
  id: string;
  groups?: string[];
  epoch?: string | null;
  referencePlane?: string | null;
  tidalLock?: boolean;
  resonance?: WorldOrbitResonance | null;
  renderHints?: WorldOrbitRenderHints | null;
  deriveRules?: WorldOrbitDeriveRule[];
  validationRules?: WorldOrbitValidationRule[];
  lockedFields?: string[];
  tolerances?: WorldOrbitToleranceRule[];
  typedBlocks?: Partial<Record<WorldOrbitTypedBlockName, Record<string, string>>>;
  properties: Record<string, NormalizedValue>;
  placement: Placement | null;
  info: Record<string, string>;
}

export type WorldOrbitTypedBlockName =
  | "climate"
  | "habitability"
  | "settlement";

export interface WorldOrbitGroup {
  id: string;
  label: string;
  summary: string;
  color: string | null;
  tags: string[];
  hidden: boolean;
}

export interface WorldOrbitRelation {
  id: string;
  from: string;
  to: string;
  kind: string;
  label: string | null;
  summary: string | null;
  tags: string[];
  color: string | null;
  hidden: boolean;
}

export interface WorldOrbitEvent {
  id: string;
  kind: string;
  label: string;
  summary: string | null;
  targetObjectId: string | null;
  participantObjectIds: string[];
  timing: string | null;
  visibility: string | null;
  epoch?: string | null;
  referencePlane?: string | null;
  tags: string[];
  color: string | null;
  hidden: boolean;
  positions: WorldOrbitEventPose[];
}

export interface WorldOrbitEventPose {
  objectId: string;
  placement: Placement | null;
  inner?: UnitValue;
  outer?: UnitValue;
  epoch?: string | null;
  referencePlane?: string | null;
}

export interface WorldOrbitResonance {
  targetObjectId: string;
  ratio: string;
}

export interface WorldOrbitRenderHints {
  renderLabel?: boolean;
  renderOrbit?: boolean;
  renderPriority?: number;
}

export interface WorldOrbitDeriveRule {
  field: string;
  strategy: string;
}

export interface WorldOrbitValidationRule {
  rule: string;
}

export interface WorldOrbitToleranceRule {
  field: string;
  value: NormalizedValue;
}

export interface WorldOrbitViewCamera {
  azimuth: number | null;
  elevation: number | null;
  roll: number | null;
  distance: number | null;
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
  bodyScaleMode: BodyScaleMode;
}

export interface SceneRenderOptions {
  width?: number;
  height?: number;
  padding?: number;
  preset?: RenderPresetName;
  projection?: "document" | ViewProjection;
  camera?: WorldOrbitViewCamera | null;
  scaleModel?: Partial<RenderScaleModel>;
  bodyScaleMode?: BodyScaleMode;
  activeEventId?: string | null;
}

export interface SpatialScaleModel {
  orbitDistanceMultiplier: number;
  bodyRadiusMultiplier: number;
  markerSizeMultiplier: number;
  ringThicknessMultiplier: number;
  focusPadding: number;
  minBodyRadius: number;
  maxBodyRadius: number;
}

export interface SpatialSceneRenderOptions extends SceneRenderOptions {
  spatialScaleModel?: Partial<SpatialScaleModel>;
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
  semanticGroupIds: string[];
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
  semanticGroupIds: string[];
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
  semanticGroupIds: string[];
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
  semanticGroupIds: string[];
  label: string;
  secondaryLabel: string;
  x: number;
  y: number;
  secondaryY: number;
  textAnchor: "start" | "middle" | "end";
  direction: "above" | "below" | "left" | "right";
  hidden: boolean;
}

export interface RenderSceneEvent {
  renderId: string;
  eventId: string;
  event: WorldOrbitEvent;
  objectIds: string[];
  participantIds: string[];
  targetObjectId: string | null;
  x: number;
  y: number;
  hidden: boolean;
}

export type SceneLayerId =
  | "background"
  | "guides"
  | "orbits-back"
  | "orbits-front"
  | "relations"
  | "events"
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
  eventIds: string[];
  projection: ViewProjection;
  renderProjection: RenderProjectionFallback;
  preset: RenderPresetName | null;
  rotationDeg: number;
  camera: WorldOrbitViewCamera | null;
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

export interface RenderSceneSemanticGroup {
  id: string;
  label: string;
  summary: string;
  color: string | null;
  tags: string[];
  hidden: boolean;
  objectIds: string[];
}

export interface RenderSceneRelation {
  renderId: string;
  relationId: string;
  relation: WorldOrbitRelation;
  fromObjectId: string;
  toObjectId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  hidden: boolean;
}

export interface SpatialBounds {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  width: number;
  height: number;
  depth: number;
  center: CoordinatePoint3D;
}

export interface OrbitalMotionModel {
  phase0Deg: number;
  rotationDeg: number;
  inclinationDeg: number;
  semiMajor: number;
  semiMinor: number;
  eccentricity: number;
  periodSeconds: number | null;
  angularVelocityDegPerSecond: number;
  heuristic: boolean;
  frozen: boolean;
}

export interface SpatialSceneObject {
  objectId: string;
  object: WorldOrbitObject;
  parentId: string | null;
  ancestorIds: string[];
  childIds: string[];
  groupId: string | null;
  semanticGroupIds: string[];
  position: CoordinatePoint3D;
  radius: number;
  visualRadius: number;
  label: string;
  secondaryLabel: string;
  fillColor?: string;
  imageHref?: string;
  hidden: boolean;
  motion: OrbitalMotionModel | null;
}

export interface SpatialOrbit {
  objectId: string;
  object: WorldOrbitObject;
  parentId: string;
  groupId: string | null;
  semanticGroupIds: string[];
  center: CoordinatePoint3D;
  kind: "circle" | "ellipse";
  radius?: number;
  semiMajor: number;
  semiMinor: number;
  rotationDeg: number;
  inclinationDeg: number;
  band: boolean;
  bandThickness?: number;
  hidden: boolean;
  motion: OrbitalMotionModel | null;
}

export interface SpatialFocusTarget {
  objectId: string;
  center: CoordinatePoint3D;
  radius: number;
}

export interface RenderScene {
  width: number;
  height: number;
  padding: number;
  renderPreset: RenderPresetName | null;
  projection: ViewProjection;
  renderProjection: RenderProjectionFallback;
  camera: WorldOrbitViewCamera | null;
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
  semanticGroups: RenderSceneSemanticGroup[];
  viewpoints: RenderSceneViewpoint[];
  events: RenderSceneEvent[];
  activeEventId: string | null;
  objects: RenderSceneObject[];
  orbitVisuals: RenderOrbitVisual[];
  relations: RenderSceneRelation[];
  leaders: RenderLeaderLine[];
  labels: RenderSceneLabel[];
}

export interface SpatialScene {
  width: number;
  height: number;
  padding: number;
  renderPreset: RenderPresetName | null;
  projection: ViewProjection;
  camera: WorldOrbitViewCamera | null;
  scaleModel: SpatialScaleModel;
  title: string;
  subtitle: string;
  systemId: string | null;
  viewMode: "3d";
  layoutPreset: SceneLayoutPreset;
  metadata: Record<string, string>;
  contentBounds: SpatialBounds;
  semanticGroups: RenderSceneSemanticGroup[];
  viewpoints: RenderSceneViewpoint[];
  activeEventId: string | null;
  timeFrozen: boolean;
  objects: SpatialSceneObject[];
  orbits: SpatialOrbit[];
  focusTargets: SpatialFocusTarget[];
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
  events: string[];
  projection: ViewProjection;
  preset: RenderPresetName | null;
  zoom: number | null;
  rotationDeg: number;
  camera: WorldOrbitViewCamera | null;
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
  description: string | null;
  epoch: string | null;
  referencePlane: string | null;
  defaults: WorldOrbitAtlasDefaults;
  atlasMetadata: Record<string, string>;
  viewpoints: WorldOrbitAtlasViewpoint[];
  annotations: WorldOrbitAtlasAnnotation[];
}

export type AtlasDocumentPathKind =
  | "system"
  | "defaults"
  | "metadata"
  | "group"
  | "event"
  | "event-pose"
  | "object"
  | "viewpoint"
  | "annotation"
  | "relation";

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
