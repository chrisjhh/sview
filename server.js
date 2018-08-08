// Local server to cache responses from Strava and additional data as required

// Allow console logs from server script
/*eslint no-console: "off" */
import { getAthlete } from './lib/cached_strava';
import { FScache } from './lib/fscache';
import { setCache } from './lib/strava';

const express = require('express');
const path = require('path');

const app = express();
const port = 7676;
app.set('PORT', port);


// Use a File-System cache for responses from Strava
const cache = new FScache(path.join(__dirname, 'server/cache'));
setCache(cache);


// Start the server
app.listen(app.get('PORT'), err => {
  if (err) {
    console.log('Error starting server', err);
  } else {
    console.log(`Server listening on port ${app.get('PORT')}`);
  }
});

// Add the routes
app.get('/athlete', function(req,res) {
  getAthlete()
    .then(data => res.json(data))
    .catch(res.sendStatus(500));
});