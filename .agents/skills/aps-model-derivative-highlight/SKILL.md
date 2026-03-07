---
name: aps-model-derivative-highlight
description: "Integrate APS Model Derivative APIs with aps-viewer-sdk highlighting workflows. Use this skill when implementing the end-to-end flow from model translation to metadata/property retrieval and conversion of `externalId` values into `viewer.highlight_elements(...)` payloads, especially for notebook workflows like `example/1 - highlight_elements_in_scene/color_elements_from_scene.ipynb`."
---

# APS Model Derivative Highlight

Use this skill to build or debug the full translation-to-visualization pipeline for element highlighting.

## External Use

1. Source repository: `https://github.com/AlejoDuarte23/aps-viewer-sdk`
2. Install package: `pip install aps-viewer-sdk`
3. For the upload/translation portion of the flow, install `aps-automation-sdk`.

## Execute End-To-End Workflow

1. Prepare credentials and input file.
- Require `CLIENT_ID` and `CLIENT_SECRET`.
- Load environment variables from `.env` when present.

2. Authenticate and translate.
- Get an access token with `get_2lo_token(...)`.
- Upload the source model and request translation (for example via `aps_automation_sdk.translate_file_in_oss`).
- Keep the returned base64 URN (`viewer_urn`) for metadata/property calls.

3. Initialize APSViewer for browser rendering.
- Create `APSViewer` with the object URN and token.
- Enable `views_selector=True` for interactive view switching.

4. Resolve usable 3D view and metadata GUID.
- Use `viewer.get_viewables(viewer_urn)` and select a 3D entry.
- Apply `viewer.set_view_guid(...)`.
- Use `get_metadata_viewables(token, viewer_urn)` and select the model GUID for properties.

5. Extract and map element identifiers.
- Call `get_all_model_properties(token, viewer_urn, model_guid)`.
- Read `data.collection[*].externalId`.
- De-duplicate IDs before building highlight payloads.

6. Render highlighted output.
- Build `ElementsInScene` items with `externalElementId` and `#RRGGBB` color.
- Call `viewer.highlight_elements(highlight_list)`.
- Use `viewer.show()` for interactive validation.

## Apply Guardrails

1. Keep URN formats separated:
- Use base64 URN for Model Derivative metadata/property endpoints.
- Use object/version URN when constructing `APSViewer`.

2. Fail fast on empty lists:
- Raise clear errors for missing viewables, missing metadata views, or missing `externalId` values.

3. Preserve payload contract:
- Highlight entries must use exact keys `externalElementId` and `color`.
- Colors must be valid hex strings.

## Use Repository References

Read `references/model-derivative-highlight-workflow.md` for the concrete notebook-aligned sequence and troubleshooting checklist.
