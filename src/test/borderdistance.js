const BorderDistance = require('../lib/borderdistance')
describe('.distanceToBorder', () => {
    const segments = [{
        start: {
            lat:  46.55001,
            lon: -63.6645
        },
        end : {
            lat: 46.41587,
            lon: -62.9393
        },
        distance: 57647.23526274624
    }]

    it('is correct', () => {
        console.log(BorderDistance.distanceToBorder(
            segments,
            45.4647,
            -98.4865
        ))
        console.log(BorderDistance.closestToGeodesic(
            45.4647, -98.4865, 46.55001, -63.6645, 46.41587, -62.9393
        ))
    })
})
