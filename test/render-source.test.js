import assert from "node:assert/strict";
import test from "node:test";

import { renderSourceToSvg } from "@worldorbit/viewer";

const atlasSource = `
schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  scale presentation
  preset atlas-card

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  image /demo/assets/naar-map.png
`.trim();

const legacyDraftSource = atlasSource.replace("schema 2.0", "schema 2.0-draft");

test("renderSourceToSvg can render canonical schema 2.0 source directly", () => {
  const svg = renderSourceToSvg(atlasSource);

  assert.match(svg, /<svg/);
  assert.match(svg, /Iyath System/);
  assert.match(svg, /\/demo\/assets\/naar-map\.png/);
  assert.match(svg, /viewBox="0 0 960 560"/);
});

test("renderSourceToSvg still accepts legacy schema 2.0-draft input", () => {
  const svg = renderSourceToSvg(legacyDraftSource);

  assert.match(svg, /<svg/);
  assert.match(svg, /Iyath System/);
  assert.match(svg, /\/demo\/assets\/naar-map\.png/);
});
