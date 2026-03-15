import assert from "node:assert/strict";
import test from "node:test";

import { renderSourceToSvg } from "@worldorbit/viewer";

const draftSource = `
schema 2.0-draft

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

test("renderSourceToSvg can render schema 2 draft source directly", () => {
  const svg = renderSourceToSvg(draftSource);

  assert.match(svg, /<svg/);
  assert.match(svg, /Iyath System/);
  assert.match(svg, /\/demo\/assets\/naar-map\.png/);
  assert.match(svg, /viewBox="0 0 960 560"/);
});
