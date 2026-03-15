import assert from "node:assert/strict";
import test from "node:test";

import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import {
  rehypeWorldOrbit,
  remarkWorldOrbit,
  renderWorldOrbitBlock,
} from "@worldorbit/markdown";
import { deserializeWorldOrbitEmbedPayload } from "@worldorbit/viewer";

const markdown = `
# Atlas

\`\`\`worldorbit
schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  scale presentation
  preset atlas-card

object star Iyath
object planet Naar orbit Iyath distance 1.18au image /demo/assets/naar-map.png
\`\`\`
`.trim();

const legacyDraftBlock = `
schema 2.0-draft

system Iyath
  title "Iyath System"

defaults
  view isometric
  scale presentation
  preset atlas-card

viewpoint overview
  label "Atlas Overview"
  summary "Legacy draft overview for markdown hydration."
  projection isometric

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

test("renderWorldOrbitBlock emits inline svg for static mode", () => {
  const html = renderWorldOrbitBlock(
    `
schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  preset markdown

object star Iyath
object planet Naar orbit Iyath semiMajor 1.18au eccentricity 0.08 angle 28deg inclination 24deg phase 42deg image /demo/assets/naar-map.png atmosphere nitrogen-oxygen
`.trim(),
    { mode: "static", projection: "isometric", preset: "markdown" },
  );

  assert.match(html, /<svg/);
  assert.match(html, /Iyath/);
  assert.match(html, /\/demo\/assets\/naar-map\.png/);
  assert.match(html, /wo-orbit-back/);
  assert.match(html, /viewBox="0 0 920 540"/);
});

test("renderWorldOrbitBlock emits a hydration payload for interactive mode", () => {
  const html = renderWorldOrbitBlock(
    `
schema 2.0

system Iyath

defaults
  view isometric
  preset atlas-card

object star Iyath
object planet Naar orbit Iyath semiMajor 1.18au eccentricity 0.08 angle 28deg inclination 24deg phase 42deg image /demo/assets/naar-map.png atmosphere nitrogen-oxygen
`.trim(),
    {
      mode: "interactive",
      preset: "atlas-card",
      projection: "isometric",
      initialViewpointId: "overview",
      initialSelectionObjectId: "Naar",
      initialFilter: {
        objectTypes: ["planet"],
        tags: ["habitable"],
      },
      minimap: true,
      scaleModel: {
        bodyRadiusMultiplier: 1.25,
      },
    },
  );

  assert.match(html, /data-worldorbit-embed="true"/);
  assert.match(html, /data-worldorbit-payload=/);

  const payloadMatch = html.match(/data-worldorbit-payload="([^"]+)"/);
  assert.ok(payloadMatch);

  const payload = deserializeWorldOrbitEmbedPayload(payloadMatch[1]);
  const planet = payload.scene.objects.find((object) => object.objectId === "Naar");

  assert.equal(payload.version, "2.0");
  assert.equal(planet?.imageHref, "/demo/assets/naar-map.png");
  assert.equal(payload.scene.projection, "isometric");
  assert.equal(payload.scene.scaleModel.bodyRadiusMultiplier, 1.25);
  assert.equal(payload.scene.renderPreset, "atlas-card");
  assert.equal(payload.options?.initialViewpointId, "overview");
  assert.equal(payload.options?.initialSelectionObjectId, "Naar");
  assert.equal(payload.options?.initialFilter?.objectTypes?.[0], "planet");
  assert.equal(payload.options?.minimap, true);
  assert.match(html, /data-worldorbit-preset="atlas-card"/);
  assert.match(html, /data-worldorbit-viewpoint="overview"/);
});

test("renderWorldOrbitBlock accepts legacy schema 2.0-draft input for compatibility", () => {
  const html = renderWorldOrbitBlock(legacyDraftBlock, {
    mode: "interactive",
  });

  assert.match(html, /data-worldorbit-preset="atlas-card"/);

  const payloadMatch = html.match(/data-worldorbit-payload="([^"]+)"/);
  assert.ok(payloadMatch);

  const payload = deserializeWorldOrbitEmbedPayload(payloadMatch[1]);
  assert.equal(payload.scene.renderPreset, "atlas-card");
  assert.equal(payload.scene.projection, "isometric");
  assert.equal(payload.scene.viewpoints[0]?.summary, "Legacy draft overview for markdown hydration.");
});

test("remark plugin transforms fenced blocks into static markup", async () => {
  const file = await unified()
    .use(remarkParse)
    .use(remarkWorldOrbit, { mode: "static" })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  assert.match(String(file), /worldorbit-static/);
  assert.match(String(file), /<svg/);
});

test("rehype plugin transforms language-worldorbit code blocks into interactive embeds", async () => {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeWorldOrbit, { mode: "interactive" })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  assert.match(String(file), /data-worldorbit-embed="true"/);
  assert.match(String(file), /data-worldorbit-payload=/);
});

test("markdown rendering can emit readable error blocks in non-strict mode", () => {
  const html = renderWorldOrbitBlock("planet Naar orbit Missing", {
    strict: false,
  });

  assert.match(html, /WorldOrbit error:/);
});
