import {
  evaluateSpatialSceneAtTime,
  type CoordinatePoint,
  type SpatialScene,
  type SpatialSceneObject,
} from "@worldorbit/core";

import { WorldOrbit3DUnavailableError } from "./errors.js";
import { resolveTheme } from "./theme.js";
import type {
  ViewerRenderOptions,
  ViewerState,
  WorldOrbit3DQuality,
} from "./types.js";

interface Viewer3DRuntimeUpdate {
  spatialScene: SpatialScene;
  renderOptions: ViewerRenderOptions;
  visibleObjectIds: Set<string>;
  selectedObjectId: string | null;
  hoveredObjectId: string | null;
  state: ViewerState;
  timeSeconds: number;
}

interface VisualMaterial {
  material: any;
  baseColor: string;
  baseOpacity: number;
  hoveredOpacity: number;
  selectedOpacity: number;
  hoveredColor?: string;
  selectedColor?: string;
  baseEmissive?: string | null;
  hoveredEmissive?: string | null;
  selectedEmissive?: string | null;
  baseEmissiveIntensity?: number;
  hoveredEmissiveIntensity?: number;
  selectedEmissiveIntensity?: number;
}

interface ObjectVisual {
  objectId: string;
  root: any;
  halo: any | null;
  materials: VisualMaterial[];
}

interface OrbitVisual {
  objectId: string;
  root: any;
  materials: VisualMaterial[];
}

interface RuntimeContext {
  THREE: ThreeModule;
  scene3d: any;
  camera: any;
  renderer: any;
  ambientLight: any;
  fillLight: any;
  rimLight: any;
  keyLight: any;
  starfield: any;
  orbitLayer: any;
  objectLayer: any;
  raycaster: any;
  pointer: any;
}

type ThreeModule = typeof import("./vendor/three.module.js");

export interface Viewer3DRuntime {
  update(next: Viewer3DRuntimeUpdate): void;
  hitTest(clientX: number, clientY: number): string | null;
  projectObjectToContainer(objectId: string): CoordinatePoint | null;
  destroy(): void;
}

const VIEW_ROOT_CLASS = "wo-viewer-3d-root";
let threeModulePromise: Promise<ThreeModule> | null = null;

export function createViewer3DRuntime(
  container: HTMLElement,
): Viewer3DRuntime {
  ensureWebGLSupport();

  const root = document.createElement("div");
  root.className = VIEW_ROOT_CLASS;
  root.dataset.worldorbit3d = "true";
  root.innerHTML = `<div class="wo-viewer-3d-loading">Loading 3D view...</div>`;
  container.innerHTML = "";
  container.append(root);

  let runtime: RuntimeContext | null = null;
  let currentScene: SpatialScene | null = null;
  let currentRenderOptions: ViewerRenderOptions | null = null;
  let currentState: ViewerState | null = null;
  let currentVisibleObjectIds = new Set<string>();
  let currentSelectedObjectId: string | null = null;
  let currentHoveredObjectId: string | null = null;
  let currentPositions = new Map<string, { x: number; y: number; z: number }>();
  let pendingUpdate: Viewer3DRuntimeUpdate | null = null;
  let destroyed = false;
  let smoothedCameraPosition: any | null = null;
  let smoothedCameraTarget: any | null = null;
  let currentEnvironmentKey = "";

  const objectVisuals = new Map<string, ObjectVisual>();
  const orbitVisuals = new Map<string, OrbitVisual>();
  const raycastTargets: any[] = [];

  void loadThreeModule()
    .then((THREE) => {
      if (destroyed) {
        return;
      }

      const scene3d = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 24_000);
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.domElement.classList.add("wo-viewer-3d-canvas");
      renderer.domElement.dataset.worldorbit3dCanvas = "true";
      root.innerHTML = "";
      root.append(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.24);
      const fillLight = new (THREE as any).DirectionalLight(0xcfe9ff, 0.36);
      const rimLight = new (THREE as any).DirectionalLight(0x7eb8ff, 0.24);
      const keyLight = new THREE.PointLight(0xfff0cf, 2.6, 0, 2);
      fillLight.position.set(-360, 260, 220);
      rimLight.position.set(340, 180, -280);

      const orbitLayer = new THREE.Group();
      const objectLayer = new THREE.Group();
      const starfield = createStarfield(THREE, 320);
      const raycaster = new THREE.Raycaster();
      raycaster.params.Line = { threshold: 7 };

      scene3d.add(ambientLight);
      scene3d.add(fillLight);
      scene3d.add(rimLight);
      scene3d.add(keyLight);
      scene3d.add(starfield);
      scene3d.add(orbitLayer);
      scene3d.add(objectLayer);

      runtime = {
        THREE,
        scene3d,
        camera,
        renderer,
        ambientLight,
        fillLight,
        rimLight,
        keyLight,
        starfield,
        orbitLayer,
        objectLayer,
        raycaster,
        pointer: new THREE.Vector2(),
      };

      configureRenderer(renderer, THREE, "balanced");

      if (pendingUpdate) {
        applyUpdate(pendingUpdate);
      }
    })
    .catch((error) => {
      if (destroyed) {
        return;
      }

      root.innerHTML = `<div class="wo-viewer-3d-loading is-error">${escapeHtml(
        error instanceof Error ? error.message : "WorldOrbit 3D could not be initialized.",
      )}</div>`;
    });

  return {
    update(next: Viewer3DRuntimeUpdate): void {
      pendingUpdate = next;
      applyUpdate(next);
    },
    hitTest(clientX: number, clientY: number): string | null {
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
    projectObjectToContainer(objectId: string): CoordinatePoint | null {
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
        x: rect.left - containerRect.left + ((vector.x + 1) / 2) * rect.width,
        y: rect.top - containerRect.top + ((1 - vector.y) / 2) * rect.height,
      };
    },
    destroy(): void {
      destroyed = true;
      pendingUpdate = null;
      runtime?.renderer.dispose();
      runtime?.starfield?.geometry?.dispose?.();
      runtime?.starfield?.material?.dispose?.();
      root.remove();
      objectVisuals.clear();
      orbitVisuals.clear();
      raycastTargets.length = 0;
      runtime = null;
    },
  };

  function applyUpdate(next: Viewer3DRuntimeUpdate): void {
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

    configureRenderer(
      runtime.renderer,
      runtime.THREE,
      currentRenderOptions?.quality ?? "balanced",
    );
    const nextEnvironmentKey = JSON.stringify({
      theme: currentRenderOptions?.theme ?? null,
      quality: currentRenderOptions?.quality ?? "balanced",
      style3d: currentRenderOptions?.style3d ?? "symbolic",
    });
    if (nextEnvironmentKey !== currentEnvironmentKey) {
      updateEnvironment(runtime, currentRenderOptions);
      currentEnvironmentKey = nextEnvironmentKey;
    }

    if (sceneChanged) {
      rebuildScene(next.spatialScene);
    }

    resizeRenderer(next.spatialScene);
    currentPositions = evaluateSpatialSceneAtTime(next.spatialScene, next.timeSeconds);
    updateObjectTransforms();
    updateOrbitTransforms();
    updateVisibility();
    updateInteractionState();
    updateLighting();
    updateCamera();
    runtime.renderer.render(runtime.scene3d, runtime.camera);
  }

  function rebuildScene(spatialScene: SpatialScene): void {
    if (!runtime) {
      return;
    }

    clearGroup(runtime.orbitLayer);
    clearGroup(runtime.objectLayer);
    objectVisuals.clear();
    orbitVisuals.clear();
    raycastTargets.length = 0;
    smoothedCameraPosition = null;
    smoothedCameraTarget = null;

    const theme = resolveTheme(currentRenderOptions?.theme);

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

  function updateObjectTransforms(): void {
    for (const object of currentScene?.objects ?? []) {
      const visual = objectVisuals.get(object.objectId);
      const position = currentPositions.get(object.objectId);
      if (visual && position) {
        visual.root.position.set(position.x, position.y, position.z);
      }
    }
  }

  function updateOrbitTransforms(): void {
    for (const orbit of currentScene?.orbits ?? []) {
      const visual = orbitVisuals.get(orbit.objectId);
      if (!visual) {
        continue;
      }

      const parentPosition = currentPositions.get(orbit.parentId);
      visual.root.position.set(
        parentPosition?.x ?? orbit.center.x,
        parentPosition?.y ?? orbit.center.y,
        parentPosition?.z ?? orbit.center.z,
      );
    }
  }

  function updateVisibility(): void {
    const layers = currentRenderOptions?.layers ?? {};

    for (const object of currentScene?.objects ?? []) {
      const visual = objectVisuals.get(object.objectId);
      if (!visual) {
        continue;
      }

      const hideStructure =
        layers.structures === false &&
        (object.object.type === "structure" || object.object.type === "phenomenon");
      visual.root.visible =
        !object.hidden &&
        currentVisibleObjectIds.has(object.objectId) &&
        layers.objects !== false &&
        !hideStructure;
    }

    for (const orbit of currentScene?.orbits ?? []) {
      const visual = orbitVisuals.get(orbit.objectId);
      if (!visual) {
        continue;
      }

      const hideStructure =
        layers.structures === false &&
        (orbit.object.type === "structure" || orbit.object.type === "phenomenon");
      visual.root.visible =
        !orbit.hidden &&
        currentVisibleObjectIds.has(orbit.objectId) &&
        layers.orbits !== false &&
        !hideStructure;
    }
  }

  function updateInteractionState(): void {
    if (!runtime) {
      return;
    }

    for (const visual of objectVisuals.values()) {
      const selected = currentSelectedObjectId === visual.objectId;
      const hovered = currentHoveredObjectId === visual.objectId;
      applyVisualState(runtime.THREE, visual.materials, selected, hovered);
      const scale = selected ? 1.16 : hovered ? 1.08 : 1;
      visual.root.scale.set(scale, scale, scale);
      if (visual.halo) {
        visual.halo.visible = selected || hovered;
      }
    }

    for (const visual of orbitVisuals.values()) {
      applyVisualState(
        runtime.THREE,
        visual.materials,
        currentSelectedObjectId === visual.objectId,
        currentHoveredObjectId === visual.objectId,
      );
    }
  }

  function updateLighting(): void {
    if (!runtime || !currentScene) {
      return;
    }

    const primaryStar =
      currentScene.objects.find((object) => object.object.type === "star" && !object.hidden) ??
      null;
    const starPosition = primaryStar
      ? currentPositions.get(primaryStar.objectId) ?? primaryStar.position
      : { x: 0, y: 40, z: 0 };

    runtime.keyLight.position.set(starPosition.x, starPosition.y + 20, starPosition.z);
  }

  function updateCamera(): void {
    if (!runtime || !currentScene || !currentState) {
      return;
    }

    const sceneCamera = currentRenderOptions?.camera ?? currentScene.camera;
    const bounds = currentScene.contentBounds;
    const size = Math.max(bounds.width, bounds.depth, bounds.height, 160);
    const yaw = degreesToRadians((sceneCamera?.azimuth ?? 30) + currentState.rotationDeg);
    const pitch = degreesToRadians(clampValue(sceneCamera?.elevation ?? 22, -75, 75));
    const zoomDistanceFactor = clampValue(2.2 / Math.max(currentState.scale, 0.1), 0.35, 7.2);
    const semanticDistance = clampValue(sceneCamera?.distance ?? 5.4, 2, 24);
    const distance = clampValue(size * zoomDistanceFactor * (semanticDistance / 5.4), 24, 8_000);
    const panFactor = Math.max(size / 900, 0.12);
    const target = new runtime.THREE.Vector3(
      bounds.center.x - currentState.translateX * panFactor,
      bounds.center.y,
      bounds.center.z - currentState.translateY * panFactor,
    );
    const desiredPosition = new runtime.THREE.Vector3(
      target.x + distance * Math.cos(pitch) * Math.sin(yaw),
      target.y + distance * Math.sin(pitch),
      target.z + distance * Math.cos(pitch) * Math.cos(yaw),
    );
    const smoothing =
      (currentRenderOptions?.style3d ?? "symbolic") === "cinematic" ? 0.16 : 0.32;

    if (!smoothedCameraPosition || !smoothedCameraTarget) {
      smoothedCameraPosition = desiredPosition.clone();
      smoothedCameraTarget = target.clone();
    } else {
      smoothedCameraPosition.lerp(desiredPosition, smoothing);
      smoothedCameraTarget.lerp(target, smoothing);
    }

    runtime.camera.position.copy(smoothedCameraPosition);
    runtime.camera.lookAt(smoothedCameraTarget);

    if (sceneCamera?.roll) {
      runtime.camera.rotation.z = degreesToRadians(sceneCamera.roll);
    }
  }

  function resizeRenderer(spatialScene: SpatialScene): void {
    if (!runtime) {
      return;
    }

    const width = Math.max(1, Math.round(container.clientWidth || spatialScene.width || 960));
    const height = Math.max(1, Math.round(container.clientHeight || spatialScene.height || 560));
    runtime.renderer.setSize(width, height, false);
    runtime.camera.aspect = width / height;
    runtime.camera.updateProjectionMatrix();
  }
}

function createObjectVisual(
  THREE: ThreeModule,
  object: SpatialSceneObject,
  theme: ReturnType<typeof resolveTheme>,
): ObjectVisual {
  const root = new THREE.Group();
  root.userData.objectId = object.objectId;
  const baseColor = object.fillColor ?? colorForObject(object);
  const materials: VisualMaterial[] = [];
  const bodyMaterial = materialForObject(THREE, object, baseColor, theme);
  const body = new THREE.Mesh(
    geometryForObject(THREE, object),
    bodyMaterial.material,
  );
  body.userData.objectId = object.objectId;
  root.add(body);
  materials.push(bodyMaterial);

  if (shouldRenderAtmosphere(object)) {
    const atmosphereMaterial: VisualMaterial = {
      material: new THREE.MeshBasicMaterial({
        color: theme.atmosphere,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
          side: 2,
      }),
      baseColor: theme.atmosphere,
      baseOpacity: 0.24,
      hoveredOpacity: 0.34,
      selectedOpacity: 0.42,
    };
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(object.visualRadius, 2) * 1.16, 20, 14),
      atmosphereMaterial.material,
    );
    atmosphere.userData.objectId = object.objectId;
    root.add(atmosphere);
    materials.push(atmosphereMaterial);
  }

  if (object.object.type === "comet") {
    const tailMaterial: VisualMaterial = {
      material: new THREE.MeshBasicMaterial({
        color: theme.cometTail,
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
      }),
      baseColor: theme.cometTail,
      baseOpacity: 0.36,
      hoveredOpacity: 0.48,
      selectedOpacity: 0.56,
    };
    const tail = new THREE.Mesh(
      new (THREE as any).ConeGeometry(Math.max(object.visualRadius * 0.55, 2), Math.max(object.visualRadius * 2.8, 8), 12, 1, true),
      tailMaterial.material,
    );
    tail.position.set(-Math.max(object.visualRadius * 1.4, 4), 0, 0);
    tail.rotation.z = -Math.PI / 2;
    tail.userData.objectId = object.objectId;
    root.add(tail);
    materials.push(tailMaterial);
  }

  const halo = createHalo(THREE, object, theme);
  if (halo) {
    halo.visible = false;
    halo.userData.objectId = object.objectId;
    root.add(halo);
  }

  return { objectId: object.objectId, root, halo, materials };
}

function createOrbitVisual(
  THREE: ThreeModule,
  orbit: SpatialScene["orbits"][number],
  theme: ReturnType<typeof resolveTheme>,
): OrbitVisual {
  const root = new THREE.Group();
  root.userData.objectId = orbit.objectId;
  root.rotation.y = degreesToRadians(orbit.rotationDeg);
  root.rotation.x = degreesToRadians(orbit.inclinationDeg);
  const baseColor = orbit.object.properties.color as string | undefined ?? theme.orbit;

  if (orbit.band) {
    const material: VisualMaterial = {
      material: new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: theme.orbitBandOpacity,
        side: 2,
        depthWrite: false,
      }),
      baseColor,
      baseOpacity: theme.orbitBandOpacity,
      hoveredOpacity: Math.min(theme.orbitBandOpacity + 0.1, 0.58),
      selectedOpacity: Math.min(theme.orbitBandOpacity + 0.18, 0.72),
      hoveredColor: theme.accent,
      selectedColor: theme.accentStrong,
    };
    const mesh = new THREE.Mesh(bandGeometryForOrbit(THREE, orbit), material.material);
    mesh.userData.objectId = orbit.objectId;
    root.add(mesh);
    return { objectId: orbit.objectId, root, materials: [material] };
  }

  const material: VisualMaterial = {
    material: new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: theme.orbitOpacity,
    }),
    baseColor,
    baseOpacity: theme.orbitOpacity,
    hoveredOpacity: Math.min(theme.orbitOpacity + 0.18, 0.72),
    selectedOpacity: Math.min(theme.orbitOpacity + 0.3, 0.88),
    hoveredColor: theme.accent,
    selectedColor: theme.accentStrong,
  };
  const geometry = new THREE.BufferGeometry().setFromPoints(sampleOrbitPoints(THREE, orbit, 120));
  const line = new THREE.LineLoop(geometry, material.material);
  line.userData.objectId = orbit.objectId;
  root.add(line);
  return { objectId: orbit.objectId, root, materials: [material] };
}

function materialForObject(
  THREE: ThreeModule,
  object: SpatialSceneObject,
  baseColor: string,
  theme: ReturnType<typeof resolveTheme>,
): VisualMaterial {
  if (object.object.type === "star") {
    return {
        material: new (THREE as any).MeshStandardMaterial({
        color: baseColor,
        emissive: new THREE.Color(theme.starGlow),
        emissiveIntensity: 1.2,
        roughness: 0.35,
        metalness: 0.02,
      }),
      baseColor,
      baseOpacity: 1,
      hoveredOpacity: 1,
      selectedOpacity: 1,
      hoveredColor: theme.starCore,
      selectedColor: "#fff2c4",
      baseEmissive: theme.starGlow,
      hoveredEmissive: theme.starGlow,
      selectedEmissive: "#fff6cc",
      baseEmissiveIntensity: 1.2,
      hoveredEmissiveIntensity: 1.5,
      selectedEmissiveIntensity: 1.8,
    };
  }

  if (object.object.type === "phenomenon") {
    return {
      material: new THREE.MeshPhongMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.7,
        emissive: new THREE.Color(baseColor),
        emissiveIntensity: 0.32,
        shininess: 90,
      }),
      baseColor,
      baseOpacity: 0.7,
      hoveredOpacity: 0.82,
      selectedOpacity: 0.9,
      hoveredColor: theme.accent,
      selectedColor: theme.selectionHalo,
      baseEmissive: baseColor,
      hoveredEmissive: theme.accent,
      selectedEmissive: theme.selectionHalo,
      baseEmissiveIntensity: 0.32,
      hoveredEmissiveIntensity: 0.52,
      selectedEmissiveIntensity: 0.74,
    };
  }

  const shininess =
    object.object.type === "structure" ? 70 :
    object.object.type === "ring" ? 42 :
    object.object.type === "belt" ? 26 :
    36;

  return {
    material: new THREE.MeshPhongMaterial({
      color: baseColor,
      specular: new THREE.Color(theme.objectSpecular),
      shininess,
      transparent: false,
      opacity: 1,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0.02,
    }),
    baseColor,
    baseOpacity: 1,
    hoveredOpacity: 1,
    selectedOpacity: 1,
    hoveredColor: shiftColorLightness(THREE, baseColor, 0.08),
    selectedColor: shiftColorLightness(THREE, baseColor, 0.16),
    hoveredEmissive: "#8fcaff",
    selectedEmissive: theme.selectionHalo,
    baseEmissiveIntensity: 0.02,
    hoveredEmissiveIntensity: 0.12,
    selectedEmissiveIntensity: 0.22,
  };
}

function geometryForObject(THREE: ThreeModule, object: SpatialSceneObject): any {
  const radius = Math.max(object.visualRadius, 2);

  switch (object.object.type) {
    case "star":
      return new THREE.SphereGeometry(radius * 1.14, 34, 24);
    case "structure":
      return geometryForStructure(THREE, object, radius);
    case "phenomenon":
      return new THREE.IcosahedronGeometry(radius * 1.12, 1);
    case "belt":
      return new (THREE as any).TorusGeometry(Math.max(radius * 1.15, 4), Math.max(radius * 0.28, 1), 10, 24);
    case "ring":
      return new (THREE as any).TorusGeometry(Math.max(radius, 4), Math.max(radius * 0.18, 0.8), 10, 30);
    case "asteroid":
      return new (THREE as any).DodecahedronGeometry(radius, 0);
    case "comet":
      return new THREE.SphereGeometry(radius * 0.94, 18, 14);
    default:
      return new THREE.SphereGeometry(radius, 24, 18);
  }
}

function geometryForStructure(
  THREE: ThreeModule,
  object: SpatialSceneObject,
  radius: number,
): any {
  const kind = String(object.object.properties.kind ?? "").toLowerCase();

  if (kind.includes("relay")) {
    return new THREE.OctahedronGeometry(radius * 1.15, 0);
  }

  if (kind.includes("elevator") || kind.includes("skyhook")) {
    return new (THREE as any).CylinderGeometry(radius * 0.36, radius * 0.52, radius * 2.4, 10);
  }

  if (kind.includes("station")) {
    return new (THREE as any).TorusKnotGeometry(radius * 0.6, Math.max(radius * 0.18, 0.6), 42, 8);
  }

  return new THREE.BoxGeometry(radius * 1.45, radius * 1.2, radius * 1.45);
}

function createHalo(
  THREE: ThreeModule,
  object: SpatialSceneObject,
  theme: ReturnType<typeof resolveTheme>,
): any | null {
  const radius = Math.max(object.visualRadius, 2);
  const geometry =
    object.object.type === "structure"
      ? new THREE.BoxGeometry(radius * 2.2, radius * 2.2, radius * 2.2)
      : new THREE.SphereGeometry(radius * 1.38, 18, 14);
  return new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: theme.selectionHalo,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: 1,
    }),
  );
}

function shouldRenderAtmosphere(object: SpatialSceneObject): boolean {
  if (object.object.type !== "planet" && object.object.type !== "moon") {
    return false;
  }

  return object.object.properties.atmosphere !== undefined;
}

function bandGeometryForOrbit(
  THREE: ThreeModule,
  orbit: SpatialScene["orbits"][number],
): any {
  const thickness = Math.max(orbit.bandThickness ?? 8, 3);
  const points = sampleOrbitPoints(THREE, orbit, 72);
  const curve = new THREE.CatmullRomCurve3(points, true);
  return new THREE.TubeGeometry(curve, 144, thickness * 0.18, 10, true);
}

function sampleOrbitPoints(
  THREE: ThreeModule,
  orbit: SpatialScene["orbits"][number],
  segments = 96,
): any[] {
  const points: any[] = [];
  const semiMajor = Math.max(orbit.semiMajor, orbit.radius ?? 1, 1);
  const semiMinor = Math.max(orbit.semiMinor, orbit.radius ?? 1, 1);

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * semiMajor,
        0,
        Math.sin(angle) * semiMinor,
      ),
    );
  }

  return points;
}

function createStarfield(THREE: ThreeModule, count: number): any {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const radius = 1800 + Math.random() * 2600;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[offset] = radius * Math.sin(phi) * Math.cos(theta);
    positions[offset + 1] = radius * Math.cos(phi) * 0.45;
    positions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  geometry.setAttribute("position", new (THREE as any).BufferAttribute(positions, 3));
  geometry.setAttribute("color", new (THREE as any).BufferAttribute(colors, 3));

  return new (THREE as any).Points(
    geometry,
    new (THREE as any).PointsMaterial({
      size: 5,
      transparent: true,
      opacity: 0.84,
      depthWrite: false,
      vertexColors: true,
      sizeAttenuation: true,
    }),
  );
}

function configureRenderer(renderer: any, THREE: any, quality: WorldOrbit3DQuality): void {
  const pixelRatioCap = quality === "high" ? 2.4 : quality === "low" ? 1.2 : 1.8;
  renderer.setPixelRatio?.(Math.min(globalThis.window?.devicePixelRatio ?? 1, pixelRatioCap));
  if ("outputColorSpace" in renderer && "SRGBColorSpace" in THREE) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if ("outputEncoding" in renderer && "sRGBEncoding" in THREE) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  if ("ACESFilmicToneMapping" in THREE) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
  }
}

function updateEnvironment(
  runtime: RuntimeContext,
  renderOptions: ViewerRenderOptions | null,
): void {
  const theme = resolveTheme(renderOptions?.theme);
  const quality = renderOptions?.quality ?? "balanced";
  const style3d = renderOptions?.style3d ?? "symbolic";
  const count = quality === "high" ? 520 : quality === "low" ? 180 : 320;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const bright = new runtime.THREE.Color(theme.starfield);
  const dim = new runtime.THREE.Color(theme.starfieldDim);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const radius = 1800 + Math.random() * 2600;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[offset] = radius * Math.sin(phi) * Math.cos(theta);
    positions[offset + 1] = radius * Math.cos(phi) * 0.45;
    positions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const color = Math.random() > 0.72 ? bright : dim;
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
  }

  runtime.scene3d.background = new runtime.THREE.Color(theme.backgroundStart);
  runtime.scene3d.fog = new (runtime.THREE as any).FogExp2(theme.spaceFog, 0.00085);
  runtime.ambientLight.intensity = style3d === "cinematic" ? 0.18 : 0.26;
  runtime.fillLight.intensity = style3d === "cinematic" ? 0.32 : 0.4;
  runtime.rimLight.intensity = style3d === "cinematic" ? 0.28 : 0.22;
  runtime.renderer.toneMappingExposure = style3d === "cinematic" ? 1.18 : 1.08;
  runtime.starfield.geometry.setAttribute("position", new (runtime.THREE as any).BufferAttribute(positions, 3));
  runtime.starfield.geometry.setAttribute("color", new (runtime.THREE as any).BufferAttribute(colors, 3));
  runtime.starfield.material.opacity = quality === "high" ? 0.96 : quality === "low" ? 0.72 : 0.84;
  runtime.starfield.material.size = quality === "high" ? 5.5 : quality === "low" ? 4.25 : 5;
}

function applyVisualState(
  THREE: ThreeModule,
  materials: VisualMaterial[],
  selected: boolean,
  hovered: boolean,
): void {
  for (const entry of materials) {
    const material = entry.material;
    if (!material) {
      continue;
    }

    const color =
      selected
        ? entry.selectedColor ?? entry.baseColor
        : hovered
          ? entry.hoveredColor ?? entry.baseColor
          : entry.baseColor;
    material.color?.set?.(new THREE.Color(color));

    if (typeof material.opacity === "number") {
      material.opacity = selected
        ? entry.selectedOpacity
        : hovered
          ? entry.hoveredOpacity
          : entry.baseOpacity;
      material.transparent = material.opacity < 0.999;
    }

    const emissive =
      selected
        ? entry.selectedEmissive ?? entry.baseEmissive
        : hovered
          ? entry.hoveredEmissive ?? entry.baseEmissive
          : entry.baseEmissive;
    material.emissive?.set?.(
      emissive ? new THREE.Color(emissive) : new THREE.Color(0x000000),
    );
    if ("emissiveIntensity" in material) {
      material.emissiveIntensity = selected
        ? entry.selectedEmissiveIntensity ?? entry.baseEmissiveIntensity ?? 0
        : hovered
          ? entry.hoveredEmissiveIntensity ?? entry.baseEmissiveIntensity ?? 0
          : entry.baseEmissiveIntensity ?? 0;
    }
  }
}

function colorForObject(object: SpatialSceneObject): string {
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
    case "craft":
      return "#ffce8a";
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

function shiftColorLightness(
  THREE: ThreeModule,
  colorValue: string,
  delta: number,
): string {
  const color = new THREE.Color(colorValue);
  color.offsetHSL(0, 0, delta);
  return `#${color.getHexString()}`;
}

function clearGroup(group: any): void {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    child.traverse?.((node: any) => {
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) {
        node.material.forEach((entry: any) => entry?.dispose?.());
      } else {
        node.material?.dispose?.();
      }
    });
  }
}

function ensureWebGLSupport(): void {
  if (typeof document === "undefined") {
    throw new WorldOrbit3DUnavailableError();
  }

  const navigatorLike =
    document.defaultView?.navigator ??
    globalThis.window?.navigator ??
    (typeof navigator !== "undefined" ? navigator : undefined);
  if (/jsdom/i.test(navigatorLike?.userAgent ?? "")) {
    throw new WorldOrbit3DUnavailableError(
      "WorldOrbit 3D needs WebGL support, but this environment did not provide it.",
    );
  }

  const canvas = document.createElement("canvas");
  const tryGetContext = (kind: "webgl2" | "webgl" | "experimental-webgl") => {
    try {
      return canvas.getContext?.(kind) ?? null;
    } catch {
      return null;
    }
  };
  const context =
    tryGetContext("webgl2") ??
    tryGetContext("webgl") ??
    tryGetContext("experimental-webgl");

  if (!context) {
    throw new WorldOrbit3DUnavailableError(
      "WorldOrbit 3D needs WebGL support, but this environment did not provide it.",
    );
  }
}

function resolveUserDataObjectId(target: any): string | null {
  let cursor = target;
  while (cursor) {
    if (typeof cursor.userData?.objectId === "string") {
      return cursor.userData.objectId;
    }
    cursor = cursor.parent;
  }

  return null;
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadThreeModule(): Promise<ThreeModule> {
  if (!threeModulePromise) {
    threeModulePromise = import("./vendor/three.module.js");
  }

  return threeModulePromise;
}
