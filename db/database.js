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
    // Query interface
    // By default use pool, but may want to use client for grouped transactions
    this.qi = this.pool;
  }

  /**
   * Return the version of the run database data structure
   * @returns {String}
   */
  version() {
    // Return the version of the database
    if (this._version) {
      return Promise.resolve(this._version);
    }
    return this.qi.query(
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

  /**
   * Low-level add. Will fail if run already exists in database
   * @param {Object} data The Strava data for the run to add
   * @returns {Promise} A promise that resolves to the id if the run was added
   */
  addRun(data) {
    const isRace = data.workout_type === 1;
    return this.qi.query(
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

  /**
   * Query the database to see if a run with the same details already exists
   * If it does the data for this run is returned.
   * Only start_date_local is used to fetch the data
   * @param {Object} data The strava data for the run to fetch
   * @returns {Promise} A promise that resolves to null or the database row object
   */
  fetchRun(data) {
    return this.qi.query(
      'SELECT * FROM runs WHERE start_time = $1',
      [data.start_date_local]
    )
      .then(res => {
        if (res.rowCount === 1) {
          return res.rows[0];
        }
        return null;
      })
      .catch(err => {
        console.log('Error fetching run', err);
        return null;
      });
  }

  /**
   * Disconnect from the database
   * Release any connections
   */
  disconnect() {
    return this.pool.end();
  }
}