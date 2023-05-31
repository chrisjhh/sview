
import * as metoffice from './metoffice';
import * as visualcrossing from './visualcrossing';
import { getActivity } from './cached_strava';
import { strava_activity_to_row } from '../db/database';
 

export const getWeather = async function(db,strava_id) {
  // First check if there is any weather data for this run already
  // in the database
  let rows = await db.getWeather(strava_id);
  if (rows) {
    console.log('  weather info retrieved from database');
    return rows;
  }
  // Get the run details for the strava id
  let run = await db.fetchRunByStravaID(strava_id);
  if (!run) {
    // This may be another type of strava activity
    let data = await getActivity(strava_id);
    if (data) {
      run = strava_activity_to_row(data);
    } 
    if (!run) {
      return null;
    }
  }
  let time = new Date(run.start_time);
  // Is this within the last month
  //const now = new Date().getTime();
  //const then = time.getTime();
  //const month = 1000 * 60 * 60 * 24 * 30;
  //if (now - then > month) {
  //  // We cant fetch the weather for this run
  //  return null;
  //}
  
  // Try from visualcrossing
  rows = await visualcrossing.getWeather(
    run.start_latlng.x,
    run.start_latlng.y, 
    time,
    run.duration
  );
  if (rows) {
    console.log('  weather info retrieved from visual crossing');
  }

  // Fallback from metoffice
  if (!rows) {
    rows = await metoffice.getWeather(
      run.start_latlng.x,
      run.start_latlng.y, 
      time,
      run.duration
    );
    if (rows) {
      console.log('  weather info retrieved from metoffice');
    }
  } 
  if (!rows) {
    return null;
  }
  
  // Store them in the database
  for (let row of rows) {
    const id = await db.addWeather(strava_id,row);
    row.id = id;
    row.strava_id = strava_id;
  }
  // Return data
  return rows;
};
