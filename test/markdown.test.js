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
system Iyath
  title "Iyath System"
star Iyath
planet Naar orbit Iyath distance 1.18au image /demo/assets/naar-map.png
\`\`\`
`.trim();

test("renderWorldOrbitBlock emits inline svg for static mode", () => {
  const html = renderWorldOrbitBlock(
    `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au image /demo/assets/naar-map.png
`.trim(),
    { mode: "static" },
  );

  assert.match(html, /<svg/);
  assert.match(html, /Iyath/);
  assert.match(html, /\/demo\/assets\/naar-map\.png/);
});

test("renderWorldOrbitBlock emits a hydration payload for interactive mode", () => {
  const html = renderWorldOrbitBlock(
    `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au image /demo/assets/naar-map.png
`.trim(),
    { mode: "interactive" },
  );

  assert.match(html, /data-worldorbit-embed="true"/);
  assert.match(html, /data-worldorbit-payload=/);

  const payloadMatch = html.match(/data-worldorbit-payload="([^"]+)"/);
  assert.ok(payloadMatch);

  const payload = deserializeWorldOrbitEmbedPayload(payloadMatch[1]);
  const planet = payload.scene.objects.find((object) => object.objectId === "Naar");

  assert.equal(planet?.imageHref, "/demo/assets/naar-map.png");
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
