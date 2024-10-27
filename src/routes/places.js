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
    const places = await gm_places.get_nearby_places(lat, lng); 
    for (place of places.places) {
        place.displayName = place.displayName.text;
        representPriceLevel(place);
    }
    console.dir(places, { depth: null });
    return places;
 }

function representPriceLevel(place) {
    switch (place.priceLevel) {
        case 'PRICE_LEVEL_FREE':
            place.priceLevel = 'Free!'
            break;
        case 'PRICE_LEVEL_INEXPENSIVE':
            place.priceLevel = '$'
            break;
        case 'PRICE_LEVEL_MODERATE':
            place.priceLevel = '$$'
            break;
        case 'PRICE_LEVEL_EXPENSIVE':
            place.priceLevel = '$$$'
            break;
        case 'PRICE_LEVEL_VERY_EXPENSIVE':
            place.priceLevel = '$$$$'
            break;
    }
 }

module.exports = router;