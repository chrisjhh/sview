
import * as weatherbit from './weatherbit';


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
    return null;
  }
  let time = new Date(run.start_time);
  // Is this within the last month
  const now = new Date().getTime();
  const then = time.getTime();
  const month = 1000 * 60 * 60 * 24 * 30;
  if (now - then > month) {
    // We cant fetch the weather for this run
    return null;
  }
  // Get the data from weatherbit
  rows = await weatherbit.getWeather(
    run.start_latlng.x,
    run.start_latlng.y, 
    time,
    run.duration
  );
  if (!rows) {
    return null;
  }
  console.log('  weather info retrieved from weatherbit.io');
  // Store them in the database
  for (let row of rows) {
    const id = await db.addWeather(strava_id,row);
    row.id = id;
    row.strava_id = strava_id;
  }
  // Return data
  return rows;
};