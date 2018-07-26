import { request } from 'http';

import token from './strava_token';

const defaultHttpOptions = {
  hostname: 'www.strava.com',
  port: 80,
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
      res
        .on('data', chunk => data.push(chunk))
        .on('end', () => {
          let buffer = Buffer.concat(data);
          resolve(JSON.parse(buffer.toString()));
        });
    });
    req.on('error', e => reject(e));
  });

export const getAthlete = () => get('/athlete');