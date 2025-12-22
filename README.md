# APS Viewer SDK

Lightweight Python helper to render APS models in the browser.

## Install

Requires `uv`.

```bash
uv sync
```

## Example: Open Viewer in Browser

```python
from aps_viewer_sdk.main import APSViewer
from aps_viewer_sdk.helper import get_2lo_token

token = get_2lo_token("CLIENT_ID", "CLIENT_SECRET")
viewer = APSViewer(
    urn="urn:...",
    token=token,
    views_selector=True,
)
viewer.show()
```

## Run Tests

```bash
uv run --group test pytest
```
