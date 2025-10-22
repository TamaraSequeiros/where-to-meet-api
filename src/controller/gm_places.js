const http_util = require('../util/http_util');

const base_URL = 'https://places.googleapis.com/v1/places:'

const get_nearby_places = async (lat, lng, maxCount) => {
    const options = {}
    options.url = base_URL + 'searchNearby',
    options.method = 'POST',
    options.headers = {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'places.displayName.text,' +
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
                            'places.userRatingCount',
        'X-Goog-Api-Key': process.env.GOOGLE_API_KEY
    }
    options.data = {
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
                radius: 1000.0 // meters
            }
        }
    }
    const response = await http_util.call(options);
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
        input: address_string,
        locationBias: {
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
    return response.data;
}

exports.get_nearby_places = get_nearby_places;
exports.complete_address = complete_address;