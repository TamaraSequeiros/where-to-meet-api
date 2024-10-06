const http_util = require('../util/http_util');

const options = {
    url: 'https://places.googleapis.com/v1/places:searchNearby',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'places.displayName,' +
                            'places.formattedAddress,' +
                            'places.rating,' +
                            'places.location',
        'X-Goog-Api-Key': process.env.GOOGLE_API_KEY
    }
};

const get_nearby_places = async (lat, lng) => {
    options.data = {
        includedTypes: [ "restaurant", "bar" ],
        maxResultCount: 5,
        rankPreference: "DISTANCE",
        locationRestriction: {
            circle: {
                center: {
                    latitude: lat,
                    longitude: lng
                },
                radius: 500.0
            }
        }
    }
    const response = await http_util.call(options);
    console.dir(response.data, {depth: null});
    return response.data;
};

exports.get_nearby_places = get_nearby_places;