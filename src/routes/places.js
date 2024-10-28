const express = require('express');
const gm_places = require('../controller/gm_places');

const router = express.Router();

router.post('/:nearby', async function(req, res) {
    const lat = req.body.lat;
    const lng = req.body.lng;

    const places = await get_places(lat, lng);

    res.send(places);
});

async function get_places(lat, lng) {
    const placesFoundNearby = await gm_places.get_nearby_places(lat, lng, 20); // max 20
    let venues = [];
    for (place of placesFoundNearby.places) {
        if (place.businessStatus.startsWith('CLOSED')) {
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