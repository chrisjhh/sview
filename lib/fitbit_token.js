import { PersistentCache } from './persistentcache';
import { promisify } from './promisify';
import { client_id, redirect_uri} from './fitbit_client_data';
import { client_secret } from './fitbit_client_secret';
let request = require('https').request;
const querystring = require('querystring');
const path = require('path');

const cache = new PersistentCache(path.join(__dirname, '..', 'server', 'cache', 'fitbit_tokens'));

const getCachedValue = promisify(cache.retrieve.bind(cache));
const setCachedValue = promisify(cache.store.bind(cache));
const removeCachedValue = promisify(cache.remove.bind(cache));

const basic_auth = Buffer(`${client_id}:${client_secret}`).toString('base64');

export const getToken = async function() {
  // Check if we have cached value first
  let token = await getCachedValue('fitbit_token');
  if (token) {
    return token;
  }
  // If not see if we have a refresh token
  const refresh = await getCachedValue('fitbit_refresh_token');
  if (!refresh) {
    // There is no token, and no means to refresh
    return null;
  }
  // Try to get refreshed token
  const response = await postRefreshRequest(refresh);
  if (!response || !response.access_token) {
    // Our refresh key is probably duff!
    removeCachedValue('fitbit_refresh_token');
    return null;
  }
  const expires = response.expires_in - 30;
  setCachedValue('fitbit_token', response.access_token, expires);
  setCachedValue('fitbit_refresh_token', response.refresh_token);
  return response.access_token;
};

const postOptions = {
  hostname: 'api.fitbit.com',
  port: 443,
  path: '/oauth2/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${basic_auth}`
  }
};

const post = (params) =>
  new Promise((resolve,reject) => {
    const postData = querystring.stringify(params);
    let options = {...postOptions};
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

const postRefreshRequest = function(code) {
  return post({grant_type: 'refresh_token', refresh_token: code});
};

export const requestToken = function(code) {
  return post({
    grant_type: 'authorization_code', 
    code,
    client_id,
    redirect_uri
  })
    .then(response => {
      if (!response || !response.access_token) {
        return null;
      }
      const expires = response.expires_in - 30;
      setCachedValue('fitbit_token', response.access_token, expires);
      setCachedValue('fitbit_refresh_token', response.refresh_token);
      return response.access_token;
    });
};


  