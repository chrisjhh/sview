import * as strava from './strava';
import { InMemoryCache } from './cache';
import { cachify } from './cachify';



let cache = new InMemoryCache();

export const setCache = function(newCache) {
  cache = newCache;
};



export const getAthlete = cachify(cache,strava.getAthlete,'athlete',300);
export const getActivities = cachify(cache,strava.getActivities,'activities',60);
export const getActivity = cachify(cache,strava.getActivity,'activity',86400);
export const getStats = cachify(cache,strava.getStats,'stats',60);
export const getLaps = cachify(cache,strava.getLaps,'laps',86400);
export const getComments = cachify(cache,strava.getComments,'comments',10);
export const getKudos = cachify(cache,strava.getKudos,'kudos',10);
export const getStreams = cachify(cache,strava.getStreams,'streams',86400);
