const http_util = require('../util/http_util');

const options = {
    url: 'https://places.googleapis.com/v1/places:searchNearby',
    method: 'POST',
    headers: {
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
                            'places.priceLevel',
        'X-Goog-Api-Key': process.env.GOOGLE_API_KEY
    }
};

const get_nearby_places = async (lat, lng, maxCount) => {
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
                radius: 1000.0
            }
        }
    }
    const response = await http_util.call(options);
    return response.data;
};

exports.get_nearby_places = get_nearby_places;