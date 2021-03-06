const { Pool, Client } = require('pg');
const path = require('path');
const fs = require('fs');

const point = function(arr) {
  if (arr == null) {
    return null;
  }
  return `(${arr[0]},${arr[1]})`;
};

const defaults = {
  host: 'localhost',
  port: 5432,
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
    // Savepoint stack
    this.savepoint_stack = [];
    this.savepoint_id = 0;
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
   * Initialise the database
   * Creates the database and tables if they do not exist
   * Updates tables if necessary
   * Must be connected
   */
  async init() {
    if (!await this.exists()) {
      // Create the database and the tables
      await this.create();
      await this.createTables();
    } else {
      await this.updateTables();
    }
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
      .then(() => client.query('SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1', [db]))
      .then(res => {
        client.end();
        return res.rowCount === 1;
      })
      .catch(err => {
        client.end();
        return Promise.reject(err);
      });
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
   * Get a value from the property key by key
   * @param {String} key 
   */
  property(key) {
    return this.qi.query(
      'SELECT value FROM properties WHERE key = $1 LIMIT 1',
      [key]
    )
      .then(res => {
        if (res.rowCount === 1) {
          return res.rows[0].value;
        }
        return undefined;
      });
  }

  /**
   * Set a value in the properties table
   * Either by inserting a new row or updating the existing one
   * @param {String} key 
   * @param {String} value 
   */
  setProperty(key,value) {
    return this.property(key)
      .then(oldValue => {
        if (oldValue === undefined) {
          return this.qi.query(
            'INSERT INTO properties (key,value) values ($1,$2)',
            [key,value]
          );
        } else {
          if (key === 'version') {
            this._version = null;
          }
          return this.qi.query(
            'UPDATE properties SET value = $2 WHERE key = $1',
            [key,value]
          );
        }
      });
  }

  /**
   * Creates the database
   */
  create(db = this.configuration.database) {
    if (!/^[a-z0-9_]+$/.test(db)) {
      throw new Error(`Invalid database name: ${db}`);
    }
    let config = {...this.configuration};
    config.database = 'postgres';
    const client = new Client(config);
    return client.connect()
      .then(() => client.query(`CREATE DATABASE ${db}`))
      .then(res => {
        client.end();
        if (db === this.configuration.database) {
          this.disconnect();
          this.pool = new Pool(this.configuration);
          this.qi = this.pool;
        }
        return res.rowCount === 1;
      })
      .catch(err => {
        client.end();
        return Promise.reject(err);
      });
  }

  /**
   * Drops the database
   * @param {String} db Optional database to drop
   */
  drop(db = this.configuration.database) {
    if (['running', 'postgres'].includes(db)) {
      throw new Error('Trying to drop main database');
    }
    if (!/^[a-z0-9_]+$/.test(db)) {
      throw new Error('Invalid database name');
    }
    let config = {...this.configuration};
    config.database = 'postgres';
    const client = new Client(config);
    return client.connect()
      .then(() => {
        if (db === this.configuration.database) {
          this.disconnect();
        }
      })
      .then(() => client.query(`DROP DATABASE ${db}`))
      .then(res => {
        client.end();
        return res.rowCount === 1;
      })
      .catch(err => {
        client.end();
        return Promise.reject(err);
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
  }

  fetchRunByStravaID(strava_id) {
    return this.qi.query(
      'SELECT * FROM runs WHERE strava_id = $1 LIMIT 1',
      [Number(strava_id)]
    )
      .then(res => {
        if (res.rowCount === 1) {
          return res.rows[0];
        }
        return null;
      });
  }

  fetchRunByID(id) {
    return this.qi.query(
      'SELECT * FROM runs WHERE id = $1 LIMIT 1',
      [Number(id)]
    )
      .then(res => {
        if (res.rowCount === 1) {
          return res.rows[0];
        }
        return null;
      });
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
   * Update database from array of strava run data
   * @param {Array} runs 
   */
  async updateRunData(runs) {
    for (let run of runs) {
      if (run.type !== 'Run') {
        continue;
      }
      try {
        await this.setRunAndRoute(run);
      } catch (err) {
        console.log('Error updating run data for run', run);
        console.log('Erorr:', err);
      }
    }
  }

  /**
   * Update / insert a run from the strava details if necessary
   * For new run, find the route it belongs to, or create a new route
   * @param {Object} data The strava data for the run to set
   */
  async setRunAndRoute(data) {
    //console.log('setRunAndRoute');
    await this.startTransaction();
    try {
      const updated = await this.updateRun(data);
      if (updated == null) {
        // Does not exist in database, so add it
        const id = await this.addRun(data);
        // Find the route
        let route_id = await this.findRoute(data);
        if (route_id == null) {
          // Create a new route for this run
          route_id = await this.createRoute(data);
        }
        if (route_id != null) {
          // Set the route id for this run
          await this.qi.query(
            'UPDATE runs SET route_id = $1 WHERE id = $2',
            [route_id, id]
          );
          // Update the route with new average distance and elevation
          await this.qi.query(
            `UPDATE
              routes 
            SET 
              (distance, elevation) = 
              (SELECT 
                avg(distance), avg(elevation)
              FROM
                runs
              WHERE
                route_id = $1
              )
            WHERE id = $1`,
            [route_id]
          );
        }
      }
    } catch(err) {
      await this.abortTransaction();
      throw err;
    }
    await this.endTransaction();
  }

  /**
   * Find a route matching the run data
   * @param {Object} data 
   */
  findRoute(data) {
    //console.log('findRoute');
    if (!data.distance || !data.start_latlng || !data.end_latlng) {
      return Promise.resolve(null);
    }
    return this.qi.query(
      `SELECT 
        *
      FROM routes 
      WHERE 
        start_latlng ~= $1 AND 
        end_latlng ~= $2 AND 
        distance BETWEEN $3 AND $4 AND
        elevation BETWEEN 
          $5 - (5 + elevation * 0.2) 
        AND 
          $5 + (5 + elevation * 0.2)`,
      [point(data.start_latlng),point(data.end_latlng),
        (data.distance - 250), (data.distance + 250),
        data.total_elevation_gain
      ]
    )
      .then(res => {
        if (res.rowCount > 1) {
          console.log('More than one route matches run', data.name, data.distance, data.total_elevation_gain);
          return this.mergeRoutes(res);
        }
        return res;
      })
      .then(res => {
        if (res.rowCount > 1) {
          let min_difference = null;
          let best_match = null;
          for (let row of res.rows) {
            let diff = Math.abs(data.distance - row.distance);
            if (min_difference === null || diff < min_difference) {
              min_difference = diff;
              best_match = row;
            }
          }
          return best_match.id;
        }
        if (res.rowCount === 1) {
          return res.rows[0].id;
        }
        return null;
      });
  }

  async mergeRoutes(res) {
    //console.log('mergeRoutes');
    let routes = Array.from(res.rows);
    const merged_routes = [];
    while(routes.length > 0) {
      const first = routes.shift();
      console.log('first',first);
      merged_routes.push(first);
      const remaining = Array.from(routes);
      while (remaining.length > 0) {
        const next = remaining.shift();
        console.log('next',next); 
        if (next.start_latlng.x === first.start_latlng.x &&
            next.start_latlng.y === first.start_latlng.y &&
            next.end_latlng.x === first.end_latlng.x &&
            next.end_latlng.y === first.end_latlng.y &&
            Math.abs(next.distance - first.distance) < 250 &&
            Math.abs(next.elevation - first.elevation) < 5 + first.elevation * 0.2) {
          console.log('Merging routes',first.id,next.id);
          // Remove the route from the array being processed
          routes = routes.filter(x => x.id !== next.id);
          // Merge the routes in the database
          await this.startTransaction();
          await this.qi.query(
            'UPDATE runs SET route_id = $1 WHERE route_id = $2',
            [first.id,next.id]
          );
          await this.qi.query(
            'DELETE FROM routes WHERE id = $1',
            [next.id]
          );
          await this.qi.query(
            `UPDATE
              routes 
            SET 
              (distance, elevation) = 
              (SELECT 
                avg(distance), avg(elevation)
              FROM
                runs
              WHERE
                route_id = $1
              )
            WHERE id = $1`,
            [first.id]
          );
          await this.endTransaction();
        }
      }
    }
    return {
      rowCount: merged_routes.length,
      rows: merged_routes
    };
  }

  /**
   * Add weather values associated with a run
   * @param {*} strava_id The strava_id of the run
   * @param {*} data The weather data to add. Must have timestamp
   * @returns {Number} id of row inserted
   */
  addWeather(strava_id, data) {
    return this.qi.query(
      `INSERT INTO weather (strava_id, timestamp, city,
        wind_speed, wind_direction, humidity, dew_point,
        pressure, snow, precipitation, temperature,
        cloud_coverage, solar_elevation, solar_azimuth,
        visibility,sea_level_pressure,uv,description
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
          $12,$13,$14,$15,$16,$17,$18)
        RETURNING id`,
      [strava_id, data.timestamp, data.city, data.wind_speed,
        data.wind_direction, data.humidity, data.dew_point,
        data.pressure, data.snow, data.precipitation,
        data.temperature, data.cloud_coverage,
        data.solar_elevation, data.solar_azimuth,
        data.visibility, data.sea_level_pressure,
        data.uv, data.weather_description
      ]
    )
      .then(res => {
        if (res.rowCount === 1) {
          return res.rows[0].id;
        }
        return null;
      });
  }

  /**
   * Get the weather data associated with a run
   * @param {Number} strava_id The strava id of the run 
   * @returns {Array|null} Array of timestamped weather data, or null if no data
   */
  getWeather(strava_id) {
    return this.qi.query(
      'SELECT * FROM weather WHERE strava_id = $1',
      [strava_id]
    )
      .then(res => {
        if (res.rowCount > 0) {
          return res.rows.map(x => {
            x.strava_id = Number(x.strava_id);
            return x;
          });
        }
        return null;
      });
  }

  /**
   * Create a route from a run
   * @param {Object} data The strava data for the run to use to create the route
   */
  createRoute(data) {
    //console.log('createRoute');
    if (!data.distance || !data.start_latlng || !data.end_latlng) {
      return Promise.resolve(null);
    }
    return this.qi.query(
      `INSERT INTO 
        routes 
        (distance, elevation, start_latlng, end_latlng)
      VALUES
        ($1, $2, $3, $4)
      RETURNING id`,
      [data.distance, data.total_elevation_gain,
        point(data.start_latlng), point(data.end_latlng)]
    )
      .then(res => {
        if (res.rowCount === 1) {
          return res.rows[0].id;
        }
        return null;
      });
  }

  /**
   * Search the database for matching runs
   * @param {String} query The string to search on
   * @returns {Promise} A promise that resolves to null or the database rows
   */
  search(query) {
    if (!query) {
      return Promise.resolve([]);
    }
    let words = query.split(' ');
    let conditions = [];
    let to_match = [];
    for (let word of words) {
      if (word.toLowerCase() === 'race') {
        conditions.push('(name ILIKE \'%race%\' OR is_race)');
      } else if (word.match(/^20\d{2}/)) {
        conditions.push(`(name LIKE '%${word}%' OR date_part('year', start_time) = ${word})`);
      } else if (word.toUpperCase() === '10K') {
        conditions.push('(name ILIKE \'%10K%\' OR (distance > 9750 AND distance < 10350))');
      } else if (word.toUpperCase() === '5K') {
        conditions.push('(name ILIKE \'%5K%\' OR (distance > 4750 AND distance < 5350))');
      } else if (word.toUpperCase() === 'HM') {
        conditions.push('(distance > 20500 AND distance < 21950)');
      } else {
        to_match.push(word);
      }
    }
    if (to_match.length > 0) {
      conditions.push('name ILIKE $1');
    }
    let params = to_match.length > 0 ? ['%' + to_match.join(' ') + '%'] : undefined;
    //console.log('SELECT * FROM runs WHERE ' + conditions.join(' AND '), params);
    return this.qi.query(
      'SELECT * FROM runs WHERE ' + conditions.join(' AND ') + ' ORDER BY start_time DESC LIMIT 20',
      params
    )
      .then(res => res.rows);

  }


  tableExists(tableName) {
    return this.qi.query(
      'SELECT 1 FROM pg_tables WHERE schemaname = \'public\' AND tablename = $1',
      [tableName]
    )
      .then(res => {
        return res.rowCount === 1;
      });
  }

  async createTables() {
    await this.startTransaction();
    try {
      await this._execSQL('properties.sql');
      await this._execSQL('routes.sql');
      await this._execSQL('runs.sql');
      await this._execSQL('weather.sql');
      await this.setProperty('version', '1.2');
    } catch(err) {
      await this.abortTransaction();
      throw err;
    }
    await this.endTransaction();
  }

  _execSQL(file) {
    return new Promise((resolve, reject) => {
    // Only exec files in the current directory
      fs.readdir(__dirname, (err, files) => {
        if (err) {
          return reject(err);
        }
        const sql_files = files.filter(x => x.endsWith('.sql'));
        if (!sql_files.includes(file)) {
          return reject(new Error(`No such sql file ${file}`));
        }
        fs.readFile(path.join(__dirname,file), (err, buffer) => {
          if (err) {
            return reject(err);
          }
          const sql = buffer.toString();
          this.qi.query(sql, (err, res) => {
            if (err) {
              return reject(err);
            }
            return resolve(res);
          });
        });
      });
    });
  }


  startTransaction() {
    //console.log('startTransaction');
    if (this.qi !== this.pool) {
      // Transaction already in progress. Use savepoint
      if (this.savepoint) {
        this.savepoint_stack.push(this.savepoint);
      }
      this.savepoint = 'tx_savepoint_' + (++this.savepoint_id);
      return this.qi.query(`SAVEPOINT ${this.savepoint}`);
    }
    return this.pool.connect()
      .then(client => {
        this.qi = client;
        return this.qi.query('BEGIN');
      });
  }

  abortTransaction() {
    //console.log('abortTransaction');
    if (this.qi === this.pool) {
      throw new Error('Transaction not in progress');
    }
    if (this.savepoint) {
      const savepoint = this.savepoint;
      this.savepoint = this.savepoint_stack.pop();
      return this.qi.query(`ROLLBACK TO ${savepoint}`);
    }
    return this.qi.query('ROLLBACK')
      .then(() => {
        const client = this.qi;
        this.qi = this.pool;
        this.savepoint_id = 0;
        client.release();
      });
  }

  endTransaction() {
    //console.log('endTransaction');
    if (this.qi === this.pool) {
      throw new Error('Transaction not in progress');
    }
    if (this.savepoint) {
      this.savepoint = this.savepoint_stack.pop();
      return Promise.resolve(null);
    }
    return this.qi.query('COMMIT')
      .then(() => {
        const client = this.qi;
        this.qi = this.pool;
        this.savepoint_id = 0;
        client.release();
      });
  }

  async updateTables() {
    const version = await this.version();
    switch (version) {
      case '1.0':
        // We need to create the weather table
        // (First we need a unique conmstraint so strava id can be
        // used as foreign key)
        await this.startTransaction();
        await this._execSQL('run_unique_strava_id.sql');
        await this._execSQL('weather1.1.sql');
        await this.setProperty('version', '1.1');
        await this.endTransaction();
        console.log('Updated running database to version 1.1');
        // deliberate fall through
      case '1.1':
        await this.startTransaction();
        // Drop foreign key on weather to allow weather info on non-run activities
        await this._execSQL('drop_weather_foreign_key.sql');
        // Store weather description details obtained from met office for
        // an alternative way of telling if it was raining etc.
        await this._execSQL('add_weather_description.sql');
        await this.setProperty('version', '1.2');
        await this.endTransaction();
        console.log('Updated running database to version 1.2');
        break;
      case '1.2':
        // This is the current version
        // Everything is OK
        break;
      default:
        // Unknown version
        // Cannot continue
        throw new Error(`Unknown and unsupported database version ${version}`);
    }
  }

  /**
   * Disconnect from the database
   * Release any connections
   */
  disconnect() {
    if (this.pool != null) {
      const pool = this.pool;
      this.pool = null;
      this.qi = null;
      pool.end();
    }
  }
}

/**
 * Convert a datbase row representing a run to the equivalent strava data that would
 * be retrieved with activities
 */
export const row_to_strava_run = function(row) {
  let data = {
    id : Number(row.strava_id),
    type : 'Run',
    name : row.name,
    workout_type : row.is_race ? 1 : null,
    elapsed_time : row.duration,
    moving_time : row.duration,
    distance : row.distance,
    start_date : row.start_time,
    start_date_local : row.start_time,
    total_elevation_gain : row.elevation,
    has_heartrate : row.average_heartrate ? true : false,
    average_heartrate : row.average_heartrate,
    max_heartrate : row.max_heartrate,
    average_cadence : row.average_cadence,
    start_latlng : row.start_latlng ? [row.start_latlng.x, row.start_latlng.y] : null,
    end_latlng : row.end_latlng ? [row.end_latlng.x, row.end_latlng.y] : null
  };
  return data;
};

export const strava_activity_to_row = function(data) {
  let row = {
    strava_id : Number(data.id),
    name : data.name,
    is_race : data.workout_type === 1 ? true : false,
    duration : data.elapsed_time,
    distance : data.distance,
    start_time : data.start_date_local,
    elevation : data.total_elevation_gain,
    average_heartrate : data.average_heartrate,
    max_heartrate : data.max_heartrate,
    average_cadence : data.average_cadence,
    start_latlng : {x: data.start_latlng[0], y: data.start_latlng[1]},
    end_latlng : {x: data.end_latlng[0], y: data.end_latlng[1]}
  };
  return row;
};

// To start database using docker
// docker run -it --rm -p 5432:5432 -v pgdata:/var/lib/postgresql/data postgres
