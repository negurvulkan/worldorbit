import { rotatePoint, } from "@worldorbit/core";
export const DEFAULT_VIEWER_STATE = {
    scale: 1,
    rotationDeg: 0,
    translateX: 0,
    translateY: 0,
    selectedObjectId: null,
};
export function normalizeRotation(rotationDeg) {
    let normalized = rotationDeg % 360;
    if (normalized > 180) {
        normalized -= 360;
    }
    if (normalized <= -180) {
        normalized += 360;
    }
    return normalized;
}
export function clampScale(scale, constraints) {
    return Math.min(Math.max(scale, constraints.minScale), constraints.maxScale);
}
export function panViewerState(state, dx, dy) {
    return {
        ...state,
        translateX: state.translateX + dx,
        translateY: state.translateY + dy,
    };
}
export function rotateViewerState(state, deltaDeg) {
    return {
        ...state,
        rotationDeg: normalizeRotation(state.rotationDeg + deltaDeg),
    };
}
export function zoomViewerStateAt(scene, state, factor, anchor, constraints) {
    if (!Number.isFinite(factor) || factor <= 0) {
        return state;
    }
    const center = getSceneCenter(scene);
    const nextScale = clampScale(state.scale * factor, constraints);
    if (nextScale === state.scale) {
        return state;
    }
    const zoomRatio = nextScale / state.scale;
    const anchorDx = anchor.x - center.x;
    const anchorDy = anchor.y - center.y;
    return {
        ...state,
        scale: nextScale,
        translateX: (1 - zoomRatio) * anchorDx + zoomRatio * state.translateX,
        translateY: (1 - zoomRatio) * anchorDy + zoomRatio * state.translateY,
    };
}
export function fitViewerState(scene, state, constraints) {
    const center = getSceneCenter(scene);
    const rotatedBounds = rotateBounds(scene.contentBounds, center, state.rotationDeg);
    const availableWidth = Math.max(scene.width - constraints.fitPadding * 2, 1);
    const availableHeight = Math.max(scene.height - constraints.fitPadding * 2, 1);
    const safeWidth = Math.max(rotatedBounds.width, 1);
    const safeHeight = Math.max(rotatedBounds.height, 1);
    const nextScale = clampScale(Math.min(availableWidth / safeWidth, availableHeight / safeHeight), constraints);
    const rotatedCenter = rotatePoint({
        x: scene.contentBounds.centerX,
        y: scene.contentBounds.centerY,
    }, center, state.rotationDeg);
    return {
        ...state,
        scale: nextScale,
        translateX: center.x - (center.x + (rotatedCenter.x - center.x) * nextScale),
        translateY: center.y - (center.y + (rotatedCenter.y - center.y) * nextScale),
    };
}
export function focusViewerState(scene, state, objectId, constraints) {
    const target = scene.objects.find((object) => object.objectId === objectId && !object.hidden);
    if (!target) {
        return state;
    }
    const center = getSceneCenter(scene);
    const nextScale = clampScale(Math.max(state.scale, 1.8), constraints);
    const rotatedPoint = rotatePoint({ x: target.x, y: target.y }, center, state.rotationDeg);
    return {
        ...state,
        scale: nextScale,
        translateX: center.x - (center.x + (rotatedPoint.x - center.x) * nextScale),
        translateY: center.y - (center.y + (rotatedPoint.y - center.y) * nextScale),
        selectedObjectId: objectId,
    };
}
export function composeViewerTransform(scene, state) {
    const center = getSceneCenter(scene);
    return `translate(${state.translateX} ${state.translateY}) translate(${center.x} ${center.y}) rotate(${state.rotationDeg}) scale(${state.scale}) translate(${-center.x} ${-center.y})`;
}
export function invertViewerPoint(scene, state, point) {
    const center = getSceneCenter(scene);
    const translated = {
        x: point.x - state.translateX,
        y: point.y - state.translateY,
    };
    const centered = {
        x: translated.x - center.x,
        y: translated.y - center.y,
    };
    const scaled = {
        x: centered.x / Math.max(state.scale, 0.0001),
        y: centered.y / Math.max(state.scale, 0.0001),
    };
    const unrotated = rotatePoint({ x: scaled.x, y: scaled.y }, { x: 0, y: 0 }, -state.rotationDeg);
    return {
        x: center.x + unrotated.x,
        y: center.y + unrotated.y,
    };
}
export function getViewerVisibleBounds(scene, state) {
    const corners = [
        { x: 0, y: 0 },
        { x: scene.width, y: 0 },
        { x: scene.width, y: scene.height },
        { x: 0, y: scene.height },
    ].map((point) => invertViewerPoint(scene, state, point));
    const minX = Math.min(...corners.map((corner) => corner.x));
    const minY = Math.min(...corners.map((corner) => corner.y));
    const maxX = Math.max(...corners.map((corner) => corner.x));
    const maxY = Math.max(...corners.map((corner) => corner.y));
    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: minX + (maxX - minX) / 2,
        centerY: minY + (maxY - minY) / 2,
    };
}
export function getSceneCenter(scene) {
    return {
        x: scene.width / 2,
        y: scene.height / 2,
    };
}
function rotateBounds(bounds, center, rotationDeg) {
    const corners = [
        { x: bounds.minX, y: bounds.minY },
        { x: bounds.maxX, y: bounds.minY },
        { x: bounds.maxX, y: bounds.maxY },
        { x: bounds.minX, y: bounds.maxY },
    ].map((corner) => rotatePoint(corner, center, rotationDeg));
    const minX = Math.min(...corners.map((corner) => corner.x));
    const minY = Math.min(...corners.map((corner) => corner.y));
    const maxX = Math.max(...corners.map((corner) => corner.x));
    const maxY = Math.max(...corners.map((corner) => corner.y));
    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: minX + (maxX - minX) / 2,
        centerY: minY + (maxY - minY) / 2,
    };
}
