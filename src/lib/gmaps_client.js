import GMaps from 'gmaps'
import mapsapi from 'google-maps-api'

const API_KEY='AIzaSyD_XGdkqvAA84OezC5DL-zOWklo6rrM4dk'

function init (callback) {
    mapsapi(API_KEY)().then((api) => {
        window.google = {maps: api}
        return callback()
    })
}

function geocode (description, callback) {
    return GMaps.geocode({
        address: description,
        callback: function (results, status) {
            if (status !== 'OK') {
                return callback(new Error('Could not geocode location'))
            }
            return callback(null, {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
            })
        }
    })
}

function renderMap (el, lat, lng, zoom) {
    return new GMaps({ el, lat, lng, zoom })
}

export default {
    init,
    geocode,
    renderMap,
}
