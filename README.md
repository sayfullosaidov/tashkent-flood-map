# Urban Flood Susceptibility Mapping in Tashkent using Earth Engine & Random Forest

## Overview
This repository contains geospatial scripts and observation datasets for mapping urban flood susceptibility across Tashkent, Uzbekistan. 

> **Scientific Distinction:** This model estimates **spatial flood susceptibility (probability)** based on geospatial predictor layers and historical flood observations. It is *not* a hydrodynamic/hydraulic model (does not calculate flow velocity or water depth).

---

## Datasets & Predictors

| Variable | Source | Resolution | Role |
| :--- | :--- | :--- | :--- |
| **Elevation & Slope** | FABDEM v1.0 | 30m | Terrain topography |
| **Precipitation** | NASA IMERG V06 | 0.1° (~10km) | Meteorological forcing |
| **Land Cover** | ESA WorldCover 2020 | 10m | Surface permeability |
| **Observations** | Geo-tagged field/social media data | Point | Target classes (1 = Flooded, 0 = Non-flooded) |

---

## How to Reproduce

### 1. Earth Engine Setup
1. Open the [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Import the modular scripts found in `gee_scripts/`.
3. Load your training table from the public asset or upload `data/flood_points_tashkent.csv` to your GEE Assets tab.

### 2. Running the Model
Run `03_random_forest.js` to execute the `ee.Classifier.smileRandomForest()` model and render the flood susceptibility raster map.

---

## Model Evaluation & Limitations
* **Validation:** Evaluated via out-of-bag error and cross-validation confusion matrices.
* **Limitations:** Spatial sampling bias in historical flood reports; coarse spatial resolution of IMERG rainfall data relative to local urban storm drains.
