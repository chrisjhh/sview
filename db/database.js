const { Pool, Client } = require('pg');

const point = function(arr) {
  return `(${arr[0]},${arr[1]})`;
};

const defaults = {
  host: 'localhost',
  user: 'postgres',
  database: 'running'
};
export class Database {
  constructor(config) {
    this.configuration = {...defaults,...config};
    this.pool = new Pool(this.configuration);
    // Query interface
    // By default use pool, but may want to use client for grouped transactions
    this.qi = this.pool;
  }

  /**
   * Check if the database server is connected
   * @returns {boolean}
   */
  connected() {
    let config = {...this.configuration};
    config.database = 'postgres';
    const client = new Client(config);
    return client.connect()
      .then(() => {
        client.end();
        return true;
      })
      .catch(() => false);
  }

  /**
   * Check if the database exists
   * @param {String} db Optional name of database to check. 
   */
  exists(db = this.configuration.database) {
    let config = {...this.configuration};
    config.database = 'postgres';
    const client = new Client(config);
    return client.connect()
      .then(() => client.query('SELECT 1 FROM pg_database WHERE datname = $1', [db]))
      .then(res => {
        client.end();
        return res.rowCount === 1;
      })
      .catch(err => {
        client.end();
        return Promise.reject(err);
      });
    //.finally(() => client.end());
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
      'SELECT value FROM properties WHERE key = \'version\' LIMIT 1'
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
      });
    // .catch(err => {
    //   console.log('Error adding run', err);
    //   return null;
    // });
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
      'SELECT * FROM runs WHERE start_time = $1 LIMIT 1',
      [data.start_date_local]
    )
      .then(res => {
        if (res.rowCount === 1) {
          return res.rows[0];
        }
        return null;
      });
    // .catch(err => {
    //   console.log('Error fetching run', err);
    //   return null;
    // });
  }

  /**
   * Update a run in the database
   * Does nothing if the run does not need updating
   * @param {Object} data The strava data of the run to update
   */
  updateRun(data) {
    return this.fetchRun(data)
      .then(rowData => {
        if (rowData == null) {
          return null;
        }
        if (Number(rowData.strava_id) !== data.id) {
          return Promise.reject(
            new Error('Run to update does not reference the same strava run')
          );
        }
        if (rowData.name !== data.name ||
            rowData.is_race !== (data.workout_type === 1)) {
          return this.qi.query(
            'UPDATE runs SET name = $1, is_race = $2 WHERE id = $3',
            [data.name, (data.workout_type == 1), rowData.id]
          )
            .then(() => true);
        }
        // No update required
        return false;
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