import { upgradeDocumentToDraftV2, upgradeDocumentToV2 } from "./draft.js";
const CANONICAL_FIELD_ORDER = [
    "title",
    "view",
    "scale",
    "units",
    "kind",
    "class",
    "tags",
    "color",
    "image",
    "hidden",
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
    "radius",
    "mass",
    "density",
    "gravity",
    "temperature",
    "albedo",
    "atmosphere",
    "inner",
    "outer",
    "on",
    "source",
    "cycle",
];
export function formatDocument(document, options = {}) {
    const schema = options.schema ?? "auto";
    const useDraft = schema === "2.0" ||
        schema === "2.1" ||
        schema === "2.5" ||
        schema === "2.6" ||
        schema === "3.0" ||
        schema === "3.1" ||
        schema === "2.0-draft" ||
        document.version === "2.0" ||
        document.version === "2.1" ||
        document.version === "2.5" ||
        document.version === "3.0" ||
        document.version === "3.1" ||
        document.version === "2.6" ||
        document.version === "2.0-draft";
    if (useDraft) {
        if (schema === "2.0-draft") {
            const legacyDraftDocument = document.version === "2.0-draft"
                ? document
                : document.version === "2.0" || document.version === "2.1" || document.version === "2.5" || document.version === "2.6"
                    ? {
                        ...document,
                        version: "2.0-draft",
                        schemaVersion: "2.0-draft",
                    }
                    : upgradeDocumentToDraftV2(document);
            return formatDraftDocument(legacyDraftDocument);
        }
        const atlasDocument = document.version === "2.0" ||
            document.version === "2.1" ||
            document.version === "2.5" ||
            document.version === "2.6" ||
            document.version === "3.0" ||
            document.version === "3.1"
            ? document
            : document.version === "2.0-draft"
                ? {
                    ...document,
                    version: "2.0",
                    schemaVersion: "2.0",
                }
                : upgradeDocumentToV2(document);
        if ((schema === "2.0" ||
            schema === "2.1" ||
            schema === "2.5" ||
            schema === "2.6" ||
            schema === "3.0" ||
            schema === "3.1") &&
            atlasDocument.version !== schema) {
            return formatAtlasDocument({
                ...atlasDocument,
                version: schema,
                schemaVersion: schema,
            });
        }
        return formatAtlasDocument(atlasDocument);
    }
    const lines = [];
    const stableDocument = document;
    if (stableDocument.system) {
        lines.push(...formatSystem(stableDocument.system));
    }
    const sortedObjects = [...stableDocument.objects].sort(compareObjects);
    for (const object of sortedObjects) {
        if (lines.length > 0) {
            lines.push("");
        }
        lines.push(...formatObject(object));
    }
    return lines.join("\n");
}
export function formatAtlasDocument(document) {
    const lines = [`schema ${document.version}`, ""];
    if (document.system) {
        lines.push(...formatAtlasSystem(document.system));
    }
    for (const group of [...document.groups].sort(compareIdLike)) {
        lines.push("");
        lines.push(...formatAtlasGroup(group));
    }
    for (const relation of [...document.relations].sort(compareIdLike)) {
        lines.push("");
        lines.push(...formatAtlasRelation(relation));
    }
    for (const event of [...document.events].sort(compareIdLike)) {
        lines.push("");
        lines.push(...formatAtlasEvent(event));
    }
    for (const trajectory of [...document.trajectories].sort(compareIdLike)) {
        lines.push("");
        lines.push(...formatAtlasTrajectory(trajectory));
    }
    const sortedObjects = [...document.objects].sort(compareObjects);
    if (sortedObjects.length > 0 && lines.at(-1) !== "") {
        lines.push("");
    }
    sortedObjects.forEach((object, index) => {
        if (index > 0) {
            lines.push("");
        }
        lines.push(...formatAtlasObject(object));
    });
    return lines.join("\n");
}
export function formatDraftDocument(document) {
    const legacy = document.version === "2.0-draft"
        ? document
        : {
            ...document,
            version: "2.0-draft",
            schemaVersion: "2.0-draft",
        };
    const lines = ["schema 2.0-draft", ""];
    if (legacy.system) {
        lines.push(...formatAtlasSystem(legacy.system));
    }
    for (const group of [...legacy.groups].sort(compareIdLike)) {
        lines.push("");
        lines.push(...formatAtlasGroup(group));
    }
    for (const relation of [...legacy.relations].sort(compareIdLike)) {
        lines.push("");
        lines.push(...formatAtlasRelation(relation));
    }
    for (const event of [...legacy.events].sort(compareIdLike)) {
        lines.push("");
        lines.push(...formatAtlasEvent(event));
    }
    const sortedObjects = [...legacy.objects].sort(compareObjects);
    if (sortedObjects.length > 0 && lines.at(-1) !== "") {
        lines.push("");
    }
    sortedObjects.forEach((object, index) => {
        if (index > 0) {
            lines.push("");
        }
        lines.push(...formatAtlasObject(object));
    });
    return lines.join("\n");
}
function formatSystem(system) {
    return formatLines("system", system.id, system.properties, null, system.info);
}
function formatLines(objectType, id, properties, placement, info) {
    const lines = [`${objectType} ${id}`];
    const fieldLines = [...formatPlacement(placement), ...formatProperties(properties)];
    for (const fieldLine of fieldLines) {
        lines.push(`  ${fieldLine}`);
    }
    const infoEntries = Object.entries(info).sort(([left], [right]) => left.localeCompare(right));
    if (infoEntries.length > 0) {
        if (fieldLines.length > 0) {
            lines.push("");
        }
        lines.push("  info");
        for (const [key, value] of infoEntries) {
            lines.push(`    ${key} ${quoteIfNeeded(value)}`);
        }
    }
    return lines;
}
function formatAtlasSystem(system) {
    const lines = [`system ${system.id}`];
    if (system.title) {
        lines.push(`  title ${quoteIfNeeded(system.title)}`);
    }
    if (system.description) {
        lines.push(`  description ${quoteIfNeeded(system.description)}`);
    }
    if (system.epoch) {
        lines.push(`  epoch ${quoteIfNeeded(system.epoch)}`);
    }
    if (system.referencePlane) {
        lines.push(`  referencePlane ${quoteIfNeeded(system.referencePlane)}`);
    }
    lines.push("");
    lines.push("defaults");
    lines.push(`  view ${system.defaults.view}`);
    if (system.defaults.scale) {
        lines.push(`  scale ${quoteIfNeeded(system.defaults.scale)}`);
    }
    if (system.defaults.units) {
        lines.push(`  units ${quoteIfNeeded(system.defaults.units)}`);
    }
    if (system.defaults.preset) {
        lines.push(`  preset ${system.defaults.preset}`);
    }
    if (system.defaults.theme) {
        lines.push(`  theme ${quoteIfNeeded(system.defaults.theme)}`);
    }
    if (Object.keys(system.atlasMetadata).length > 0) {
        lines.push("");
        lines.push("atlas");
        lines.push("  metadata");
        for (const [key, value] of Object.entries(system.atlasMetadata).sort(([left], [right]) => left.localeCompare(right))) {
            lines.push(`    ${key} ${quoteIfNeeded(value)}`);
        }
    }
    for (const viewpoint of system.viewpoints) {
        lines.push("");
        lines.push(...formatAtlasViewpoint(viewpoint));
    }
    for (const annotation of system.annotations) {
        lines.push("");
        lines.push(...formatAtlasAnnotation(annotation));
    }
    return lines;
}
function formatObject(object) {
    return formatWorldOrbitObject(object.type, object.id, object);
}
function formatAtlasObject(object) {
    return formatWorldOrbitObject(`object ${object.type}`, object.id, object);
}
function formatWorldOrbitObject(objectType, id, object) {
    const lines = [`${objectType} ${id}`];
    const fieldLines = [
        ...formatPlacement(object.placement),
        ...formatProperties(object.properties),
        ...formatObjectMetadata(object),
    ];
    for (const fieldLine of fieldLines) {
        lines.push(`  ${fieldLine}`);
    }
    const infoEntries = Object.entries(object.info).sort(([left], [right]) => left.localeCompare(right));
    if (infoEntries.length > 0) {
        if (fieldLines.length > 0) {
            lines.push("");
        }
        lines.push("  info");
        for (const [key, value] of infoEntries) {
            lines.push(`    ${key} ${quoteIfNeeded(value)}`);
        }
    }
    for (const blockName of ["climate", "habitability", "settlement"]) {
        const blockEntries = Object.entries(object.typedBlocks?.[blockName] ?? {}).sort(([left], [right]) => left.localeCompare(right));
        if (blockEntries.length > 0) {
            lines.push("");
            lines.push(`  ${blockName}`);
            for (const [key, value] of blockEntries) {
                lines.push(`    ${key} ${quoteIfNeeded(value)}`);
            }
        }
    }
    return lines;
}
function formatPlacement(placement) {
    if (!placement)
        return [];
    switch (placement.mode) {
        case "orbit":
            return [
                `orbit ${placement.target}`,
                ...formatOptionalUnit("distance", placement.distance),
                ...formatOptionalUnit("semiMajor", placement.semiMajor),
                ...formatOptionalNumber("eccentricity", placement.eccentricity),
                ...formatOptionalUnit("period", placement.period),
                ...formatOptionalUnit("angle", placement.angle),
                ...formatOptionalUnit("inclination", placement.inclination),
                ...formatOptionalUnit("phase", placement.phase),
            ];
        case "at":
            return [`at ${formatAtReference(placement.reference)}`];
        case "surface":
            return [`surface ${placement.target}`];
        case "free":
            return [`free ${placement.distance ? formatUnitValue(placement.distance) : placement.descriptor ?? ""}`.trim()];
    }
}
function formatProperties(properties) {
    return Object.keys(properties)
        .sort(compareFieldKeys)
        .map((key) => `${key} ${formatValue(properties[key])}`);
}
function formatObjectMetadata(object) {
    const lines = [];
    if (object.groups?.length) {
        lines.push(`groups ${object.groups.join(" ")}`);
    }
    if (object.trajectoryId) {
        lines.push(`trajectory ${object.trajectoryId}`);
    }
    if (object.epoch) {
        lines.push(`epoch ${quoteIfNeeded(object.epoch)}`);
    }
    if (object.referencePlane) {
        lines.push(`referencePlane ${quoteIfNeeded(object.referencePlane)}`);
    }
    if (object.tidalLock !== undefined) {
        lines.push(`tidalLock ${object.tidalLock ? "true" : "false"}`);
    }
    if (object.renderHints?.renderLabel !== undefined) {
        lines.push(`renderLabel ${object.renderHints.renderLabel ? "true" : "false"}`);
    }
    if (object.renderHints?.renderOrbit !== undefined) {
        lines.push(`renderOrbit ${object.renderHints.renderOrbit ? "true" : "false"}`);
    }
    if (object.renderHints?.renderPriority !== undefined) {
        lines.push(`renderPriority ${object.renderHints.renderPriority}`);
    }
    if (object.resonance) {
        lines.push(`resonance ${object.resonance.targetObjectId} ${object.resonance.ratio}`);
    }
    for (const rule of object.deriveRules ?? []) {
        lines.push(`derive ${rule.field} ${rule.strategy}`);
    }
    for (const rule of object.validationRules ?? []) {
        lines.push(`validate ${rule.rule}`);
    }
    if (object.lockedFields?.length) {
        lines.push(`locked ${object.lockedFields.join(" ")}`);
    }
    for (const tolerance of object.tolerances ?? []) {
        lines.push(`tolerance ${tolerance.field} ${formatValue(tolerance.value)}`);
    }
    return lines;
}
function formatAtlasViewpoint(viewpoint) {
    const lines = [`viewpoint ${viewpoint.id}`, `  label ${quoteIfNeeded(viewpoint.label)}`];
    if (viewpoint.focusObjectId) {
        lines.push(`  focus ${viewpoint.focusObjectId}`);
    }
    if (viewpoint.selectedObjectId && viewpoint.selectedObjectId !== viewpoint.focusObjectId) {
        lines.push(`  select ${viewpoint.selectedObjectId}`);
    }
    if (viewpoint.summary) {
        lines.push(`  summary ${quoteIfNeeded(viewpoint.summary)}`);
    }
    if (viewpoint.projection) {
        lines.push(`  projection ${viewpoint.projection}`);
    }
    if (viewpoint.preset) {
        lines.push(`  preset ${viewpoint.preset}`);
    }
    if (viewpoint.zoom !== null) {
        lines.push(`  zoom ${viewpoint.zoom}`);
    }
    if (viewpoint.rotationDeg !== 0) {
        lines.push(`  rotation ${viewpoint.rotationDeg}`);
    }
    if (viewpoint.camera && hasCameraValues(viewpoint.camera)) {
        lines.push("  camera");
        if (viewpoint.camera.azimuth !== null) {
            lines.push(`    azimuth ${viewpoint.camera.azimuth}`);
        }
        if (viewpoint.camera.elevation !== null) {
            lines.push(`    elevation ${viewpoint.camera.elevation}`);
        }
        if (viewpoint.camera.roll !== null) {
            lines.push(`    roll ${viewpoint.camera.roll}`);
        }
        if (viewpoint.camera.distance !== null) {
            lines.push(`    distance ${viewpoint.camera.distance}`);
        }
    }
    const layerTokens = formatDraftLayers(viewpoint.layers);
    if (layerTokens.length > 0) {
        lines.push(`  layers ${layerTokens.join(" ")}`);
    }
    if (viewpoint.events.length > 0) {
        lines.push(`  events ${viewpoint.events.join(" ")}`);
    }
    if (viewpoint.filter) {
        lines.push("  filter");
        if (viewpoint.filter.query) {
            lines.push(`    query ${quoteIfNeeded(viewpoint.filter.query)}`);
        }
        if (viewpoint.filter.objectTypes.length > 0) {
            lines.push(`    objectTypes ${viewpoint.filter.objectTypes.join(" ")}`);
        }
        if (viewpoint.filter.tags.length > 0) {
            lines.push(`    tags ${viewpoint.filter.tags.map(quoteIfNeeded).join(" ")}`);
        }
        if (viewpoint.filter.groupIds.length > 0) {
            lines.push(`    groups ${viewpoint.filter.groupIds.join(" ")}`);
        }
    }
    return lines;
}
function formatAtlasAnnotation(annotation) {
    const lines = [`annotation ${annotation.id}`, `  label ${quoteIfNeeded(annotation.label)}`];
    if (annotation.targetObjectId) {
        lines.push(`  target ${annotation.targetObjectId}`);
    }
    lines.push(`  body ${quoteIfNeeded(annotation.body)}`);
    if (annotation.tags.length > 0) {
        lines.push(`  tags ${annotation.tags.map(quoteIfNeeded).join(" ")}`);
    }
    return lines;
}
function formatAtlasGroup(group) {
    const lines = [`group ${group.id}`, `  label ${quoteIfNeeded(group.label)}`];
    if (group.summary) {
        lines.push(`  summary ${quoteIfNeeded(group.summary)}`);
    }
    if (group.color) {
        lines.push(`  color ${quoteIfNeeded(group.color)}`);
    }
    if (group.tags.length > 0) {
        lines.push(`  tags ${group.tags.map(quoteIfNeeded).join(" ")}`);
    }
    if (group.hidden) {
        lines.push("  hidden true");
    }
    return lines;
}
function formatAtlasRelation(relation) {
    const lines = [`relation ${relation.id}`];
    if (relation.from) {
        lines.push(`  from ${quoteIfNeeded(relation.from)}`);
    }
    if (relation.to) {
        lines.push(`  to ${quoteIfNeeded(relation.to)}`);
    }
    if (relation.kind) {
        lines.push(`  kind ${quoteIfNeeded(relation.kind)}`);
    }
    if (relation.label) {
        lines.push(`  label ${quoteIfNeeded(relation.label)}`);
    }
    if (relation.summary) {
        lines.push(`  summary ${quoteIfNeeded(relation.summary)}`);
    }
    if (relation.tags.length > 0) {
        lines.push(`  tags ${relation.tags.map(quoteIfNeeded).join(" ")}`);
    }
    if (relation.color) {
        lines.push(`  color ${quoteIfNeeded(relation.color)}`);
    }
    if (relation.hidden) {
        lines.push("  hidden true");
    }
    return lines;
}
function formatAtlasEvent(event) {
    const lines = [`event ${event.id}`, `  kind ${quoteIfNeeded(event.kind)}`];
    if (event.label) {
        lines.push(`  label ${quoteIfNeeded(event.label)}`);
    }
    if (event.summary) {
        lines.push(`  summary ${quoteIfNeeded(event.summary)}`);
    }
    if (event.trajectoryId) {
        lines.push(`  trajectory ${event.trajectoryId}`);
    }
    if (event.targetObjectId) {
        lines.push(`  target ${event.targetObjectId}`);
    }
    if (event.participantObjectIds.length > 0) {
        lines.push(`  participants ${event.participantObjectIds.join(" ")}`);
    }
    if (event.timing) {
        lines.push(`  timing ${quoteIfNeeded(event.timing)}`);
    }
    if (event.visibility) {
        lines.push(`  visibility ${quoteIfNeeded(event.visibility)}`);
    }
    if (event.epoch) {
        lines.push(`  epoch ${quoteIfNeeded(event.epoch)}`);
    }
    if (event.referencePlane) {
        lines.push(`  referencePlane ${quoteIfNeeded(event.referencePlane)}`);
    }
    if (event.tags.length > 0) {
        lines.push(`  tags ${event.tags.map(quoteIfNeeded).join(" ")}`);
    }
    if (event.color) {
        lines.push(`  color ${quoteIfNeeded(event.color)}`);
    }
    if (event.hidden) {
        lines.push("  hidden true");
    }
    if (event.positions.length > 0) {
        lines.push("");
        lines.push("  positions");
        for (const pose of [...event.positions].sort(comparePoseObjectId)) {
            lines.push(`    pose ${pose.objectId}`);
            for (const fieldLine of formatEventPoseFields(pose)) {
                lines.push(`      ${fieldLine}`);
            }
        }
    }
    return lines;
}
function formatEventPoseFields(pose) {
    return [
        ...formatPlacement(pose.placement),
        ...(pose.trajectorySegmentId ? [`segment ${pose.trajectorySegmentId}`] : []),
        ...(pose.trajectoryManeuverId ? [`maneuver ${pose.trajectoryManeuverId}`] : []),
        ...(pose.epoch ? [`epoch ${quoteIfNeeded(pose.epoch)}`] : []),
        ...(pose.referencePlane ? [`referencePlane ${quoteIfNeeded(pose.referencePlane)}`] : []),
        ...formatOptionalUnit("inner", pose.inner),
        ...formatOptionalUnit("outer", pose.outer),
    ];
}
function formatAtlasTrajectory(trajectory) {
    const lines = [`trajectory ${trajectory.id}`];
    if (trajectory.label) {
        lines.push(`  label ${quoteIfNeeded(trajectory.label)}`);
    }
    if (trajectory.summary) {
        lines.push(`  summary ${quoteIfNeeded(trajectory.summary)}`);
    }
    if (trajectory.craftObjectId) {
        lines.push(`  craft ${trajectory.craftObjectId}`);
    }
    if (trajectory.tags.length > 0) {
        lines.push(`  tags ${trajectory.tags.map(quoteIfNeeded).join(" ")}`);
    }
    if (trajectory.color) {
        lines.push(`  color ${quoteIfNeeded(trajectory.color)}`);
    }
    if (trajectory.renderMode) {
        lines.push(`  renderMode ${trajectory.renderMode}`);
    }
    if (trajectory.stroke) {
        lines.push(`  stroke ${quoteIfNeeded(trajectory.stroke)}`);
    }
    if (trajectory.strokeWidth !== null && trajectory.strokeWidth !== undefined) {
        lines.push(`  strokeWidth ${trajectory.strokeWidth}`);
    }
    if (trajectory.marker) {
        lines.push(`  marker ${quoteIfNeeded(trajectory.marker)}`);
    }
    if (trajectory.labelMode) {
        lines.push(`  labelMode ${quoteIfNeeded(trajectory.labelMode)}`);
    }
    if (trajectory.showWaypoints !== null && trajectory.showWaypoints !== undefined) {
        lines.push(`  showWaypoints ${trajectory.showWaypoints ? "true" : "false"}`);
    }
    if (trajectory.hidden) {
        lines.push("  hidden true");
    }
    for (const segment of [...trajectory.segments].sort(compareIdLike)) {
        lines.push("");
        lines.push(`  segment ${segment.id}`);
        for (const field of formatTrajectorySegmentFields(segment)) {
            lines.push(`    ${field}`);
        }
        for (const maneuver of [...segment.maneuvers].sort(compareIdLike)) {
            lines.push(`    maneuver ${maneuver.id}`);
            for (const field of formatTrajectoryManeuverFields(maneuver)) {
                lines.push(`      ${field}`);
            }
        }
    }
    return lines;
}
function formatTrajectorySegmentFields(segment) {
    return [
        `kind ${segment.kind}`,
        ...(segment.label ? [`label ${quoteIfNeeded(segment.label)}`] : []),
        ...(segment.summary ? [`summary ${quoteIfNeeded(segment.summary)}`] : []),
        ...(segment.fromObjectId ? [`from ${segment.fromObjectId}`] : []),
        ...(segment.toObjectId ? [`to ${segment.toObjectId}`] : []),
        ...(segment.aroundObjectId ? [`around ${segment.aroundObjectId}`] : []),
        ...(segment.assist?.objectId ? [`assist ${segment.assist.objectId}`] : []),
        ...(segment.epoch ? [`epoch ${quoteIfNeeded(segment.epoch)}`] : []),
        ...formatOptionalUnit("periapsis", segment.periapsis),
        ...formatOptionalUnit("apoapsis", segment.apoapsis),
        ...formatOptionalUnit("inclination", segment.inclination),
        ...formatOptionalUnit("duration", segment.duration),
        ...formatOptionalUnit("deltaV", segment.deltaV),
        ...formatOptionalUnit("phaseAngle", segment.phaseAngle),
        ...formatOptionalUnit("turnAngle", segment.turnAngle),
        ...formatOptionalUnit("energy", segment.energy),
        ...(segment.waypointLabel ? [`waypointLabel ${quoteIfNeeded(segment.waypointLabel)}`] : []),
        ...(segment.waypointDate ? [`waypointDate ${quoteIfNeeded(segment.waypointDate)}`] : []),
        ...(segment.renderHidden !== null && segment.renderHidden !== undefined
            ? [`renderHidden ${segment.renderHidden ? "true" : "false"}`]
            : []),
        ...(segment.sampleDensity !== null && segment.sampleDensity !== undefined
            ? [`sampleDensity ${segment.sampleDensity}`]
            : []),
        ...(segment.notes.length > 0 ? [`notes ${segment.notes.map(quoteIfNeeded).join(" ")}`] : []),
    ];
}
function formatTrajectoryManeuverFields(maneuver) {
    return [
        `kind ${quoteIfNeeded(maneuver.kind)}`,
        ...(maneuver.label ? [`label ${quoteIfNeeded(maneuver.label)}`] : []),
        ...(maneuver.epoch ? [`epoch ${quoteIfNeeded(maneuver.epoch)}`] : []),
        ...formatOptionalUnit("deltaV", maneuver.deltaV),
        ...formatOptionalUnit("duration", maneuver.duration),
        ...(maneuver.notes.length > 0 ? [`notes ${maneuver.notes.map(quoteIfNeeded).join(" ")}`] : []),
    ];
}
function hasCameraValues(camera) {
    return (camera.azimuth !== null ||
        camera.elevation !== null ||
        camera.roll !== null ||
        camera.distance !== null);
}
function formatValue(value) {
    if (Array.isArray(value)) {
        return value.map((item) => quoteIfNeeded(item)).join(" ");
    }
    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }
    if (typeof value === "number") {
        return String(value);
    }
    if (typeof value === "string") {
        return quoteIfNeeded(value);
    }
    return formatUnitValue(value);
}
function formatUnitValue(value) {
    return `${value.value}${value.unit ?? ""}`;
}
function formatOptionalUnit(key, value) {
    return value ? [`${key} ${formatUnitValue(value)}`] : [];
}
function formatOptionalNumber(key, value) {
    return value === undefined ? [] : [`${key} ${value}`];
}
function formatAtReference(reference) {
    switch (reference.kind) {
        case "lagrange":
            return reference.secondary
                ? `${reference.primary}-${reference.secondary}:${reference.point}`
                : `${reference.primary}:${reference.point}`;
        case "anchor":
            return `${reference.objectId}:${reference.anchor}`;
        case "named":
            return reference.name;
    }
}
function formatDraftLayers(layers) {
    const tokens = [];
    const orbitFront = layers["orbits-front"];
    const orbitBack = layers["orbits-back"];
    if (orbitFront !== undefined || orbitBack !== undefined) {
        tokens.push(orbitFront !== false || orbitBack !== false
            ? "orbits"
            : "-orbits");
    }
    for (const key of ["background", "guides", "relations", "events", "objects", "trajectories", "labels", "metadata"]) {
        if (layers[key] !== undefined) {
            tokens.push(layers[key] ? key : `-${key}`);
        }
    }
    return tokens;
}
function compareFieldKeys(left, right) {
    const leftIndex = CANONICAL_FIELD_ORDER.indexOf(left);
    const rightIndex = CANONICAL_FIELD_ORDER.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1)
        return left.localeCompare(right);
    if (leftIndex === -1)
        return 1;
    if (rightIndex === -1)
        return -1;
    return leftIndex - rightIndex;
}
function compareObjects(left, right) {
    const leftIndex = objectTypeIndex(left.type);
    const rightIndex = objectTypeIndex(right.type);
    if (leftIndex !== rightIndex)
        return leftIndex - rightIndex;
    return left.id.localeCompare(right.id);
}
function compareIdLike(left, right) {
    return left.id.localeCompare(right.id);
}
function comparePoseObjectId(left, right) {
    return left.objectId.localeCompare(right.objectId);
}
function objectTypeIndex(objectType) {
    switch (objectType) {
        case "star":
            return 0;
        case "planet":
            return 1;
        case "moon":
            return 2;
        case "belt":
            return 3;
        case "asteroid":
            return 4;
        case "comet":
            return 5;
        case "ring":
            return 6;
        case "craft":
            return 7;
        case "structure":
            return 8;
        case "phenomenon":
            return 9;
    }
}
function quoteIfNeeded(value) {
    if (!/\s/.test(value) && !value.includes('"')) {
        return value;
    }
    return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}
