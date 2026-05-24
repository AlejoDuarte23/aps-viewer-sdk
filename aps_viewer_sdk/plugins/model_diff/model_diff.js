(function () {
  const EXT_ID = "My.ModelDiff";
  const STYLE_ID = "my-modeldiff-styles";
  const DEFAULT_COLORS = {
    added: "#00ff66",
    removed: "#ff1744",
    modified: "#ffd600",
  };

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function getThree() {
    return (
      (window.Autodesk &&
        Autodesk.Viewing &&
        Autodesk.Viewing.Private &&
        Autodesk.Viewing.Private.THREE) ||
      window.THREE ||
      null
    );
  }

  function colorToVec4(color, alpha) {
    const THREE_REF = getThree();
    if (!THREE_REF) return null;

    const fallback = new THREE_REF.Vector4(0, 1, 0, alpha);
    if (typeof color !== "string") return fallback;

    const raw = color.trim().toLowerCase();
    if (raw.startsWith("#") && raw.length === 7) {
      return new THREE_REF.Vector4(
        clamp01(parseInt(raw.slice(1, 3), 16) / 255),
        clamp01(parseInt(raw.slice(3, 5), 16) / 255),
        clamp01(parseInt(raw.slice(5, 7), 16) / 255),
        alpha
      );
    }

    const rgba = raw.match(
      /^rgba?\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9.]+))?\s*\)$/
    );
    if (rgba) {
      return new THREE_REF.Vector4(
        clamp01(parseInt(rgba[1], 10) / 255),
        clamp01(parseInt(rgba[2], 10) / 255),
        clamp01(parseInt(rgba[3], 10) / 255),
        rgba[4] == null ? alpha : clamp01(parseFloat(rgba[4]))
      );
    }

    return fallback;
  }

  function asViewerDocumentUrn(baseUrn) {
    const value = String(baseUrn || "").trim();
    if (!value) return "";
    return value.startsWith("urn:") ? value : `urn:${value}`;
  }

  function getDbIds(map, externalId) {
    if (!map || !externalId) return [];
    const value = map[String(externalId)];
    if (value == null) return [];
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === "number");
    }
    return typeof value === "number" ? [value] : [];
  }

  function getExternalId(change, side) {
    if (!change || typeof change !== "object") return "";
    const viewer = change.viewer || {};

    if (side === "base" && viewer.baseExternalElementId) {
      return String(viewer.baseExternalElementId);
    }
    if (side === "target" && viewer.targetExternalElementId) {
      return String(viewer.targetExternalElementId);
    }

    return change.externalElementId ? String(change.externalElementId) : "";
  }

  function modelGuid(model) {
    if (!model) return "";
    if (typeof model.getData === "function") {
      const data = model.getData() || {};
      return data.guid || data.urn || "";
    }
    return "";
  }

  function mapExternalIds(model) {
    return new Promise((resolve) => {
      if (!model || typeof model.getExternalIdMapping !== "function") {
        resolve({});
        return;
      }
      model.getExternalIdMapping(
        (map) => resolve(map || {}),
        () => resolve({})
      );
    });
  }

  function ensureStyles(viewer) {
    const doc = viewer.container.ownerDocument;
    if (doc.getElementById(STYLE_ID)) return;

    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .my-modeldiff-legend{
        position:absolute;
        right:12px;
        top:50%;
        transform:translateY(-50%);
        z-index:9999;
        width:clamp(176px, 22vw, 224px);
        max-width:calc(100% - 24px);
        max-height:min(40vh, 248px);
        overflow:auto;
        padding:9px;
        color:#1f2328;
        background:rgba(255,255,255,.95);
        border:1px solid #e0e0e0;
        border-radius:6px;
        box-shadow:0 2px 8px rgba(0,0,0,.15);
        font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
        font-size:13px;
        line-height:1.25;
        user-select:none;
      }
      .my-modeldiff-pane-legend{
        position:absolute;
        left:12px;
        top:74px;
        z-index:30;
        display:flex;
        flex-direction:column;
        align-items:flex-start;
        gap:6px;
        max-width:calc(100% - 24px);
        color:#1f2328;
        font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
        font-size:12px;
        line-height:1.2;
        user-select:none;
      }
      .my-modeldiff-pane-legend .compact-title,
      .my-modeldiff-pane-legend button{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:6px;
        min-width:86px;
        min-height:26px;
        padding:0 8px;
        box-sizing:border-box;
        background:rgba(255,255,255,.95);
        border:1px solid #e0e0e0;
        border-radius:6px;
        box-shadow:0 2px 8px rgba(0,0,0,.12);
        white-space:nowrap;
      }
      .my-modeldiff-pane-legend .compact-title{
        color:#1a73e8;
        font-weight:700;
      }
      .my-modeldiff-pane-legend .badges{
        display:flex;
        flex-direction:column;
        align-items:flex-start;
        gap:6px;
      }
      .my-modeldiff-pane-legend .summary-count{
        color:#666;
        font-weight:700;
        font-variant-numeric:tabular-nums;
      }
      .my-modeldiff-legend .title,
      .my-modeldiff-pane-legend .title{
        display:flex;
        justify-content:space-between;
        gap:8px;
        margin-bottom:8px;
        font-weight:700;
      }
      .my-modeldiff-legend .title span:first-child,
      .my-modeldiff-pane-legend .title span:first-child{
        color:#1a73e8;
      }
      .my-modeldiff-legend .subtitle,
      .my-modeldiff-pane-legend .subtitle{
        color:#666;
        font-weight:600;
      }
      .my-modeldiff-pane-legend .meta{
        display:none;
      }
      .my-modeldiff-legend button{
        appearance:none;
        width:100%;
        height:27px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin:0;
        padding:0 8px;
        border:1px solid #d0d0d0;
        border-radius:6px;
        background:#fff;
        color:#1f2328;
        cursor:pointer;
      }
      .my-modeldiff-pane-legend button{
        appearance:none;
        height:26px;
        margin:0;
        min-width:112px;
        color:#1f2328;
        cursor:pointer;
      }
      .my-modeldiff-legend button + button{ margin-top:6px; }
      .my-modeldiff-legend button:hover{
        border-color:#1a73e8;
        background:#fff;
      }
      .my-modeldiff-pane-legend button:hover{
        border-color:#1a73e8;
      }
      .my-modeldiff-legend button.off,
      .my-modeldiff-pane-legend button.off{
        opacity:.48;
        text-decoration:line-through;
      }
      .my-modeldiff-legend .label,
      .my-modeldiff-pane-legend .label{
        display:flex;
        align-items:center;
        gap:7px;
        min-width:0;
      }
      .my-modeldiff-legend .swatch,
      .my-modeldiff-pane-legend .swatch{
        width:10px;
        height:10px;
        border-radius:2px;
        flex:0 0 auto;
      }
      .my-modeldiff-legend .count,
      .my-modeldiff-pane-legend .count{
        color:#555;
        font-variant-numeric:tabular-nums;
      }
      .my-modeldiff-legend .foot,
      .my-modeldiff-pane-legend .foot{
        margin-top:7px;
        color:#666;
        font-size:11px;
      }
      .my-modeldiff-pane-legend .foot{
        display:none;
      }
      .my-modeldiff-split-root{
        position:absolute;
        inset:0;
        z-index:1;
        display:flex;
        width:100%;
        height:100%;
        background:#f7fbff;
      }
      .my-modeldiff-pane{
        position:relative;
        flex:1 1 0;
        min-width:0;
        height:100%;
        overflow:hidden;
      }
      .my-modeldiff-pane + .my-modeldiff-pane{
        border-left:1px solid #e0e0e0;
      }
      .my-modeldiff-base-viewer,
      .my-modeldiff-pane-target > #apsViewerDiv{
        width:100%;
        height:100%;
      }
      @media (max-width:1100px){
        .my-modeldiff-split-root{
          flex-direction:column;
        }
        .my-modeldiff-pane{
          flex:1 1 50%;
          height:50%;
        }
        .my-modeldiff-pane + .my-modeldiff-pane{
          border-left:0;
          border-top:1px solid #e0e0e0;
        }
        .my-modeldiff-pane-legend{
          top:74px;
          right:auto;
        }
      }
      @media (max-width:720px){
        #viewSelector{
          max-width:calc(100vw - 24px);
          box-sizing:border-box;
        }
        #viewDropdown{
          min-width:0;
          max-width:calc(100vw - 118px);
        }
        .my-modeldiff-pane-legend{
          top:70px;
          font-size:11px;
        }
        .my-modeldiff-pane-legend button{
          height:26px;
          padding:0 7px;
        }
      }
    `;
    doc.head.appendChild(style);
  }

  class ModelDiffExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
      super(viewer, options);
      const opt = options || {};

      this._baseUrn = asViewerDocumentUrn(opt.baseUrn);
      this._baseViewGuid = opt.baseViewGuid || "";
      this._labels = opt.labels || {};
      this._colors = Object.assign({}, DEFAULT_COLORS, opt.colors || {});
      this._changes = Array.isArray(opt.changes) ? opt.changes : [];
      this._mode = String(opt.defaultMode || "overlay").toLowerCase();
      this._legendEnabled = opt.legend !== false;
      this._syncEnabled = opt.syncViews !== false;
      this._unchangedVisibility = String(
        (opt.defaultVisibility && opt.defaultVisibility.unchanged) || "visible"
      ).toLowerCase();

      this._baseViewer = null;
      this._baseModel = null;
      this._targetModel = null;
      this._baseLoading = false;
      this._splitStarted = false;
      this._splitRoot = null;
      this._baseContainer = null;
      this._basePaneLegend = null;
      this._targetPaneLegend = null;
      this._cameraSyncReady = false;
      this._syncingCamera = false;
      this._onTargetCameraChanged = null;
      this._onBaseCameraChanged = null;
      this._originalParent = null;
      this._originalNextSibling = null;
      this._refsByType = { added: [], removed: [], modified: [] };
      this._visibleByType = { added: true, removed: true, modified: true };
      this._legend = null;
      this._lastTargetGuid = "";

      this._onGeometryLoaded = this._onGeometryLoaded.bind(this);
    }

    load() {
      if (!this._baseUrn) {
        console.warn("[ModelDiff] Missing baseUrn");
        return true;
      }

      this.viewer.container.style.position =
        this.viewer.container.style.position || "relative";

      if (this._mode === "split") {
        this.viewer.addEventListener(
          Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
          this._onGeometryLoaded
        );
        this._startSplitMode();
        return true;
      }

      this.viewer.addEventListener(
        Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
        this._onGeometryLoaded
      );

      this._captureTargetAndLoadBase();
      return true;
    }

    unload() {
      this.viewer.removeEventListener(
        Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
        this._onGeometryLoaded
      );
      this._teardownCameraSync();

      if (this._legend && this._legend.parentNode) {
        this._legend.parentNode.removeChild(this._legend);
      }
      this._legend = null;

      if (
        this._mode !== "split" &&
        this._baseModel &&
        typeof this.viewer.unloadModel === "function"
      ) {
        try {
          this.viewer.unloadModel(this._baseModel);
        } catch (e) {
          console.warn("[ModelDiff] Failed to unload base model", e);
        }
      }

      if (this._baseViewer && typeof this._baseViewer.finish === "function") {
        try {
          this._baseViewer.finish();
        } catch (e) {
          console.warn("[ModelDiff] Failed to finish base split viewer", e);
        }
      }
      this._baseViewer = null;

      if (this._splitRoot && this._originalParent) {
        try {
          if (this._originalNextSibling) {
            this._originalParent.insertBefore(
              this.viewer.container,
              this._originalNextSibling
            );
          } else {
            this._originalParent.appendChild(this.viewer.container);
          }
          this._originalParent.removeChild(this._splitRoot);
        } catch (e) {
          console.warn("[ModelDiff] Failed to restore split layout", e);
        }
      }
      this._splitRoot = null;
      this._baseContainer = null;
      this._basePaneLegend = null;
      this._targetPaneLegend = null;

      return true;
    }

    getChanges() {
      return this._changes.slice();
    }

    fitChange(indexOrId) {
      const ref = this._findRef(indexOrId);
      if (!ref) return false;
      ref.viewer.fitToView(ref.dbIds, ref.model);
      return true;
    }

    setChangeTypeVisible(changeType, visible) {
      const type = String(changeType || "").toLowerCase();
      if (!this._refsByType[type]) return false;

      this._visibleByType[type] = !!visible;
      this._refsByType[type].forEach((ref) => {
        this._setDbIdsVisible(ref.viewer, ref.model, ref.dbIds, !!visible);
      });
      this._syncLegendState();
      this._invalidateViewers();
      return true;
    }

    _startSplitMode() {
      if (this._splitStarted) return;
      if (!this.viewer || !this.viewer.model) {
        setTimeout(() => this._startSplitMode(), 50);
        return;
      }

      this._splitStarted = true;
      this._targetModel = this.viewer.model;
      this._lastTargetGuid = modelGuid(this._targetModel);
      this._createSplitLayout();

      this._baseViewer = new Autodesk.Viewing.GuiViewer3D(this._baseContainer, {
        disableBimWalkInfoIcon: true,
      });
      this._baseViewer.start();

      this._loadBaseModelIntoViewer(this._baseViewer)
        .then((model) => {
          this._baseModel = model;
          this._setupCameraSync();
          this._applyDiff();
        })
        .catch((error) => {
          console.error("[ModelDiff] Failed to load split base model", error);
          this._applyDiff();
        });
    }

    _createSplitLayout() {
      ensureStyles(this.viewer);

      const doc = this.viewer.container.ownerDocument;
      const parent = this.viewer.container.parentNode;
      if (!parent) return;

      this._originalParent = parent;
      this._originalNextSibling = this.viewer.container.nextSibling;

      const root = doc.createElement("div");
      root.className = "my-modeldiff-split-root";

      const basePane = doc.createElement("div");
      basePane.className = "my-modeldiff-pane my-modeldiff-pane-base";

      const targetPane = doc.createElement("div");
      targetPane.className = "my-modeldiff-pane my-modeldiff-pane-target";

      const baseContainer = doc.createElement("div");
      baseContainer.className = "my-modeldiff-base-viewer";

      const baseLegend = doc.createElement("div");
      baseLegend.className =
        "my-modeldiff-pane-legend my-modeldiff-pane-legend-base";
      baseLegend.dataset.diffSide = "base";

      const targetLegend = doc.createElement("div");
      targetLegend.className =
        "my-modeldiff-pane-legend my-modeldiff-pane-legend-target";
      targetLegend.dataset.diffSide = "target";

      parent.insertBefore(root, this.viewer.container);
      basePane.appendChild(baseContainer);
      basePane.appendChild(baseLegend);
      targetPane.appendChild(this.viewer.container);
      targetPane.appendChild(targetLegend);
      root.appendChild(basePane);
      root.appendChild(targetPane);

      this._splitRoot = root;
      this._baseContainer = baseContainer;
      this._basePaneLegend = baseLegend;
      this._targetPaneLegend = targetLegend;
      this.viewer.resize();
    }

    _loadBaseModelIntoViewer(viewerInstance, viewGuid) {
      return new Promise((resolve, reject) => {
        Autodesk.Viewing.Document.load(
          this._baseUrn,
          (doc) => {
            const root = doc.getRoot();
            let node = null;
            const requestedGuid = viewGuid || this._baseViewGuid;
            if (requestedGuid && root.findByGuid) {
              node = root.findByGuid(requestedGuid);
            }
            if (!node) node = root.getDefaultGeometry();
            if (!node) {
              reject(new Error("No base model geometry found"));
              return;
            }

            viewerInstance
              .loadDocumentNode(doc, node, {
                keepCurrentModels: false,
                preserveView: true,
              })
              .then(resolve)
              .catch(reject);
          },
          (code, message) => {
            reject(new Error(`Base document load failed: ${code} ${message || ""}`));
          }
        );
      });
    }

    _setupCameraSync() {
      if (this._cameraSyncReady || !this.viewer || !this._baseViewer) return;

      this._onTargetCameraChanged = () => {
        this._syncCamera(this.viewer, this._baseViewer);
      };
      this._onBaseCameraChanged = () => {
        this._syncCamera(this._baseViewer, this.viewer);
      };

      this.viewer.addEventListener(
        Autodesk.Viewing.CAMERA_CHANGE_EVENT,
        this._onTargetCameraChanged
      );
      this._baseViewer.addEventListener(
        Autodesk.Viewing.CAMERA_CHANGE_EVENT,
        this._onBaseCameraChanged
      );
      this._cameraSyncReady = true;

      if (this._syncEnabled) {
        this._syncCamera(this.viewer, this._baseViewer);
      }
    }

    _teardownCameraSync() {
      if (this._onTargetCameraChanged) {
        this.viewer.removeEventListener(
          Autodesk.Viewing.CAMERA_CHANGE_EVENT,
          this._onTargetCameraChanged
        );
      }
      if (this._baseViewer && this._onBaseCameraChanged) {
        this._baseViewer.removeEventListener(
          Autodesk.Viewing.CAMERA_CHANGE_EVENT,
          this._onBaseCameraChanged
        );
      }
      this._cameraSyncReady = false;
      this._onTargetCameraChanged = null;
      this._onBaseCameraChanged = null;
    }

    _syncCamera(sourceViewer, targetViewer) {
      if (
        !this._syncEnabled ||
        this._syncingCamera ||
        !sourceViewer ||
        !targetViewer ||
        typeof sourceViewer.getState !== "function" ||
        typeof targetViewer.restoreState !== "function"
      ) {
        return;
      }

      this._syncingCamera = true;
      try {
        const state = sourceViewer.getState({ viewport: true });
        targetViewer.restoreState(state, null, true);
      } catch (e) {
        console.warn("[ModelDiff] Failed to sync split cameras", e);
      } finally {
        window.setTimeout(() => {
          this._syncingCamera = false;
        }, 0);
      }
    }

    _onGeometryLoaded(event) {
      const model = event && event.model;
      if (this._mode === "split") {
        this._onSplitTargetGeometryLoaded(model);
        return;
      }
      if (this._baseLoading) return;
      if (!model || model === this._baseModel) return;

      const guid = modelGuid(model);
      if (guid && guid === this._lastTargetGuid) return;

      this._targetModel = model;
      this._lastTargetGuid = guid;
      this._baseModel = null;
      this._captureTargetAndLoadBase();
    }

    _onSplitTargetGeometryLoaded(model) {
      if (!model || model === this._targetModel) return;

      const guid = modelGuid(model);
      if (guid && guid === this._lastTargetGuid) return;

      this._targetModel = model;
      this._lastTargetGuid = guid;

      if (!this._baseViewer) {
        this._applyDiff();
        return;
      }

      this._loadBaseModelIntoViewer(this._baseViewer, guid)
        .then((baseModel) => {
          this._baseModel = baseModel;
          this._setupCameraSync();
          this._applyDiff();
        })
        .catch((error) => {
          console.warn("[ModelDiff] Failed to reload base split view", error);
          this._baseModel = null;
          this._applyDiff();
        });
    }

    _captureTargetAndLoadBase() {
      if (!this.viewer || !this.viewer.model || this._baseLoading) return;

      this._targetModel = this.viewer.model;
      this._lastTargetGuid = modelGuid(this._targetModel);
      this._loadBaseModel();
    }

    _loadBaseModel() {
      this._baseLoading = true;

      Autodesk.Viewing.Document.load(
        this._baseUrn,
        (doc) => {
          const root = doc.getRoot();
          let node = null;
          if (this._baseViewGuid && root.findByGuid) {
            node = root.findByGuid(this._baseViewGuid);
          }
          if (!node) node = root.getDefaultGeometry();
          if (!node) {
            console.warn("[ModelDiff] No base model geometry found");
            this._baseLoading = false;
            this._applyDiff();
            return;
          }

          this.viewer
            .loadDocumentNode(doc, node, {
              keepCurrentModels: true,
              preserveView: true,
            })
            .then((model) => {
              this._baseModel = model;
              this._baseLoading = false;
              this._applyDiff();
            })
            .catch((error) => {
              console.error("[ModelDiff] Failed to load base model", error);
              this._baseLoading = false;
              this._applyDiff();
            });
        },
        (code, message) => {
          console.error("[ModelDiff] Base document load failed", code, message);
          this._baseLoading = false;
          this._applyDiff();
        }
      );
    }

    async _applyDiff() {
      if (!this._targetModel) return;

      const targetMap = await mapExternalIds(this._targetModel);
      const baseMap = await mapExternalIds(this._baseModel);

      this._refsByType = { added: [], removed: [], modified: [] };

      for (let i = 0; i < this._changes.length; i++) {
        const change = this._changes[i];
        const type = String(change.changeType || "").toLowerCase();
        if (!this._refsByType[type]) continue;

        if (type === "added") {
          this._applyChangeToSide(change, i, "target", this._targetModel, targetMap);
        } else if (type === "removed") {
          this._applyChangeToSide(change, i, "base", this._baseModel, baseMap);
        } else {
          this._applyChangeToSide(change, i, "base", this._baseModel, baseMap);
          this._applyChangeToSide(
            change,
            i,
            "target",
            this._targetModel,
            targetMap
          );
        }
      }

      this._createOrUpdateLegend();
      if (this._unchangedVisibility === "hidden") {
        this._isolateChangedRefs();
      }
      this._invalidateViewers();
    }

    _applyChangeToSide(change, index, side, model, map) {
      if (!model) return;

      const viewerInstance = this._viewerForSide(side);
      if (!viewerInstance) return;

      const type = String(change.changeType || "").toLowerCase();
      const externalId = getExternalId(change, side);
      const dbIds = getDbIds(map, externalId);
      if (!dbIds.length) return;

      const alpha = side === "base" && type === "modified" ? 0.55 : 0.95;
      const color = colorToVec4(this._colors[type], alpha);
      if (!color) return;

      dbIds.forEach((dbId) => {
        viewerInstance.setThemingColor(dbId, color, model, false);
      });

      const ref = {
        index,
        id: change.id || String(index),
        change,
        type,
        side,
        viewer: viewerInstance,
        model,
        dbIds,
      };
      this._refsByType[type].push(ref);

      if (!this._visibleByType[type]) {
        this._setDbIdsVisible(viewerInstance, model, dbIds, false);
      }
    }

    _viewerForSide(side) {
      if (this._mode === "split" && side === "base") {
        return this._baseViewer;
      }
      return this.viewer;
    }

    _isolateChangedRefs() {
      const groups = [];
      []
        .concat(this._refsByType.added)
        .concat(this._refsByType.removed)
        .concat(this._refsByType.modified)
        .forEach((ref) => {
          let group = groups.find(
            (candidate) =>
              candidate.viewer === ref.viewer && candidate.model === ref.model
          );
          if (!group) {
            group = { viewer: ref.viewer, model: ref.model, dbIds: [] };
            groups.push(group);
          }
          ref.dbIds.forEach((dbId) => {
            if (!group.dbIds.includes(dbId)) group.dbIds.push(dbId);
          });
        });

      groups.forEach((group) => {
        if (!group.viewer || !group.model || !group.dbIds.length) return;
        try {
          group.viewer.isolate(group.dbIds, group.model);
          group.viewer.fitToView(group.dbIds, group.model);
        } catch (e) {
          console.warn("[ModelDiff] Failed to isolate changed elements", e);
        }
      });
    }

    _createOrUpdateLegend() {
      if (!this._legendEnabled) return;
      ensureStyles(this.viewer);

      if (this._mode === "split") {
        this._createOrUpdateSplitLegends();
        return;
      }

      const doc = this.viewer.container.ownerDocument;
      if (!this._legend) {
        this._legend = doc.createElement("div");
        this._legend.className = "my-modeldiff-legend";
        this.viewer.container.appendChild(this._legend);
      }

      const counts = this._countChanges();
      const label =
        (this._labels.base || "Base") + " -> " + (this._labels.target || "Target");

      this._legend.innerHTML = `
        <div class="title">
          <span>Model diff</span>
          <span class="subtitle">${escapeHtml(label)}</span>
        </div>
        ${this._legendButton("added", "Added", counts.added)}
        ${this._legendButton("removed", "Removed", counts.removed)}
        ${this._legendButton("modified", "Modified", counts.modified)}
        <div class="foot">Click a swatch to toggle visibility.</div>
      `;

      this._bindLegendButtons(this._legend);

      this._syncLegendState();
    }

    _createOrUpdateSplitLegends() {
      const counts = this._countChanges();

      if (this._basePaneLegend) {
        this._basePaneLegend.setAttribute("aria-label", "Base changes");
        this._basePaneLegend.innerHTML = `
          <div class="compact-title" title="${escapeHtml(this._labels.base || "Base")}">
            <span>Base</span>
            <span class="summary-count">${counts.removed + counts.modified}</span>
          </div>
          <div class="badges">
            ${this._legendButton("removed", "Removed", counts.removed)}
            ${this._legendButton("modified", "Modified", counts.modified)}
          </div>
          <div class="foot">Removed and modified elements.</div>
        `;
        this._bindLegendButtons(this._basePaneLegend);
      }

      if (this._targetPaneLegend) {
        this._targetPaneLegend.setAttribute("aria-label", "Target changes");
        this._targetPaneLegend.innerHTML = `
          <div class="compact-title" title="${escapeHtml(this._labels.target || "Target")}">
            <span>Target</span>
            <span class="summary-count">${counts.added + counts.modified}</span>
          </div>
          <div class="badges">
            ${this._legendButton("added", "Added", counts.added)}
            ${this._legendButton("modified", "Modified", counts.modified)}
          </div>
          <div class="foot">Added and modified elements.</div>
        `;
        this._bindLegendButtons(this._targetPaneLegend);
      }

      this._syncLegendState();
    }

    _bindLegendButtons(root) {
      ["added", "removed", "modified"].forEach((type) => {
        const btn = root.querySelector(`[data-change-type="${type}"]`);
        if (!btn) return;
        btn.addEventListener("click", () => {
          this.setChangeTypeVisible(type, !this._visibleByType[type]);
        });
      });
    }

    _legendButton(type, label, count) {
      const color = this._colors[type] || DEFAULT_COLORS[type];
      return `
        <button type="button" data-change-type="${type}">
          <span class="label">
            <span class="swatch" style="background:${escapeHtml(color)}"></span>
            <span>${escapeHtml(label)}</span>
          </span>
          <span class="count">${count}</span>
        </button>
      `;
    }

    _syncLegendState() {
      const legends = [
        this._legend,
        this._basePaneLegend,
        this._targetPaneLegend,
      ].filter(Boolean);
      if (!legends.length) return;

      ["added", "removed", "modified"].forEach((type) => {
        legends.forEach((legend) => {
          const btn = legend.querySelector(`[data-change-type="${type}"]`);
          if (!btn) return;
          btn.classList.toggle("off", !this._visibleByType[type]);
        });
      });
    }

    _countChanges() {
      const counts = { added: 0, removed: 0, modified: 0 };
      this._changes.forEach((change) => {
        const type = String(change.changeType || "").toLowerCase();
        if (Object.prototype.hasOwnProperty.call(counts, type)) counts[type]++;
      });
      return counts;
    }

    _setDbIdsVisible(viewerInstance, model, dbIds, visible) {
      if (!viewerInstance || !model || !dbIds || !dbIds.length) return;

      if (visible && typeof viewerInstance.show === "function") {
        viewerInstance.show(dbIds, model);
        return;
      }
      if (!visible && typeof viewerInstance.hide === "function") {
        viewerInstance.hide(dbIds, model);
        return;
      }

      const manager = model.visibilityManager;
      if (manager && typeof manager.setNodeOff === "function") {
        dbIds.forEach((dbId) => manager.setNodeOff(dbId, !visible));
      }
    }

    _invalidateViewers() {
      if (this.viewer && this.viewer.impl) {
        this.viewer.impl.invalidate(true, true, true);
      }
      if (this._baseViewer && this._baseViewer.impl) {
        this._baseViewer.impl.invalidate(true, true, true);
      }
    }

    _findRef(indexOrId) {
      const needle = String(indexOrId);
      const all = []
        .concat(this._refsByType.added)
        .concat(this._refsByType.removed)
        .concat(this._refsByType.modified);
      return (
        all.find((ref) => String(ref.index) === needle || String(ref.id) === needle) ||
        null
      );
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  Autodesk.Viewing.theExtensionManager.registerExtension(EXT_ID, ModelDiffExtension);
})();
