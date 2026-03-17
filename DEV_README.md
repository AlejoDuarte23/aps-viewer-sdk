# Dev Notes

## Setup

Requires `uv`.

```bash
uv sync
uv sync --group test
uv run --group test pre-commit install
uv sync --group examples
```
This installs the Ruff hook at `.git/hooks/pre-commit` so formatted `.py` files run automatically.
The `examples` group is optional and is only needed for notebook flows that use `aps_automation_sdk`.

## Tests

```bash
uv run --group test pytest
```

## Examples

Example notebooks live in `example/`; sync the `examples` dependency group so the `.ipynb` dependencies are available.
If you open them in VS Code, install the IPyKernel you want to use before running cells.
Set `CLIENT_ID` and `CLIENT_SECRET` (e.g., with `CLIENT_ID = os.environ.get("CLIENT_ID")` and `CLIENT_SECRET = os.environ.get("CLIENT_SECRET")`) to authenticate APS services.

## Release

Create a version bump in `pyproject.toml`, push a tag like `v0.1.2`, and let the publish workflow build and upload the package.
