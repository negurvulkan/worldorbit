import {
  Component,
  MarkdownRenderChild,
  Modal,
  Notice,
  Platform,
  Plugin,
  PluginSettingTab,
  Setting,
  setIcon,
  type App,
  type Editor,
  type MarkdownPostProcessorContext,
} from "obsidian";
import { loadWorldOrbitSourceWithDiagnostics } from "@worldorbit/core/load";
import { renderDocumentToScene } from "@worldorbit/core/scene";
import type {
  LoadedWorldOrbitSource,
  RenderScene,
  WorldOrbitDiagnostic,
} from "@worldorbit/core/types";

import { formatDiagnosticLocation, summarizeDiagnostics } from "./diagnostics.js";
import {
  buildSolarSystemExampleBlock,
  WORLDORBIT_HELP_TITLE,
} from "./examples.js";
import {
  navigateToWorldOrbitDiagnostic,
  resolveFenceNavigationContext,
} from "./navigation.js";
import { DEFAULT_SETTINGS } from "./settings.js";
import { createObsidianViewerTheme } from "./theme.js";
import { WorldOrbitEmbeddedView } from "./viewer-host.js";
import type {
  BlockNavigationContext,
  WorldOrbitObsidianPluginSettings,
} from "./types.js";

type BlockRenderState =
  | "idle"
  | "queued"
  | "rendered-static"
  | "interactive-mounted"
  | "destroyed";

export class WorldOrbitObsidianPlugin extends Plugin {
  settings: WorldOrbitObsidianPluginSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerMarkdownCodeBlockProcessor("worldorbit", (source, el, ctx) => {
      const child = new WorldOrbitBlockComponent(this.app, this, source, el, ctx);
      ctx.addChild(child);
    });
    this.addCommand({
      id: "insert-solar-system-example",
      name: "Insert Solar System Example",
      editorCheckCallback: (checking, editor) => {
        if (checking) {
          return true;
        }

        insertWorldOrbitExample(editor);
        return true;
      },
    });
    this.addSettingTab(new WorldOrbitSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<WorldOrbitObsidianPluginSettings> | null;
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loaded,
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

class WorldOrbitBlockComponent extends MarkdownRenderChild {
  private readonly app: App;
  private readonly plugin: WorldOrbitObsidianPlugin;
  private readonly source: string;
  private readonly context: MarkdownPostProcessorContext;

  private navigationContext: BlockNavigationContext | null = null;
  private embeddedView: WorldOrbitEmbeddedView | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private pendingFrameId: number | null = null;
  private cleanupComponent = new Component();

  private rootEl!: HTMLDivElement;
  private toolbarEl!: HTMLDivElement;
  private statusEl!: HTMLSpanElement;
  private actionsEl!: HTMLDivElement;
  private hostEl!: HTMLDivElement;
  private diagnosticsEl!: HTMLDivElement;

  private renderState: BlockRenderState = "idle";
  private loadedSource: LoadedWorldOrbitSource | null = null;
  private scene: RenderScene | null = null;
  private diagnostics: WorldOrbitDiagnostic[] = [];

  constructor(
    app: App,
    plugin: WorldOrbitObsidianPlugin,
    source: string,
    containerEl: HTMLElement,
    context: MarkdownPostProcessorContext,
  ) {
    super(containerEl);
    this.app = app;
    this.plugin = plugin;
    this.source = source;
    this.context = context;
  }

  onload(): void {
    this.renderShell();
  }

  onunload(): void {
    this.renderState = "destroyed";
    this.cancelPendingRender();
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.destroyEmbeddedView();
    this.cleanupComponent.unload();
    this.rootEl?.detach();
  }

  private renderShell(): void {
    this.containerEl.empty();
    this.navigationContext = resolveFenceNavigationContext(this.context, this.containerEl);

    this.rootEl = this.containerEl.createDiv({ cls: "worldorbit-obsidian-block" });
    this.toolbarEl = this.rootEl.createDiv({ cls: "worldorbit-obsidian-toolbar" });
    this.statusEl = this.toolbarEl.createSpan({
      cls: "worldorbit-obsidian-status",
      text: "Preparing WorldOrbit block...",
    });
    this.actionsEl = this.toolbarEl.createDiv({
      cls: "worldorbit-obsidian-actions",
    });
    this.hostEl = this.rootEl.createDiv({
      cls: "worldorbit-obsidian-host is-locked",
    });
    this.diagnosticsEl = this.rootEl.createDiv({
      cls: "worldorbit-obsidian-diagnostics",
    });

    this.attachResizeObserver();

    if (!this.source.trim()) {
      this.statusEl.setText("Empty WorldOrbit block");
      this.renderState = "idle";
      this.renderActions();
      this.renderEmptyState();
      return;
    }

    this.statusEl.setText("Preview will render when this block becomes visible.");
    this.renderPlaceholder();
    this.renderActions();
    this.scheduleLazyRender();
  }

  private scheduleLazyRender(): void {
    this.intersectionObserver?.disconnect();

    if (typeof IntersectionObserver === "undefined") {
      this.queueRender();
      return;
    }

    this.intersectionObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        this.intersectionObserver?.disconnect();
        this.intersectionObserver = null;
        this.queueRender();
      }
    });
    this.intersectionObserver.observe(this.rootEl);
  }

  private queueRender(): void {
    if (this.renderState !== "idle" || this.pendingFrameId !== null) {
      return;
    }

    this.renderState = "queued";
    this.statusEl.setText("Preparing preview...");
    this.pendingFrameId = window.requestAnimationFrame(() => {
      this.pendingFrameId = null;
      this.ensureRendered();
    });
  }

  private ensureRendered(): void {
    if (this.renderState === "destroyed" || this.scene || this.loadedSource) {
      return;
    }

    const result = loadWorldOrbitSourceWithDiagnostics(this.source);
    this.loadedSource = result.ok ? result.value : null;
    this.diagnostics = this.filterDiagnostics(result.diagnostics);
    this.diagnosticsEl.empty();

    if (!result.ok || !result.value) {
      this.renderState = "rendered-static";
      this.destroyEmbeddedView();
      this.hostEl.empty();
      this.hostEl.createDiv({
        cls: "worldorbit-obsidian-empty",
        text: "WorldOrbit could not be rendered. Check the diagnostics below.",
      });
      this.renderDiagnostics(this.diagnostics, true);
      this.renderActions();
      return;
    }

    this.scene = renderDocumentToScene(result.value.document);
    this.mountStaticScene();
    this.renderDiagnostics(this.diagnostics, false);
    this.renderActions();

    if (this.plugin.settings.embeddedInteraction === "enabled" && !Platform.isMobile) {
      this.mountInteractiveIfNeeded();
    } else {
      this.renderState = "rendered-static";
      this.statusEl.setText(this.diagnostics.length ? summarizeDiagnostics(this.diagnostics) : "Rendered");
    }
  }

  private renderActions(): void {
    this.actionsEl.empty();

    this.createIconButton("Help", "help-circle", () => {
      new WorldOrbitHelpModal(this.app).open();
    });

    if (!this.source.trim()) {
      return;
    }

    if (this.plugin.settings.showFullscreenButton) {
      this.createToolbarButton("Open fullscreen", false, () => {
        this.openFullscreen();
      });
    }

    if (!this.scene) {
      return;
    }

    const interactive = this.renderState === "interactive-mounted";
    this.createToolbarButton(
      interactive ? "Lock interaction" : "Activate interaction",
      !interactive,
      () => {
        if (interactive) {
          this.mountStaticScene();
          this.renderState = "rendered-static";
          this.hostEl.toggleClass("is-locked", true);
          this.statusEl.setText(this.diagnostics.length ? summarizeDiagnostics(this.diagnostics) : "Rendered");
          this.renderActions();
          return;
        }

        this.mountInteractiveIfNeeded();
      },
    );
  }

  private renderPlaceholder(): void {
    this.destroyEmbeddedView();
    this.hostEl.empty();
    this.hostEl.createDiv({
      cls: "worldorbit-obsidian-empty",
      text: "Preview loads when the block becomes visible. Use fullscreen to render immediately.",
    });
  }

  private renderEmptyState(): void {
    this.destroyEmbeddedView();
    this.hostEl.empty();
    this.hostEl.createDiv({
      cls: "worldorbit-obsidian-empty",
      text: "Type or paste a WorldOrbit document to start. Use the help button or the example command for a ready-made block.",
    });
    const code = this.hostEl.createEl("pre", {
      cls: "worldorbit-obsidian-example",
      text: [
        "schema 2.5",
        "",
        "system Sol",
        "",
        "object star Sun",
        "",
        "object planet Earth",
        "  orbit Sun",
        "  semiMajor 1au",
      ].join("\n"),
    });
    code.setAttr("aria-label", "WorldOrbit quick start example");
  }

  private mountStaticScene(): void {
    if (!this.scene) {
      return;
    }

    this.hostEl.empty();
    this.embeddedView?.destroy();
    this.embeddedView = new WorldOrbitEmbeddedView({
      container: this.hostEl,
      scene: this.scene,
      theme: createObsidianViewerTheme(),
      interactive: false,
      enablePointer: true,
      enableTouch: true,
    });
    this.embeddedView.mount();
    this.hostEl.toggleClass("is-locked", true);
  }

  private mountInteractiveIfNeeded(): void {
    if (!this.scene) {
      this.ensureRendered();
    }

    if (!this.scene) {
      return;
    }

    if (!this.embeddedView) {
      this.embeddedView = new WorldOrbitEmbeddedView({
        container: this.hostEl,
        scene: this.scene,
        theme: createObsidianViewerTheme(),
        interactive: true,
        enablePointer: true,
        enableTouch: true,
      });
      this.embeddedView.mount();
    } else {
      this.embeddedView.setInteractive(true);
    }

    this.renderState = "interactive-mounted";
    this.hostEl.toggleClass("is-locked", false);
    this.statusEl.setText("Interactive preview active");
    this.renderActions();
  }

  private renderDiagnostics(diagnostics: WorldOrbitDiagnostic[], errorState: boolean): void {
    this.diagnosticsEl.empty();
    if (!diagnostics.length) {
      this.diagnosticsEl.detach();
      return;
    }

    if (!this.diagnosticsEl.parentElement) {
      this.rootEl.appendChild(this.diagnosticsEl);
    }

    for (const diagnostic of diagnostics) {
      const itemEl = this.diagnosticsEl.createDiv({
        cls: "worldorbit-obsidian-diagnostic",
      });
      itemEl.dataset.severity = diagnostic.severity;

      const metaEl = itemEl.createDiv({ cls: "worldorbit-obsidian-diagnostic-meta" });
      metaEl.createSpan({
        cls: "worldorbit-obsidian-diagnostic-badge",
        text: diagnostic.severity,
      });
      metaEl.createSpan({
        text: diagnostic.source,
      });
      metaEl.createSpan({
        text: formatDiagnosticLocation(diagnostic),
      });

      itemEl.createDiv({
        cls: "worldorbit-obsidian-diagnostic-message",
        text: diagnostic.message,
      });

      const canNavigate = Boolean(this.navigationContext && diagnostic.line);
      if (canNavigate) {
        const actionsEl = itemEl.createDiv({
          cls: "worldorbit-obsidian-diagnostic-actions",
        });
        const button = actionsEl.createEl("button", {
          cls: "worldorbit-obsidian-button",
          text: "Go to error",
        });
        button.disabled = !canNavigate;
        this.cleanupComponent.registerDomEvent(button, "click", () => {
          void this.handleDiagnosticNavigation(diagnostic);
        });
      }
    }

    if (errorState) {
      this.statusEl.setText(summarizeDiagnostics(diagnostics));
    }
  }

  private async openFullscreen(): Promise<void> {
    if (!this.scene) {
      this.ensureRendered();
    }

    if (!this.scene) {
      new Notice("WorldOrbit: this block could not be rendered.");
      return;
    }

    new WorldOrbitFullscreenModal(this.app, this.scene).open();
  }

  private filterDiagnostics(diagnostics: WorldOrbitDiagnostic[]): WorldOrbitDiagnostic[] {
    return this.plugin.settings.showWarnings
      ? diagnostics
      : diagnostics.filter((diagnostic) => diagnostic.source !== "validate");
  }

  private async handleDiagnosticNavigation(diagnostic: WorldOrbitDiagnostic): Promise<void> {
    if (!this.navigationContext) {
      new Notice("WorldOrbit: no editor position is available for this block.");
      return;
    }

    const navigated = await navigateToWorldOrbitDiagnostic(
      this.app,
      this.navigationContext.sourcePath,
      this.navigationContext.contentStartLine,
      diagnostic,
    );
    if (!navigated) {
      new Notice("WorldOrbit: could not focus the diagnostic location.");
    }
  }

  private attachResizeObserver(): void {
    this.resizeObserver?.disconnect();
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.embeddedView?.resize();
    });
    this.resizeObserver.observe(this.hostEl);
  }

  private cancelPendingRender(): void {
    if (this.pendingFrameId !== null) {
      window.cancelAnimationFrame(this.pendingFrameId);
      this.pendingFrameId = null;
    }
  }

  private destroyEmbeddedView(): void {
    this.embeddedView?.destroy();
    this.embeddedView = null;
  }

  private createToolbarButton(
    label: string,
    emphasized: boolean,
    onClick: () => void,
  ): HTMLButtonElement {
    const button = this.actionsEl.createEl("button", {
      cls: `worldorbit-obsidian-button${emphasized ? " mod-cta" : ""}`,
      text: label,
    });
    this.cleanupComponent.registerDomEvent(button, "click", onClick);
    return button;
  }

  private createIconButton(
    label: string,
    icon: Parameters<typeof setIcon>[1],
    onClick: () => void,
  ): HTMLButtonElement {
    const button = this.actionsEl.createEl("button", {
      cls: "worldorbit-obsidian-button worldorbit-obsidian-icon-button",
      attr: {
        "aria-label": label,
        title: label,
      },
    });
    setIcon(button, icon);
    this.cleanupComponent.registerDomEvent(button, "click", onClick);
    return button;
  }
}

class WorldOrbitFullscreenModal extends Modal {
  private readonly scene: RenderScene;
  private embeddedView: WorldOrbitEmbeddedView | null = null;

  constructor(app: App, scene: RenderScene) {
    super(app);
    this.scene = scene;
  }

  onOpen(): void {
    this.modalEl.addClass("worldorbit-obsidian-modal");
    this.setTitle("WorldOrbit");
    const host = this.contentEl.createDiv({
      cls: "worldorbit-obsidian-modal-host",
    });
    this.embeddedView = new WorldOrbitEmbeddedView({
      container: host,
      scene: this.scene,
      theme: createObsidianViewerTheme(),
      interactive: true,
      enablePointer: true,
      enableTouch: true,
    });
    this.embeddedView.mount();
  }

  onClose(): void {
    this.embeddedView?.destroy();
    this.embeddedView = null;
    this.contentEl.empty();
  }
}

class WorldOrbitHelpModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    this.setTitle(WORLDORBIT_HELP_TITLE);
    this.contentEl.empty();
    const prose = this.contentEl.createDiv({
      cls: "worldorbit-obsidian-help",
    });
    prose.createEl("p", {
      text: "Paste a fenced worldorbit block into a note to start rendering immediately.",
    });
    prose.createEl("pre", {
      cls: "worldorbit-obsidian-example",
      text: [
        "```worldorbit",
        "schema 2.5",
        "",
        "system Sol",
        "",
        "object star Sun",
        "",
        "object planet Earth",
        "  orbit Sun",
        "  semiMajor 1au",
        "```",
      ].join("\n"),
    });
    const list = prose.createEl("ul");
    for (const item of [
      "`object planet NAME` creates a body",
      "`orbit TARGET` places it around another object",
      "`semiMajor 1au` or `distance 384400km` controls orbit size",
      "`color #6fa8ff`, `radius`, `mass`, and `kind` add detail",
      "Locked mode keeps note scrolling safe until you activate interaction",
    ]) {
      list.createEl("li", { text: item });
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

class WorldOrbitSettingTab extends PluginSettingTab {
  private readonly plugin: WorldOrbitObsidianPlugin;

  constructor(app: App, plugin: WorldOrbitObsidianPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Embedded interaction")
      .setDesc("Choose whether embedded previews start locked or immediately interactive. Locked mode keeps note scrolling safe until you explicitly activate pan and zoom.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("locked", "Locked by default")
          .addOption("enabled", "Interactive by default")
          .setValue(this.plugin.settings.embeddedInteraction)
          .onChange(async (value) => {
            this.plugin.settings.embeddedInteraction =
              value as WorldOrbitObsidianPluginSettings["embeddedInteraction"];
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Show validator diagnostics")
      .setDesc("Display diagnostics produced by the validation phase under rendered WorldOrbit blocks.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showWarnings).onChange(async (value) => {
          this.plugin.settings.showWarnings = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Show fullscreen button")
      .setDesc("Offer a larger interactive view for code blocks on small screens.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showFullscreenButton).onChange(async (value) => {
          this.plugin.settings.showFullscreenButton = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}

function insertWorldOrbitExample(editor: Editor): void {
  const snippet = buildSolarSystemExampleBlock();
  const cursor = editor.getCursor();
  const lineCount = editor.lineCount();
  const needsLeadingBreak = cursor.line > 0;
  const needsTrailingBreak = cursor.line < lineCount - 1;
  const wrapped = `${needsLeadingBreak ? "\n" : ""}${snippet}${needsTrailingBreak ? "\n" : ""}`;
  editor.replaceRange(wrapped, cursor);
}
