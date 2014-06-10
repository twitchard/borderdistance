borderdistance
==============
This project is a javascript application for calculating and comparing distances from geographic locations to the US-Canada border.

To Deploy
========
Simply put index.html, borderdistance.js, gmaps.js, geographiclib.js, and borderSegments.js in the same directory on a web server, and the application will be fully functional.

Using a different border
=======
You might be interested in looking at the distance to something other than the US-Canada border. In that case, what you have to do is simply replace the borderSegments.js file with a correcly formatted borderSegments.js file that defines your border of interest instead of the US-Canada one. How to get a correctly formatted borderSegments.js file? Well you need to define your object in GeoJSON format. I originally attained the US-Canada border from a shapefile provided by nationalatlas.gov providing boundaries for all of North America, but I used an application called qgis to select the subset of 'features' in the shapefile that belonged to both the US and Canada, and also to convert to GeoJSON format.

After you have your border in GeoJSON format, put it in a file called "border.json" in the same directory as "process.js". The "process.js" is intended to be run as command-line javascript, and outputs a correctly formatted "borderSegments.js" file to standard output. For example

    js process.js > borderSegments_new.js

will generate a correctly formatted file called borderSegments\_new.js

