// Methods to interface with Strava API
// https://developers.strava.com/docs/reference/

//import { request } from 'https';
let request = require('https').request;
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

export const useLocal = function(port) {
  request = require('http').request;
  defaultHttpOptions.hostname = 'localhost';
  defaultHttpOptions.port = port;
  defaultHttpOptions.headers = {};
};

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
 * Convert values in object to types expected in strava API
 * @param {Object} options
 * @returns modified object
 */
const stravaTypes = function(options) {
  if (!options || typeof options !== 'object') {
    return options;
  }
  let adjusted = {...options};
  for (let [k,v] of Object.entries(options)) {
    // Strava expects date in seconds past the epoch
    if (v instanceof Date) {
      adjusted[k] = v.valueOf() / 1000;
    }
  }
  return adjusted;
};

/**
 * Get the detail of the authenticated athlete
 */  
export const getAthlete = () => get('/athlete');

/**
 * Get the activities of the authenticated athlete
 * Defaults to the most recent 30 activities
 * @param {Object} options Options to modify the activities that are retrieved
 *   before - Date or timestamp (in seconds) for filtering to only activities before a certain time
 *   after - Date or timestamp (in seconds) for filtering to only activities after a certain time
 *   page - page number. Used for fetching next in sequence.
 *   per_page - number of results per page [30]
 */
export const getActivities = options => get('/athlete/activities', stravaTypes(options));

/**
 * Get the stats for the authenicated Athlete
 * @param {number} athleteID The ID of the autheticated athlete ("id" from getAthlete())
 * @param {Object} options 
 *   page - page number
 *   per_page - Number of items per page
 *   Not sure if these options do anything!
 */
export const getStats = (athleteID, options) => get(`/athletes/${athleteID}/stats`, options);

/**
 * Get the laps for the designated activity
 * @param {number} activityID 
 */
export const getLaps = activityID => get(`/activities/${activityID}/laps`);

/**
 * Get the laps for the designated activity
 * @param {number} activityID 
 */
export const getComments = activityID => get(`/activities/${activityID}/comments`);

/**
 * Get the laps for the designated activity
 * @param {number} activityID 
 */
export const getKudos = activityID => get(`/activities/${activityID}/kudos`);
