'use strict'
const GeographicLib = require('geographiclib')
const _             = require('lodash')
const minimize      = require('./newtonsmethod').minimize

const earth = GeographicLib.Geodesic.WGS84

/**
 * Overview of how this function operates mathematically:
 *
 * It takes a series of n + 1 points defining, e.g., the US-Canada border.
 * The border is formed by the n paths on the surface of the Earth which
 * connect the points. These paths are not strictly speaking 'line segments' 
 * because the surface of the earth is not a plane. They are 'geodesics'.
 *
 * The user will provide a third point b on the surface of the Earth. I
 * need to find the length of the path between b and the nearest point on
 * the border. To do this, I can find the shortest path between b and each
 * of the n geodesics, and then find the minimum length of those n paths.
 *
 * But how to find the shortest path between a point and a geodesic?
 * GeographicLib provides a function for finding the shortest path
 * between a point and another point--but a geodesic contains infinitely
 * many points. How do I find the point nearest to b?
 *
 * I make an assumption that the distance to b as you travel along 
 * a geodesic is twice-differentiable, and has one critical point--the global
 * minimum. Disclaimer: I don't have the background in geodesy to prove this,
 * but it seems intuitive.
 *
 * This assumption allows me to use Newton's method to find the point on a
 * geodesic which minimizes distance to b. So then I do this for all n
 * geodesics between the border points, and then I find the smallest distance
 * of all that list, and that identifies the point on the border closest to b.
 *
 * But Newton's method is expensive, so I eliminate some geodesics from
 * consideration. If li is the length of geodesic i, and si is one of the ends
 * of the geodesic, then d(b, si) - li is a lower bound for the distance
 * from b to the closest point on the geodesic. Therefore, if we have
 * already found a geodesic closer than d(b, si) - li then there is no need
 * to consider i.  For example, suppose I'm going through the n geodesics
 * and I've found one that's 60km away from the border. That means if I
 * come across a geodesic that is 10km long, but one of its ends is 80km
 * from b. Then no point on the geodesic can be closer than 70km, and
 * there's no possible way this geodesic can be the closest one, so I can
 * simply forget about it and I don't have to run Newton's method or
 * anything on it.  Actually what I do is I sort all the geodesics by their
 * lower bound and I start at the bottom, so once I reach a point where the
 * closest distance of a geodesic that I've already calculated is lower
 * than the lower bound of the next geodesic, then I can terminate.
 * 
 * @param segments
 *   Array of 'segments' defining the border of some geographical region.
 *   Must be of at least length 1.
 *   Each element should be a javascript object bearing the properties:
 *     .start.lat
 *     .start.lon
 *     .end.lat
 *     .end.lon
 *     .distance
 * @param latb
 *   Latitude of the point which we are finding the shortest distance
 *   between that point and the border defined by 'segments'.
 * @param lonb
 *   Longitude of the point which we are finding the shortest distance
 *   between that point and the border defined by 'segments'.
 * @return
 *   Returns an object bearing the properties:
 *     .point.lat - latitude of the closest point on the border to 'b'
 *     .point.lon - longitude of the closest point on the border to 'b'
 *     .distance - distance (in km) between 'b' and the closest point.
 *      
 */
function distanceToBorder (segments, latb, lonb) {
    // Calculate and sort segments by a lower bound for how close the
    // segment is to point 'b'.
    segments = _(segments)
        .map((segment) => {
            return _.assign(_.cloneDeep(segment), {
                lowerBound: distanceBetween(
                    segment.end.lat,
                    segment.end.lon,
                    latb,
                    lonb
                ) - segment.distance
            })
        })
        .sortBy((segment) => segment.lowerBound)
        .value()

    // What is the closest point on the segment to point 'b'?
    const closestOnSegment = (segment) => {
        return closestToGeodesic(
            latb,
            lonb,
            segment.start.lat,
            segment.start.lon,
            segment.end.lat,
            segment.end.lon
        )
    }

    let closestSoFar = closestOnSegment(segments[0])
    let closestSegment = segments[0]
    for (let i = 1; i < segments.length; i++) {
        const segment = segments[i]
        
        // Terminate if this segment (and, since our list is sorted,
        // all subsequent segments) cannot possibly be closer to
        // 'b' than the closest point we have found so far.
        if (segment.lowerBound > closestSoFar.distance) {
            break
        }

        // Otherwise, find the closest point to b
        const result = closestOnSegment(segment)
        if (result.distance < closestSoFar.distance) {
            closestSoFar = result
            closestSegment = segments[i]
        }
    }
    return closestSoFar
}
exports.distanceToBorder = distanceToBorder

/** 
 * Distance between two points defined by latitude and longitude.
 * Simply a wrapper around the GeographicLib's 'Inverse' function.
 */
function distanceBetween (lata, lona, latb, lonb) {
    return earth.Inverse(
        lata,
        lona,
        latb,
        lonb
    ).s12
}

/**
 * Finds an intermediate point between a1 and a2 which is a fraction,
 * alpha, of the distance from a1 to a2.
 */
function linearCombination (lata1, lona1, lata2, lona2, alpha) {
    const path = earth.Inverse(lata1, lona1, lata2, lona2)
    const line = new GeographicLib.GeodesicLine.GeodesicLine(
        earth,
        lata1,
        lona1,
        path.azi1
    )
    const vals = line.GenPosition(
        true,
        path.a12 * alpha,
        GeographicLib.Geodesic.LATITUDE | GeographicLib.Geodesic.LONGITUDE
    )
    return [vals.lat2, vals.lon2]
}

/**
 * Finds the point on the geodesic between a1 and a2 that is closest to 'b'.
 */
function closestToGeodesic (latb, lonb, lata1, lona1, lata2, lona2) {
    const f = (alpha) => {
        const point = linearCombination(lata1, lona1, lata2, lona2, alpha)
        const ret =  distanceBetween(point[0], point[1], latb, lonb)
        return ret
    }
    const alpha = minimize(f, 0.5)

    // Convergence might not occur, and may not determine the minimum.
    // So, compare against the endpoints.
    const candidates = [[lata1, lona1],[lata2, lona2]]
    if (alpha > 0 && alpha < 1) {
        candidates.push(linearCombination(
            lata1, lona1, lata2, lona2, alpha
        ))
    }

    const closestPoint = _.minBy(candidates, (point) => {
        return distanceBetween(point[0], point[1], latb, lonb)
    })

    return {
        distance: distanceBetween(closestPoint[0], closestPoint[1], latb, lonb),
        point: closestPoint
    }
}
exports.closestToGeodesic = closestToGeodesic

const MAX_GAP = 35;
const MAX_POINTS = 1000;

function pathBetween (lata, lona, latb, lonb) {
    const line = earth.InverseLine(lata, lona, latb, lonb)
    const path = []
    for (let i = 0; i < line.s13; i += 5000) {
        path.push(earth.Direct(line.lat1, line.lon1, line.azi1, i))
    }
    const ret = path.map(x => {
        return [x.lat2, x.lon2]
    })
    return ret
}
exports.pathBetween = pathBetween
