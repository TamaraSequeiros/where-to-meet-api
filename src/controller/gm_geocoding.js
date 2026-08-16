const http_util = require('../util/http_util');

const get_coordinates = async (address) => {
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        url: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(address) + '&key=' + process.env.GOOGLE_API_KEY
    };

    const response = await http_util.call(options);
    if (response.hasError) {
        console.dir(response, { depth: null });
        return { hasError: true, errorMessage: 'Error geocoding address: ' + address };
    }

    const results = response.data && response.data.results;
    if (!results || results.length === 0) {
        return { hasError: true, errorMessage: 'No results found for address: ' + address };
    }

    return results[0].geometry.location;
};


exports.get_coordinates = get_coordinates;
