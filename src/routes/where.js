const express = require('express');
const gm_routes = require('../controller/gm_routes');
const gm_geocoding = require('../controller/gm_geocoding');

const router = express.Router();

router.post('/:middle', async function(req, res) {
   
   const locations = await find_coordinates(req.body);
   console.log(locations)
   const middle_point = await calculate_middle(req.body.method, locations[0], locations[1]);
   console.log('Calculated middle point: ' + JSON.stringify(middle_point));
   const response = {
      'middle_point' : middle_point
   }
   res.send(response);
});

async function find_coordinates(reqBody) {
   if (reqBody.locations) {
      return reqBody.locations;
   
   } else if (reqBody.addresses) {
      let coord1 = await gm_geocoding.get_coordinates(reqBody.addresses[0]);
      let coord2 = await gm_geocoding.get_coordinates(reqBody.addresses[1]);
      return [coord1, coord2];
   
   } else {
      throw new Error('Missing input: locations or addresses');
   }
}

function calculate_middle(method, origin, destination) {
   if (method === 'geographical') {
      const avg_lat = (origin.lat + destination.lat) / 2;
      const avg_lng = (origin.lng + destination.lng) / 2;
      return {'lat': avg_lat, 'lng': avg_lng};
   
   } else if (method === 'route') {
      let middle_coord; 
      try {
         middle_coord = gm_routes.calculate_middle(origin, destination);
      } catch (error) {
         console.log(error);
         return 'N/A';
      }
      return middle_coord;
   
   } else {
      throw new Error('Method ' + method + ' not supported');
   }
}

module.exports = router;