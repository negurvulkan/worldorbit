import type { WorldOrbitMarkdownOptions } from "./types.js";
interface HastNode {
    type: string;
    tagName?: string;
    value?: string;
    properties?: Record<string, unknown>;
    children?: HastNode[];
}
export declare function rehypeWorldOrbit(options?: WorldOrbitMarkdownOptions): (tree: HastNode) => void;
export {};
