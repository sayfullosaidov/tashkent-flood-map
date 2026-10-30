var data = require(
  'users/sayfullo/tashkent_flood_map:03_preparation/data-predict-prep'
);

var split = require(
  'users/sayfullo/tashkent_flood_map:03_preparation/train-test-split'
);

var predictors = data.predictors;
var region = data.region;

var training = split.training;
var testing = split.testing;

// ==========================================
// RANDOM FOREST — VALIDATION MODEL
// ==========================================
var rfClassifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 200,
  seed: 42
})
.train({
  features: training,
  classProperty: 'Flood_Label',
  inputProperties: predictors.bandNames()
});

// ==========================================
// VALIDATION
// ==========================================
var validated = testing.classify(rfClassifier);

var confusionMatrix = validated.errorMatrix(
  'Flood_Label',
  'classification'
);

print('Confusion Matrix:', confusionMatrix);
print('Accuracy:', confusionMatrix.accuracy());
print('Kappa:', confusionMatrix.kappa());

print(
  'Recall:',
  confusionMatrix.producersAccuracy()
);

print(
  'Precision:',
  confusionMatrix.consumersAccuracy()
);

// ==========================================
// PROBABILITY MODEL
// ==========================================
var rfProbability = ee.Classifier.smileRandomForest({
  numberOfTrees: 200,
  seed: 42
})
.setOutputMode('PROBABILITY')
.train({
  features: training,
  classProperty: 'Flood_Label',
  inputProperties: predictors.bandNames()
});

// ==========================================
// SUSCEPTIBILITY MAP
// ==========================================
var susceptibility = predictors
  .classify(rfProbability)
  .clip(region);

// ==========================================
// DISPLAY
// ==========================================
Map.centerObject(region, 10);

Map.addLayer(
  susceptibility,
  {
    min: 0,
    max: 1,
    palette: [
      '006400', // green
      '7FFF00', // light green
      'FFFF00', // yellow
      'FFA500', // orange
      'FF0000'  // red
    ]
  },
  'RF Flood Susceptibility'
);

// ==========================================
// VARIABLE IMPORTANCE
// ==========================================
print(
  'RF Variable Importance:',
  rfClassifier.explain()
);
