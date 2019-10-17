import * as strava from './strava';
import { InMemoryCache } from './cache';
import { cachify } from './cachify';

export let getAthlete; 
export let getActivities ;
export let getActivity;
export let getStats;
export let getLaps;
export let getComments;
export let getKudos;
export let getStreams;

let default_cache = new InMemoryCache();

export const setCache = function(cache) {
  getAthlete = cachify(cache,strava.getAthlete,'athlete',300);
  getActivities = cachify(cache,strava.getActivities,'activities',60);
  getActivity = cachify(cache,strava.getActivity,'activity',86400);
  getStats = cachify(cache,strava.getStats,'stats',60);
  getLaps = cachify(cache,strava.getLaps,'laps',86400);
  getComments = cachify(cache,strava.getComments,'comments',10);
  getKudos = cachify(cache,strava.getKudos,'kudos',10);
  getStreams = cachify(cache,strava.getStreams,'streams',86400);
};

setCache(default_cache);



