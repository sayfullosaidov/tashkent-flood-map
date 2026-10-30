// =====================================================
// 1. IMPORT DATA + SAME TRAIN/TEST SPLIT
// =====================================================

var data = require(
  'users/sayfullo/tashkent_flood_map:03_preparation/data-predict-prep'
);

var split = require(
  'users/sayfullo/tashkent_flood_map:03_preparation/train-test-split'
);

var region = data.region;

var training = split.training;
var testing = split.testing;


// =====================================================
// 2. TRAINING-SET MEAN + SD
// IMPORTANT: calculate from TRAINING only
// =====================================================

var elevMean = training.aggregate_mean('Elevation');
var elevSD   = training.aggregate_total_sd('Elevation');

var slopeMean = training.aggregate_mean('Slope');
var slopeSD   = training.aggregate_total_sd('Slope');

var tpiMean = training.aggregate_mean('TPI');
var tpiSD   = training.aggregate_total_sd('TPI');

print('Elevation mean/sd:', elevMean, elevSD);
print('Slope mean/sd:', slopeMean, slopeSD);
print('TPI mean/sd:', tpiMean, tpiSD);


// =====================================================
// 3. STANDARDIZE FEATURE COLLECTION
// =====================================================

function standardizeFeature(f) {

  var zElevation = ee.Number(f.get('Elevation'))
    .subtract(elevMean)
    .divide(elevSD);

  var zSlope = ee.Number(f.get('Slope'))
    .subtract(slopeMean)
    .divide(slopeSD);

  var zTPI = ee.Number(f.get('TPI'))
    .subtract(tpiMean)
    .divide(tpiSD);

  return f.set({
    zElevation: zElevation,
    zSlope: zSlope,
    zTPI: zTPI
  });
}

var trainingZ = training.map(standardizeFeature);
var testingZ = testing.map(standardizeFeature);


// =====================================================
// 4. STANDARDIZE MAP PREDICTORS
// using SAME mean/sd as training data
// =====================================================

var zElevation = data.dem
  .subtract(ee.Number(elevMean))
  .divide(ee.Number(elevSD))
  .rename('zElevation');

var zSlope = data.slope
  .subtract(ee.Number(slopeMean))
  .divide(ee.Number(slopeSD))
  .rename('zSlope');

var zTPI = data.tpi
  .subtract(ee.Number(tpiMean))
  .divide(ee.Number(tpiSD))
  .rename('zTPI');

var svmPredictors = zElevation
  .addBands(zSlope)
  .addBands(zTPI);


// =====================================================
// 5. SVM
// =====================================================

var svm = ee.Classifier.libsvm({
  svmType: 'C_SVC',
  kernelType: 'RBF',
  cost: 10,
  gamma: 0.5
})
.train({
  features: trainingZ,
  classProperty: 'Flood_Label',
  inputProperties: [
    'zElevation',
    'zSlope',
    'zTPI'
  ]
});


// =====================================================
// 6. VALIDATION
// =====================================================

var validated = testingZ.classify(svm);

var cm = validated.errorMatrix(
  'Flood_Label',
  'classification'
);

print('SVM Confusion Matrix:', cm);
print('SVM Accuracy:', cm.accuracy());
print('SVM Kappa:', cm.kappa());
print('SVM Recall:', cm.producersAccuracy());
print('SVM Precision:', cm.consumersAccuracy());


// =====================================================
// 7. MAP
// =====================================================

var svmMap = svmPredictors
  .classify(svm)
  .clip(region);

Map.centerObject(region, 10);

Map.addLayer(
  svmMap,
  {
    min: 0,
    max: 1,
    palette: ['006400', 'FF0000']
  },
  'Standardized SVM'
);
