import { renderWorldOrbitBlock } from "./html.js";
export function remarkWorldOrbit(options = {}) {
    return function transform(tree) {
        visitMdNodes(tree, (node, index, parent) => {
            if (!parent || index === -1 || node.type !== "code" || !isWorldOrbitLanguage(node.lang)) {
                return;
            }
            parent.children[index] = {
                type: "html",
                value: renderWorldOrbitBlock(node.value ?? "", options),
            };
        });
    };
}
function visitMdNodes(node, visitor, parent = null) {
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
function isWorldOrbitLanguage(language) {
    return (language ?? "").trim().toLowerCase() === "worldorbit";
}
