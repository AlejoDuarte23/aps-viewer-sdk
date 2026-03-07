---
name: aps-viewer-advanced
description: "Build and debug advanced APS Viewer SDK integrations, including plugin composition, custom 2D/3D interaction tools, and overlay scene generation. Use this skill when working with `aps_viewer_sdk.plugins`, plugin `spec()` payloads, JS extension injection, or multi-plugin viewer setups."
---

# APS Viewer Advanced

Use this skill to implement complex Viewer behavior while preserving the repository's plugin contract.

## External Use

1. Source repository: `https://github.com/AlejoDuarte23/aps-viewer-sdk`
2. Install package: `pip install aps-viewer-sdk`
3. Use the public plugin API from `aps_viewer_sdk.plugins` (`OverlayMeshes`, `Draw2DCircles`, `Draw3DSpheres`).

## Execute Plugin Workflow

1. Choose the correct plugin path.
- Use `OverlayMeshes` for programmatic 3D objects in a custom scene.
- Use `Draw2DCircles` for interactive markup in 2D views.
- Use `Draw3DSpheres` for interactive placement in 3D views.
- Create a custom plugin only when built-in plugins are insufficient.

2. Build plugin specs through class APIs.
- Create plugin instances and call `.spec()`.
- Register with `viewer.add_plugin(plugin.spec())`.
- Keep returned `PluginSpec` fields consistent: `extension_id`, `only_2d`, `options`, `js_content`.

3. Compose advanced scenes deterministically.
- Group mesh items under a stable `scene_id`.
- Add primitives with explicit coordinates and dimensions.
- Use stable color constants when testability matters.

4. Verify plugin injection in generated HTML.
- Confirm placeholders are replaced (`PLUGINS_PLACEHOLDER`, `PLUGINS_JS_PLACEHOLDER` absent).
- Confirm extension IDs and serialized options appear in HTML.
- Confirm extension JS is present when debugging runtime load failures.

## Apply Advanced Guardrails

1. Preserve extension IDs used by this repository:
- `My.OverlayMeshes`
- `My.CircleMarkers`
- `My.SphereMarkers`

2. Keep `only_2d=True` for 2D-only interaction plugins.
3. Preserve option key names expected by JS (`initialRadius`, `color`, mesh item fields).
4. Avoid direct template edits unless plugin registration behavior cannot be solved in Python.

## Use Repository References

Read `references/advanced-workflows.md` for concrete composition patterns and debugging checks.
