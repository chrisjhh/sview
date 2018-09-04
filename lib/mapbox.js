// Methods to fetch and cache tiles from mapbox.com 

let request = require('https').request;
const querystring = require('querystring');


const defaultHttpOptions = {
  hostname: 'api.tiles.mapbox.com',
  port: 443,
  method: 'GET',
};
const api = '/v4';


const get = (path,params) =>
  new Promise((resolve,reject) => {
    if (params) {
      path += '?' + querystring.stringify(params);
    }
    let options = {...defaultHttpOptions, path: api + path};
    const req = request(options, (res) => {
      let data = [];
      res.setEncoding('binary');
      res.on('data', chunk => {
        data.push(chunk);
      });
      res.on('end', () => {
        let buffer = data.join('');
        data = Buffer.from(buffer, 'binary').toString('base64');
        resolve(data);
      });
    });
    req.on('error', e => reject(e));
    req.end();
  });


const promisify = fn => (...args) => 
  new Promise((resolve, reject) => {
    fn(...args, (err,data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
  
  
  
const combinedKey = function(key,...args) {
  return key + '_' + args.join('_');
};
  
const cachify = (cache,fn,key,expiresIn) => (...args) =>
  // Attempt to get data from cache
  // If it succeeds return it
  // Otherwise forward call to strava api
  // and cache result before returning it
  promisify(cache.retrieve.bind(cache))(combinedKey(key,...args))
    .then(data => data ? data :
      fn(...args)
        .then(
          data => promisify(cache.store.bind(cache))(combinedKey(key,...args), data, expiresIn)
            .then(() => {
              return data;
            })
        )
        .catch(err => {
          // Strava lookup failed
          // Check if we are using a fallback cache
          if (cache.fallback) {
            return promisify(cache.fallback.bind(cache))(combinedKey(key,...args));
          }
          // Otherwise just pass the error on
          return Promise.reject(err);
        })
    );

export const getTile = (id,z,x,y,params) => get(`/${id}/${z}/${x}/${y}.png`,params);
export const cachedGetTile = (cache) => cachify(cache,getTile,'mapbox_tile',864000);
