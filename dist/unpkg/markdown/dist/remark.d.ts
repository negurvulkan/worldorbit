import type { WorldOrbitMarkdownOptions } from "./types.js";
interface MdNode {
    type: string;
    lang?: string | null;
    value?: string;
    children?: MdNode[];
}
export declare function remarkWorldOrbit(options?: WorldOrbitMarkdownOptions): (tree: MdNode) => void;
export {};
