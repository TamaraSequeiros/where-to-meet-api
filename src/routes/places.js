const express = require('express');
const gm_places = require('../controller/gm_places');

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
        if (place.businessStatus && place.businessStatus.startsWith('CLOSED')) {
            continue;
        }
        if (!place.userRatingCount || place.userRatingCount < 10) {
            continue;
        }
        if (venues.length > 4) {
            break;
        }
        place.displayName = place.displayName.text;
        if (place.primaryTypeDisplayName) {
            place.primaryTypeDisplayName = place.primaryTypeDisplayName.text;
        }
        if (place.location) {
            place.location = {
                lat: place.location.latitude,
                lng: place.location.longitude
            };
        }
        representPriceLevel(place);
        venues.push(place);
    }
    const response = { places: venues };
    console.dir( response, { depth: null });
    return response;
}

function representPriceLevel(place) {
    switch (place.priceLevel) {
        case 'PRICE_LEVEL_INEXPENSIVE':
            place.priceLevel = '€'
            break;
        case 'PRICE_LEVEL_MODERATE':
            place.priceLevel = '€€'
            break;
        case 'PRICE_LEVEL_EXPENSIVE':
            place.priceLevel = '€€€'
            break;
        case 'PRICE_LEVEL_VERY_EXPENSIVE':
            place.priceLevel = '€€€€'
            break;
        default:
            place.priceLevel = null;
    }
 }

module.exports = router;
