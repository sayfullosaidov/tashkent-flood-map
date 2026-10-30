// ==========================================
// 1. REGION
// ==========================================
var region = ee.Geometry.Rectangle([
  69.13, 41.22,
  69.39, 41.41
]);

// ==========================================
// 2. POINTS
// ==========================================
var points = ee.FeatureCollection(
  'users/sayfullo/flood_events'
);

var pointsFixed = points.map(function(f) {

  var lon = ee.Number.parse(ee.String(f.get('Lon')));
  var lat = ee.Number.parse(ee.String(f.get('Lat')));
  var label = ee.Number.parse(ee.String(f.get('Flood_Label')));

  return ee.Feature(
    ee.Geometry.Point([lon, lat]),
    f.toDictionary()
  ).set('Flood_Label', label);

});

// ==========================================
// 3. FABDEM
// ==========================================

var fabdemCollection = ee.ImageCollection(
  'projects/sat-io/open-datasets/FABDEM'
)
.filterBounds(region)
.select('b1');

// Get native projection from a FABDEM tile
var fabdemProjection =
  ee.Image(fabdemCollection.first()).projection();

// Mosaic and restore native projection
var demRaw = fabdemCollection
  .mosaic()
  .setDefaultProjection(fabdemProjection)
  .rename('Elevation');

// Calculate terrain BEFORE clipping
var slopeRaw = ee.Terrain.slope(demRaw)
  .rename('Slope');

// Clip afterward
var dem = demRaw.clip(region);
var slope = slopeRaw.clip(region);

// ==========================================
// 4. TPI
// ==========================================
var neighborhoodMean = dem.focal_mean({
  radius: 1000,
  units: 'meters'
});

var tpi = dem
  .subtract(neighborhoodMean)
  .rename('TPI');

// ==========================================
// 5. LAND COVER
// ==========================================
var landcover = ee.ImageCollection(
  'ESA/WorldCover/v200'
)
.first()
.select('Map')
.clip(region)
.rename('LandCover');

// ==========================================
// 6. PREDICTOR STACK
// ==========================================
var predictors = dem
  .addBands(slope)
  .addBands(tpi)
  .addBands(landcover);

// ==========================================
// 7. EXPORT VARIABLES FOR OTHER SCRIPTS
// ==========================================
exports.region = region;
exports.pointsFixed = pointsFixed;

exports.dem = dem;
exports.slope = slope;
exports.tpi = tpi;
exports.landcover = landcover;

exports.predictors = predictors;
