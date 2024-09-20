require('dotenv').config();
const axios = require('axios');

const options = {
    hostname: 'https://maps.googleapis.com',
    path: '/maps/api/place/nearbysearch/json',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_API_KEY
    },
};

const call = () => {
    https.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (body) {
            console.log('BODY: ' + body);
        });
    }).end();
};

exports.call = call;