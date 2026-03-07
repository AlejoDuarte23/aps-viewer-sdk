# Advanced Workflows

## Compose Multiple Plugins

```python
from aps_viewer_sdk import APSViewer
from aps_viewer_sdk.plugins import Draw2DCircles, Draw3DSpheres, OverlayMeshes

viewer = APSViewer(urn="urn:...", token="token", views_selector=True)

trees = OverlayMeshes(scene_id="trees")
trees.add_box((0, 0, 5), size=(2, 10, 2), color="#8b5a2b", align_to_world_up=True)
trees.add_cone((0, 0, 15), radius=6, height=8, color="#2e8b57", align_to_world_up=True)

viewer.add_plugin(trees.spec())
viewer.add_plugin(Draw2DCircles(initial_radius=1.0, color="#ff8800").spec())
viewer.add_plugin(Draw3DSpheres(initial_radius=0.75, color="#0066ff").spec())

html = viewer.write()
```

## Build Deterministic Overlay Scenes

1. Reuse one `scene_id` for related objects.
2. Keep object coordinates explicit and numeric.
3. Use constants for colors/radius/segments when tests assert HTML serialization.
4. Prefer adding geometry through `OverlayMeshes` methods instead of writing raw options.

## Validate Plugin Serialization

Check generated HTML for:

1. Expected extension IDs:
- `My.OverlayMeshes`
- `My.CircleMarkers`
- `My.SphereMarkers`

2. Expected `only2d` flags per plugin.
3. Expected options JSON keys (`items`, `initialRadius`, `color`).
4. No remaining template placeholders (`PLUGINS_PLACEHOLDER`, `PLUGINS_JS_PLACEHOLDER`).

## Debug Checklist

1. If plugin does not activate, verify `extension_id` in Python matches JS extension registration.
2. If plugin appears but does nothing, inspect options key names and types (`float`, `bool`, `str`).
3. If behavior differs across 2D/3D, verify plugin `only_2d` and chosen view role.
