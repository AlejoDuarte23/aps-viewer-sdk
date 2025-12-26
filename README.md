# APS Viewer SDK

[![PyPI version](https://badge.fury.io/py/aps-viewer-sdk.svg)](https://badge.fury.io/py/aps-viewer-sdk)
[![CI](https://github.com/AlejoDuarte23/aps-viewer-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/AlejoDuarte23/aps-viewer-sdk/actions/workflows/ci.yml)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Code style: ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Lightweight Python helper to render APS models in the browser with powerful built-in plugins for visualization and interaction.

## Features

### Core Viewer Capabilities
- 🎨 **Display Revit models** in the APS Viewer with full 3D/2D support
- 🔄 **View selector dropdown** to switch between available 3D and 2D views
- ✨ **Highlight and color elements** by `externalId` for visual analysis
- 🔌 **Extensible plugin system** for custom visualizations and interactions

### Built-in Plugins

The SDK includes three powerful plugins (from `aps_viewer_sdk.plugins`) for extending viewer functionality:

#### 1. Element Highlighting
Programmatically highlight and color model elements for visual analysis and QA/QC workflows.

![Highlight Elements](assets/example1.png)
*Color-code elements by properties, categories, or custom logic*

#### 2. OverlayMeshes Plugin
Add custom 3D geometries (boxes, cones, spheres, cylinders) overlaid on your model for context and visualization.

![Tree Overlays](assets/example2.png)
*Add trees, furniture, equipment, or any custom 3D objects to your scene*

**Key Features:**
- Add primitive shapes: `add_box()`, `add_cone()`, `add_sphere()`, `add_cylinder()`
- Position meshes at specific 3D coordinates
- Customize colors, opacity, and orientation
- Combine shapes to create complex objects

#### 3. Draw2DCircles Plugin
Enable interactive circle markers on 2D views for annotations and markup.

![2D Circle Markers](assets/example3.png)
*Click-to-place circle markers on floor plans, elevations, and sections*

**Key Features:**
- Interactive placement by clicking on 2D views
- Customizable radius and color
- Perfect for marking inspection points, issues, or locations of interest
- Works exclusively on 2D views (floor plans, elevations, sections)

## Use Cases
- **QA/QC filtering and visual inspection** - Color-code elements by validation status
- **Pre-processing for automation APIs** - Visualize data before processing
- **Context visualization** - Add trees, furniture, or site elements to architectural models
- **Interactive markup** - Annotate 2D drawings with circle markers
- **Integrations** with Model Properties API, Model Derivative, Data Exchange API, and AEC Data Model API

## Installation

### For Users

```bash
pip install aps-viewer-sdk
```

Or with `uv`:
```bash
uv add aps-viewer-sdk
```

### For Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/AlejoDuarte23/aps-viewer-sdk.git
cd aps-viewer-sdk
uv sync
uv sync --group test
```

## Quick Start

### Basic Viewer

```python
from aps_viewer_sdk import APSViewer
from aps_viewer_sdk.helper import get_2lo_token

token = get_2lo_token("CLIENT_ID", "CLIENT_SECRET")  # 2LO; 3LO tokens work too
viewer = APSViewer(
    urn="urn:...",  # ACC URNs work too
    token=token,
    views_selector=True,
)
viewer.show()
```

### Using Built-in Plugins

```python
from aps_viewer_sdk import APSViewer
from aps_viewer_sdk.plugins import OverlayMeshes
from aps_viewer_sdk.helper import get_2lo_token

token = get_2lo_token("CLIENT_ID", "CLIENT_SECRET")
viewer = APSViewer(urn="urn:...", token=token, views_selector=True)

# Add 3D tree meshes (see example #2)
trees = OverlayMeshes(scene_id="trees")
trees.add_box((0, 0, 5), size=(2, 10, 2), color="#8b5a2b")
trees.add_cone((0, 0, 15), radius=6, height=8, color="#2e8b57")
viewer.add_plugin(trees.spec())

viewer.show()
```

## Examples

The `example/` folder contains comprehensive Jupyter notebooks demonstrating all features.

**Setup for examples:**
```bash
# Clone the repository
git clone https://github.com/AlejoDuarte23/aps-viewer-sdk.git
cd aps-viewer-sdk

# Install dependencies including examples group
uv sync --group examples

# Create .env file with your APS credentials
cp .env.example .env
# Edit .env with your CLIENT_ID, CLIENT_SECRET, TEST_URN
```

### 1. Highlight Elements in Scene
`example/1 - highlight_elements_in_scene/color_elements_from_scene.ipynb`
- Upload and translate Revit models using `aps_automation_sdk`
- Extract element metadata and external IDs
- Color-code all elements with random colors
- Perfect for QA/QC and visual analysis workflows

### 2. Add 3D Meshes to Scene
`example/2 - add_meshes_to_scene/add_trees_to_scene.ipynb`
- Use the **OverlayMeshes plugin** to add custom 3D geometries
- Create stylized trees with boxes (trunks) and cones (canopy)
- Position and style custom meshes in 3D space
- Demonstrates combining primitive shapes into complex objects

### 3. Add 2D Circle Markers
`example/3 - add_circles_2d_view/add_circles_to_2d_view.ipynb`
- Use the **Draw2DCircles plugin** for interactive 2D annotations
- Click-to-place circle markers on floor plans and elevations
- Customize circle appearance (radius, color)
- Ideal for markup and inspection workflows

Each notebook includes detailed explanations, parameter documentation, and use case examples.

Each notebook includes detailed explanations, parameter documentation, and use case examples.
