# Border Distance Calculator

A working instance of this project is served at [twitchard.github.io/borderdistance](http://twitchard.github.io/borderdistance)

This project is a javascript application written with [sveltejs](https://svelte.technology) for calculating and comparing distances from geographic locations to the US-Canada border. Distances are determined by modeling the Earth as an oblate spheroid according to the specifications of the [WGS 84 standard](http://en.wikipedia.org/wiki/World_Geodetic_System). The project makes use of the [GeographicLib library](http://geographiclib.sourceforge.net/) by Charles Karney, and the [gmaps.js](http://hpneo.github.io/gmaps/) library by Gustavo Leon.

## To Build

Nodejs 6+ is required to build. If this is not the system nodejs, I recommend [nvm](https://github.com/creationix/nvm).

```sh
nvm use 6
npm install
npm run build
```

This will build the website into the `dist/` subdirectory. Serve the files there using any method of your liking. If you have python2, here is a one-liner

```sh
cd dist/
python2 -m SimpleHTTPServer 8000
```

## To use a different border

First, acquire GeoJSON describing the border that interests you. There are several countries in the public domain available at AshKyd's [geojson-regions](https://github.com/AshKyd/geojson-regions) project. Put it in maps/geojson/YOUR_MAP.json

You will then need to preprocess the geojson to calculate the border "segments" and their length. 

```sh
cat maps/geojson/YOUR_MAP.json | node scripts/process.js > maps/segments/YOUR_MAP.json
```

Then, modify the `PATH_TO_MAP` constant in `src/app.html` to point to `maps/segments/YOUR_MAP.json`. Build the project, and it should use the new map!
