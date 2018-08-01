// Methods to interface with Strava API
// https://developers.strava.com/docs/reference/

import { request } from 'https';
const querystring = require('querystring');

import token from './strava_token';

const defaultHttpOptions = {
  hostname: 'www.strava.com',
  port: 443,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};
const api = '/api/v3';

const get = (path,params) =>
  new Promise((resolve,reject) => {
    if (params) {
      path += '?' + querystring.stringify(params);
    }
    let options = {...defaultHttpOptions, path: api + path};
    const req = request(options, (res) => {
      let data = [];
      res.setEncoding('utf8');
      res.on('data', chunk => {
        data.push(chunk);
      });
      res.on('end', () => {
        let buffer = data.join('');
        resolve(JSON.parse(buffer.toString()));
      });
    });
    req.on('error', e => reject(e));
    req.end();
  });

/**
 * Get the detail of the authenticated athlete
 */  
export const getAthlete = () => get('/athlete');

/**
 * Get the activities of the authenticated athlete
 * Defaults to the most recent 30 activities
 * @param {Object} options Options to modify the activities that are retrieved
 *   before - timestamp for filtering to only activities before a certain time
 *   after - timestamp for filtering to only activities after a certain time
 *   page - page number. Used for fetching next in sequence.
 *   per_page - number of results per page [30]
 */
export const getActivities = options => get('/athlete/activities', options);