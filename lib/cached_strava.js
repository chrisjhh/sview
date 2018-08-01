import * as strava from './strava';
import { InMemoryCache } from './cache';

const crypto = require('crypto');

let cache = new InMemoryCache();

const promisify = fn => (...args) => 
  new Promise((resolve, reject) => {
    fn(...args, (err,data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });

export const setCache = function(newCache) {
  cache = newCache;
};

const combinedKey = function(key,...args) {
  if (args.length === 0) {
    return key;
  }
  let argString = JSON.stringify(args);
  const hash = crypto.createHash('sha256');
  hash.update(argString);
  const identifier = hash.digest('hex').slice(0,8);
  
  return key + '_' + identifier;
};

const cachify = (fn,key,expiresIn) => (...args) =>
  // Attempt to get data from cache
  // If it succeeds return it
  // Otherwise forward call to strava api
  // and cache result before returning it
  promisify(cache.retrieve.bind(cache))(combinedKey(key,...args))
    .then(data => data ? data :
      fn(...args).then(
        data => promisify(cache.store.bind(cache))(combinedKey(key,...args), data, expiresIn)
          .then(() => {
            return data;
          })
      )
    );

export const getAthlete = cachify(strava.getAthlete,'athlete',300);
export const getActivities = cachify(strava.getActivities,'activities',60);
