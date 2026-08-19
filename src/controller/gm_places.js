const http_util = require('../util/http_util');

const base_URL = 'https://places.googleapis.com/v1/places:'

const PLACE_FIELD_MASK = 'places.id,' +
                        'places.displayName.text,' +
                        'places.formattedAddress,' +
                        'places.googleMapsUri,' +
                        'places.rating,' +
                        'places.location,' +
                        'places.primaryTypeDisplayName.text,' +
                        'places.types,' +
                        'places.dineIn,' +
                        'places.servesWine,' +
                        'places.servesBeer,' +
                        'places.servesCocktails,' +
                        'places.businessStatus,' +
                        'places.priceLevel,' +
                        'places.userRatingCount';

const build_nearby_search_data = (lat, lng, maxCount, radius) => ({
    includedPrimaryTypes: [ "restaurant", "bar" ],
    // excludedPrimaryTypes: [],
    maxResultCount: maxCount,
    rankPreference: "DISTANCE",
    locationRestriction: {
        circle: {
            center: {
                latitude: lat,
                longitude: lng
            },
            radius: radius
        }
    }
});

const get_nearby_places = async (lat, lng, maxCount, radius = 1000.0) => {
    const options = {}
    options.url = base_URL + 'searchNearby',
    options.method = 'POST',
    options.headers = {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': PLACE_FIELD_MASK,
        'X-Goog-Api-Key': process.env.GOOGLE_API_KEY
    }
    options.data = build_nearby_search_data(lat, lng, maxCount, radius);
    const response = await http_util.call(options);
    if (response.hasError) {
        console.dir(response, { depth: null });
        throw new Error('Error retrieving nearby places');
    }
    return response.data;
};

// Same as get_nearby_places, but also asks the Places API to compute a
// bicycle routing summary (routingSummaries) from routingOrigin to each
// returned place, so callers can rank venues by real bike travel time
// instead of raw distance from the search circle's center.
const get_nearby_places_routed = async (lat, lng, maxCount, radius, routingOrigin) => {
    const options = {}
    options.url = base_URL + 'searchNearby',
    options.method = 'POST',
    options.headers = {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': PLACE_FIELD_MASK + ',routingSummaries',
        'X-Goog-Api-Key': process.env.GOOGLE_API_KEY
    }
    options.data = {
        ...build_nearby_search_data(lat, lng, maxCount, radius),
        routingParameters: {
            origin: {
                latitude: routingOrigin.lat,
                longitude: routingOrigin.lng
            },
            travelMode: 'BICYCLE'
        }
    };
    const response = await http_util.call(options);
    if (response.hasError) {
        console.dir(response, { depth: null });
        throw new Error('Error retrieving nearby places with bicycle routing');
    }
    return response.data;
};

const complete_address = async(address_string, lat, lng) => {
    const options = {}
    options.url = base_URL + 'autocomplete';
    options.method = 'POST';
    options.headers = {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'suggestions.placePrediction.text.text',
        'X-Goog-Api-Key': process.env.GOOGLE_API_KEY
    }
    options.data = {
        input: address_string
    }
    if (typeof lat === 'number' && typeof lng === 'number') {
        options.data.locationBias = {
            circle: {
                center: {
                    latitude: lat,
                    longitude: lng
                },
                radius: 1000.0 // meters
            }
        }
    }
    const response = await http_util.call(options);
    if (response.hasError) {
        console.dir(response, { depth: null });
        throw new Error('Error retrieving address suggestions');
    }
    return response.data;
}

exports.get_nearby_places = get_nearby_places;
exports.get_nearby_places_routed = get_nearby_places_routed;
exports.complete_address = complete_address;
