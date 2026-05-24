import os
import random
from typing import Literal, cast

import pytest
from dotenv import load_dotenv

from aps_viewer_sdk import APSViewer, ChangesInput
from aps_viewer_sdk.helper import (
    get_2lo_token,
    get_all_model_properties,
    get_metadata_viewables,
    to_md_urn,
)


@pytest.mark.requires_secrets
def test_model_diff_plugin_opens_split_view_with_fake_changes() -> None:
    load_dotenv()
    client_id = os.getenv("CLIENT_ID")
    client_secret = os.getenv("CLIENT_SECRET")
    test_urn = os.getenv("TEST_URN")
    region = os.getenv("APS_MODEL_DERIVATIVE_REGION", "US")
    if not client_id or not client_secret or not test_urn:
        pytest.skip("Missing CLIENT_ID/CLIENT_SECRET/TEST_URN for model diff test")

    token = get_2lo_token(client_id, client_secret)
    urn_bs64 = to_md_urn(test_urn)

    viewer = APSViewer(
        urn=test_urn,
        token=token,
        views_selector=True,
        region=region,
    )

    viewables = viewer.get_viewables(urn_bs64)
    first_view = next((v for v in viewables if v.get("role") == "3d"), None)
    if not first_view:
        pytest.skip("No 3d viewables returned for TEST_URN")
    viewer.set_view_guid(first_view["guid"], first_view["name"], first_view["role"])

    metadata_views = get_metadata_viewables(token, urn_bs64, region=region)
    model_guid = next(
        (v["guid"] for v in metadata_views if v.get("role") == "3d"),
        metadata_views[0].get("guid") if metadata_views else None,
    )
    if not model_guid:
        pytest.skip("No valid model GUID available for metadata properties")

    payload = get_all_model_properties(token, urn_bs64, model_guid, region=region)
    data_raw = payload.get("data")
    data: dict[str, object] = cast(
        dict[str, object], data_raw if isinstance(data_raw, dict) else payload
    )
    collection = data.get("collection", [])

    rng = random.Random(23)
    required_change_count = 50
    external_ids: list[str] = []
    seen: set[str] = set()
    for item in collection:
        ext = item.get("externalId")
        if isinstance(ext, str) and ext and ext not in seen:
            seen.add(ext)
            external_ids.append(ext)
        if len(external_ids) == 500:
            break
    if len(external_ids) < required_change_count:
        pytest.skip(
            f"Need at least {required_change_count} external IDs for fake diff changes"
        )

    sampled_external_ids = rng.sample(external_ids, required_change_count)
    change_types: list[Literal["added", "removed", "modified"]] = (
        ["added"] * 17 + ["removed"] * 17 + ["modified"] * 16
    )
    rng.shuffle(change_types)

    change_items: list[dict[str, object]] = []
    for index, (external_id, change_type) in enumerate(
        zip(sampled_external_ids, change_types, strict=True)
    ):
        modification_types = (
            ["geometry", "properties"] if change_type == "modified" else []
        )
        change_items.append(
            {
                "id": f"fake-{change_type}-{index}",
                "externalElementId": external_id,
                "changeType": change_type,
                "displayName": f"Fake {change_type} element {index + 1}",
                "modificationTypes": modification_types,
            }
        )
    changes: ChangesInput = change_items
    default_visibility: dict[Literal["unchanged"], Literal["visible", "hidden"]] = {
        "unchanged": "hidden"
    }

    viewer.compare_with(
        test_urn,
        changes,
        base_label="same model base",
        target_label="same model target",
        base_view_guid=first_view["guid"],
        default_mode="split",
        default_visibility=default_visibility,
        legend=True,
        list_mode="none",
        sync_views=True,
    )

    html = viewer.write()
    viewer.show()

    assert "PLUGINS_PLACEHOLDER" not in html
    assert "PLUGINS_JS_PLACEHOLDER" not in html
    assert '"extensionId": "My.ModelDiff"' in html
    assert '"baseUrn": "' + urn_bs64 + '"' in html
    assert '"defaultMode": "split"' in html
    assert '"syncViews": true' in html
    assert '"defaultVisibility": {"unchanged": "hidden"}' in html
    assert "viewDropdown" in html
    assert "my-modeldiff-split-root" in html
    assert "my-modeldiff-pane-legend-base" in html
    assert "my-modeldiff-pane-legend-target" in html
    assert "my-modeldiff-sync-toggle" not in html
    assert "Base changes" in html
    assert "Target changes" in html
    assert "compact-title" in html
    assert "badges" in html
    assert 'const EXT_ID = "My.ModelDiff";' in html
    assert '"changeType": "added"' in html
    assert '"changeType": "removed"' in html
    assert '"changeType": "modified"' in html
    assert '"added": "#00ff66"' in html
    assert '"removed": "#ff1744"' in html
    assert '"modified": "#ffd600"' in html
    for external_id in sampled_external_ids:
        assert external_id in html


if __name__ == "__main__":
    test_model_diff_plugin_opens_split_view_with_fake_changes()
