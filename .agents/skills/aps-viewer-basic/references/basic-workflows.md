# Basic Workflows

## Quick Start: Load And Show A Model

```python
from aps_viewer_sdk import APSViewer
from aps_viewer_sdk.helper import get_2lo_token

token = get_2lo_token("CLIENT_ID", "CLIENT_SECRET")
viewer = APSViewer(urn="urn:...", token=token, views_selector=True)
viewer.show()
```

## Highlight Elements By externalId

```python
from aps_viewer_sdk import APSViewer

viewer = APSViewer(urn="urn:...", token="token", views_selector=False)
viewer.highlight_elements(
    [
        {"externalElementId": "3f8e3fcb-9f8d-4cbf-aef8-a0d2f5f2a100-00012345", "color": "#ff0000"},
        {"externalElementId": "3f8e3fcb-9f8d-4cbf-aef8-a0d2f5f2a100-00012346", "color": "#00aa00"},
    ]
)
html = viewer.write()
```

## Force A Specific View

```python
from aps_viewer_sdk import APSViewer
from aps_viewer_sdk.helper import to_md_urn

viewer = APSViewer(urn="urn:...", token="token", views_selector=True)
viewables = viewer.get_viewables(to_md_urn(viewer.urn))

target = next(v for v in viewables if v["role"] == "3d")
viewer.set_view_guid(target["guid"], target["name"], target["role"])
viewer.show()
```

## Troubleshooting

1. If no views appear, ensure the model has finished translation in APS.
2. If highlighting does not apply, verify `externalElementId` values match APS property payloads.
3. If browser rendering fails, call `viewer.write()` and inspect the resulting HTML for injected token/URN.
