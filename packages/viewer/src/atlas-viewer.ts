import type {
  RenderScene,
  WorldOrbitDocument,
  WorldOrbitObject,
} from "@worldorbit/core";

import { normalizeViewerFilter } from "./atlas-state.js";
import type {
  AtlasInspectorSnapshot,
  AtlasViewerOptions,
  ViewerBookmark,
  ViewerFilter,
  ViewerSearchResult,
  ViewerState,
  WorldOrbitAtlasViewer,
  WorldOrbitViewer,
} from "./types.js";
import { createInteractiveViewer } from "./viewer.js";

const STYLE_ID = "worldorbit-atlas-viewer-style";

export function createAtlasViewer(
  container: HTMLElement,
  options: AtlasViewerOptions,
): WorldOrbitAtlasViewer {
  if (typeof document === "undefined") {
    throw new Error("Atlas viewer requires a browser environment.");
  }

  installAtlasViewerStyles();

  const controls = {
    search: options.controls?.search ?? true,
    typeFilter: options.controls?.typeFilter ?? true,
    viewpointSelect: options.controls?.viewpointSelect ?? true,
    inspector: options.controls?.inspector ?? true,
    bookmarks: options.controls?.bookmarks ?? true,
  };

  container.classList.add("wo-atlas-viewer");
  container.innerHTML = buildAtlasViewerMarkup(controls);

  const toolbar = container.querySelector<HTMLElement>("[data-atlas-toolbar]");
  const searchInput = container.querySelector<HTMLInputElement>("[data-atlas-search]");
  const typeFilterSelect = container.querySelector<HTMLSelectElement>("[data-atlas-type-filter]");
  const viewpointSelect = container.querySelector<HTMLSelectElement>("[data-atlas-viewpoint]");
  const bookmarkButton = container.querySelector<HTMLButtonElement>("[data-atlas-bookmark]");
  const bookmarkList = container.querySelector<HTMLElement>("[data-atlas-bookmarks]");
  const searchResults = container.querySelector<HTMLElement>("[data-atlas-results]");
  const inspector = container.querySelector<HTMLElement>("[data-atlas-inspector]");
  const stage = container.querySelector<HTMLElement>("[data-atlas-stage]");

  if (!stage) {
    throw new Error("Atlas viewer failed to initialize its stage container.");
  }

  const baseFilter = normalizeViewerFilter(options.initialFilter ?? null);
  let searchQuery = options.initialQuery?.trim() ?? baseFilter?.query ?? "";
  let objectTypeFilter =
    options.initialObjectType ??
    (baseFilter?.objectTypes?.length === 1 ? baseFilter.objectTypes[0] : null);
  let bookmarks: ViewerBookmark[] = [];

  let viewer: WorldOrbitViewer | undefined;

  viewer = createInteractiveViewer(stage, {
    ...options,
    initialFilter: null,
    onSelectionChange(selection) {
      if (viewer) {
        updateInspector();
      }
      options.onSelectionChange?.(selection);
    },
    onSelectionDetailsChange(details) {
      if (viewer) {
        updateInspector();
      }
      options.onSelectionDetailsChange?.(details);
    },
    onFilterChange(filter, visibleObjects) {
      if (viewer) {
        syncControlsFromFilter(filter);
        updateSearchResults();
        updateInspector();
      }
      options.onFilterChange?.(filter, visibleObjects);
    },
    onViewpointChange(viewpoint) {
      if (viewer) {
        syncViewpointControl();
        updateInspector();
      }
      options.onViewpointChange?.(viewpoint);
    },
    onAtlasStateChange(state) {
      if (viewer) {
        updateInspector();
      }
      options.onAtlasStateChange?.(state);
    },
    onViewChange(state) {
      if (viewer) {
        updateInspector();
      }
      options.onViewChange?.(state);
    },
  });

  applyCurrentFilter();
  populateViewpoints();
  syncControlsFromFilter(viewer.getFilter());
  renderBookmarks();
  updateSearchResults();
  updateInspector();

  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value.trim();
    applyCurrentFilter();
  });

  typeFilterSelect?.addEventListener("change", () => {
    objectTypeFilter = (typeFilterSelect.value || null) as WorldOrbitObject["type"] | null;
    applyCurrentFilter();
  });

  viewpointSelect?.addEventListener("change", () => {
    const activeViewer = requireViewer();
    if (!viewpointSelect.value) {
      activeViewer.resetView();
      applyCurrentFilter();
      return;
    }

    activeViewer.goToViewpoint(viewpointSelect.value);
    updateInspector();
  });

  bookmarkButton?.addEventListener("click", () => {
    const activeViewer = requireViewer();
    const label =
      activeViewer.getActiveViewpoint()?.label ??
      activeViewer.getSelectionDetails()?.objectId ??
      `Bookmark ${bookmarks.length + 1}`;
    bookmarks = [...bookmarks, activeViewer.captureBookmark(label, label)];
    renderBookmarks();
    updateInspector();
  });

  bookmarkList?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      "[data-bookmark-id]",
    );
    if (!button) {
      return;
    }

    const bookmark = bookmarks.find((entry) => entry.id === button.dataset.bookmarkId);
    if (!bookmark) {
      return;
    }

    const activeViewer = requireViewer();
    activeViewer.applyBookmark(bookmark);
    syncControlsFromFilter(activeViewer.getFilter());
    updateSearchResults();
    updateInspector();
  });

  searchResults?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      "[data-object-id]",
    );
    if (!button) {
      return;
    }

    requireViewer().focusObject(button.dataset.objectId ?? "");
    updateInspector();
  });

  function requireViewer(): WorldOrbitViewer {
    if (!viewer) {
      throw new Error("Atlas viewer is not initialized.");
    }

    return viewer;
  }

  const api: WorldOrbitAtlasViewer = {
    element: container,
    get viewer() {
      return requireViewer();
    },
    getViewer(): WorldOrbitViewer {
      return requireViewer();
    },
    setSource(source: string): void {
      requireViewer().setSource(source);
      refreshAfterInputChange();
    },
    setDocument(document: WorldOrbitDocument): void {
      requireViewer().setDocument(document);
      refreshAfterInputChange();
    },
    setScene(scene: RenderScene): void {
      requireViewer().setScene(scene);
      refreshAfterInputChange();
    },
    getAtlasState() {
      return requireViewer().getAtlasState();
    },
    setAtlasState(state): void {
      const activeViewer = requireViewer();
      activeViewer.setAtlasState(state);
      syncControlsFromFilter(activeViewer.getFilter());
      updateSearchResults();
      updateInspector();
    },
    getInspectorSnapshot(): AtlasInspectorSnapshot {
      return buildInspectorSnapshot();
    },
    getSearchQuery(): string {
      return searchQuery;
    },
    setSearchQuery(query: string): void {
      searchQuery = query.trim();
      if (searchInput) {
        searchInput.value = searchQuery;
      }
      applyCurrentFilter();
    },
    getObjectTypeFilter(): WorldOrbitObject["type"] | null {
      return objectTypeFilter;
    },
    setObjectTypeFilter(type: WorldOrbitObject["type"] | null): void {
      objectTypeFilter = type;
      if (typeFilterSelect) {
        typeFilterSelect.value = type ?? "";
      }
      applyCurrentFilter();
    },
    listSearchResults(limit = 6): ViewerSearchResult[] {
      return requireViewer().search(searchQuery, limit);
    },
    listBookmarks(): ViewerBookmark[] {
      return bookmarks.map(cloneBookmark);
    },
    captureBookmark(name: string, label?: string): ViewerBookmark {
      const bookmark = requireViewer().captureBookmark(name, label);
      bookmarks = [...bookmarks, bookmark];
      renderBookmarks();
      updateInspector();
      return cloneBookmark(bookmark);
    },
    applyBookmark(bookmark: ViewerBookmark | string): boolean {
      const activeViewer = requireViewer();
      const result = activeViewer.applyBookmark(bookmark);
      if (result) {
        syncControlsFromFilter(activeViewer.getFilter());
        updateSearchResults();
        updateInspector();
      }
      return result;
    },
    goToViewpoint(id: string): boolean {
      const result = requireViewer().goToViewpoint(id);
      if (result) {
        updateInspector();
      }
      return result;
    },
    exportSvg(): string {
      return requireViewer().exportSvg();
    },
    destroy(): void {
      requireViewer().destroy();
      container.innerHTML = "";
      container.classList.remove("wo-atlas-viewer");
    },
  };

  return api;

  function refreshAfterInputChange(): void {
    populateViewpoints();
    applyCurrentFilter();
    renderBookmarks();
    updateSearchResults();
    updateInspector();
  }

  function applyCurrentFilter(): void {
    requireViewer().setFilter(buildComposedFilter());
    populateViewpoints();
    updateSearchResults();
    updateInspector();
  }

  function buildComposedFilter(): ViewerFilter | null {
    return normalizeViewerFilter({
      query: searchQuery || undefined,
      objectTypes: objectTypeFilter ? [objectTypeFilter] : undefined,
      tags: baseFilter?.tags,
      groupIds: baseFilter?.groupIds,
      includeAncestors: baseFilter?.includeAncestors ?? true,
    });
  }

  function syncControlsFromFilter(filter: ViewerFilter | null): void {
    searchQuery = filter?.query?.trim() ?? "";
    objectTypeFilter =
      filter?.objectTypes?.length === 1 ? filter.objectTypes[0] : null;

    if (searchInput && document.activeElement !== searchInput) {
      searchInput.value = searchQuery;
    }
    if (typeFilterSelect) {
      typeFilterSelect.value = objectTypeFilter ?? "";
    }
  }

  function populateViewpoints(): void {
    if (!viewpointSelect) {
      return;
    }

    const activeViewer = requireViewer();
    const active = activeViewer.getActiveViewpoint()?.id ?? "";
    viewpointSelect.innerHTML = [
      `<option value="">Scene default</option>`,
      ...activeViewer
        .listViewpoints()
        .map(
          (viewpoint) =>
            `<option value="${escapeHtml(viewpoint.id)}">${escapeHtml(viewpoint.label)}</option>`,
        ),
    ].join("");
    viewpointSelect.value = active;
  }

  function syncViewpointControl(): void {
    if (!viewpointSelect) {
      return;
    }

    viewpointSelect.value = requireViewer().getActiveViewpoint()?.id ?? "";
  }

  function updateSearchResults(): void {
    if (!searchResults) {
      return;
    }

    const results = requireViewer().search(searchQuery, 6);
    searchResults.innerHTML = results
      .map(
        (result) =>
          `<button type="button" class="wo-atlas-pill" data-object-id="${escapeHtml(result.objectId)}">${escapeHtml(result.objectId)} - ${escapeHtml(result.type)}</button>`,
      )
      .join("");
  }

  function updateInspector(): void {
    const snapshot = buildInspectorSnapshot();

    if (inspector) {
      inspector.textContent = JSON.stringify(snapshot, null, 2);
    }

    options.onInspectorChange?.(snapshot);
  }

  function buildInspectorSnapshot(): AtlasInspectorSnapshot {
    const activeViewer = requireViewer();
    return {
      selection: activeViewer.getSelectionDetails(),
      activeViewpoint: activeViewer.getActiveViewpoint(),
      filter: activeViewer.getFilter(),
      atlasState: activeViewer.getAtlasState(),
      visibleObjectIds: activeViewer.getVisibleObjects().map((object) => object.objectId),
      scene: {
        title: activeViewer.getScene().title,
        projection: activeViewer.getScene().projection,
        renderPreset: activeViewer.getScene().renderPreset,
        groupCount: activeViewer.getScene().groups.length,
        viewpointCount: activeViewer.getScene().viewpoints.length,
      },
    };
  }

  function renderBookmarks(): void {
    if (!bookmarkList) {
      return;
    }

    bookmarkList.innerHTML = bookmarks
      .map(
        (bookmark) =>
          `<button type="button" class="wo-atlas-pill" data-bookmark-id="${escapeHtml(bookmark.id)}">${escapeHtml(bookmark.label)}</button>`,
      )
      .join("");
  }
}

function buildAtlasViewerMarkup(controls: {
  search: boolean;
  typeFilter: boolean;
  viewpointSelect: boolean;
  inspector: boolean;
  bookmarks: boolean;
}): string {
  const toolbarItems = [
    controls.search
      ? `<label class="wo-atlas-field">
          <span>Search</span>
          <input data-atlas-search type="text" placeholder="Search objects, tags, or types" />
        </label>`
      : "",
    controls.typeFilter
      ? `<label class="wo-atlas-field">
          <span>Type</span>
          <select data-atlas-type-filter>
            <option value="">All types</option>
            <option value="star">Star</option>
            <option value="planet">Planet</option>
            <option value="moon">Moon</option>
            <option value="belt">Belt</option>
            <option value="asteroid">Asteroid</option>
            <option value="comet">Comet</option>
            <option value="ring">Ring</option>
            <option value="structure">Structure</option>
            <option value="phenomenon">Phenomenon</option>
          </select>
        </label>`
      : "",
    controls.viewpointSelect
      ? `<label class="wo-atlas-field">
          <span>Viewpoint</span>
          <select data-atlas-viewpoint>
            <option value="">Scene default</option>
          </select>
        </label>`
      : "",
    controls.bookmarks
      ? `<button type="button" class="wo-atlas-button" data-atlas-bookmark>Save bookmark</button>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  return `<section class="wo-atlas-shell">
    ${toolbarItems ? `<div class="wo-atlas-toolbar" data-atlas-toolbar>${toolbarItems}</div>` : ""}
    <div class="wo-atlas-workspace">
      <div class="wo-atlas-stage" data-atlas-stage></div>
      ${controls.inspector ? `<pre class="wo-atlas-inspector" data-atlas-inspector></pre>` : ""}
    </div>
    <div class="wo-atlas-footer">
      <div class="wo-atlas-results" data-atlas-results></div>
      ${controls.bookmarks ? `<div class="wo-atlas-bookmarks" data-atlas-bookmarks></div>` : ""}
    </div>
  </section>`;
}

function installAtlasViewerStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .wo-atlas-shell { display: grid; gap: 16px; min-width: 0; }
    .wo-atlas-toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: end; }
    .wo-atlas-workspace { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr) minmax(260px, 320px); }
    .wo-atlas-stage { min-height: 420px; min-width: 0; }
    .wo-atlas-inspector {
      margin: 0;
      min-height: 420px;
      padding: 16px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(7, 16, 25, 0.72);
      color: #edf6ff;
      overflow: auto;
      font: 12px/1.5 "Cascadia Code", "Consolas", monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .wo-atlas-footer { display: grid; gap: 12px; }
    .wo-atlas-results, .wo-atlas-bookmarks { display: flex; gap: 8px; flex-wrap: wrap; }
    .wo-atlas-field { display: grid; gap: 6px; min-width: 180px; color: #edf6ff; font: 600 12px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif; text-transform: uppercase; letter-spacing: 0.08em; }
    .wo-atlas-field input, .wo-atlas-field select, .wo-atlas-button, .wo-atlas-pill {
      border: 1px solid rgba(240, 180, 100, 0.2);
      border-radius: 999px;
      background: rgba(240, 180, 100, 0.08);
      color: #edf6ff;
      font: 500 13px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif;
      padding: 10px 14px;
    }
    .wo-atlas-button, .wo-atlas-pill { cursor: pointer; }
    @media (max-width: 1080px) {
      .wo-atlas-workspace { grid-template-columns: 1fr; }
      .wo-atlas-inspector { min-height: 220px; }
    }
  `;
  document.head.append(style);
}

function cloneBookmark(bookmark: ViewerBookmark): ViewerBookmark {
  return {
    ...bookmark,
    atlasState: {
      ...bookmark.atlasState,
      viewerState: { ...bookmark.atlasState.viewerState },
      renderOptions: {
        ...bookmark.atlasState.renderOptions,
        layers: bookmark.atlasState.renderOptions.layers
          ? { ...bookmark.atlasState.renderOptions.layers }
          : undefined,
        scaleModel: bookmark.atlasState.renderOptions.scaleModel
          ? { ...bookmark.atlasState.renderOptions.scaleModel }
          : undefined,
      },
      filter: bookmark.atlasState.filter ? { ...bookmark.atlasState.filter } : null,
    },
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
