const express = require('express');
const gm_places = require('../controller/gm_places');
const venue_format = require('../util/venue_format');
const debug = require('../util/debug_log');

const router = express.Router();

router.post('/:nearby', async function(req, res) {
    try {
        const { lat, lng } = req.body;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({ error: 'lat and lng are required and must be numbers' });
        }

        const places = await get_places(lat, lng);
        res.json(places);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ error: error.message || 'Unable to fetch nearby places' });
    }
});

async function get_places(lat, lng) {
    const placesFoundNearby = await gm_places.get_nearby_places(lat, lng, 20); // max 20
    let venues = [];
    for (const place of placesFoundNearby.places) {
        if (venue_format.is_closed(place)) {
            continue;
        }
        if (!venue_format.has_enough_ratings(place)) {
            continue;
        }
        if (venues.length > 4) {
            break;
        }
        venues.push(venue_format.format_place(place));
    }
    const response = { places: venues };
    debug.dir(response, { depth: null });
    return response;
}

module.exports = router;
