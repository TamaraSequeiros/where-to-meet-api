const express = require('express');
const gm_routes = require('../controller/gm_routes');

const router = express.Router();

router.post('/:middle', async function(req, res) {
   const locations = req.body.locations;
   
   const middle_point = await calculate_middle(req.body.method, locations[0], locations[1]);
   console.log(middle_point);
   const response = {
      'middle_point' : middle_point
   }
   res.send(response);
});

function calculate_middle(method, origin, destination) {
   if (method === 'geographical') {
      const avg_lat = (origin[0] + destination[0]) / 2;
      const avg_lng = (origin[1] + destination[1]) / 2;
      return [avg_lat, avg_lng];
   
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