---
name: aps-viewer-basic
description: "Build and fix basic APS Viewer SDK flows: load a translated model, show available views, choose a target 2D/3D view, and highlight elements by externalId. Use this skill when working with APSViewer initialization, `highlight_elements`, `set_view_guid`, `write`, or `show`."
---

# APS Viewer Basic

Use this skill to implement the default workflow in this repository without touching custom plugin internals.

## External Use

1. Source repository: `https://github.com/AlejoDuarte23/aps-viewer-sdk`
2. Install package: `pip install aps-viewer-sdk`
3. For translation/upload helpers used in notebooks, also install and configure `aps-automation-sdk`.

## Execute Core Workflow

1. Prepare valid inputs.
- Require `urn` and `token`.
- Treat `urn` as a version URN (`urn:...`) or already-base64 value.

2. Initialize the viewer.
- Create `APSViewer(urn=..., token=..., views_selector=True)` for default behavior.
- Set `views_selector=False` only when a fixed view is required.

3. Select a view only when needed.
- Keep automatic selection when any view is acceptable.
- Use `set_view_guid(guid, name, role)` when a specific 2D/3D view is required.
- Use `viewer.get_viewables(to_md_urn(urn))` to inspect available views.

4. Highlight elements by externalId.
- Build a list with this exact shape:
```python
[{"externalElementId": "some-external-id", "color": "#ff0000"}]
```
- Pass it to `viewer.highlight_elements(...)`.
- Use `#RRGGBB` colors.

5. Render output.
- Use `viewer.write()` when HTML needs to be inspected, tested, or embedded.
- Use `viewer.show()` when opening the generated HTML in a browser is desired.

## Apply Guardrails

1. Preserve repository API names and payload keys exactly (`externalElementId`, `color`, `guid`, `role`).
2. Avoid changing plugin internals in this skill; hand off to advanced skill for extension logic.
3. Keep examples aligned with existing tests under `tests/unit` and `tests/integration`.

## Use Repository References

Read `references/basic-workflows.md` for copy-paste-safe patterns and troubleshooting steps.
