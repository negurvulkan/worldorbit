import { renderDocumentToScene } from "./scene.js";
const DAY_IN_SECONDS = 86_400;
const YEAR_IN_SECONDS = DAY_IN_SECONDS * 365.25;
const FASTEST_VISIBLE_ORBIT_SECONDS = 18;
const SLOWEST_VISIBLE_ORBIT_SECONDS = 180;
export function renderDocumentToSpatialScene(document, options = {}) {
    const renderOptions = {
        width: options.width,
        height: options.height,
        padding: options.padding,
        preset: options.preset,
        projection: options.projection,
        camera: options.camera,
        scaleModel: options.scaleModel,
        activeEventId: options.activeEventId,
    };
    const scene = renderDocumentToScene(document, renderOptions);
    const scaleModel = resolveSpatialScaleModel(scene.layoutPreset, options.spatialScaleModel);
    const sceneCenter = {
        x: scene.contentBounds.centerX,
        y: scene.contentBounds.centerY,
    };
    const objectMap = new Map(scene.objects.map((object) => [object.objectId, object]));
    const orbitMap = new Map(scene.orbitVisuals.map((orbit) => [orbit.objectId, orbit]));
    const rawMotionMetrics = new Map();
    for (const object of scene.objects) {
        const placement = object.object.placement;
        if (!placement || placement.mode !== "orbit") {
            continue;
        }
        rawMotionMetrics.set(object.objectId, resolveRawOrbitMetric(placement));
    }
    const minimumMotionMetric = Math.min(...[...rawMotionMetrics.values()].filter((value) => Number.isFinite(value) && value > 0)) || 1;
    const positionCache = new Map();
    const spatialObjects = scene.objects.map((entry) => createSpatialObject(entry, scene, sceneCenter, objectMap, orbitMap, scaleModel, positionCache, minimumMotionMetric));
    const spatialObjectMap = new Map(spatialObjects.map((object) => [object.objectId, object]));
    const spatialOrbits = scene.orbitVisuals.map((orbit) => createSpatialOrbit(orbit, spatialObjectMap, minimumMotionMetric, scene.activeEventId !== null));
    const focusTargets = spatialObjects.map((object) => ({
        objectId: object.objectId,
        center: { ...object.position },
        radius: object.visualRadius + scaleModel.focusPadding,
    }));
    return {
        width: scene.width,
        height: scene.height,
        padding: scene.padding,
        renderPreset: scene.renderPreset,
        projection: scene.projection,
        camera: scene.camera,
        scaleModel,
        title: scene.title,
        subtitle: scene.subtitle,
        systemId: scene.systemId,
        viewMode: "3d",
        layoutPreset: scene.layoutPreset,
        metadata: {
            ...scene.metadata,
            "viewer.mode": "3d",
        },
        contentBounds: calculateSpatialBounds(spatialObjects),
        semanticGroups: scene.semanticGroups,
        viewpoints: scene.viewpoints,
        activeEventId: scene.activeEventId,
        timeFrozen: scene.activeEventId !== null,
        objects: spatialObjects,
        orbits: spatialOrbits,
        focusTargets,
    };
}
function createSpatialObject(entry, scene, sceneCenter, objectMap, orbitMap, scaleModel, positionCache, minimumMotionMetric) {
    const position = resolveSpatialObjectPosition(entry, scene, sceneCenter, objectMap, orbitMap, positionCache);
    const motion = createMotionModel(entry.object, orbitMap.get(entry.objectId), minimumMotionMetric, scene.activeEventId !== null);
    return {
        objectId: entry.objectId,
        object: entry.object,
        parentId: entry.parentId,
        ancestorIds: entry.ancestorIds.slice(),
        childIds: entry.childIds.slice(),
        groupId: entry.groupId,
        semanticGroupIds: entry.semanticGroupIds.slice(),
        position,
        radius: clampNumber(entry.radius * scaleModel.bodyRadiusMultiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius),
        visualRadius: clampNumber(entry.visualRadius * scaleModel.bodyRadiusMultiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius + 24),
        label: entry.label,
        secondaryLabel: entry.secondaryLabel,
        fillColor: entry.fillColor,
        imageHref: entry.imageHref,
        hidden: entry.hidden,
        motion,
    };
}
function createSpatialOrbit(orbit, objectMap, minimumMotionMetric, frozen) {
    const owner = objectMap.get(orbit.objectId);
    const parent = objectMap.get(orbit.parentId);
    return {
        objectId: orbit.objectId,
        object: orbit.object,
        parentId: orbit.parentId,
        groupId: orbit.groupId,
        semanticGroupIds: orbit.semanticGroupIds.slice(),
        center: parent?.position ?? { x: 0, y: 0, z: 0 },
        kind: orbit.kind,
        radius: orbit.radius,
        semiMajor: orbit.radius ?? orbit.rx ?? 0,
        semiMinor: orbit.radius ?? orbit.ry ?? 0,
        rotationDeg: orbit.rotationDeg,
        inclinationDeg: owner?.motion?.inclinationDeg ??
            unitValueToDegrees(orbit.object.placement?.mode === "orbit"
                ? orbit.object.placement.inclination
                : undefined) ??
            0,
        band: orbit.band,
        bandThickness: orbit.bandThickness,
        hidden: orbit.hidden,
        motion: owner?.motion ??
            createMotionModel(orbit.object, orbit, minimumMotionMetric, frozen),
    };
}
function resolveSpatialObjectPosition(entry, scene, sceneCenter, objectMap, orbitMap, cache) {
    const cached = cache.get(entry.objectId);
    if (cached) {
        return cached;
    }
    const placement = entry.object.placement;
    let position;
    if (placement?.mode === "orbit" && entry.parentId) {
        const parent = objectMap.get(entry.parentId);
        const parentPosition = parent
            ? resolveSpatialObjectPosition(parent, scene, sceneCenter, objectMap, orbitMap, cache)
            : { x: 0, y: 0, z: 0 };
        const orbit = orbitMap.get(entry.objectId);
        const motion = createMotionModel(entry.object, orbit, 1, scene.activeEventId !== null);
        const local = motion
            ? computeOrbitPosition(motion, 0)
            : {
                x: (entry.x - sceneCenter.x) * 0.8,
                y: 0,
                z: (entry.y - sceneCenter.y) * 0.8,
            };
        position = addPoint3D(parentPosition, local);
    }
    else if (placement?.mode === "surface" && entry.parentId) {
        const parent = objectMap.get(entry.parentId);
        const parentPosition = parent
            ? resolveSpatialObjectPosition(parent, scene, sceneCenter, objectMap, orbitMap, cache)
            : { x: 0, y: 0, z: 0 };
        const parentRadius = parent?.visualRadius ?? 16;
        const seed = hashUnit(entry.objectId);
        const angle = seed * Math.PI * 2;
        position = {
            x: parentPosition.x + Math.cos(angle) * (parentRadius + entry.visualRadius * 0.9),
            y: parentPosition.y + Math.sin(seed * Math.PI) * Math.max(entry.visualRadius * 0.2, 2),
            z: parentPosition.z + Math.sin(angle) * (parentRadius + entry.visualRadius * 0.9),
        };
    }
    else if (placement?.mode === "at" && entry.parentId) {
        const parent = objectMap.get(entry.parentId);
        const parentPosition = parent
            ? resolveSpatialObjectPosition(parent, scene, sceneCenter, objectMap, orbitMap, cache)
            : { x: 0, y: 0, z: 0 };
        const anchorX = entry.anchorX ?? parent?.x ?? sceneCenter.x;
        const anchorY = entry.anchorY ?? parent?.y ?? sceneCenter.y;
        position = {
            x: parentPosition.x + (entry.x - anchorX),
            y: parentPosition.y,
            z: parentPosition.z + (entry.y - anchorY),
        };
    }
    else {
        position = {
            x: (entry.x - sceneCenter.x) * 0.8,
            y: 0,
            z: (entry.y - sceneCenter.y) * 0.8,
        };
    }
    cache.set(entry.objectId, position);
    return position;
}
export function evaluateSpatialSceneAtTime(scene, timeSeconds) {
    const objectMap = new Map(scene.objects.map((object) => [object.objectId, object]));
    const cache = new Map();
    const resolvePosition = (objectId) => {
        const cached = cache.get(objectId);
        if (cached) {
            return cached;
        }
        const object = objectMap.get(objectId);
        if (!object) {
            return { x: 0, y: 0, z: 0 };
        }
        let next = { ...object.position };
        if (object.motion && object.parentId) {
            const parentPosition = resolvePosition(object.parentId);
            const local = computeOrbitPosition(object.motion, scene.timeFrozen ? 0 : timeSeconds);
            next = addPoint3D(parentPosition, local);
        }
        cache.set(objectId, next);
        return next;
    };
    for (const object of scene.objects) {
        resolvePosition(object.objectId);
    }
    return cache;
}
function computeOrbitPosition(motion, timeSeconds) {
    const angleDeg = motion.phase0Deg + motion.angularVelocityDegPerSecond * timeSeconds;
    const angle = degreesToRadians(angleDeg);
    const rotation = degreesToRadians(motion.rotationDeg);
    const inclination = degreesToRadians(motion.inclinationDeg);
    const localX = Math.cos(angle) * motion.semiMajor;
    const localZ = Math.sin(angle) * motion.semiMinor;
    const rotatedX = localX * Math.cos(rotation) - localZ * Math.sin(rotation);
    const rotatedZ = localX * Math.sin(rotation) + localZ * Math.cos(rotation);
    return {
        x: rotatedX,
        y: rotatedZ * Math.sin(inclination),
        z: rotatedZ * Math.cos(inclination),
    };
}
function createMotionModel(object, orbit, minimumMotionMetric, frozen) {
    const placement = object.placement;
    if (!placement || placement.mode !== "orbit") {
        return null;
    }
    const semiMajor = orbit?.radius ??
        orbit?.rx ??
        clampNumber(resolveRawOrbitMetric(placement) * 48, 24, 1_200);
    const semiMinor = orbit?.radius ?? orbit?.ry ?? semiMajor;
    const periodSeconds = unitValueToDurationSeconds(placement.period);
    const rawMetric = resolveRawOrbitMetric(placement);
    const ratio = clampNumber(rawMetric / Math.max(minimumMotionMetric, 0.0001), 1, 20);
    const visualDurationSeconds = periodSeconds
        ? clampNumber(FASTEST_VISIBLE_ORBIT_SECONDS * ratio, FASTEST_VISIBLE_ORBIT_SECONDS, SLOWEST_VISIBLE_ORBIT_SECONDS)
        : clampNumber(FASTEST_VISIBLE_ORBIT_SECONDS * Math.pow(ratio, 0.75), FASTEST_VISIBLE_ORBIT_SECONDS, SLOWEST_VISIBLE_ORBIT_SECONDS);
    return {
        phase0Deg: unitValueToDegrees(placement.phase) ?? 0,
        rotationDeg: unitValueToDegrees(placement.angle) ??
            orbit?.rotationDeg ??
            0,
        inclinationDeg: unitValueToDegrees(placement.inclination) ?? 0,
        semiMajor,
        semiMinor,
        eccentricity: placement.eccentricity ?? 0,
        periodSeconds,
        angularVelocityDegPerSecond: 360 / Math.max(visualDurationSeconds, 0.001),
        heuristic: periodSeconds === null,
        frozen,
    };
}
function resolveRawOrbitMetric(placement) {
    const distance = unitValueToDistanceMetric(placement.semiMajor) ??
        unitValueToDistanceMetric(placement.distance) ??
        1;
    return Math.max(distance, 0.01);
}
function unitValueToDistanceMetric(value) {
    if (!value) {
        return null;
    }
    switch (value.unit) {
        case "au":
            return value.value;
        case "km":
            return value.value / 149_597_870.7;
        case "m":
            return value.value / 149_597_870_700;
        case "re":
            return (value.value * 6_371) / 149_597_870.7;
        case "rj":
            return (value.value * 71_492) / 149_597_870.7;
        case "sol":
            return (value.value * 695_700) / 149_597_870.7;
        case "ly":
            return value.value * 63_241.077;
        case "pc":
            return value.value * 206_264.806;
        case "kpc":
            return value.value * 206_264_806;
        default:
            return value.value;
    }
}
function unitValueToDurationSeconds(value) {
    if (!value) {
        return null;
    }
    switch (value.unit) {
        case "s":
            return value.value;
        case "min":
            return value.value * 60;
        case "h":
            return value.value * 3_600;
        case "d":
            return value.value * DAY_IN_SECONDS;
        case "y":
            return value.value * YEAR_IN_SECONDS;
        case "ky":
            return value.value * YEAR_IN_SECONDS * 1_000;
        case "my":
            return value.value * YEAR_IN_SECONDS * 1_000_000;
        case "gy":
            return value.value * YEAR_IN_SECONDS * 1_000_000_000;
        default:
            return null;
    }
}
function unitValueToDegrees(value) {
    if (!value) {
        return null;
    }
    return value.unit === "deg" || value.unit === null ? value.value : null;
}
function resolveSpatialScaleModel(layoutPreset, overrides) {
    const defaults = defaultSpatialScaleModel(layoutPreset);
    return {
        ...defaults,
        ...overrides,
    };
}
function defaultSpatialScaleModel(layoutPreset) {
    switch (layoutPreset) {
        case "compact":
            return {
                orbitDistanceMultiplier: 0.92,
                bodyRadiusMultiplier: 0.92,
                markerSizeMultiplier: 0.92,
                ringThicknessMultiplier: 0.9,
                focusPadding: 10,
                minBodyRadius: 4,
                maxBodyRadius: 34,
            };
        case "presentation":
            return {
                orbitDistanceMultiplier: 1.15,
                bodyRadiusMultiplier: 1.12,
                markerSizeMultiplier: 1.08,
                ringThicknessMultiplier: 1.14,
                focusPadding: 16,
                minBodyRadius: 5,
                maxBodyRadius: 44,
            };
        default:
            return {
                orbitDistanceMultiplier: 1,
                bodyRadiusMultiplier: 1,
                markerSizeMultiplier: 1,
                ringThicknessMultiplier: 1,
                focusPadding: 12,
                minBodyRadius: 4,
                maxBodyRadius: 40,
            };
    }
}
function calculateSpatialBounds(objects) {
    if (objects.length === 0) {
        return {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 0,
            maxY: 0,
            maxZ: 0,
            width: 0,
            height: 0,
            depth: 0,
            center: { x: 0, y: 0, z: 0 },
        };
    }
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;
    for (const object of objects) {
        minX = Math.min(minX, object.position.x - object.visualRadius);
        minY = Math.min(minY, object.position.y - object.visualRadius);
        minZ = Math.min(minZ, object.position.z - object.visualRadius);
        maxX = Math.max(maxX, object.position.x + object.visualRadius);
        maxY = Math.max(maxY, object.position.y + object.visualRadius);
        maxZ = Math.max(maxZ, object.position.z + object.visualRadius);
    }
    return {
        minX,
        minY,
        minZ,
        maxX,
        maxY,
        maxZ,
        width: maxX - minX,
        height: maxY - minY,
        depth: maxZ - minZ,
        center: {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
            z: (minZ + maxZ) / 2,
        },
    };
}
function addPoint3D(left, right) {
    return {
        x: left.x + right.x,
        y: left.y + right.y,
        z: left.z + right.z,
    };
}
function hashUnit(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return (hash % 10_000) / 10_000;
}
function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function degreesToRadians(value) {
    return (value * Math.PI) / 180;
}
