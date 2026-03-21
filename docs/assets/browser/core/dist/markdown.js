const FENCE_PATTERN = /^```worldorbit(?:\s+(.*))?\s*$/;
export function extractWorldOrbitBlocks(markdown) {
    const lines = markdown.split(/\r?\n/);
    const blocks = [];
    let active = false;
    let activeInfo = null;
    let activeStartLine = 0;
    let buffer = [];
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        if (!active) {
            const match = line.match(FENCE_PATTERN);
            if (match) {
                active = true;
                activeInfo = match[1] ?? null;
                activeStartLine = lineNumber;
                buffer = [];
            }
            return;
        }
        if (line.trim() === "```") {
            blocks.push({
                source: buffer.join("\n"),
                info: activeInfo,
                startLine: activeStartLine,
                endLine: lineNumber,
            });
            active = false;
            activeInfo = null;
            activeStartLine = 0;
            buffer = [];
            return;
        }
        buffer.push(line);
    });
    return blocks;
}
