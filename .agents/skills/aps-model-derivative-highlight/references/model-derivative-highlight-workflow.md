# Model Derivative Highlight Workflow

## Notebook Anchor

Mirror this repository example:

- `example/1 - highlight_elements_in_scene/color_elements_from_scene.ipynb`

## Minimal Sequence

1. Load credentials (`CLIENT_ID`, `CLIENT_SECRET`).
2. Get 2LO token with `get_2lo_token`.
3. Upload and translate the model.
4. Keep translation URN in base64 (`viewer_urn`) for Model Derivative API calls.
5. Create `APSViewer` with the object/version URN.
6. Fetch viewables and pick first 3D view.
7. Fetch metadata viewables and pick 3D model GUID.
8. Fetch model properties and collect unique `externalId` values.
9. Build `highlight` list of `{externalElementId, color}`.
10. Apply highlights and call `viewer.show()`.

## Reference Snippet

```python
from typing import cast
import random

from aps_viewer_sdk import APSViewer, ElementsInScene
from aps_viewer_sdk.helper import (
    get_2lo_token,
    get_metadata_viewables,
    get_all_model_properties,
)

token = get_2lo_token(CLIENT_ID, CLIENT_SECRET)
viewer_urn = "..."  # base64 URN from translation step

viewer = APSViewer(
    urn=f"urn:adsk.objects:os.object:{bucket_key}/{object_key}",
    token=token,
    views_selector=True,
)

viewables = viewer.get_viewables(viewer_urn)
first_view = next(v for v in viewables if v.get("role") == "3d")
viewer.set_view_guid(first_view["guid"], first_view["name"], first_view["role"])

metadata_views = get_metadata_viewables(token, viewer_urn)
model_guid = next((v["guid"] for v in metadata_views if v.get("role") == "3d"), None)
if not model_guid:
    raise RuntimeError("No valid model GUID available")

payload: dict[str, object] = get_all_model_properties(token, viewer_urn, model_guid)
data_raw = payload.get("data")
data: dict[str, object] = cast(
    dict[str, object], data_raw if isinstance(data_raw, dict) else payload
)
collection = data.get("collection", [])

seen: set[str] = set()
external_ids: list[str] = []
for item in collection:
    ext = item.get("externalId")
    if isinstance(ext, str) and ext and ext not in seen:
        seen.add(ext)
        external_ids.append(ext)

rng = random.Random(0)
highlight: list[ElementsInScene] = []
for ext_id in external_ids:
    color = "#{:02x}{:02x}{:02x}".format(
        rng.randrange(256), rng.randrange(256), rng.randrange(256)
    )
    highlight.append({"externalElementId": ext_id, "color": color})

viewer.highlight_elements(highlight)
viewer.show()
```

## Troubleshooting

1. If `get_viewables` is empty, confirm translation completed successfully.
2. If metadata requests return `202`, rely on helper polling or retry.
3. If no IDs are highlighted, verify `collection[*].externalId` exists for selected model GUID.
4. If colors fail visually, enforce `#RRGGBB` format.
