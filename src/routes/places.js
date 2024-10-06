const express = require('express');
const gm_places = require('../controller/gm_places');

const router = express.Router();

router.post('/:nearby', async function(req, res) {
    const lat = req.body.lat;
    const lng = req.body.lng;
   
    const places = await gm_places.get_nearby_places(lat, lng);

    res.send(places);
});

module.exports = router;