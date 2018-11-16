import * as strava from './strava';
import { InMemoryCache } from './cache';
import { promisify } from './promisify';

const crypto = require('crypto');

let cache = new InMemoryCache();

export const setCache = function(newCache) {
  cache = newCache;
};

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

const cachify = (fn,key,expiresIn) => (...args) =>
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

export const getAthlete = cachify(strava.getAthlete,'athlete',300);
export const getActivities = cachify(strava.getActivities,'activities',60);
export const getStats = cachify(strava.getStats,'stats',60);
export const getLaps = cachify(strava.getLaps,'laps',86400);
export const getComments = cachify(strava.getComments,'comments',10);
export const getKudos = cachify(strava.getKudos,'kudos',10);
export const getStreams = cachify(strava.getStreams,'streams',86400);
