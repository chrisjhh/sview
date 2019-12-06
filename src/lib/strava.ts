// Methods to interface with Strava API
// https://developers.strava.com/docs/reference/

import { OutgoingHttpHeaders, request as requestHttp } from 'http';
import { request as requestHttps } from 'https';
import querystring = require('querystring');

interface Athlete {
  id: number;
  username: string;
  resource_state: number;
  firstname: string;
  lastname: string;
  city: string;
  state: string;
  country: string;
  sex: ("M"|"F");
  premium: boolean;
  summit?: boolean;
  created_at: string;
  updated_at: string;
  badge_type_id: number;
  profile_medium: string;
  profile: string;
  friend?: any;
  follower?: any;
  email?: string;
}

interface AthleteData extends Athlete {
  follower_count: number;
  friend_count: number;
  mutual_friend_count: number;
  athlete_type: number;
  date_preference: string;
  measurement_preference: string;
  clubs: Club[];
  ftp?: any;
  weight: number;
  bikes: Bike[];
  shoes: Shoe[];
}

type Club = {
  id: number,
  resource_state: number,
  name: string,
  profile_medium: string,
  profile: string,
  cover_photo: string,
  cover_photo_small: string,
  sport_type: string,
  city: string,
  state: string,
  country: string,
  private: boolean,
  member_count: number,
  featured: boolean,
  verified: boolean,
  url: string,
  membership: string,
  admin: boolean,
  owner: boolean
};

type Bike = any;

type Shoe = {
  id: string,
  primary: boolean,
  name: string,
  resource_state: number,
  distance: number
};

type activityType = ("AlpineSki" |
  "BackcountrySki" |
  "Canoeing" |
  "Crossfit" |
  "EBikeRide" |
  "Elliptical" |
  "Golf" |
  "Handcycle" |
  "Hike" |
  "IceSkate" |
  "InlineSkate" |
  "Kayaking" |
  "Kitesurf" |
  "NordicSki" |
  "Ride" |
  "RockClimbing" |
  "RollerSki" |
  "Rowing"  |
  "Run" |
  "Sail" |
  "Skateboard" |
  "Snowboard" |
  "Snowshoe" |
  "Soccer" |
  "StairStepper" |
  "StandUpPaddling" |
  "Surfing" |
  "Swim"  |
  "Velomobile" |
  "VirtualRide" |
  "VirtualRun" |
  "Walk" |
  "WeightTraining" |
  "Wheelchair" |
  "Windsurf" |
  "Workout"  |
  "Yoga");

export type StravaActivity = BaseActivityData & HRdata;

type BaseActivityData = {
  name: string,
  distance: number,
  moving_time: number,
  elapsed_time: number,
  total_elevation_gain: number,
  type: activityType,
  id: number,
  workout_type: number | null,
  start_date: string,
  start_date_local: string,
  timezone?: string,
  utc_offset?: number,
  start_latlng: [number, number] | null,
  end_latlng: [number, number] | null,
  kudos_count?: number,
  achievement_count?: number,
  comment_count?: number,
  average_cadence: number | null,
  location_city?: string,
  location_state?: string,
  location_country?: string,
  start_longitude?: number,
  start_latitude?: number
};

type HRdata = noHRdata | hasHRdata;

type noHRdata = {
  has_heartrate: false
};

type hasHRdata = {
  has_heartrate: true,
  max_heartrate: number,
  average_heartrate: number
};

type AthleteStats = {
  recent_run_totals: Totals,
  all_run_totals: Totals,
  recent_swim_totals: Totals,
  biggest_ride_distance: number | null,
  ytd_swim_totals: Totals,
  all_swim_totals: Totals,
  recent_ride_totals: Totals,
  biggest_climb_elevation_gain: number | null,
  ytd_ride_totals: Totals,
  all_ride_totals: Totals,
  ytd_run_totals: Totals
};

type Totals = {
  count: number,
  distance: number,
  moving_time: number,
  elapsed_time: number,
  elevation_gain: number,
  achievement_count: number
};

type Lap = {
  id: number,
  resource_state: number,
  name: string,
  activity: {id: number, resource_state: number},
  athlete: {id: number, resource_state: number},
  elapsed_time: number,
  moving_time: number,
  start_date: string,
  start_date_local: string,
  distance: number,
  start_index: number,
  end_index: number,
  total_elevation_gain: number,
  average_speed: number,
  max_speed: number,
  average_cadence?: number,
  average_heartrate?: number,
  max_heartrate?: number,
  lap_index: number,
  split: number,
  pace_zone: number
};

type Comment = {
  id: number,
  activity_id: number,
  post_id: number | null,
  resource_state: number,
  text: string,
  mentions_metadata: any,
  created_at: string,
  athlete: Athlete
};

let request = requestHttps;

const defaultHttpOptions = {
  hostname: 'www.strava.com',
  port: 443,
  method: 'GET',
  headers: {
    Authorization: ''
  } as OutgoingHttpHeaders
};
const api = '/api/v3';

export const useLocal = function(port: number) {
  request = requestHttp;
  defaultHttpOptions.hostname = 'localhost';
  defaultHttpOptions.port = port;
  defaultHttpOptions.headers = {};
};

export const useToken = function(token: string) {
  defaultHttpOptions.headers.Authorization = `Bearer ${token}`;
};

const get = (path: string, params?): Promise<any> =>
  new Promise((resolve, reject) => {
    if (params) {
      path += '?' + querystring.stringify(params);
    }
    const options = {...defaultHttpOptions, path: api + path};
    const req = request(options, (res) => {
      const data = [];
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      res.on('end', () => {
        const buffer = data.join('');
        const obj = JSON.parse(buffer.toString());
        if (obj.errors) {
          return reject(obj);
        }
        resolve(obj);
      });
    });
    req.on('error', (e) => reject(e));
    req.end();
  });

/**
 * Convert values in object to types expected in strava API
 * @param {Object} options
 * @returns modified object
 */
const stravaTypes = function(options) {
  if (!options || typeof options !== 'object') {
    return options;
  }
  const adjusted = {...options};
  for (const [k, v] of Object.entries(options)) {
    // Strava expects date in seconds past the epoch
    if (v instanceof Date) {
      adjusted[k] = v.valueOf() / 1000;
    }
  }
  return adjusted;
};

/**
 * Get the detail of the authenticated athlete
 */
export const getAthlete = (): Promise<AthleteData> => get('/athlete');

/**
 * Get the activities of the authenticated athlete
 * Defaults to the most recent 30 activities
 * @param {Object} options Options to modify the activities that are retrieved
 *   before - Date or timestamp (in seconds) for filtering to only activities before a certain time
 *   after - Date or timestamp (in seconds) for filtering to only activities after a certain time
 *   page - page number. Used for fetching next in sequence.
 *   per_page - number of results per page [30]
 */
export const getActivities = (options): Promise<StravaActivity[]> => get('/athlete/activities', stravaTypes(options));

/**
 * Get an individual activity by its strava id
 * @param {Number} strava_id
 */
export const getActivity = (strava_id: number): Promise<StravaActivity> => get(`/activities/${strava_id}`);

/**
 * Get the stats for the authenicated Athlete
 * @param {number} athleteID The ID of the autheticated athlete ("id" from getAthlete())
 * @param {Object} options
 *   page - page number
 *   per_page - Number of items per page
 *   Not sure if these options do anything!
 */
export const getStats = (athleteID: number, options): Promise<AthleteStats> =>
  get(`/athletes/${athleteID}/stats`, options);

/**
 * Get the laps for the designated activity
 * @param {number} activityID
 */
export const getLaps = (activityID: number): Promise<Lap[]> => get(`/activities/${activityID}/laps`);

/**
 * Get the comments for the designated activity
 * @param {number} activityID
 */
export const getComments = (activityID: number): Promise<Comment[]> => get(`/activities/${activityID}/comments`);

/**
 * Get the kudos for the designated activity
 * @param {number} activityID
 */
export const getKudos = (activityID: number): Promise<Athlete[]> => get(`/activities/${activityID}/kudos`);

// cadence,distance,time,heartrate,latlng
/**
 * Get the streams for the designated activities
 * @param {number} activityID 
 * @param {Object} options 
 *   keys_by_type - must be true
 *   keys - array. One or more of cadence,distance,time,heartrate,latlng
 */
export const getStreams = (activityID,options) => 
  get(`/activities/${activityID}/streams`, options)
    .then((data) => {
      if (data.errors) {
        return [];
      }
      return data;
    });
