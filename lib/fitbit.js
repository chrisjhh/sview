import { getToken } from './fitbit_token';
import { cachify } from './cachify';
import { FallbackCache } from './fallbackcache';

const path = require('path');
const request = require('https').request;
const querystring = require('querystring');

const cache = new FallbackCache(path.join(__dirname, '..', 'server', 'cache'));

const defaultHttpOptions = {
  hostname: 'api.fitbit.com',
  port: 443,
  method: 'GET',
  headers: {
    'Authorization': 'Bearer TOKEN'
  }
};
const api = '/1/user/-/activities';

const get = (token,path,params) =>
  new Promise((resolve,reject) => {
    if (params) {
      path += '?' + querystring.stringify(params);
    }
    let options = {...defaultHttpOptions, path: api + path};
    options.headers['Authorization'] = `Bearer ${token}`;
    const req = request(options, (res) => {
      let data = [];
      res.setEncoding('utf8');
      res.on('data', chunk => {
        data.push(chunk);
      });
      res.on('end', () => {
        let buffer = data.join('');
        if (res.statusCode !== 200) {
          reject(buffer.toString());
        } else {
          resolve(JSON.parse(buffer.toString()));
        }
      });
    });
    req.on('error', e => reject(e));
    req.end();
  });

const getWithToken = (path,params) =>
  getToken()
    .then(token => {
      if (!token) {
        return null;
      }
      return get(token,path,params);
    });

function pad(number) {
  if (number < 10) {
    return '0' + number;
  }
  return number;
}    

const directHeartRateData = (start_time, duration) => {
  console.log('  Getting heartrate data from fitbit...');
  const d = new Date(start_time);
  const day = d.getFullYear() + '-' + pad(d.getMonth() + 1) +
    '-' + pad(d.getDate());
  const end = new Date(d.getTime() + duration * 1000);
  const time1 = pad(d.getHours()) + ':' + pad(d.getMinutes());
  const time2 = pad(end.getHours()) + ':' + pad(end.getMinutes());
  return getWithToken(`/heart/date/${day}/1d/1sec/time/${time1}/${time2}.json`)
    .then(response => {
      const series = response['activities-heart-intraday'];
      if (!series || series.dataset.length == 0) {
        // Return error so missing results don't get cached
        return Promise.reject('No heartrate data for time range');
      }
      return response;
    });
};

export const getHeartRateData = cachify(cache,directHeartRateData,'fitbit_hr',null);
