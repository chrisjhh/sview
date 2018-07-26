import { request } from 'https';

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

const get = path =>
  new Promise((resolve,reject) => {
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

export const getAthlete = () => get('/athlete');