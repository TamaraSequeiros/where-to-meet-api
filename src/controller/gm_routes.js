require('dotenv').config();
const axios = require('axios');

const options = {
    url: 'https://routes.googleapis.com/directions/v2:computeRoutes',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_API_KEY
    },
};

const call = async (location1, location2) => {
    options.data = {
            origin: location1,
            destination: location2
    }
        
    const response = await axios(options)
    .then(ok => ok)
    .catch(error => error);

    return process_route(response.data);
};

const process_route = (response) => {
    const route = response.routes[0];
    const halfway_time = get_halfway_time(route.staticDuration);
    const location = get_halfway_location(route.legs[0].steps, halfway_time);
    return { 'latitude' : location.latitude, 'longitude' : location.longitude }
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

exports.call = call;
if (process.env['NODE_DEV'] == 'TEST') {
    module.exports.process_route = process_route;
}