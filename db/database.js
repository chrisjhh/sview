const { Pool } = require('pg');

const point = function(arr) {
  return `(${arr[0]},${arr[1]})`;
};
export class Database {
  constructor() {
    this.pool = new Pool({
      host: 'localhost',
      user: 'postgres',
      database: 'running'
    });
  }

  version() {
    // Return the version of the database
    if (this._version) {
      return Promise.resolve(this._version);
    }
    return this.pool.query(
      'SELECT value FROM properties WHERE key = \'version\''
    )
      .then(res => {
        if (res.rowCount === 1) {
          this._version = res.rows[0].value;
          return this._version;
        }
        return undefined;
      });
  }

  addRun(data) {
    const isRace = data.workout_type === 1;
    return this.pool.query(
      `INSERT INTO runs (name, start_time, distance, duration, elevation,
        start_latlng, end_latlng, is_race, average_heartrate,
        max_heartrate, average_cadence, strava_id, moving_time)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING id`,
      [data.name, data.start_date_local, data.distance, data.elapsed_time,
        data.total_elevation_gain, point(data.start_latlng), 
        point(data.end_latlng),
        isRace, data.average_heartrate, data.max_heartrate,
        data.average_cadence, data.id, data.moving_time]
    )
      .then(res => {
        if (res.rowCount === 1) {
          return res.rows[0].id;
        }
        return null;
      })
      .catch(err => {
        console.log('Error adding run', err);
        return null;
      });
  }

  disconnect() {
    return this.pool.end();
  }
}