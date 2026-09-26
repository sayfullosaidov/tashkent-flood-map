# Tashkent Urban Flood Susceptibility Mapping

Machine-learning-based **urban flood susceptibility mapping for Tashkent, Uzbekistan** using historical flood observations, open geospatial data, Google Earth Engine (GEE), Random Forest, and Support Vector Machine.

## Project Goal

The goal of this project is to identify areas of Tashkent whose environmental characteristics are similar to locations where flooding has historically been observed.

This is a **flood susceptibility model**, not a hydraulic flood simulation or real-time flood forecasting system.

The model does **not** predict:

- flood depth;
- water velocity;
- exact flood extent during a storm;
- whether a specific location will flood during a particular future rainfall event.

Instead, it estimates **relative spatial susceptibility**.

---

## Flood Inventory

Historical flood locations were collected manually from publicly available sources including:

- local news reports;
- Telegram channels;
- photographs and videos;
- emergency and public-information reports.

Locations were manually geolocated using roads, intersections, buildings, landmarks, and surrounding infrastructure.

The current dataset contains:

```text
11 documented flood locations
22 pseudo-non-flood locations
33 total samples
```

The target variable is:

```text
Flood_Label = 1 → documented flood location
Flood_Label = 0 → pseudo-non-flood location
```

Multiple reports describing the same flood event are not treated as separate independent events.

---

## Pseudo-Non-Flood Points

A location without a flood report cannot automatically be considered a confirmed non-flood location.

For this reason, the negative samples are referred to as **pseudo-non-flood points**.

Candidate pseudo-non-flood locations were selected using a **Gazeta.uz flood-report heatmap covering approximately 2021–2023**. Locations without recorded flood heatmap signals were used as candidate negative samples and distributed across the study area.

Therefore:

> `Flood_Label = 0` means that no documented flood signal was identified in the reference data — not that the location has never flooded.

This is one of the main uncertainties in the project.

**TODO:** Add the relevant Statistics Agency article/citation here if it is used to justify population distribution, urban coverage, or another part of the pseudo-non-flood sampling strategy.

---

## Predictor Variables

The current predictor stack contains four variables:

| Predictor | Source |
|---|---|
| Elevation | FABDEM |
| Slope | Derived from FABDEM |
| Topographic Position Index (TPI) | Derived from FABDEM |
| Land Cover | ESA WorldCover |

### Topographic Position Index

TPI measures whether a location is higher or lower than its surrounding terrain.

```text
TPI = pixel elevation - mean surrounding elevation
```

Interpretation:

```text
TPI < 0  → lower than surrounding terrain
TPI ≈ 0  → similar elevation to surroundings
TPI > 0  → higher than surrounding terrain
```

The current implementation uses a **1000 m neighborhood radius**.

This radius is currently an experimental modeling choice and may be tested against other neighborhood scales later.

---

## Why Rainfall Is Not Currently Included

Rainfall is clearly a major trigger of urban flooding, but this project currently focuses on **spatial susceptibility** rather than event-specific flood prediction.

The flood inventory contains observations from different dates and years.

Correctly incorporating rainfall would require matching each individual flood event with variables such as:

- rainfall intensity;
- storm accumulation;
- storm duration;
- antecedent rainfall.

Using one rainfall layer for all observations would not correctly represent the conditions associated with different historical events.

There is also a spatial-resolution issue. Satellite rainfall datasets such as **GSMaP** and **IMERG** are relatively coarse compared with the street-scale flooding being studied.

For these reasons, rainfall is left for future work rather than included in a way that could imply unrealistic spatial precision.

---

## Machine-Learning Workflow

```text
Flood + pseudo-non-flood observations
                ↓
       Geospatial predictors
                ↓
      Extract predictor values
                ↓
         Train / test split
                ↓
        Machine-learning
          ↙          ↘
 Random Forest       SVM
          ↓          ↓
        Validation
                ↓
   Flood susceptibility map
```

Predictor values are extracted automatically in Google Earth Engine at the sample locations.

They therefore do not need to be entered manually into the original flood-inventory spreadsheet.

---

## Train / Test Split

Flood and pseudo-non-flood observations are split separately before being merged.

The current workflow uses approximately:

```text
70% training
30% testing
```

A fixed random seed is used:

```text
seed = 42
```

One current split contains:

```text
23 training samples
10 testing samples
```

The same train/test split is reused when comparing Random Forest and SVM so that the comparison is based on the same observations.

---

## Random Forest

Random Forest is an ensemble machine-learning algorithm made up of many decision trees.

The current model uses:

```text
200 trees
seed = 42
```

Each tree learns relationships between the predictor variables and `Flood_Label`, and the predictions from the trees are combined.

The Random Forest model is also run in probability mode, producing values approximately between:

```text
0 → lower susceptibility
1 → higher susceptibility
```

These probabilities are mapped across Tashkent to produce the susceptibility surface.

Random Forest variable importance is also examined, but feature importance should **not** be interpreted as statistical significance or proof of physical causation.

---

## Support Vector Machine

Support Vector Machine is tested as a second classification method.

Unlike Random Forest, SVM is sensitive to differences in predictor scale.

Continuous variables such as:

- elevation;
- slope;
- TPI

are therefore standardized before SVM training.

Importantly, the scaling statistics are calculated using the **training data only** to avoid leaking information from the test dataset into the model.

Using the same observations and train/test split allows the project to compare how different machine-learning methods behave on the same dataset.

---

## Validation

Model performance is evaluated using:

- confusion matrix;
- accuracy;
- precision;
- recall;
- Cohen's kappa.

For the binary classification problem:

```text
[[TN, FP],
 [FN, TP]]
```

where:

```text
TN = correctly predicted pseudo-non-flood
FP = pseudo-non-flood predicted as flood
FN = documented flood predicted as non-flood
TP = correctly predicted flood
```

Because only a small number of observations are available, these validation metrics are treated as **exploratory rather than definitive**.

A change in the classification of only one or two test samples can noticeably change the reported accuracy, recall, or precision.

---

## Main Limitations

### Small Flood Inventory

Only **11 documented flood locations** are currently available.

This means that:

- validation results are unstable;
- individual samples can strongly affect performance metrics;
- variable importance may change;
- the models have relatively few positive examples from which to learn.

At the current stage, increasing the historical flood inventory is likely more useful than extensive hyperparameter tuning.

### Pseudo-Non-Flood Uncertainty

No recorded flood does not necessarily mean no flood occurred.

Some pseudo-non-flood points may therefore represent undocumented flood locations.

### Reporting Bias

News and social-media-derived flood observations are more likely to represent:

- busy roads;
- populated locations;
- visually dramatic flooding;
- areas receiving greater media attention.

### Temporal Differences

Flood observations were collected from multiple years, while the predictor layers mostly represent the urban landscape as a relatively static system.

### Missing Drainage Infrastructure

Detailed information about:

- storm drains;
- sewer networks;
- culverts;
- drainage capacity;
- blocked drains;
- maintenance conditions

is not currently available at the required scale.

These factors may strongly influence urban flooding.

### Spatial Resolution

Global geospatial datasets cannot fully reproduce street-level drainage conditions.

The susceptibility map should therefore not be interpreted as having greater physical precision than its input datasets.

---

## Current Status

- [x] Build historical flood inventory
- [x] Geolocate documented flood locations
- [x] Select pseudo-non-flood locations
- [x] Prepare FABDEM elevation
- [x] Derive slope
- [x] Derive TPI
- [x] Add ESA WorldCover land cover
- [x] Create predictor stack in GEE
- [x] Create reproducible train/test split
- [x] Implement Random Forest
- [x] Implement SVM
- [x] Generate preliminary susceptibility maps
- [x] Calculate preliminary validation metrics
- [ ] Expand historical flood inventory

---

## Future Improvements

Potential next steps include:

- collecting additional historical flood observations;
- improving pseudo-non-flood sampling;
- using repeated or cross-validation approaches;
- testing different TPI neighborhood sizes;
- adding flow accumulation or drainage-related variables;
- adding impervious-surface information;
- obtaining stormwater drainage data;
- improving categorical land-cover handling;
- investigating event-specific rainfall;
- comparing additional machine-learning algorithms.

---

## Tools and Data

- Google Earth Engine
- JavaScript
- FABDEM
- ESA WorldCover
- Random Forest
- Support Vector Machine
- manually collected historical flood observations
- publicly available news and Telegram reports

---

## Interpretation

The final map represents **relative flood susceptibility**.

A high-susceptibility location means that its modeled environmental characteristics are relatively similar to the characteristics associated with documented flood locations.

It does **not** mean that the location will definitely flood.

Likewise, a low-susceptibility location should not be interpreted as guaranteed to remain flood-free.

---

## Disclaimer

This project is intended for **educational, exploratory, and portfolio purposes**.

The susceptibility maps should not be used for emergency planning, engineering design, insurance decisions, or official flood-risk assessment.
