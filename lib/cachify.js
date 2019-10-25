import { promisify } from './promisify';
const crypto = require('crypto');

const combinedKey = function(key,...args) {
  if (args.length === 0 || args.length === 1 && args[0] == null) {
    return key;
  }
  let argString = JSON.stringify(args);
  const hash = crypto.createHash('sha256');
  hash.update(argString);
  const identifier = hash.digest('hex').slice(0,8);
  
  return key + '_' + identifier;
};

export const cachify = (cache,fn,key,expiresIn) => (...args) =>
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
            console.log('Looking for fallback', combinedKey(key,...args));
            return promisify(cache.fallback.bind(cache))(combinedKey(key,...args))
              .catch(() => Promise.reject(err));
          }
          // Otherwise just pass the error on
          return Promise.reject(err);
        })
    )
    .catch(err => {
      console.log('Error from cachify', err);
      return Promise.reject(err);
    });
