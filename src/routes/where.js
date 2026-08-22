const express = require('express');
const gm_bike_meet = require('../controller/gm_bike_meet');
const gm_geocoding = require('../controller/gm_geocoding');
const debug = require('../util/debug_log');

const router = express.Router();

class AppError extends Error {
   constructor(message, status = 500) {
      super(message);
      this.status = status;
   }
}

router.post('/:middle', async function(req, res) {
   try {
      const locations = await find_coordinates(req.body);
      debug.log('Requested locations: ' + JSON.stringify(locations) + ', with method: ' + req.body.method);

      const result = await calculate_middle(req.body.method, locations[0], locations[1]);
      debug.log('Calculated middle result: ' + JSON.stringify(result));

      res.json(result);
   } catch (error) {
      console.error(error);
      res.status(error.status || 500).json({ error: error.message || 'Unable to calculate middle point' });
   }
});

async function find_coordinates(reqBody) {
   if (reqBody.locations) {
      if (!Array.isArray(reqBody.locations) || reqBody.locations.length !== 2) {
         throw new AppError('Expected exactly two locations', 400);
      }
      return reqBody.locations;

   } else if (reqBody.addresses) {
      if (!Array.isArray(reqBody.addresses) || reqBody.addresses.length !== 2) {
         throw new AppError('Expected exactly two addresses', 400);
      }
      const [coord1, coord2] = await Promise.all([
         gm_geocoding.get_coordinates(reqBody.addresses[0]),
         gm_geocoding.get_coordinates(reqBody.addresses[1])
      ]);
      [coord1, coord2].forEach((coord, i) => {
         if (coord.hasError) {
            debug.log(coord.errorMessage);
            throw new AppError(`Could not geocode address ${i + 1}: "${reqBody.addresses[i]}"`, 422);
         }
      });
      return [coord1, coord2];

   } else {
      throw new AppError('Missing input: locations or addresses', 400);
   }
}

async function calculate_middle(method, origin, destination) {
   if (method === 'geographical') {
      return {
         middle_point: {
            lat: (origin.lat + destination.lat) / 2,
            lng: (origin.lng + destination.lng) / 2
         }
      };

   } else if (method === 'route') {
      try {
         const venues = await gm_bike_meet.find_bike_meeting_venues(origin, destination);
         return { venues };
      } catch (error) {
         throw new AppError(error.message || 'Unable to find a bicycle meeting point', 502);
      }

   } else {
      throw new AppError(`Method ${method} not supported`, 400);
   }
}

module.exports = router;
