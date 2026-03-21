import { renderWorldOrbitBlock } from "./html.js";
export function rehypeWorldOrbit(options = {}) {
    return function transform(tree) {
        visitHastNodes(tree, (node, index, parent) => {
            if (!parent || index === -1 || node.type !== "element" || node.tagName !== "pre") {
                return;
            }
            const codeElement = node.children?.[0];
            if (!codeElement || codeElement.type !== "element" || codeElement.tagName !== "code") {
                return;
            }
            const classNames = normalizeClassNames(codeElement.properties?.className);
            if (!classNames.includes("language-worldorbit")) {
                return;
            }
            const source = collectText(codeElement);
            parent.children[index] = {
                type: "raw",
                value: renderWorldOrbitBlock(source, options),
            };
        });
    };
}
function visitHastNodes(node, visitor, parent = null) {
    const children = node.children ?? [];
    for (let index = 0; index < children.length; index += 1) {
        const child = children[index];
        visitor(child, index, node);
        visitHastNodes(child, visitor, node);
    }
    if (!parent) {
        visitor(node, -1, null);
    }
}
function normalizeClassNames(value) {
    if (Array.isArray(value)) {
        return value.map((entry) => String(entry));
    }
    if (typeof value === "string") {
        return value.split(/\s+/).filter(Boolean);
    }
    return [];
}
function collectText(node) {
    if (node.type === "text") {
        return node.value ?? "";
    }
    return (node.children ?? []).map((child) => collectText(child)).join("");
}
