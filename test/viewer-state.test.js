import assert from "node:assert/strict";
import test from "node:test";

import { parse, renderDocumentToScene } from "@worldorbit/core";
import {
  DEFAULT_VIEWER_STATE,
  composeViewerTransform,
  fitViewerState,
  focusViewerState,
  panViewerState,
  rotateViewerState,
  zoomViewerStateAt,
} from "@worldorbit/viewer/viewer-state";

const constraints = {
  minScale: 0.2,
  maxScale: 8,
  fitPadding: 48,
};

const source = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
moon Leth orbit Naar distance 220000km
structure Relay kind relay at Naar:L4
`.trim();

function projectPoint(scene, state, point) {
  const center = { x: scene.width / 2, y: scene.height / 2 };
  const radians = (state.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const rotatedX = dx * cos - dy * sin;
  const rotatedY = dx * sin + dy * cos;

  return {
    x: center.x + rotatedX * state.scale + state.translateX,
    y: center.y + rotatedY * state.scale + state.translateY,
  };
}

test("zoom keeps the anchor point stable", () => {
  const scene = renderDocumentToScene(parse(source).document);
  const anchor = { x: 180, y: 240 };
  const zoomed = zoomViewerStateAt(
    scene,
    DEFAULT_VIEWER_STATE,
    2,
    anchor,
    constraints,
  );
  const projected = projectPoint(scene, zoomed, anchor);

  assert.ok(Math.abs(projected.x - anchor.x) < 0.001);
  assert.ok(Math.abs(projected.y - anchor.y) < 0.001);
});

test("pan, rotate, fit, and focus produce bounded camera states", () => {
  const scene = renderDocumentToScene(parse(source).document);
  const panned = panViewerState(DEFAULT_VIEWER_STATE, 24, -18);
  const rotated = rotateViewerState(panned, 45);
  const fit = fitViewerState(scene, rotated, constraints);
  const focused = focusViewerState(scene, fit, "Naar", constraints);
  const target = scene.objects.find((object) => object.objectId === "Naar");

  assert.equal(panned.translateX, 24);
  assert.equal(panned.translateY, -18);
  assert.equal(rotated.rotationDeg, 45);
  assert.ok(fit.scale >= constraints.minScale);
  assert.ok(fit.scale <= constraints.maxScale);
  assert.ok(target);

  if (!target) {
    assert.fail("Target object should exist in the scene");
  }

  const projected = projectPoint(scene, focused, { x: target.x, y: target.y });
  assert.ok(Math.abs(projected.x - scene.width / 2) < 0.001);
  assert.ok(Math.abs(projected.y - scene.height / 2) < 0.001);
  assert.ok(focused.scale >= 1.8);
  assert.equal(focused.selectedObjectId, "Naar");
  assert.match(composeViewerTransform(scene, focused), /scale\(/);
});
