const express = require('express');
const haversine = require('haversine-distance');
const gm_routes = require('../controller/gm_routes');
const gm_places = require('../controller/gm_places');

const router = express.Router();

router.post('/:middle', function(req, res) {
   const locations = req.body.addresses;
   locations.forEach((element) => {
      console.log(element);
   });

   // TODO get coordinates from addresses
   
   let middle_point = calculate_middle('geographical', location1, location2);

   let response = {
      'middle_point' : middle_point
   }
   res.send(response);
});

function calculate_middle(method, origin, destination) {
   if (method === 'geographical') {
      return haversine(origin, destination)
   
   } else if (method === 'route') {
      return gm_routes.call(origin, destination);
   
   } else {
      throw new Error('Method ' + method + ' not supported')
   }
}

module.exports = router;