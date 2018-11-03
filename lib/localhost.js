// Methods to fetch and cache tiles from mapbox.com 

let request = require('http').request;
const querystring = require('querystring');


const defaultHttpOptions = {
  hostname: 'localhost',
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


export const getStats = (id) => get(`/api/routes/${id}/stats`);
export const getWeather = (strava_id) => get(`/api/weather/${strava_id}`);
