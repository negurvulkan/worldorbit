import { loadWorldOrbitSource, } from "@worldorbit/core";
import { createHierarchyViewer } from "@worldorbit/viewer";
const STYLE_ID = "worldorbit-hierarchy-editor-style";
export function createHierarchyEditor(container, options = {}) {
    if (!(container instanceof HTMLElement)) {
        throw new Error("WorldOrbit hierarchy editor requires an HTMLElement container.");
    }
    installStyles();
    container.classList.add("woc-editor");
    container.innerHTML = markup();
    const sourceArea = container.querySelector("[data-hierarchy-source]");
    const outline = container.querySelector("[data-hierarchy-outline]");
    const diagnostics = container.querySelector("[data-hierarchy-diagnostics]");
    const viewerHost = container.querySelector("[data-hierarchy-viewer]");
    const scopeSelect = container.querySelector("[data-hierarchy-scope]");
    const zoomInput = container.querySelector("[data-hierarchy-zoom]");
    const status = container.querySelector("[data-hierarchy-status]");
    if (!sourceArea || !outline || !diagnostics || !viewerHost || !scopeSelect || !zoomInput || !status) {
        throw new Error("WorldOrbit hierarchy editor failed to initialize.");
    }
    const sourceField = sourceArea;
    const outlineRoot = outline;
    const diagnosticsRoot = diagnostics;
    const viewerRoot = viewerHost;
    const scopeField = scopeSelect;
    const zoomField = zoomInput;
    const statusRoot = status;
    let source = options.source ?? "";
    let loaded = tryLoad(source);
    let scope = "system";
    let savedSource = source;
    let activeGalaxyId = loaded?.hierarchyDocument?.universe.galaxies[0]?.id ?? null;
    let activeSystemId = loaded?.hierarchyDocument?.universe.galaxies[0]?.systems[0]?.id ?? null;
    let viewer = createHierarchyViewer(viewerRoot, {
        source,
        width: options.width ?? 1080,
        height: options.height ?? 720,
        scope,
        zoom: Number(zoomField.value),
    });
    sourceField.value = source;
    scopeField.value = scope;
    renderOutline();
    renderDiagnostics();
    renderStatus();
    sourceField.addEventListener("input", () => {
        source = sourceField.value;
        loaded = tryLoad(source);
        viewer?.setSource(source);
        renderOutline();
        renderDiagnostics();
        renderStatus();
        notifyChange();
    });
    scopeField.addEventListener("change", () => {
        scope = scopeField.value;
        viewer?.setScope(scope);
        renderStatus();
        notifyChange();
    });
    zoomField.addEventListener("input", () => {
        viewer?.setZoom(Number(zoomField.value));
        renderStatus();
    });
    outlineRoot.addEventListener("click", (event) => {
        const target = event.target;
        const item = target?.closest?.("[data-hierarchy-pick]");
        if (!item || !loaded) {
            return;
        }
        const kind = item.dataset.hierarchyKind;
        const id = item.dataset.hierarchyId ?? null;
        if (kind === "galaxy") {
            activeGalaxyId = id;
            activeSystemId =
                loaded.hierarchyDocument?.universe.galaxies.find((galaxy) => galaxy.id === id)?.systems[0]?.id ?? null;
            viewer?.setActiveGalaxy(activeGalaxyId);
            viewer?.setActiveSystem(activeSystemId);
            scope = "galaxy";
            scopeField.value = scope;
            viewer?.setScope(scope);
        }
        else if (kind === "system") {
            activeSystemId = id;
            viewer?.setActiveSystem(activeSystemId);
            scope = "system";
            scopeField.value = scope;
            viewer?.setScope(scope);
        }
        else if (kind === "universe") {
            scope = "universe";
            scopeField.value = scope;
            viewer?.setScope(scope);
        }
        renderStatus();
        notifyChange();
    });
    notifyChange();
    return {
        getSource() {
            return source;
        },
        setSource(nextSource) {
            source = nextSource;
            sourceField.value = nextSource;
            loaded = tryLoad(nextSource);
            viewer?.setSource(nextSource);
            renderOutline();
            renderDiagnostics();
            renderStatus();
            notifyChange();
        },
        getDocument() {
            return loaded?.hierarchyDocument ?? null;
        },
        getDiagnostics() {
            return loaded?.diagnostics ?? [];
        },
        getViewMode() {
            return "2d";
        },
        setViewMode(mode) {
            if (mode !== "2d") {
                throw new Error("3D preview is not available in the WorldOrbit hierarchy editor yet.");
            }
        },
        setScope(nextScope) {
            scope = nextScope;
            scopeField.value = nextScope;
            viewer?.setScope(nextScope);
            renderStatus();
            notifyChange();
        },
        isDirty() {
            return source !== savedSource;
        },
        markSaved() {
            savedSource = source;
            notifyChange();
        },
        exportSvg() {
            return viewerRoot.querySelector("svg")?.outerHTML ?? "";
        },
        exportEmbedMarkup() {
            const escapedSource = escapeHtml(source);
            return `<div class="worldorbit-embed" data-schema="4.0"><pre>${escapedSource}</pre></div>`;
        },
        destroy() {
            viewer?.destroy();
            viewer = null;
            container.innerHTML = "";
        },
    };
    function renderOutline() {
        if (!loaded) {
            outlineRoot.innerHTML = `<p class="woc-editor-empty">No parsed universe available.</p>`;
            return;
        }
        const universe = loaded.hierarchyDocument?.universe;
        if (!universe) {
            outlineRoot.innerHTML = `<p class="woc-editor-empty">No parsed universe available.</p>`;
            return;
        }
        outlineRoot.innerHTML = [
            renderOutlineButton("universe", universe.id, universe.title ?? universe.id, 0),
            ...universe.galaxies.map((galaxy) => {
                const items = [
                    renderOutlineButton("galaxy", galaxy.id, galaxy.title ?? galaxy.id, 1),
                    ...galaxy.systems.map((system) => renderOutlineButton("system", system.id, system.title ?? system.id, 2)),
                ];
                return items.join("");
            }),
        ].join("");
    }
    function renderDiagnostics() {
        const list = loaded?.diagnostics ?? [];
        if (list.length === 0) {
            diagnosticsRoot.innerHTML = `<div class="woc-editor-ok">No diagnostics.</div>`;
            return;
        }
        diagnosticsRoot.innerHTML = list
            .slice(0, 16)
            .map((diagnostic) => `<article class="woc-editor-diagnostic is-${diagnostic.severity}">
          <strong>${escapeHtml(diagnostic.severity)}</strong>
          <p>${escapeHtml(diagnostic.message)}</p>
        </article>`)
            .join("");
    }
    function renderStatus() {
        const galaxyText = activeGalaxyId ? `Galaxy: ${activeGalaxyId}` : "Galaxy: none";
        const systemText = activeSystemId ? `System: ${activeSystemId}` : "System: none";
        statusRoot.textContent = `schema 4.0 - ${scope} scope - zoom ${Number(zoomField.value).toFixed(2)} - ${galaxyText} - ${systemText}`;
    }
    function notifyChange() {
        const dirty = source !== savedSource;
        const diagnostics = loaded?.diagnostics ?? [];
        options.onDiagnosticsChange?.(diagnostics);
        options.onDirtyChange?.(dirty);
        options.onChange?.({
            source,
            document: loaded?.hierarchyDocument ?? null,
            diagnostics,
            dirty,
            scope,
        });
    }
}
function renderOutlineButton(kind, id, label, depth) {
    return `<button class="woc-editor-outline-item depth-${depth}" data-hierarchy-pick="true" data-hierarchy-kind="${escapeHtml(kind)}" data-hierarchy-id="${escapeHtml(id)}">${escapeHtml(label)}</button>`;
}
function tryLoad(source) {
    if (!source.trim()) {
        return null;
    }
    try {
        const loaded = loadWorldOrbitSource(source);
        return loaded.hierarchyDocument ? loaded : null;
    }
    catch {
        return null;
    }
}
function markup() {
    return `<div class="woc-editor-shell">
    <div class="woc-editor-toolbar">
      <label>Scope
        <select data-hierarchy-scope>
          <option value="universe">Universe</option>
          <option value="galaxy">Galaxy</option>
          <option value="system">System</option>
        </select>
      </label>
      <label>Zoom
        <input data-hierarchy-zoom type="range" min="1" max="2.2" step="0.05" value="1.1" />
      </label>
      <div class="woc-editor-status" data-hierarchy-status></div>
    </div>
    <div class="woc-editor-main">
      <aside class="woc-editor-panel">
        <h2>Hierarchy</h2>
        <div data-hierarchy-outline></div>
      </aside>
      <section class="woc-editor-panel">
        <h2>Preview</h2>
        <div data-editor-stage>
          <div data-hierarchy-viewer></div>
        </div>
      </section>
      <section class="woc-editor-panel">
        <h2>Source</h2>
        <textarea data-hierarchy-source data-editor-source spellcheck="false"></textarea>
        <h2>Diagnostics</h2>
        <div data-hierarchy-diagnostics></div>
      </section>
    </div>
  </div>`;
}
function installStyles() {
    if (document.getElementById(STYLE_ID)) {
        return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    .woc-editor { color: #edf6ff; font-family: "Segoe UI Variable", "Segoe UI", sans-serif; }
    .woc-editor-shell { display: grid; gap: 16px; }
    .woc-editor-toolbar, .woc-editor-main { display: grid; gap: 16px; }
    .woc-editor-toolbar { grid-template-columns: repeat(3, minmax(0, max-content)); align-items: center; }
    .woc-editor-toolbar label { display: grid; gap: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(237,246,255,0.72); }
    .woc-editor-toolbar select, .woc-editor-toolbar input, .woc-editor textarea { background: rgba(7,16,31,0.92); border: 1px solid rgba(123,208,255,0.16); color: #edf6ff; padding: 10px 12px; }
    .woc-editor-main { grid-template-columns: minmax(220px, 280px) minmax(0, 1fr) minmax(320px, 420px); }
    .woc-editor-panel { background: rgba(8,20,40,0.82); border: 1px solid rgba(123,208,255,0.12); padding: 16px; display: grid; gap: 14px; min-width: 0; }
    .woc-editor-panel h2 { margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(237,246,255,0.72); }
    .woc-editor textarea { min-height: 360px; width: 100%; font: 13px/1.6 "Cascadia Code", "Consolas", monospace; resize: vertical; box-sizing: border-box; }
    .woc-editor-outline-item { width: 100%; text-align: left; padding: 10px 12px; border: 1px solid rgba(123,208,255,0.12); background: rgba(255,255,255,0.03); color: #edf6ff; cursor: pointer; }
    .woc-editor-outline-item.depth-1 { margin-left: 12px; width: calc(100% - 12px); }
    .woc-editor-outline-item.depth-2 { margin-left: 24px; width: calc(100% - 24px); }
    .woc-editor-status { color: #9bddff; font-size: 12px; }
    .woc-editor-diagnostic { border: 1px solid rgba(123,208,255,0.12); padding: 10px 12px; background: rgba(255,255,255,0.03); }
    .woc-editor-diagnostic.is-warning { border-color: rgba(240,180,100,0.28); }
    .woc-editor-diagnostic.is-error { border-color: rgba(255,120,120,0.3); }
    .woc-editor-diagnostic strong { display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; }
    .woc-editor-diagnostic p, .woc-editor-empty, .woc-editor-ok { margin: 0; color: rgba(237,246,255,0.82); font-size: 12px; line-height: 1.5; }
    @media (max-width: 1120px) {
      .woc-editor-main { grid-template-columns: 1fr; }
    }
  `;
    document.head.appendChild(style);
}
function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}
