'use strict'
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
const earth = require('geographiclib').Geodesic.WGS84
const _ = require('lodash')

function readFromStdin (callback) {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('readable', () => {
        const chunk = process.stdin.read()
        if (chunk !== null) {
            data += chunk
        }
    })
    process.stdin.on('end', () => {
        return callback(null, data)
    })
}

function polygonToPaths (polygon) {
    // According to the GeoJSON spec, a "Polygon" is a list of coordinate
    // arrays. For each coordinate array, the first coordinate is equal
    // to the last coordinate. The first coordinate array is equal to the
    // exterior boundary of the polygon, and subsequent coordinate arrays
    // determine "holes" in the polygon. 
    //
    // If we excluded holes, we couldn't find the distance to South Africa
    // from a location inside Lesotho, or the distance to Italy from
    // Vatican city, for example.

    return _(polygon)
        .map((coordinateArray) => {
            // [a, b, c, d] -> [[a, b], [b, c], [c, d]]
            const coords = _.initial(_.zip(coordinateArray, _.tail(coordinateArray)))
            return _.map(coords, (coord) => {
                const ret = {
                    start: {
                        lat: coord[0][1],
                        lon: coord[0][0]
                    },
                    end: {
                        lat: coord[1][1],
                        lon: coord[1][0]
                    }
                }
                ret.distance = earth.Inverse(
                    ret.start.lat,
                    ret.start.lon,
                    ret.end.lat,
                    ret.end.lon
                ).s12
                return ret
            })
        })
        .flatten()
        .value()
}
function main () {
    readFromStdin((err, data) => {
        if (err) return console.error(err)
        try {
            data = JSON.parse(data)
        } catch (e) {
            console.error('There was an error parsing JSON from standard input')
            console.error(e)
            process.exit(1)
        }
        const polygons = data[0].geometry.coordinates
        const ret = _(polygons).map(polygonToPaths).flatten()
        console.log(JSON.stringify(
            ret,
            null,
            2
        ))
    })
}
main()



