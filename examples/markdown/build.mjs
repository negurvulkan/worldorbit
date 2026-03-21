import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { remarkWorldOrbit } from "../../packages/markdown/dist/index.js";

const inputPath = process.argv[2] ?? "./examples/markdown/static.md";
const requestedMode = process.argv[3] ?? "static";
const mode = ["static", "interactive", "interactive-2d", "interactive-3d"].includes(requestedMode)
  ? requestedMode
  : "static";
const source = await readFile(inputPath, "utf8");

const file = await unified()
  .use(remarkParse)
  .use(remarkWorldOrbit, { mode })
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true })
  .process(source);

const outputDir = "./examples/markdown/out";
const outputPath = join(outputDir, `${basename(inputPath, ".md")}.${mode}.html`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, String(file), "utf8");

console.log(`Wrote ${outputPath}`);
