import { evaluateSpatialSceneAtTime, } from "@worldorbit/core";
import { WorldOrbit3DUnavailableError } from "./errors.js";
import { resolveTheme } from "./theme.js";
const VIEW_ROOT_CLASS = "wo-viewer-3d-root";
let threeModulePromise = null;
export function createViewer3DRuntime(container) {
    ensureWebGLSupport();
    const root = document.createElement("div");
    root.className = VIEW_ROOT_CLASS;
    root.dataset.worldorbit3d = "true";
    root.innerHTML = `<div class="wo-viewer-3d-loading">Loading 3D view...</div>`;
    container.innerHTML = "";
    container.append(root);
    let runtime = null;
    let currentScene = null;
    let currentRenderOptions = null;
    let currentState = null;
    let currentVisibleObjectIds = new Set();
    let currentSelectedObjectId = null;
    let currentHoveredObjectId = null;
    let currentTimeSeconds = 0;
    let currentPositions = new Map();
    let pendingUpdate = null;
    let destroyed = false;
    const objectVisuals = new Map();
    const orbitVisuals = new Map();
    const raycastTargets = [];
    void loadThreeModule()
        .then((THREE) => {
        if (destroyed) {
            return;
        }
        const scene3d = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 20_000);
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
        });
        renderer.domElement.classList.add("wo-viewer-3d-canvas");
        renderer.domElement.dataset.worldorbit3dCanvas = "true";
        root.innerHTML = "";
        root.append(renderer.domElement);
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        const keyLight = new THREE.PointLight(0xffffff, 1.35, 0, 2);
        scene3d.add(ambientLight);
        scene3d.add(keyLight);
        const orbitLayer = new THREE.Group();
        const objectLayer = new THREE.Group();
        scene3d.add(orbitLayer);
        scene3d.add(objectLayer);
        const raycaster = new THREE.Raycaster();
        raycaster.params.Line = { threshold: 10 };
        runtime = {
            THREE,
            scene3d,
            camera,
            renderer,
            keyLight,
            orbitLayer,
            objectLayer,
            raycaster,
            pointer: new THREE.Vector2(),
        };
        if (pendingUpdate) {
            applyUpdate(pendingUpdate);
        }
    })
        .catch((error) => {
        if (destroyed) {
            return;
        }
        root.innerHTML = `<div class="wo-viewer-3d-loading is-error">${escapeHtml(error instanceof Error ? error.message : "WorldOrbit 3D could not be initialized.")}</div>`;
    });
    return {
        update(next) {
            pendingUpdate = next;
            applyUpdate(next);
        },
        hitTest(clientX, clientY) {
            if (!runtime || !currentScene) {
                return null;
            }
            const rect = runtime.renderer.domElement.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return null;
            }
            runtime.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            runtime.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
            runtime.raycaster.setFromCamera(runtime.pointer, runtime.camera);
            const intersections = runtime.raycaster.intersectObjects(raycastTargets, true);
            for (const hit of intersections) {
                const objectId = resolveUserDataObjectId(hit.object);
                if (objectId) {
                    return objectId;
                }
            }
            return null;
        },
        projectObjectToContainer(objectId) {
            if (!runtime) {
                return null;
            }
            const position = currentPositions.get(objectId);
            if (!position) {
                return null;
            }
            const vector = new runtime.THREE.Vector3(position.x, position.y, position.z);
            vector.project(runtime.camera);
            if (vector.z > 1) {
                return null;
            }
            const rect = runtime.renderer.domElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            return {
                x: rect.left -
                    containerRect.left +
                    ((vector.x + 1) / 2) * rect.width,
                y: rect.top -
                    containerRect.top +
                    ((1 - vector.y) / 2) * rect.height,
            };
        },
        destroy() {
            destroyed = true;
            pendingUpdate = null;
            runtime?.renderer.dispose();
            root.remove();
            objectVisuals.clear();
            orbitVisuals.clear();
            raycastTargets.length = 0;
            runtime = null;
        },
    };
    function applyUpdate(next) {
        if (!runtime) {
            return;
        }
        const sceneChanged = currentScene !== next.spatialScene;
        currentScene = next.spatialScene;
        currentRenderOptions = next.renderOptions;
        currentState = next.state;
        currentVisibleObjectIds = next.visibleObjectIds;
        currentSelectedObjectId = next.selectedObjectId;
        currentHoveredObjectId = next.hoveredObjectId;
        currentTimeSeconds = next.timeSeconds;
        if (sceneChanged) {
            rebuildScene(next.spatialScene);
        }
        resizeRenderer(next.spatialScene);
        currentPositions = evaluateSpatialSceneAtTime(next.spatialScene, next.timeSeconds);
        updateObjectTransforms();
        updateOrbitTransforms();
        updateVisibility();
        updateInteractionState();
        updateCamera();
        renderNow();
    }
    function rebuildScene(spatialScene) {
        if (!runtime) {
            return;
        }
        clearGroup(runtime.orbitLayer);
        clearGroup(runtime.objectLayer);
        objectVisuals.clear();
        orbitVisuals.clear();
        raycastTargets.length = 0;
        const theme = resolveTheme(currentRenderOptions?.theme);
        runtime.scene3d.background = new runtime.THREE.Color(theme.backgroundStart);
        for (const orbit of spatialScene.orbits) {
            const visual = createOrbitVisual(runtime.THREE, orbit, theme);
            runtime.orbitLayer.add(visual.root);
            orbitVisuals.set(orbit.objectId, visual);
            raycastTargets.push(visual.root);
        }
        for (const object of spatialScene.objects) {
            const visual = createObjectVisual(runtime.THREE, object, theme);
            runtime.objectLayer.add(visual.root);
            objectVisuals.set(object.objectId, visual);
            raycastTargets.push(visual.root);
        }
    }
    function updateObjectTransforms() {
        for (const object of currentScene?.objects ?? []) {
            const visual = objectVisuals.get(object.objectId);
            const position = currentPositions.get(object.objectId);
            if (!visual || !position) {
                continue;
            }
            visual.root.position.set(position.x, position.y, position.z);
        }
    }
    function updateOrbitTransforms() {
        for (const orbit of currentScene?.orbits ?? []) {
            const visual = orbitVisuals.get(orbit.objectId);
            if (!visual) {
                continue;
            }
            const parentPosition = currentPositions.get(orbit.parentId);
            visual.root.position.set(parentPosition?.x ?? orbit.center.x, parentPosition?.y ?? orbit.center.y, parentPosition?.z ?? orbit.center.z);
        }
    }
    function updateVisibility() {
        const layers = currentRenderOptions?.layers ?? {};
        for (const object of currentScene?.objects ?? []) {
            const visual = objectVisuals.get(object.objectId);
            if (!visual) {
                continue;
            }
            const hideStructure = layers.structures === false &&
                (object.object.type === "structure" || object.object.type === "phenomenon");
            const hideObjects = layers.objects === false;
            visual.root.visible =
                !object.hidden &&
                    currentVisibleObjectIds.has(object.objectId) &&
                    !hideStructure &&
                    !hideObjects;
        }
        for (const orbit of currentScene?.orbits ?? []) {
            const visual = orbitVisuals.get(orbit.objectId);
            if (!visual) {
                continue;
            }
            const hideStructure = layers.structures === false &&
                (orbit.object.type === "structure" || orbit.object.type === "phenomenon");
            visual.root.visible =
                !orbit.hidden &&
                    currentVisibleObjectIds.has(orbit.objectId) &&
                    layers.orbits !== false &&
                    !hideStructure;
        }
    }
    function updateInteractionState() {
        if (!runtime) {
            return;
        }
        for (const visual of objectVisuals.values()) {
            applyVisualState(runtime.THREE, visual.materials, visual.baseColor, currentSelectedObjectId === visual.objectId, currentHoveredObjectId === visual.objectId);
            const scale = currentSelectedObjectId === visual.objectId
                ? 1.2
                : currentHoveredObjectId === visual.objectId
                    ? 1.1
                    : 1;
            visual.root.scale.set(scale, scale, scale);
        }
        for (const visual of orbitVisuals.values()) {
            applyVisualState(runtime.THREE, visual.materials, visual.baseColor, currentSelectedObjectId === visual.objectId, currentHoveredObjectId === visual.objectId);
        }
    }
    function updateCamera() {
        if (!runtime || !currentScene || !currentState) {
            return;
        }
        const sceneCamera = currentRenderOptions?.camera ?? currentScene.camera;
        const bounds = currentScene.contentBounds;
        const size = Math.max(bounds.width, bounds.depth, bounds.height, 160);
        const yaw = degreesToRadians((sceneCamera?.azimuth ?? 34) + currentState.rotationDeg);
        const pitch = degreesToRadians(clampValue(sceneCamera?.elevation ?? 24, -75, 75));
        const zoomDistanceFactor = clampValue(2.4 / Math.max(currentState.scale, 0.1), 0.35, 8);
        const semanticDistance = clampValue(sceneCamera?.distance ?? 6, 2, 24);
        const distance = clampValue(size * zoomDistanceFactor * (semanticDistance / 6), 28, 8_000);
        const panFactor = Math.max(size / 900, 0.12);
        const target = new runtime.THREE.Vector3(bounds.center.x - currentState.translateX * panFactor, bounds.center.y, bounds.center.z - currentState.translateY * panFactor);
        runtime.camera.position.set(target.x + distance * Math.cos(pitch) * Math.sin(yaw), target.y + distance * Math.sin(pitch), target.z + distance * Math.cos(pitch) * Math.cos(yaw));
        runtime.camera.lookAt(target);
        if (sceneCamera?.roll) {
            runtime.camera.rotation.z = degreesToRadians(sceneCamera.roll);
        }
        runtime.keyLight.position.copy(runtime.camera.position);
    }
    function resizeRenderer(spatialScene) {
        if (!runtime) {
            return;
        }
        const width = Math.max(1, Math.round(container.clientWidth || spatialScene.width || 960));
        const height = Math.max(1, Math.round(container.clientHeight || spatialScene.height || 560));
        runtime.renderer.setSize(width, height, false);
        runtime.camera.aspect = width / height;
        runtime.camera.updateProjectionMatrix();
    }
    function renderNow() {
        if (!runtime) {
            return;
        }
        runtime.renderer.render(runtime.scene3d, runtime.camera);
    }
}
function createObjectVisual(THREE, object, theme) {
    const root = new THREE.Group();
    root.userData.objectId = object.objectId;
    const baseColor = object.fillColor ?? colorForObject(object);
    const material = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: object.object.type === "star"
            ? new THREE.Color(theme.starGlow)
            : new THREE.Color(0x000000),
        emissiveIntensity: object.object.type === "star" ? 0.6 : 0.08,
        transparent: true,
        opacity: object.object.type === "phenomenon" ? 0.7 : 1,
    });
    const geometry = geometryForObject(THREE, object);
    const body = new THREE.Mesh(geometry, material);
    body.userData.objectId = object.objectId;
    root.add(body);
    return {
        objectId: object.objectId,
        root,
        body,
        materials: [material],
        baseColor,
    };
}
function createOrbitVisual(THREE, orbit, theme) {
    const root = new THREE.Group();
    root.userData.objectId = orbit.objectId;
    root.rotation.y = degreesToRadians(orbit.rotationDeg);
    root.rotation.x = degreesToRadians(orbit.inclinationDeg);
    const baseColor = orbit.object.properties.color ?? theme.orbit;
    const materials = [];
    if (orbit.band) {
        const material = new THREE.MeshBasicMaterial({
            color: baseColor,
            transparent: true,
            opacity: 0.42,
            side: 2,
        });
        const geometry = bandGeometryForOrbit(THREE, orbit);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.objectId = orbit.objectId;
        root.add(mesh);
        materials.push(material);
    }
    else {
        const material = new THREE.LineBasicMaterial({
            color: baseColor,
            transparent: true,
            opacity: 0.55,
        });
        const points = sampleOrbitPoints(THREE, orbit);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.LineLoop(geometry, material);
        line.userData.objectId = orbit.objectId;
        root.add(line);
        materials.push(material);
    }
    return {
        objectId: orbit.objectId,
        root,
        materials,
        baseColor,
    };
}
function geometryForObject(THREE, object) {
    const radius = Math.max(object.visualRadius, 2);
    switch (object.object.type) {
        case "star":
            return new THREE.SphereGeometry(radius * 1.12, 28, 20);
        case "structure":
            return new THREE.BoxGeometry(radius * 1.5, radius * 1.5, radius * 1.5);
        case "phenomenon":
            return new THREE.OctahedronGeometry(radius * 1.25, 0);
        case "belt":
        case "ring":
            return new THREE.OctahedronGeometry(Math.max(radius * 0.85, 3), 0);
        default:
            return new THREE.SphereGeometry(radius, 20, 14);
    }
}
function bandGeometryForOrbit(THREE, orbit) {
    const thickness = Math.max(orbit.bandThickness ?? 8, 3);
    const points = sampleOrbitPoints(THREE, orbit, 72);
    const curve = new THREE.CatmullRomCurve3(points, true);
    return new THREE.TubeGeometry(curve, 128, thickness * 0.28, 10, true);
}
function sampleOrbitPoints(THREE, orbit, segments = 96) {
    const points = [];
    const semiMajor = Math.max(orbit.semiMajor, orbit.radius ?? 1, 1);
    const semiMinor = Math.max(orbit.semiMinor, orbit.radius ?? 1, 1);
    for (let index = 0; index < segments; index += 1) {
        const angle = (index / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * semiMajor, 0, Math.sin(angle) * semiMinor));
    }
    return points;
}
function colorForObject(object) {
    switch (object.object.type) {
        case "star":
            return "#ffd36a";
        case "planet":
            return "#73b6ff";
        case "moon":
            return "#d8dde8";
        case "belt":
            return "#b8926a";
        case "ring":
            return "#cdbf9a";
        case "structure":
            return "#ffce8a";
        case "phenomenon":
            return "#7ce6ff";
        case "asteroid":
            return "#cdb5a1";
        case "comet":
            return "#b8f2ff";
    }
}
function applyVisualState(THREE, materials, baseColor, selected, hovered) {
    const color = new THREE.Color(baseColor);
    if (selected) {
        color.offsetHSL(0, 0, 0.16);
    }
    else if (hovered) {
        color.offsetHSL(0, 0, 0.08);
    }
    for (const material of materials) {
        if (!material) {
            continue;
        }
        material.color?.set?.(color);
        if (typeof material.opacity === "number") {
            material.opacity = selected ? 0.85 : hovered ? 0.72 : material.transparent ? 0.55 : 1;
        }
        material.emissive?.set?.(selected ? new THREE.Color("#ffdda9") : hovered ? new THREE.Color("#cfe9ff") : new THREE.Color(0x000000));
        material.emissiveIntensity = selected ? 0.28 : hovered ? 0.14 : material.emissiveIntensity ?? 0.08;
    }
}
function clearGroup(group) {
    while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) {
            child.material.forEach((entry) => entry?.dispose?.());
        }
        else {
            child.material?.dispose?.();
        }
    }
}
function ensureWebGLSupport() {
    if (typeof document === "undefined") {
        throw new WorldOrbit3DUnavailableError();
    }
    const navigatorLike = document.defaultView?.navigator ??
        globalThis.window?.navigator ??
        (typeof navigator !== "undefined" ? navigator : undefined);
    if (/jsdom/i.test(navigatorLike?.userAgent ?? "")) {
        throw new WorldOrbit3DUnavailableError("WorldOrbit 3D needs WebGL support, but this environment did not provide it.");
    }
    const canvas = document.createElement("canvas");
    const tryGetContext = (kind) => {
        try {
            return canvas.getContext?.(kind) ?? null;
        }
        catch {
            return null;
        }
    };
    const context = tryGetContext("webgl2") ??
        tryGetContext("webgl") ??
        tryGetContext("experimental-webgl");
    if (!context) {
        throw new WorldOrbit3DUnavailableError("WorldOrbit 3D needs WebGL support, but this environment did not provide it.");
    }
}
function resolveUserDataObjectId(target) {
    let cursor = target;
    while (cursor) {
        if (typeof cursor.userData?.objectId === "string") {
            return cursor.userData.objectId;
        }
        cursor = cursor.parent;
    }
    return null;
}
function clampValue(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function degreesToRadians(value) {
    return (value * Math.PI) / 180;
}
function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
function loadThreeModule() {
    if (!threeModulePromise) {
        threeModulePromise = import("./vendor/three.module.js");
    }
    return threeModulePromise;
}
