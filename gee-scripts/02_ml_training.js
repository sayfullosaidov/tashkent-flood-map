var data = require(
  'users/sayfullo/tashkent_flood_map:03_preparation/data-predict-prep'
);

var predictors = data.predictors;
var pointsFixed = data.pointsFixed;

// ==========================================
// SAMPLE PREDICTORS AT POINTS
// ==========================================
var samples = predictors.sampleRegions({
  collection: pointsFixed,
  properties: ['Flood_Label'],
  scale: 30,
  geometries: true
});

// ==========================================
// SPLIT FLOOD / NON-FLOOD
// ==========================================
var flood = samples
  .filter(ee.Filter.eq('Flood_Label', 1))
  .randomColumn('random', 42);

var nonFlood = samples
  .filter(ee.Filter.eq('Flood_Label', 0))
  .randomColumn('random', 42);

// ==========================================
// 70 / 30 SPLIT
// ==========================================
var floodTrain =
  flood.filter(ee.Filter.lt('random', 0.7));

var floodTest =
  flood.filter(ee.Filter.gte('random', 0.7));

var nonFloodTrain =
  nonFlood.filter(ee.Filter.lt('random', 0.7));

var nonFloodTest =
  nonFlood.filter(ee.Filter.gte('random', 0.7));

var training =
  floodTrain.merge(nonFloodTrain);

var testing =
  floodTest.merge(nonFloodTest);

// ==========================================
// EXPORT TO OTHER SCRIPTS
// ==========================================
exports.training = training;
exports.testing = testing;
exports.samples = samples;
