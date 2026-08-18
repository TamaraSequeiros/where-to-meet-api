const express = require('express');
const gm_complete = require('../controller/gm_places');
const debug = require('../util/debug_log');

const router = express.Router();

router.post('/:complete', async function(req, res) {
    try {
        const address_string = req.body.address_string;
        if (typeof address_string !== 'string' || address_string.length < 3) {
            return res.status(400).json({ error: 'address_string is required and must be at least 3 characters' });
        }
        const lat = req.body.lat;
        const lng = req.body.lng;

        const suggestions = await get_suggestions(address_string, lat, lng);

        res.json(suggestions);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ error: error.message || 'Unable to fetch address suggestions' });
    }
});

async function get_suggestions(address_string, lat, lng) {
    const suggestions_found = await gm_complete.complete_address(address_string, lat, lng);

    let addresses = [];
    for (const suggestion of suggestions_found.suggestions || []) {
        addresses.push(suggestion.placePrediction.text.text);
    }

    const response = { suggestions: addresses };
    debug.dir(response, { depth: null });
    return response;
}

module.exports = router;
