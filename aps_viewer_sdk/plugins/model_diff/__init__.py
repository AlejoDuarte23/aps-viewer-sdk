from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Annotated, Literal

from ...diff import (
    ChangesInput,
    normalize_change_set,
)
from ...helper import to_md_urn
from ..base import PluginSpec

DEFAULT_DIFF_COLORS: dict[Literal["added", "removed", "modified"], str] = {
    "added": "#00ff66",
    "removed": "#ff1744",
    "modified": "#ffd600",
}


@dataclass(frozen=True)
class ModelDiff:
    base_urn: Annotated[
        str,
        "Base or previous model version URN used as the comparison reference",
    ]
    changes: Annotated[
        ChangesInput,
        "Normalized diff items or a ModelDiffChangeSet produced by aps_viewer_sdk.diff",
    ]
    base_label: Annotated[
        str | None,
        "Optional short label shown for the base side of the comparison",
    ] = None
    target_label: Annotated[
        str | None,
        "Optional short label shown for the target/current side of the comparison",
    ] = None
    colors: Annotated[
        Mapping[Literal["added", "removed", "modified"], str] | None,
        "Optional HEX color overrides keyed by added, removed, or modified",
    ] = None
    default_mode: Annotated[
        Literal["overlay", "split"],
        "Initial comparison layout: overlay in one viewer or split in two viewers",
    ] = "overlay"
    legend: Annotated[
        bool,
        "Whether to render the in-view diff controls and change badges",
    ] = True
    list_mode: Annotated[
        Literal["external", "drawer", "none"],
        "Change list presentation mode: external, drawer, or none",
    ] = "external"
    base_view_guid: Annotated[
        str | None,
        "Optional base model view GUID to match the selected target view",
    ] = None
    sync_views: Annotated[
        bool,
        "Whether split viewers keep camera/navigation state synchronized",
    ] = True
    default_visibility: Annotated[
        Mapping[Literal["unchanged"], Literal["visible", "hidden"]] | None,
        "Initial visibility policy for unchanged elements",
    ] = None

    def spec(self) -> PluginSpec:
        change_set = normalize_change_set(self.changes)
        colors = {**DEFAULT_DIFF_COLORS, **dict(self.colors or {})}

        if self.list_mode not in {"external", "drawer", "none"}:
            raise ValueError("list_mode must be one of external, drawer, or none")
        if self.default_mode not in {"overlay", "split"}:
            raise ValueError("default_mode must be one of overlay or split")
        if self.default_visibility and self.default_visibility.get("unchanged") not in {
            None,
            "visible",
            "hidden",
        }:
            raise ValueError("default_visibility.unchanged must be visible or hidden")

        js_path = Path(__file__).resolve().parent / "model_diff.js"
        js_content = js_path.read_text(encoding="utf-8")

        base_meta = change_set.get("base", {})
        target_meta = change_set.get("target", {})
        labels = {
            "base": self.base_label or base_meta.get("label") or "Base",
            "target": self.target_label or target_meta.get("label") or "Target",
        }

        return PluginSpec(
            extension_id="My.ModelDiff",
            only_2d=False,
            options={
                "baseUrn": to_md_urn(self.base_urn),
                "labels": labels,
                "colors": colors,
                "changes": change_set["items"],
                "changeSet": {
                    "schemaVersion": change_set["schemaVersion"],
                    "source": change_set.get("source", {}),
                    "base": change_set.get("base", {}),
                    "target": change_set.get("target", {}),
                },
                "defaultMode": self.default_mode,
                "legend": bool(self.legend),
                "listMode": self.list_mode,
                "baseViewGuid": self.base_view_guid or "",
                "syncViews": bool(self.sync_views),
                "defaultVisibility": dict(self.default_visibility or {}),
            },
            js_content=js_content,
        )
