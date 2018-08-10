// Local server to cache responses from Strava and additional data as required

// Allow console logs from server script
/*eslint no-console: "off" */
import * as strava from './lib/cached_strava';
import { FallbackCache } from './lib/fallbackcache';

const express = require('express');
const path = require('path');

const app = express();
const port = 7676;
app.set('PORT', port);


// Use a fallback File-System cache for responses from Strava
const cache = new FallbackCache(path.join(__dirname, 'server', 'cache'));
strava.setCache(cache);


// Start the server
app.listen(app.get('PORT'), err => {
  if (err) {
    console.log('Error starting server', err);
  } else {
    console.log(`Server listening on port ${app.get('PORT')}`);
  }
});


// Log all requests
app.use((req,res,next) => {
  console.log(req.originalUrl);
  next();
});

// Add the routes
app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/compiled/bundle.js', (req,res) => {
  res.sendFile(path.join(__dirname, 'compiled', 'bundle.js'));
});
// Serve anything under styles and img as static content
app.use('/styles', express.static('styles'));
app.use('/img', express.static('img'));


// Cached strava API interface
app.get('/api/v3/athlete', (req,res) => {
  strava.getAthlete()
    .then(data => res.json(data))
    .catch(err => res.setStatus(500).send('Internal server error:', err));
});
app.get('/api/v3/athlete/activities', (req,res) => {
  strava.getActivities(req.query.length ? req.query : null)
    .then(data => res.json(data))
    .catch(err => res.setStatus(500).send('Internal server error:', err));
});
app.get('/api/v3/athletes/:id/stats', (req,res) => {
  strava.getStats(req.params.id, req.query.length ? req.query : null)
    .then(data => res.json(data))
    .catch(err => res.setStatus(500).send('Internal server error:', err));
});
