// Methods to fetch and cache tiles from mapbox.com 

let request = require('http').request;
const querystring = require('querystring');


const defaultHttpOptions = {
  hostname: location.hostname,
  port: location.port,
  method: 'GET',
};


const get = (path,params) =>
  new Promise((resolve,reject) => {
    if (params) {
      path += '?' + querystring.stringify(params);
    }
    let options = {...defaultHttpOptions, path: path};
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

const postOptions = {
  ...defaultHttpOptions,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};
  
const post = (path, params) =>
  new Promise((resolve,reject) => {
    const postData = querystring.stringify(params);
    let options = {...postOptions, path};
    options.headers['Content-Length'] = Buffer.byteLength(postData);
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
    req.write(postData);
    req.end();
  });
  


export const getStats = (id) => get(`/api/routes/${id}/stats`);
export const getWeather = (strava_id) => get(`/api/weather/${strava_id}`);
export const isFitbitAuthorised = () => get('/api/fitbit/isauthorised');
export const fitbitHeartrate = (time,duration) => get(
  '/api/fitbit/heartrate',
  {
    time : new Date(time).toISOString(),
    duration
  }
);
export const getRunsFromSearch = (query,before) => get('/api/search', {q:query,before});
export const getManualHR = (id) => get(`/api/manualhr/${id}`);
export const setManualHR = (id,data) => post(`/api/manualhr/${id}`,data);
