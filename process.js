/**
 * process.js
 * Richard Marmorstein
 * June 2014
 *
 * When a shapefile is converted to GeoJSON there are a bunch of 'features',
 * which consist of collections of points. I'm not interested in the
 * distinction between different features, I just want the border. This
 * file takes all the features and turns them into a single array of
 * 'segment' objects that have a start coordinate, an end coordinate,
 * and also describes the distance between the two coordinates.

 */
run('geographiclib.js');
borderData = JSON.parse(snarf('border.json'));
var geod = GeographicLib.Geodesic.WGS84;
lines = [];
for (var i = 0; i < borderData.features.length; i++) {
  lines = lines.concat(borderData.features[i].geometry.coordinates);
};
segments = [];
for (var i = 1; i < lines.length; i++) {
  var segment = {'start': {'lat' : lines[i-1][1], 'lon' : lines[i-1][0]},
                 'end':   {'lat' : lines[i][1]  , 'lon' : lines[i][0]}};
  segment.distance = geod.Inverse(segment.start.lat, segment.start.lon,
                                  segment.end.lat, segment.end.lon).s12;
  segments.push(segment);
}

print("BorderDistance.segments = " + JSON.stringify(segments));


