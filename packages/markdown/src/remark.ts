import { renderWorldOrbitBlock } from "./html.js";
import type { WorldOrbitMarkdownOptions } from "./types.js";

interface MdNode {
  type: string;
  lang?: string | null;
  value?: string;
  children?: MdNode[];
}

export function remarkWorldOrbit(options: WorldOrbitMarkdownOptions = {}) {
  return function transform(tree: MdNode): void {
    visitMdNodes(tree, (node, index, parent) => {
      if (!parent || index === -1 || node.type !== "code" || !isWorldOrbitLanguage(node.lang)) {
        return;
      }

      parent.children![index] = {
        type: "html",
        value: renderWorldOrbitBlock(node.value ?? "", options),
      };
    });
  };
}

function visitMdNodes(
  node: MdNode,
  visitor: (node: MdNode, index: number, parent: MdNode | null) => void,
  parent: MdNode | null = null,
): void {
  const children = node.children ?? [];

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    visitor(child, index, node);
    visitMdNodes(child, visitor, node);
  }

  if (!parent) {
    visitor(node, -1, null);
  }
}

function isWorldOrbitLanguage(language?: string | null): boolean {
  return (language ?? "").trim().toLowerCase() === "worldorbit";
}
