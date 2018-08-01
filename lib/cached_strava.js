import * as strava from './strava';
import { InMemoryCache } from './cache';

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

const cachify = (fn,key,expiresIn) => (...args) =>
  // Attempt to get data from cache
  // If it succeeds return it
  // Otherwise forward call to strava api
  // and cache result before returning it
  promisify(cache.retrieve.bind(cache))(key)
    .then(data => data ? data :
      fn(...args).then(
        data => promisify(cache.store.bind(cache))(key, data, expiresIn)
          .then(data)
      )
    );

export const getAthlete = cachify(strava.getAthlete,'athlete',300);
export const getActivities = cachify(strava.getActivities,'activities',60);
