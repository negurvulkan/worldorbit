import { createWorldOrbitEditor } from "@worldorbit/editor";

const EXAMPLE_URL = "../examples/iyath.schema2.worldorbit";
const RECOVERY_STORAGE_KEY = "worldorbit.studio.recovery.v2.5";
const SESSION_STORAGE_KEY = "worldorbit.studio.session.v2.5";
const DEFAULT_FILE_NAME = "untitled.worldorbit";
const DEFAULT_SESSION_STATE = {
  panels: {
    inspector: true,
    preview: true,
    text: true,
  },
  panes: {
    sidebarWidth: 280,
    inspectorWidth: 360,
    sourceHeight: 280,
  },
};
const FALLBACK_SOURCE = `schema 2.0

system New-Atlas
  title "New Atlas"

defaults
  view isometric
  scale presentation
  preset atlas-card

viewpoint overview
  label "Overview"
  projection isometric

object star Primary

object planet Homeworld
  orbit Primary
  semiMajor 1au
  eccentricity 0.03
  phase 36deg
  radius 1re
  atmosphere nitrogen-oxygen
  info
    description "A fresh starting point for a new worldbuilding atlas."
`;

export async function createWorldOrbitStudio(root, options = {}) {
  ensureRoot(root);

  const sessionState = loadSessionState();
  const recoveryDraft = loadRecoveryDraft();
  const baseSource =
    options.initialSource ?? (await loadExampleSource(options.exampleUrl ?? EXAMPLE_URL));

  root.innerHTML = buildStudioMarkup();

  const toolbar = query(root, "[data-studio-toolbar]");
  const editorRoot = query(root, "[data-studio-editor]");
  const fileInput = query(root, "[data-studio-open-input]");
  const fileLabel = query(root, "[data-studio-file]");
  const message = query(root, "[data-studio-message]");
  const saveButton = query(root, '[data-studio-action="save"]');
  const exportSvgButton = query(root, '[data-studio-action="export-svg"]');
  const exportEmbedButton = query(root, '[data-studio-action="export-embed"]');
  let currentDiagnostics = [];
  let currentDirty = false;
  let currentFileName = options.fileName ?? DEFAULT_FILE_NAME;
  let recoveryTimer = null;

  let editor = createWorldOrbitEditor(editorRoot, {
    source: baseSource,
    showInspector: sessionState.panels.inspector,
    showPreview: sessionState.panels.preview,
    showTextPane: sessionState.panels.text,
    shortcuts: true,
    onChange(snapshot) {
      currentDiagnostics = snapshot.diagnostics;
      syncToolbarState();
      if (currentDirty) {
        scheduleRecoverySave();
      }
    },
    onDiagnosticsChange(nextDiagnostics) {
      currentDiagnostics = nextDiagnostics;
      syncToolbarState();
    },
    onDirtyChange(nextDirty) {
      currentDirty = nextDirty;
      syncToolbarState();
      if (currentDirty) {
        scheduleRecoverySave();
      } else {
        clearRecoveryDraft();
      }
    },
  });
  editor.markSaved();
  currentDiagnostics = editor.getDiagnostics();
  currentDirty = editor.isDirty();

  applySessionState();

  if (recoveryDraft?.source) {
    currentFileName = recoveryDraft.fileName || currentFileName;
    editor.setSource(recoveryDraft.source);
    currentDiagnostics = editor.getDiagnostics();
    currentDirty = editor.isDirty();
    setMessage("Recovered unsaved local draft from the browser.", "info");
  } else {
    currentFileName =
      options.fileName ??
      (options.initialSource ? currentFileName : deriveFileNameFromUrl(options.exampleUrl ?? EXAMPLE_URL));
    editor.markSaved();
    currentDirty = editor.isDirty();
    setMessage("Studio ready. Working with canonical schema 2.0 output.", "info");
  }

  toolbar.addEventListener("click", handleToolbarClick);
  toolbar.addEventListener("input", handleToolbarInput);
  fileInput.addEventListener("change", handleFileSelection);
  editorRoot.addEventListener("input", handleEditorInput);
  window.addEventListener("beforeunload", handleBeforeUnload);

  syncToolbarState();

  return {
    getEditor() {
      return editor;
    },
    destroy() {
      if (recoveryTimer !== null) {
        window.clearTimeout(recoveryTimer);
        recoveryTimer = null;
      }
      toolbar.removeEventListener("click", handleToolbarClick);
      toolbar.removeEventListener("input", handleToolbarInput);
      fileInput.removeEventListener("change", handleFileSelection);
      editorRoot.removeEventListener("input", handleEditorInput);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      editor.destroy();
      root.innerHTML = "";
    },
  };

  function handleToolbarClick(event) {
    const button = event.target.closest("[data-studio-action]");
    if (!button) {
      return;
    }

    switch (button.dataset.studioAction) {
      case "new":
        loadIntoEditor(FALLBACK_SOURCE, DEFAULT_FILE_NAME, {
          markSaved: true,
          message: "Started a new schema 2.0 atlas.",
        });
        return;
      case "open":
        fileInput.click();
        return;
      case "save":
        saveCurrentSource();
        return;
      case "export-svg":
        exportCurrentSvg();
        return;
      case "export-embed":
        exportCurrentEmbed();
        return;
      case "load-example":
        loadExampleIntoEditor();
        return;
      case "toggle-inspector":
        togglePanel("inspector");
        return;
      case "toggle-preview":
        togglePanel("preview");
        return;
      case "toggle-text":
        togglePanel("text");
        return;
    }
  }

  function handleToolbarInput(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    switch (input.dataset.studioRange) {
      case "sidebar":
        sessionState.panes.sidebarWidth = Number(input.value);
        break;
      case "inspector":
        sessionState.panes.inspectorWidth = Number(input.value);
        break;
      case "source":
        sessionState.panes.sourceHeight = Number(input.value);
        break;
      default:
        return;
    }

    applySessionState();
    persistSessionState(sessionState);
  }

  async function handleFileSelection() {
    const [file] = fileInput.files ?? [];
    if (!file) {
      return;
    }

    const text = await file.text();
    currentFileName = file.name || DEFAULT_FILE_NAME;
    loadIntoEditor(text, currentFileName, {
      markSaved: true,
      message: `Opened ${currentFileName}.`,
    });
    fileInput.value = "";
  }

  function handleEditorInput(event) {
    if (!(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement)) {
      return;
    }

    if (currentDirty) {
      scheduleRecoverySave();
    }
  }

  function handleBeforeUnload(event) {
    if (!editor.isDirty()) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  }

  async function loadExampleIntoEditor() {
    const source = await loadExampleSource(options.exampleUrl ?? EXAMPLE_URL);
    currentFileName = deriveFileNameFromUrl(options.exampleUrl ?? EXAMPLE_URL);
    loadIntoEditor(source, currentFileName, {
      markSaved: true,
      message: `Loaded example ${currentFileName}.`,
    });
  }

  function loadIntoEditor(source, fileName, config = {}) {
    editor.setSource(source);
    currentDiagnostics = editor.getDiagnostics();
    currentFileName = fileName || DEFAULT_FILE_NAME;
    const blockingErrors = hasBlockingErrors(currentDiagnostics);

    if (config.markSaved && !blockingErrors) {
      editor.markSaved();
      currentDirty = editor.isDirty();
      clearRecoveryDraft();
    } else {
      currentDirty = editor.isDirty();
    }

    setMessage(
      blockingErrors
        ? `${config.message ?? "Updated studio source."} Fix the current errors before saving.`
        : config.message ?? "Updated studio source.",
      blockingErrors ? "warning" : "info",
    );
    syncToolbarState();
  }

  function saveCurrentSource() {
    if (hasBlockingErrors(currentDiagnostics)) {
      setMessage("Save blocked until all errors are resolved.", "error");
      return;
    }

    downloadText(editor.getSource(), ensureWorldOrbitExtension(currentFileName), "text/plain;charset=utf-8");
    editor.markSaved();
    currentDirty = editor.isDirty();
    clearRecoveryDraft();
    setMessage(`Saved ${ensureWorldOrbitExtension(currentFileName)}.`, "info");
    syncToolbarState();
  }

  function exportCurrentSvg() {
    if (hasBlockingErrors(currentDiagnostics)) {
      setMessage("SVG export blocked until all errors are resolved.", "error");
      return;
    }

    downloadText(editor.exportSvg(), replaceExtension(currentFileName, ".svg"), "image/svg+xml;charset=utf-8");
    setMessage("Exported SVG preview.", "info");
  }

  function exportCurrentEmbed() {
    if (hasBlockingErrors(currentDiagnostics)) {
      setMessage("Embed export blocked until all errors are resolved.", "error");
      return;
    }

    downloadText(
      editor.exportEmbedMarkup(),
      replaceExtension(currentFileName, ".html"),
      "text/html;charset=utf-8",
    );
    setMessage("Exported interactive embed markup.", "info");
  }

  function togglePanel(panel) {
    sessionState.panels[panel] = !sessionState.panels[panel];
    applySessionState();
    persistSessionState(sessionState);
    syncToolbarState();
  }

  function applySessionState() {
    editorRoot.dataset.woShowInspector = String(sessionState.panels.inspector);
    editorRoot.dataset.woShowPreview = String(sessionState.panels.preview);
    editorRoot.dataset.woShowTextPane = String(sessionState.panels.text);
    editorRoot.style.setProperty("--wo-editor-sidebar-width", `${sessionState.panes.sidebarWidth}px`);
    editorRoot.style.setProperty("--wo-editor-inspector-width", `${sessionState.panes.inspectorWidth}px`);
    editorRoot.style.setProperty("--wo-editor-source-height", `${sessionState.panes.sourceHeight}px`);
    syncRangeValues();
  }

  function syncRangeValues() {
    const sidebar = toolbar.querySelector('[data-studio-range="sidebar"]');
    const inspector = toolbar.querySelector('[data-studio-range="inspector"]');
    const source = toolbar.querySelector('[data-studio-range="source"]');
    if (sidebar) {
      sidebar.value = String(sessionState.panes.sidebarWidth);
    }
    if (inspector) {
      inspector.value = String(sessionState.panes.inspectorWidth);
    }
    if (source) {
      source.value = String(sessionState.panes.sourceHeight);
    }
  }

  function syncToolbarState() {
    const blockingErrors = hasBlockingErrors(currentDiagnostics);
    fileLabel.textContent = `${ensureWorldOrbitExtension(currentFileName)}${currentDirty ? " *" : ""}`;
    fileLabel.dataset.state = currentDirty ? "dirty" : "clean";
    saveButton.disabled = blockingErrors;
    exportSvgButton.disabled = blockingErrors;
    exportEmbedButton.disabled = blockingErrors;

    for (const panel of ["inspector", "preview", "text"]) {
      const button = toolbar.querySelector(`[data-studio-action="toggle-${panel}"]`);
      if (button) {
        const visible = sessionState.panels[panel];
        button.setAttribute("aria-pressed", visible ? "true" : "false");
      }
    }

    message.dataset.state = hasBlockingErrors(currentDiagnostics)
      ? "error"
      : currentDirty
        ? "warning"
        : "clean";
  }

  function setMessage(text, state) {
    message.textContent = text;
    message.dataset.state = state;
  }

  function scheduleRecoverySave() {
    if (!currentDirty) {
      return;
    }

    if (recoveryTimer !== null) {
      window.clearTimeout(recoveryTimer);
    }

    recoveryTimer = window.setTimeout(() => {
      recoveryTimer = null;
      persistRecoveryDraft({
        source: getEditableSource(),
        fileName: ensureWorldOrbitExtension(currentFileName),
      });
    }, 180);
  }

  function getEditableSource() {
    const sourcePane = editorRoot.querySelector("[data-editor-source]");
    if (sourcePane instanceof HTMLTextAreaElement) {
      return sourcePane.value;
    }

    return editor.getSource();
  }
}

function buildStudioMarkup() {
  return `<section class="studio-app">
    <div class="studio-toolbar" data-studio-toolbar>
      <div class="studio-toolbar-row">
        <button type="button" data-studio-action="new">New</button>
        <button type="button" data-studio-action="open">Open .worldorbit</button>
        <button type="button" data-studio-action="save">Save/Download</button>
        <button type="button" data-studio-action="export-svg">Export SVG</button>
        <button type="button" data-studio-action="export-embed">Export Embed</button>
        <button type="button" data-studio-action="load-example">Load Example</button>
      </div>
      <div class="studio-toolbar-row">
        <button type="button" data-studio-action="toggle-inspector" aria-pressed="true">Inspector</button>
        <button type="button" data-studio-action="toggle-preview" aria-pressed="true">Preview</button>
        <button type="button" data-studio-action="toggle-text" aria-pressed="true">Source</button>
        <label class="studio-range">
          <span>Sidebar</span>
          <input type="range" min="220" max="420" step="10" data-studio-range="sidebar" />
        </label>
        <label class="studio-range">
          <span>Inspector</span>
          <input type="range" min="280" max="460" step="10" data-studio-range="inspector" />
        </label>
        <label class="studio-range">
          <span>Source</span>
          <input type="range" min="220" max="520" step="10" data-studio-range="source" />
        </label>
      </div>
      <div class="studio-toolbar-row studio-toolbar-row-meta">
        <strong class="studio-file" data-studio-file></strong>
        <span class="studio-message" data-studio-message aria-live="polite"></span>
      </div>
      <input type="file" accept=".worldorbit,.txt" hidden data-studio-open-input />
    </div>
    <div class="studio-editor-root" data-studio-editor></div>
  </section>`;
}

function ensureRoot(root) {
  if (!(root instanceof HTMLElement)) {
    throw new Error("WorldOrbit Studio requires an HTMLElement root.");
  }
}

function query(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`WorldOrbit Studio failed to initialize selector "${selector}".`);
  }
  return element;
}

function hasBlockingErrors(diagnostics) {
  return diagnostics.some((entry) => entry.diagnostic.severity === "error");
}

function downloadText(text, fileName, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(anchor.href), 0);
}

function ensureWorldOrbitExtension(fileName) {
  if (fileName.toLowerCase().endsWith(".worldorbit")) {
    return fileName;
  }

  return `${fileName.replace(/\.[^.]+$/, "") || "atlas"}.worldorbit`;
}

function replaceExtension(fileName, extension) {
  return `${ensureWorldOrbitExtension(fileName).replace(/\.worldorbit$/i, "")}${extension}`;
}

function loadSessionState() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return cloneSessionState(DEFAULT_SESSION_STATE);
    }

    const parsed = JSON.parse(raw);
    return {
      panels: {
        inspector: parsed?.panels?.inspector !== false,
        preview: parsed?.panels?.preview !== false,
        text: parsed?.panels?.text !== false,
      },
      panes: {
        sidebarWidth: Number(parsed?.panes?.sidebarWidth) || DEFAULT_SESSION_STATE.panes.sidebarWidth,
        inspectorWidth:
          Number(parsed?.panes?.inspectorWidth) || DEFAULT_SESSION_STATE.panes.inspectorWidth,
        sourceHeight: Number(parsed?.panes?.sourceHeight) || DEFAULT_SESSION_STATE.panes.sourceHeight,
      },
    };
  } catch {
    return cloneSessionState(DEFAULT_SESSION_STATE);
  }
}

function persistSessionState(state = DEFAULT_SESSION_STATE) {
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Session persistence is best-effort in Studio.
  }
}

function cloneSessionState(state) {
  return {
    panels: { ...state.panels },
    panes: { ...state.panes },
  };
}

function loadRecoveryDraft() {
  try {
    const raw = window.localStorage.getItem(RECOVERY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistRecoveryDraft(draft) {
  try {
    window.localStorage.setItem(
      RECOVERY_STORAGE_KEY,
      JSON.stringify({
        ...draft,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Local draft recovery is best-effort.
  }
}

function clearRecoveryDraft() {
  try {
    window.localStorage.removeItem(RECOVERY_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

async function loadExampleSource(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return FALLBACK_SOURCE;
    }

    return await response.text();
  } catch {
    return FALLBACK_SOURCE;
  }
}

function deriveFileNameFromUrl(url) {
  const parts = url.split("/");
  return parts[parts.length - 1] || DEFAULT_FILE_NAME;
}

export {
  buildStudioMarkup,
  clearRecoveryDraft,
  downloadText,
  ensureWorldOrbitExtension,
  hasBlockingErrors,
  loadExampleSource,
  loadRecoveryDraft,
  loadSessionState,
  persistRecoveryDraft,
  persistSessionState,
  replaceExtension,
};
