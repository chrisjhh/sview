// Methods to fetch weather info from metoffice

let request = require('http').request;
const querystring = require('querystring');
const path = require('path');
const geolib = require('geolib');
const suncalc = require('suncalc');
import { cachify } from './cachify';
import { FallbackCache } from './fallbackcache';

const cache = new FallbackCache(path.join(__dirname, '..', 'server', 'cache'));

const defaultHttpOptions = {
  hostname: 'datapoint.metoffice.gov.uk',
  port: 80,
  method: 'GET',
};
const api = '/public/data/val';

const defaultParams = {
  key: '45cdf26d-263e-4015-962d-f51131a5ea30'
};


const get = (path,userParams) =>
  new Promise((resolve,reject) => {
    const params = {...defaultParams,...userParams};
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
        try {
          let buffer = data.join('');
          resolve(JSON.parse(buffer.toString()));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', e => reject(e));
    req.end();
  });

const getLocations = () => get('/wxobs/all/json/sitelist');
const getCachedLocations = cachify(cache,getLocations,'metoffice_sites',2592000); // cache for 30 days

const getWeatherData = (siteID) => get(`/wxobs/all/json/${siteID}`, {res: 'hourly'});
const getCachedWeatherData = cachify(cache,getWeatherData,'metoffice_data',3600);

const nearestLocation = (lat,lon) => {
  return getCachedLocations()
    .then(data => {
      const locations = data.Locations.Location;
      const here = {latitude:lat,longitude:lon};
      const result = geolib.findNearest(here,locations);
      return locations[result.key];
    })
    .catch(err => console.log(err));
};


const wind_direction = {
  'N' : 0,
  'NNE' : 22.5,
  'NE' : 45,
  'ENE' : 67.5,
  'E' : 90,
  'ESE' : 112.5,
  'SE' : 135,
  'SSE' : 157.5,
  'S' : 180,
  'SWW' : 202.5,
  'SW' : 225,
  'WSW' : 247.5,
  'W' : 270,
  'WNW' : 292.5,
  'NW' : 315,
  'NNW' : 337.5
};

export const getWeather = function (lat,lon,date,duration) {
  const d = new Date(date);
  // Can only retrieve data for today or yesterday
  const now = new Date();
  const yesterday_time = now.getTime() - 24 * 60 * 60 * 1000;
  let yesterday = new Date(yesterday_time);
  //yesterday.setHours(0,0,0,0);
  if (d.getTime() < yesterday.getTime()) {
    return Promise.resolve(null);
  }

  return nearestLocation(lat,lon)
    .then(site => getCachedWeatherData(site.id))
    .then(response => convert_format(response,lat,lon,date,duration));
  
};


const convert_format = function(response,lat,lon,date,duration) {
  if (!response.SiteRep) {
    return null;
  }
  const d = new Date(date);
  let hour = d.getHours();
  const mins = d.getMinutes();
  if (mins > 30) {
    ++hour;
  }
  const location = response.SiteRep.DV.Location;
  const values = location.Period.filter(x => new Date(x.value).getDate() === d.getDate())[0];
  const rows = [];
  for (let offset = 0; offset < duration/3600; ++offset) {
    const row = {};
    let timestamp = new Date(date);
    timestamp.setHours(hour + offset,0,0,0);
    const rep = values.Rep.filter(x => x['$'] == (hour + offset) * 60);
    if (rep.length !== 1) {
      console.log('could not find metoffice data for hour', hour + offset);
      return null;
    }
    const solarpos = suncalc.getPosition(timestamp,lat,lon);
    const data = rep[0];
    row.city = location.name;
    row.timestamp = timestamp.toISOString();
    row.humidity = data.H;
    row.wind_speed = data.S * 0.44704; // m/s
    row.sea_level_pressure = null;
    row.solar_azimuth = solarpos.azimuth * 180 / Math.PI;
    row.dew_point = data.Dp;
    row.snow = null;
    row.uv = null;
    row.wind_direction = wind_direction[data.D];
    row.visibility = data.V / 1000; // km
    row.precipitation = null;
    row.solar_elevation = solarpos.altitude * 180 / Math.PI;
    row.pressure = data.P;
    row.temperature = data.T;
    row.cloud_coverage = null;
    rows.push(row);
  }
  return rows;
};
