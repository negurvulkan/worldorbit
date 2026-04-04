import { createWorldOrbitEditor } from "@worldorbit/editor";

const RECOVERY_STORAGE_KEY = "worldorbit.studio.recovery.v4.0";
const LEGACY_RECOVERY_STORAGE_KEY = "worldorbit.studio.recovery.v2.6";
const SESSION_STORAGE_KEY = "worldorbit.studio.session.v4.0";
const LEGACY_SESSION_STORAGE_KEY = "worldorbit.studio.session.v2.6";
const DEFAULT_FILE_NAME = "untitled.worldorbit";
const DEFAULT_SESSION_STATE = {
  panels: {
    inspector: true,
  },
  panes: {
    sidebarWidth: 280,
    inspectorWidth: 360,
  },
};
const FALLBACK_SOURCE = `schema 4.0

universe Starter-Verse
  title "Starter Verse"

  galaxy Dawn-Spindle
    title "Dawn Spindle"

    system New-Atlas
      title "New Atlas"
      description "Starter hierarchy for Schema 4.0 authoring"
      epoch "JY-0001.0"
      referencePlane ecliptic

      defaults
        view orthographic
        scale presentation
        preset atlas-card

      object star Primary
        mass 1sol

      object planet Homeworld
        orbit Primary
        semiMajor 1au
        eccentricity 0.03
        phase 36deg
        radius 1re
        atmosphere nitrogen-oxygen

      object moon Moonlet
        orbit Homeworld
        distance 384400km
`;

export async function createWorldOrbitStudio(root, options = {}) {
  ensureRoot(root);

  const sessionState = loadSessionState();
  const recoveryDraft = loadRecoveryDraft();
  const exampleUrl = resolveConfiguredExampleUrl(root, options);
  const baseSource =
    options.initialSource ??
    (exampleUrl ? await loadExampleSource(exampleUrl) : FALLBACK_SOURCE);

  root.innerHTML = buildStudioMarkup();

  const toolbar = query(root, "[data-studio-toolbar]");
  const editorRoot = query(root, "[data-studio-editor]");
  const fileInput = query(root, "[data-studio-open-input]");
  const fileLabel = query(root, "[data-studio-file]");
  const message = query(root, "[data-studio-message]");
  const sourceDialog = query(root, "[data-studio-modal='source']");
  const sourceInput = query(root, "[data-studio-source-input]");
  const sourceDiagnostics = query(root, "[data-studio-source-diagnostics]");
  const embedDialog = query(root, "[data-studio-modal='embed']");
  const embedOutput = query(root, "[data-studio-embed-output]");
  const saveButton = query(root, '[data-studio-action="save"]');
  const exportSvgButton = query(root, '[data-studio-action="export-svg"]');
  let currentDiagnostics = [];
  let currentDirty = false;
  let currentFileName = options.fileName ?? DEFAULT_FILE_NAME;
  let recoveryTimer = null;
  let currentViewMode = "2d";
  let sourceModalDirty = false;

  let editor = null;
  editorRoot.dataset.woStickyStage = "true";
  editorRoot.style.setProperty("--wo-editor-stage-sticky-top", "12px");
  editorRoot.style.setProperty("--wo-editor-stage-sticky-max-height", "calc(100vh - 24px)");
  editor = createWorldOrbitEditor(editorRoot, {
    source: baseSource,
    onChange(snapshot) {
      currentDiagnostics = normalizeDiagnostics(snapshot.diagnostics);
      syncSourceDialogFromEditor();
      syncEmbedDialogFromEditor();
      renderSourceDialogDiagnostics();
      syncToolbarState();
      if (currentDirty) {
        scheduleRecoverySave();
      }
    },
    onDiagnosticsChange(nextDiagnostics) {
      currentDiagnostics = normalizeDiagnostics(nextDiagnostics);
      renderSourceDialogDiagnostics();
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
  currentDiagnostics = normalizeDiagnostics(editor.getDiagnostics());
  currentDirty = editor.isDirty();
  currentViewMode = editor.getViewMode();

  applySessionState();

  if (recoveryDraft?.source) {
    currentFileName = recoveryDraft.fileName || currentFileName;
    editor.setSource(recoveryDraft.source);
    currentDiagnostics = normalizeDiagnostics(editor.getDiagnostics());
    currentDirty = editor.isDirty();
    setMessage("Recovered unsaved local draft from the browser.", "info");
  } else {
    currentFileName =
      options.fileName ??
      (options.initialSource || !exampleUrl
        ? currentFileName
        : deriveFileNameFromUrl(exampleUrl));
    editor.markSaved();
    currentDirty = editor.isDirty();
    setMessage("Studio ready. Working with schema 4.0 universes.", "info");
  }

  toolbar.addEventListener("click", handleToolbarClick);
  toolbar.addEventListener("input", handleToolbarInput);
  fileInput.addEventListener("change", handleFileSelection);
  editorRoot.addEventListener("input", handleEditorInput);
  sourceDialog.addEventListener("click", handleDialogClick);
  embedDialog.addEventListener("click", handleDialogClick);
  sourceInput.addEventListener("input", handleSourceDialogInput);
  window.addEventListener("beforeunload", handleBeforeUnload);

  syncSourceDialogFromEditor(true);
  syncEmbedDialogFromEditor();
  renderSourceDialogDiagnostics();
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
      sourceDialog.removeEventListener("click", handleDialogClick);
      embedDialog.removeEventListener("click", handleDialogClick);
      sourceInput.removeEventListener("input", handleSourceDialogInput);
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
          message: "Started a new schema 4.0 universe workspace.",
        });
        return;
      case "open":
        fileInput.click();
        return;
      case "save":
        saveCurrentSource();
        return;
      case "open-source":
        openSourceDialog();
        return;
      case "open-embed":
        openEmbedDialog();
        return;
      case "export-svg":
        exportCurrentSvg();
        return;
      case "load-example":
        loadExampleIntoEditor();
        return;
      case "toggle-inspector":
        togglePanel("inspector");
        return;
      case "view-2d":
        editor.setViewMode("2d");
        currentViewMode = editor.getViewMode();
        setMessage("Studio preview switched to 2D.", "info");
        syncToolbarState();
        return;
      case "view-3d":
        try {
          editor.setViewMode("3d");
          currentViewMode = editor.getViewMode();
          setMessage("Studio preview switched to 3D.", "info");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : String(error), "error");
        }
        syncToolbarState();
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
    const source = exampleUrl ? await loadExampleSource(exampleUrl) : FALLBACK_SOURCE;
    currentFileName = exampleUrl ? deriveFileNameFromUrl(exampleUrl) : DEFAULT_FILE_NAME;
    loadIntoEditor(source, currentFileName, {
      markSaved: true,
      message: exampleUrl
        ? `Loaded example ${currentFileName}.`
        : "Loaded the built-in starter universe.",
    });
  }

  function loadIntoEditor(source, fileName, config = {}) {
    editor.setSource(source);
    currentDiagnostics = normalizeDiagnostics(editor.getDiagnostics());
    currentFileName = fileName || DEFAULT_FILE_NAME;
    syncSourceDialogFromEditor(true);
    syncEmbedDialogFromEditor();
    renderSourceDialogDiagnostics();
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

  function togglePanel(panel) {
    sessionState.panels[panel] = !sessionState.panels[panel];
    applySessionState();
    persistSessionState(sessionState);
    syncToolbarState();
  }

  function applySessionState() {
    editorRoot.dataset.woShowInspector = String(sessionState.panels.inspector);
    editorRoot.style.setProperty("--wo-editor-sidebar-width", `${sessionState.panes.sidebarWidth}px`);
    editorRoot.style.setProperty("--wo-editor-inspector-width", `${sessionState.panes.inspectorWidth}px`);
    syncRangeValues();
  }

  function syncRangeValues() {
    const sidebar = toolbar.querySelector('[data-studio-range="sidebar"]');
    const inspector = toolbar.querySelector('[data-studio-range="inspector"]');
    if (sidebar) {
      sidebar.value = String(sessionState.panes.sidebarWidth);
    }
    if (inspector) {
      inspector.value = String(sessionState.panes.inspectorWidth);
    }
  }

  function syncToolbarState() {
    const blockingErrors = hasBlockingErrors(currentDiagnostics);
    fileLabel.textContent = `${ensureWorldOrbitExtension(currentFileName)}${currentDirty ? " *" : ""}`;
    fileLabel.dataset.state = currentDirty ? "dirty" : "clean";
    saveButton.disabled = blockingErrors;
    exportSvgButton.disabled = blockingErrors;

    for (const panel of ["inspector"]) {
      const button = toolbar.querySelector(`[data-studio-action="toggle-${panel}"]`);
      if (button) {
        const visible = sessionState.panels[panel];
        button.setAttribute("aria-pressed", visible ? "true" : "false");
      }
    }

    for (const mode of ["2d", "3d"]) {
      const button = toolbar.querySelector(`[data-studio-action="view-${mode}"]`);
      if (button) {
        const activeMode = editor?.getViewMode?.() ?? currentViewMode;
        button.setAttribute("aria-pressed", activeMode === mode ? "true" : "false");
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

  function openSourceDialog() {
    syncSourceDialogFromEditor(true);
    renderSourceDialogDiagnostics();
    sourceDialog.showModal();
    sourceInput.focus();
    sourceInput.setSelectionRange(0, 0);
  }

  function openEmbedDialog() {
    syncEmbedDialogFromEditor();
    embedDialog.showModal();
  }

  function handleDialogClick(event) {
    const button = event.target.closest("[data-studio-action]");
    if (!button) {
      return;
    }

    switch (button.dataset.studioAction) {
      case "close-source-modal":
        sourceModalDirty = false;
        sourceDialog.close();
        return;
      case "close-embed-modal":
        embedDialog.close();
        return;
      case "apply-source-modal":
        applySourceFromDialog();
        return;
      case "copy-source-modal":
        void copyText(sourceInput.value, "Copied source code to clipboard.");
        return;
      case "copy-embed-modal":
        if (hasBlockingErrors(currentDiagnostics)) {
          setMessage("Embed copy blocked until all errors are resolved.", "error");
          return;
        }
        void copyText(embedOutput.textContent || "", "Copied embed markup to clipboard.");
        return;
      case "download-embed-modal":
        downloadEmbedMarkup();
        return;
    }
  }

  function handleSourceDialogInput() {
    sourceModalDirty = true;
  }

  function applySourceFromDialog() {
    editor.setSource(sourceInput.value);
    currentDiagnostics = normalizeDiagnostics(editor.getDiagnostics());
    syncSourceDialogFromEditor(true);
    syncEmbedDialogFromEditor();
    renderSourceDialogDiagnostics();
    const blockingErrors = hasBlockingErrors(currentDiagnostics);
    setMessage(
      blockingErrors
        ? "Source updated, but there are still errors to fix."
        : "Source code applied from the modal.",
      blockingErrors ? "warning" : "info",
    );
    syncToolbarState();
  }

  function syncSourceDialogFromEditor(force = false) {
    if (!editor) {
      return;
    }
    if (!force && sourceModalDirty) {
      return;
    }

    const nextSource = getEditableSource();
    if (sourceInput.value !== nextSource) {
      sourceInput.value = nextSource;
    }
    sourceModalDirty = false;
  }

  function syncEmbedDialogFromEditor() {
    if (!editor) {
      return;
    }
    const nextMarkup = hasBlockingErrors(currentDiagnostics)
      ? "Resolve the current diagnostics to generate embed markup."
      : editor.exportEmbedMarkup();
    if (embedOutput.textContent !== nextMarkup) {
      embedOutput.textContent = nextMarkup;
    }
  }

  function renderSourceDialogDiagnostics() {
    if (currentDiagnostics.length === 0) {
      sourceDiagnostics.innerHTML = '<p class="studio-modal-note">No current diagnostics.</p>';
      return;
    }

    sourceDiagnostics.innerHTML = currentDiagnostics
      .map(
        (entry) => `<div class="studio-modal-diagnostic" data-state="${entry.diagnostic.severity}">
          <strong>${escapeHtml(entry.diagnostic.severity)}</strong>
          <p>${escapeHtml(entry.diagnostic.message)}</p>
        </div>`,
      )
      .join("");
  }

  async function copyText(text, successMessage) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        copyTextFallback(text);
      }
      setMessage(successMessage, "info");
    } catch {
      copyTextFallback(text);
      setMessage(successMessage, "info");
    }
  }

  function copyTextFallback(text) {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "true");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  function downloadEmbedMarkup() {
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
}

function buildStudioMarkup() {
  return `<section class="studio-app">
    <div class="studio-toolbar" data-studio-toolbar>
      <div class="studio-toolbar-row">
        <button type="button" data-studio-action="new">New Atlas</button>
        <button type="button" data-studio-action="open">Open Source</button>
        <button type="button" data-studio-action="save">Save Download</button>
        <button type="button" data-studio-action="open-source">Focused Source</button>
        <button type="button" data-studio-action="open-embed">Embed Output</button>
        <button type="button" data-studio-action="export-svg">Export SVG</button>
        <button type="button" data-studio-action="load-example">Load Example</button>
      </div>
      <div class="studio-toolbar-row">
        <button type="button" data-studio-action="toggle-inspector" aria-pressed="true">Inspector</button>
        <button type="button" data-studio-action="view-2d" aria-pressed="true">View 2D</button>
        <button type="button" data-studio-action="view-3d" aria-pressed="false">View 3D</button>
        <label class="studio-range">
          <span>Sidebar</span>
          <input type="range" min="220" max="420" step="10" data-studio-range="sidebar" />
        </label>
        <label class="studio-range">
          <span>Inspector</span>
          <input type="range" min="280" max="460" step="10" data-studio-range="inspector" />
        </label>
      </div>
      <div class="studio-toolbar-row studio-toolbar-row-meta">
        <strong class="studio-file" data-studio-file></strong>
        <span class="studio-message" data-studio-message aria-live="polite"></span>
      </div>
      <input type="file" accept=".worldorbit,.txt" hidden data-studio-open-input />
    </div>
    <div class="studio-editor-root" data-studio-editor></div>
    <dialog class="studio-modal" data-studio-modal="source">
      <div class="studio-modal-card">
        <div class="studio-modal-header">
          <div>
            <strong>Source Code</strong>
            <p>Edit the active atlas source in a focused modal instead of a permanent side pane.</p>
          </div>
          <button type="button" data-studio-action="close-source-modal" aria-label="Close source code modal">Close</button>
        </div>
        <textarea class="studio-modal-textarea" data-studio-source-input spellcheck="false"></textarea>
        <div class="studio-modal-diagnostics" data-studio-source-diagnostics aria-live="polite"></div>
        <div class="studio-modal-actions">
          <button type="button" data-studio-action="copy-source-modal">Copy</button>
          <button type="button" data-studio-action="apply-source-modal">Apply</button>
        </div>
      </div>
    </dialog>
    <dialog class="studio-modal" data-studio-modal="embed">
      <div class="studio-modal-card">
        <div class="studio-modal-header">
          <div>
            <strong>Embed Markup</strong>
            <p>Copy or download the current interactive embed once the atlas validates cleanly.</p>
          </div>
          <button type="button" data-studio-action="close-embed-modal" aria-label="Close embed markup modal">Close</button>
        </div>
        <pre class="studio-modal-code" data-studio-embed-output></pre>
        <div class="studio-modal-actions">
          <button type="button" data-studio-action="copy-embed-modal">Copy</button>
          <button type="button" data-studio-action="download-embed-modal">Download HTML</button>
        </div>
      </div>
    </dialog>
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

function resolveConfiguredExampleUrl(root, options = {}) {
  const configured = options.exampleUrl ?? root.dataset.exampleUrl ?? "";
  return configured.trim() || null;
}

function hasBlockingErrors(diagnostics) {
  return diagnostics.some((entry) => entry.diagnostic.severity === "error");
}

function normalizeDiagnostics(diagnostics) {
  return diagnostics.map((entry) => ("diagnostic" in entry ? entry : { diagnostic: entry, path: null }));
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadSessionState() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
      ?? window.sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY);
    if (!raw) {
      return cloneSessionState(DEFAULT_SESSION_STATE);
    }

    const parsed = JSON.parse(raw);
    return {
      panels: {
        inspector: parsed?.panels?.inspector !== false,
      },
      panes: {
        sidebarWidth: Number(parsed?.panes?.sidebarWidth) || DEFAULT_SESSION_STATE.panes.sidebarWidth,
        inspectorWidth:
          Number(parsed?.panes?.inspectorWidth) || DEFAULT_SESSION_STATE.panes.inspectorWidth,
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
    const raw = window.localStorage.getItem(RECOVERY_STORAGE_KEY)
      ?? window.localStorage.getItem(LEGACY_RECOVERY_STORAGE_KEY);
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
  resolveConfiguredExampleUrl,
  replaceExtension,
};
