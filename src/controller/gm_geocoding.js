const http_util = require('../util/http_util');

const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const get_coordinates = async (address) => {
    options.url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(address) + '&key=' + process.env.GOOGLE_API_KEY;
    const response = await http_util.call(options);
    if (response.hasError) {
        console.dir(response, { depth: null });
        return { hasError : true, errorMessage : 'Error geocoding addresses'};
    }
    return response.data.results[0].geometry.location;
};


exports.get_coordinates = get_coordinates;


