from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any, Literal, NotRequired, TypedDict, cast


class ModelDiffViewerRefs(TypedDict, total=False):
    baseExternalElementId: str
    targetExternalElementId: str


class ModelDiffPropertyDelta(TypedDict, total=False):
    name: str
    displayName: str
    oldValue: Any
    newValue: Any


class ModelDiffBounds(TypedDict, total=False):
    min: Sequence[float]
    max: Sequence[float]


class ModelDiffChange(TypedDict, total=False):
    externalElementId: str
    changeType: Literal["added", "removed", "modified"]
    id: str
    displayName: str
    category: str
    discipline: str
    level: str
    modificationTypes: list[str]
    viewer: ModelDiffViewerRefs
    properties: list[ModelDiffPropertyDelta]
    bounds: dict[str, ModelDiffBounds]
    source: dict[str, Any]


class ModelDiffVersion(TypedDict, total=False):
    urn: str
    label: str


class ModelDiffChangeSet(TypedDict):
    schemaVersion: str
    items: list[ModelDiffChange]
    source: NotRequired[dict[str, Any]]
    base: NotRequired[ModelDiffVersion]
    target: NotRequired[ModelDiffVersion]


RawChangeInput = Mapping[str, Any]
RawChangeSetInput = Mapping[str, Any]
ChangesInput = Sequence[RawChangeInput] | RawChangeSetInput

SCHEMA_VERSION = "aps-viewer-diff/0.1"

CHANGE_TYPE_ALIASES: dict[str, Literal["added", "removed", "modified"]] = {
    "add": "added",
    "added": "added",
    "created": "added",
    "new": "added",
    "object_added": "added",
    "remove": "removed",
    "removed": "removed",
    "deleted": "removed",
    "delete": "removed",
    "object_removed": "removed",
    "modify": "modified",
    "modified": "modified",
    "changed": "modified",
    "change": "modified",
    "updated": "modified",
    "object_changed": "modified",
}


def normalize_change_type(value: Any) -> Literal["added", "removed", "modified"]:
    key = str(value).strip().lower()
    key = key.replace("-", "_").replace(" ", "_")
    if key in CHANGE_TYPE_ALIASES:
        return CHANGE_TYPE_ALIASES[key]
    raise ValueError(
        f"changeType must be one of added, removed, or modified (received {value!r})"
    )


def normalize_change_item(change: RawChangeInput) -> ModelDiffChange:
    if "changeType" not in change:
        raise ValueError("each model diff change must include changeType")

    normalized = cast(ModelDiffChange, dict(change))
    normalized["changeType"] = normalize_change_type(change["changeType"])

    if "displayName" not in normalized and "name" in change:
        normalized["displayName"] = str(change["name"])

    if "properties" not in normalized and "changedProperties" in change:
        normalized["properties"] = list(change["changedProperties"] or [])

    if not _has_viewer_reference(normalized):
        raise ValueError(
            "each model diff change must include externalElementId, "
            "viewer.baseExternalElementId, viewer.targetExternalElementId, "
            "or bounds"
        )

    return normalized


def normalize_change_items(changes: Sequence[RawChangeInput]) -> list[ModelDiffChange]:
    return [normalize_change_item(change) for change in changes]


def normalize_change_set(changes: ChangesInput) -> ModelDiffChangeSet:
    if isinstance(changes, Mapping) and "items" in changes:
        items = changes.get("items") or []
        if not isinstance(items, Sequence) or isinstance(items, (str, bytes)):
            raise ValueError("ModelDiffChangeSet.items must be a sequence")

        raw_items = cast(Sequence[RawChangeInput], items)
        change_set: ModelDiffChangeSet = {
            "schemaVersion": str(changes.get("schemaVersion") or SCHEMA_VERSION),
            "items": normalize_change_items(raw_items),
        }
        if "source" in changes:
            change_set["source"] = dict(
                cast(Mapping[str, Any], changes["source"] or {})
            )
        if "base" in changes:
            change_set["base"] = cast(
                ModelDiffVersion,
                dict(cast(Mapping[str, Any], changes["base"] or {})),
            )
        if "target" in changes:
            change_set["target"] = cast(
                ModelDiffVersion,
                dict(cast(Mapping[str, Any], changes["target"] or {})),
            )
        return change_set

    if isinstance(changes, Mapping):
        raise ValueError(
            "changes must be a sequence of change items or a mapping with an items key"
        )

    return {
        "schemaVersion": SCHEMA_VERSION,
        "items": normalize_change_items(changes),
    }


def _has_viewer_reference(change: Mapping[str, Any]) -> bool:
    if change.get("externalElementId"):
        return True

    viewer = change.get("viewer") or {}
    if isinstance(viewer, Mapping) and (
        viewer.get("baseExternalElementId") or viewer.get("targetExternalElementId")
    ):
        return True

    bounds = change.get("bounds") or {}
    return isinstance(bounds, Mapping) and (
        bool(bounds.get("base")) or bool(bounds.get("target"))
    )
