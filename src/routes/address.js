const express = require('express');
const gm_complete = require('../controller/gm_places');

const router = express.Router();

router.post('/:complete', async function(req, res) {
    const address_string = req.body.address_string;
    const lat = req.body.lat;
    const lng = req.body.lng;

    const suggestions = await get_suggestions(address_string, lat, lng);

    res.send(suggestions);
});

async function get_suggestions(address_string, lat, lng) {
    const suggestions_found = await gm_complete.complete_address(address_string, lat, lng);

    let addresses = [];
    for (suggestion of suggestions_found.suggestions) {
        addresses.push(suggestion.placePrediction.text.text);
    }
    
    const response = { suggestions: addresses };
    console.dir( response, { depth: null });
    return response;
}

module.exports = router;