const http_util = require('../util/http_util');

const options = {
    url: 'https://routes.googleapis.com/directions/v2:computeRoutes',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'routes.staticDuration,' +
                            'routes.legs.steps.staticDuration,' +
                            'routes.legs.steps.startLocation,' +
                            'routes.legs.steps.endLocation,' +
                            'routes.polyline.encodedPolyline'
    }
};

const calculate_middle = async (location1, location2) => {
    options.data = {
        origin: {
            location : {
                latLng : {
                    latitude : location1.lat,
                    longitude : location1.lng
                }
            }
        },
        destination: {
            location : {
                latLng : {
                    latitude : location2.lat,
                    longitude : location2.lng
                }
            }
        },
        travelMode: 'BICYCLE'
    }

    const response = await http_util.call(options);
    if (response.hasError) {
        console.dir(response, { depth: null });
        return 'Error retrieving routes';
    }
    console.log(response.data)
    return process_route(response.data);
};

const process_route = (route_data) => {
    const route = route_data.routes[0];
    const halfway_time = get_halfway_time(route.staticDuration);
    const location = get_halfway_location(route.legs[0].steps, halfway_time);
    return { 'lat': location.latitude, 'lng': location.longitude };
}

const get_halfway_time = (duration) => {
    const seconds = duration.substring(0, duration.length - 1);
    return parseInt(seconds) / 2;
}

const get_halfway_location = (steps, halfway_time) => {
    let time_travelled = 0;
    for (let step of steps) {
        const step_duration = parseInt(step.staticDuration.substring(0, step.staticDuration.length - 1));
        time_travelled += step_duration;
        if (time_travelled > halfway_time) {           
            const step_start_time = time_travelled - step_duration;
            if (halfway_time - step_start_time < time_travelled - halfway_time) {
                // TODO
                console.log('We were closer behore, helaas pindakaas');
            }
            return step.endLocation.latLng;
        }
    }
}

exports.calculate_middle = calculate_middle;
if (process.env['NODE_DEV'] == 'TEST') {
    module.exports.process_route = process_route;
}