// Methods to fetch and cache tiles from mapbox.com 

let request = require('https').request;
const querystring = require('querystring');


const defaultHttpOptions = {
  hostname: 'api.tiles.mapbox.com',
  port: 443,
  method: 'GET',
};
const api = '/v4';


const get = (path,params,etag) =>
  new Promise((resolve,reject) => {
    if (params) {
      path += '?' + querystring.stringify(params);
    }
    let options = {...defaultHttpOptions, path: api + path};
    if (etag) {
      options.headers = {'If-None-Match': etag};
    }
    const req = request(options, (res) => {
      if (res.statusCode === 304) {
        reject(304);
      }
      let data = [];
      res.setEncoding('binary');
      res.on('data', chunk => {
        data.push(chunk);
      });
      res.on('end', () => {
        let buffer = data.join('');
        let etag = res.headers.etag;
        data = Buffer.from(buffer, 'binary').toString('base64');
        resolve({data, etag});
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
    .then(cached => {
      if (cached) {
        console.log('  retreived from cache');
        return cached.data ? cached.data : cached;
      }
      return promisify(cache.fallback.bind(cache))(combinedKey(key,...args))
        .catch(() => null)
        .then(fallback => {
          let etag = null;
          if (fallback) {
            etag = fallback.etag;
          }
          return fn(...args,etag)
            .then(
              fresh => promisify(cache.store.bind(cache))(combinedKey(key,...args), fresh, expiresIn)
                .then(() => {
                  if (etag) {
                    console.log('  updated version fetched from mapbox');
                  } else {
                    console.log('  fetched from mapbox');
                  }
                  return fresh.data;
                })
            )
            .catch(err => {
              if (err === 304) {
                // Old cache is still up to date. refresh it
                console.log('  304 - Not changed');
                return promisify(cache.store.bind(cache))(combinedKey(key,...args), fallback, expiresIn)
                  .then(() => {
                    return fallback.data;
                  });
              } else if (fallback) {
                // Return fallback data but do not mark as fresh
                console.log('  cannot access mapbox using fallback');
                return fallback.data ? fallback.data : fallback;
              } else {
                // Pass error on
                return Promise.reject(err);
              }
            });

        });
    });



      

export const getTile = (id,z,x,y,params,etag) => get(`/${id}/${z}/${x}/${y}.png`,params,etag);
export const cachedGetTile = (cache) => cachify(cache,getTile,'mapbox_tile', 864000);
