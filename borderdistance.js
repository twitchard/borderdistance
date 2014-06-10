/** 
 * borderdistance.js
 * Richard Marmorstein
 * June 2014
 * 
 * This software is released into the Public Domain. For more information
 * see UNLICENSE.TXT.
 *
 * I make use of Charles Karney's GeographicLib, and the javascript file
 * is included with this application. That library is released under the
 * MIT/X11 license.
 *
 * This .js file assumes the existence of a variable named segments which
 * contains an array of objects representing line segments. Each segment
 * object should have a 'start' property and an 'end' property, which in turn 
 * should have a 'lon' and 'lat' property defining geographic coordinates.
 * Each segment should also have a 'distance' property, defining the
 * geodesic distance between the 'start' segment and the 'end' segment.
 */

var BorderDistance = BorderDistance || {};
;(function (BorderDistance, undefined) {
    /** Here is an outline of the geometric problem I have to solve and my
     * solution. I have a series of n + 1 points defining the US-Canada border.
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
     * I make an unwarranted assumption that the distance to b as you travel along 
     * a geodesic is twice-differentiable, and has one critical point--the global
     * minimum. I don't have the background in geodesy to prove this, but it
     * seems likely to hold in at least most cases. I'm an economist, not a
     * mathematician. In economics, if you'd like something to be true you just
     * assume it.
     *
     * This assumption allows me to use Newton's method to find the point on a
     * geodesic which minimizes distance to b. So then I do this for all n
     * geodesics between the border points, and then I find the smallest distance
     * of all that list, and that identifies the point on the border closest to b.
     *
     * Except, I lied. I actually don't do that. For me, n was really big (more than
     * a thousand) and it was taking forever to run. I don't want to do Newton's
     * method on all 1000 geodesics, so I wanted some method of eliminating some
     * from consideration. I found one. It work like this:
     *
     * Each geodesic i has a start point si and an end point ei. There is also some 
     * distance di between si and ei, which can be calculated beforehand. If li is 
     * the distance between b and di, then no point on the geodesic can possibly have 
     * a distance to b of less than li - di. That is, li - di (which can be found 
     * without applying Newton's method) is a lower bound of the distance from b to the 
     * geodesic.
     *
     * That means, suppose I'm going through the n geodesics and I've found one that's
     * 60km away from the border. That means if I come across a geodesic where
     * li - di is 80km, there's no possible way it can be the closest one, so I can just
     * forget about it and I don't have to run Newton's method or anything on it.
     *
     * Actually what I do is I sort all the geodesics by their lower bound and I start
     * at the bottom, so once I reach a point where the closest distance of a geodesic
     * that I've already calculated is lower than the lower bound of the next geodesic
     * then I can just stop.
     * 
     */


    // Constants for regulating Newton's method execution.
    var INITIAL_GUESS = 0.5;
    var NUM_ITERS = 15;
    var STEP_SIZE = 0.01;
    var CONVERGENCE_MARGIN = 0.001;

    // An implemenation of Newton's method.

    function estimateFirstDerivative(f, x, stepSize) {
        return (f(x + stepSize/2) - f(x - stepSize/2)) / stepSize;
    }
    function estimateSecondDerivative(f, x, stepSize) {
        return (estimateFirstDerivative(f, x + stepSize/2, stepSize) - estimateFirstDerivative(f, x - stepSize/2, stepSize))/stepSize;
    }
    function newtonMinimization (f, initialGuess, numIters, stepSize, convergenceMargin) {
        var cur = initialGuess;
        var points = [initialGuess];
        for (var i = 1; i <= numIters; i++) {
    	try {
            var next = cur - estimateFirstDerivative(f, cur, stepSize) / estimateSecondDerivative(f, cur, stepSize);
    	if (Math.abs(cur-next) < convergenceMargin) {
    	    return next;
    	    break;
	}
    	cur = next;
    	points.push(next);
	}
    	catch (err) {
              return false;
	}
        }
        return false;
    }


    var geod = GeographicLib.Geodesic.WGS84;
    var dms = GeographicLib.DMS;

    /**
     * Finds an intermediate point between a1 and a2 which is a fraction,
     * alpha, of the distance along the geodesic between the two.
     */
    function getIntermediatePoint(lata1, lona1, lata2, lona2, alpha) {
            path = geod.Inverse(lata1, lona1, lata2, lona2)
            line = new GeographicLib.GeodesicLine.GeodesicLine(geod,lata1,lona1,path.azi1)
            vals = line.GenPosition(true, path.a12 * alpha, GeographicLib.Geodesic.LATITUDE|GeographicLib.Geodesic.LONGITUDE);
            return [vals.lat2, vals.lon2];
}
    /**
     * This returns a function that tests a point on the geodesic between
     * a1 and a2 and returns its distance to a third point b.
     * This function should then be plugged in as 'f' to newtonMinimization.
     */
    function pointToPathFunc(lata1, lona1, lata2, lona2, latb, lonb) {
        var func = function (alpha) {
    	var intermediatePoint = getIntermediatePoint(lata1, lona1, lata2, lona2, alpha);
    	return geod.Inverse(intermediatePoint[0], intermediatePoint[1],
    			    latb, lonb).a12;
        }
        return func;
}


    function getClosestPointAndDistanceOnSegment(lata1, lona1, lata2, lona2, latb, lonb) {
        // First, find the alpha for the intermediate point between a1 and a2 
        // that minimizes distance from b.
        var f = pointToPathFunc(lata1, lona1, lata2, lona2, latb, lonb);
        var alpha = newtonMinimization(f, INITIAL_GUESS, NUM_ITERS, STEP_SIZE, CONVERGENCE_MARGIN);
        // Convergence might not occur, and may not determine the minimum.
        // So, compare against the endpoints.
        
        var candidates = [[lata1, lona1],[lata2, lona2]];
        if (alpha > 0 && alpha < 1) {
    	candidates.push(getIntermediatePoint(lata1, lona1, lata2, lona2, alpha));
        }

        var distances = [];
        for (var i = 0; i < candidates.length; i++) {
            distances[i] = geod.Inverse(latb, lonb, candidates[i][0], candidates[i][1]).s12;
        }
        var mini = 0;
        for (var i = 0; i < 3; i++) {
            if (distances[i] < distances[mini]) {
                mini = i;
	}
        }

        return {'distance': distances[mini], 'point': candidates[mini]};
}

    BorderDistance.distanceToBorder = function(latb, lonb) {
        var segments = BorderDistance.segments;
	var n = segments.length;
        // First calculate a lower bound for the distance from b to this segment.
        // The lower bound is the distance from b to an endpoint of the segment
        // minus the length of the segment.
        for (var i = 0; i < segments.length; i++) {
            segments[i].lowerBound = geod.Inverse(segments[i].end.lat, segments[i].end.lon, latb, lonb).s12 - segments[i].distance;
        }
        //Now sort the array by the lower bound.
        segments.sort(function(left, right) {
            return left.lowerBound === right.lowerBound ? 0 : (left.lowerBound < right.lowerBound ? -1 : 1);
        });
        //Find the distance to the first segment.
        var minPtDistance = getClosestPointAndDistanceOnSegment(
    	    segments[0].start.lat, segments[0].start.lon, 
    	    segments[0].end.lat, segments[0].end.lon,
    	    latb, lonb);

        for (var i = 1; i < n; i++) {
    	    if (minPtDistance.distance < segments[i].lowerBound) {
    		return minPtDistance;
	    }
         
		var ptDistance = getClosestPointAndDistanceOnSegment(
    		segments[i].start.lat, segments[i].start.lon,
    		segments[i].end.lat, segments[i].end.lon,
    		latb, lonb);
    	if (ptDistance.distance < minPtDistance.distance) {
                minPtDistance = ptDistance;
	}
        }
        return minPtDistance;
    }
})(BorderDistance);
