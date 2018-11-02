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
          $5 - GREATEST(5, elevation * 0.2) 
        AND 
          $5 + GREATEST(5, elevation * 0.2)`,
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
            Math.abs(next.elevation - first.elevation < 5)) {
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
      await this.qi.query('INSERT INTO properties (key,value) values (\'version\',\'1.1\')');
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
        await this._execSQL('weather.sql');
        await this.setProperty('version', '1.1');
        await this.endTransaction();
        break;
      case '1.1':
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

// To start database using docker
// docker run -it --rm -p 5432:5432 -v pgdata:/var/lib/postgresql/data postgres
