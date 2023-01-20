
import fs = require('fs');
import path = require('path');
import {Client, Pool, PoolClient, PoolConfig, QueryResult} from 'pg';
import { DBRunData } from './DBRunData';
import { HRData } from './HRData';
import { StravaRunData } from './StravaRunData';
import { DBWeatherData, WeatherData } from './WeatherData';

const point = function(arr: null|number[]) {
  if (arr == null) {
    return null;
  }
  return `(${arr[0]},${arr[1]})`;
};

type ConfigOptions = PoolConfig;

const defaults: PoolConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  database: 'running'
};

export class Database {

  protected configuration: PoolConfig;
  protected pool: Pool | null;
  protected qi: Client|Pool|PoolClient|null;
  protected savepoint_stack: string[];
  protected savepoint_id: number;
  protected _version: string|null = null;
  protected savepoint: string | null | undefined = null;

  constructor(config: null|ConfigOptions) {
    this.configuration = {...defaults, ...config};
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
   */
  public connected(): Promise<boolean> {
    const config = {...this.configuration};
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
  public async init() {
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
   */
  public exists(db = this.configuration.database) {
    const config = {...this.configuration};
    config.database = 'postgres';
    const client = new Client(config);
    return client.connect()
      .then(() => client.query('SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1', [db]))
      .then((res) => {
        client.end();
        return res.rowCount === 1;
      })
      .catch((err) => {
        client.end();
        return Promise.reject(err);
      });
  }

  /**
   * Return the version of the run database data structure
   */
  public version() {
    // Return the version of the database
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    if (this._version) {
      return Promise.resolve(this._version);
    }
    return this.qi.query(
      'SELECT value FROM properties WHERE key = \'version\' LIMIT 1'
    )
      .then((res) => {
        if (res.rowCount === 1) {
          this._version = res.rows[0].value;
          return this._version;
        }
        return undefined;
      });
  }

  /**
   * Get a value from the property key by key
   */
  public property(key: string): Promise<string | null | undefined> {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    return this.qi.query(
      'SELECT value FROM properties WHERE key = $1 LIMIT 1',
      [key]
    )
      .then((res) => {
        if (res.rowCount === 1) {
          return res.rows[0].value;
        }
        return undefined;
      });
  }

  /**
   * Set a value in the properties table
   * Either by inserting a new row or updating the existing one
   */
  public setProperty(key: string, value: string) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    return this.property(key)
      .then((oldValue) => {
        if (!this.qi) {
          throw Error("Not connected to database");
        }
        if (oldValue === undefined) {
          return this.qi.query(
            'INSERT INTO properties (key,value) values ($1,$2)',
            [key, value]
          );
        } else {
          if (key === 'version') {
            this._version = null;
          }
          return this.qi.query(
            'UPDATE properties SET value = $2 WHERE key = $1',
            [key, value]
          );
        }
      })
      .then((res) => res.rowCount === 1);
  }

  /**
   * Creates the database
   */
  public create(db = this.configuration.database) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    if (!db) {
      throw new Error('No database specified to create()');
    }
    if (!/^[a-z0-9_]+$/.test(db)) {
      throw new Error(`Invalid database name: ${db}`);
    }
    const config = {...this.configuration};
    config.database = 'postgres';
    const client = new Client(config);
    return client.connect()
      .then(() => client.query(`CREATE DATABASE ${db}`))
      .then((res) => {
        client.end();
        if (db === this.configuration.database) {
          this.disconnect();
          this.pool = new Pool(this.configuration);
          this.qi = this.pool;
        }
        return res.rowCount === 1;
      })
      .catch((err) => {
        client.end();
        return Promise.reject(err);
      });
  }

  /**
   * Drops the database
   */
  public drop(db = this.configuration.database) {
    if (!db) {
      throw new Error('No database specified to drop()');
    }
    if (['running', 'postgres'].includes(db)) {
      throw new Error('Trying to drop main database');
    }
    if (!/^[a-z0-9_]+$/.test(db)) {
      throw new Error('Invalid database name');
    }
    const config = {...this.configuration};
    config.database = 'postgres';
    const client = new Client(config);
    return client.connect()
      .then(() => {
        if (db === this.configuration.database) {
          this.disconnect();
        }
      })
      .then(() => client.query(`DROP DATABASE ${db}`))
      .then((res) => {
        client.end();
        return res.rowCount === 1;
      })
      .catch((err) => {
        client.end();
        return Promise.reject(err);
      });
  }

  /**
   * Low-level add. Will fail if run already exists in database
   */
  public addRun(data: StravaRunData) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    const isRace = data.workout_type === 1;
    return this.qi.query(
      `INSERT INTO runs (name, start_time, distance, duration, elevation,
        start_latlng, end_latlng, is_race, average_heartrate,
        max_heartrate, average_cadence, strava_id, moving_time, runtype)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING id`,
      [data.name, data.start_date_local, data.distance, data.elapsed_time,
        data.total_elevation_gain, point(data.start_latlng),
        point(data.end_latlng),
        isRace,
        data.has_heartrate ? data.average_heartrate : null,
        data.has_heartrate ? data.max_heartrate : null,
        data.average_cadence, data.id, data.moving_time, data.type]
    )
      .then((res: QueryResult<{id: DBRunData["id"]}>) => {
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
   */
  public fetchRun(data: {start_date_local: string}) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    return this.qi.query(
      'SELECT * FROM runs WHERE start_time = $1 LIMIT 1',
      [data.start_date_local]
    )
      .then((res: QueryResult<DBRunData>) => {
        if (res.rowCount === 1) {
          return res.rows[0];
        }
        return null;
      });
  }

  public fetchRunByStravaID(strava_id: number | string) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    return this.qi.query(
      'SELECT * FROM runs WHERE strava_id = $1 LIMIT 1',
      [Number(strava_id)]
    )
      .then((res: QueryResult<DBRunData>) => {
        if (res.rowCount === 1) {
          return res.rows[0];
        }
        return null;
      });
  }

  public fetchRunByID(id: number) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    return this.qi.query(
      'SELECT * FROM runs WHERE id = $1 LIMIT 1',
      [Number(id)]
    )
      .then((res: QueryResult<DBRunData>) => {
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
  public updateRun(data: StravaRunData): Promise<boolean|null> {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    return this.fetchRun(data)
      .then((rowData) => {
        if (!this.qi) {
          throw Error("Not connected to database");
        }
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
            [data.name, (data.workout_type === 1), rowData.id]
          )
            .then(() => true);
        }
        // No update required
        return false;
      });
  }

  /**
   * Update database from array of strava run data
   */
  public async updateRunData(runs: StravaRunData[]) {
    for (const run of runs) {
      if (run.type !== 'Run' && run.type !== 'VirtualRun') {
        continue;
      }
      try {
        await this.setRunAndRoute(run);
      } catch (err) {
        /* tslint:disable-next-line no-console */
        console.log('Error updating run data for run', run);
        /* tslint:disable-next-line no-console */
        console.log('Erorr:', err);
      }
    }
  }

  /**
   * Update / insert a run from the strava details if necessary
   * For new run, find the route it belongs to, or create a new route
   * @param {Object} data The strava data for the run to set
   */
  public async setRunAndRoute(data: StravaRunData) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    await this.startTransaction();
    try {
      const updated = await this.updateRun(data);
      if (updated == null) {
        // Does not exist in database, so add it
        const id = await this.addRun(data);
        if (data.type === 'Run') {
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
      }
    } catch (err) {
      await this.abortTransaction();
      throw err;
    }
    await this.endTransaction();
  }

  /**
   * Find a route matching the run data
   */
  public findRoute(data: StravaRunData) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
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
      [point(data.start_latlng), point(data.end_latlng),
        (data.distance - 250), (data.distance + 250),
        data.total_elevation_gain
      ]
    )
      .then((res) => {
        if (res.rowCount > 1) {
          /* tslint:disable-next-line no-console */
          console.log('More than one route matches run', data.name, data.distance, data.total_elevation_gain);
          return this.mergeRoutes(res);
        }
        return res;
      })
      .then((res) => {
        if (res.rowCount > 1) {
          let min_difference = null;
          let best_match = null;
          for (const row of res.rows) {
            const diff = Math.abs(data.distance - row.distance);
            if (min_difference === null || diff < min_difference) {
              min_difference = diff;
              best_match = row;
            }
          }
          return best_match ? best_match.id : null;
        }
        if (res.rowCount === 1) {
          const rows = res.rows;
          return rows[0].id;
        }
        return null;
      });
  }

  public async mergeRoutes(res: QueryResult<DBRunData>) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    let routes = Array.from(res.rows);
    const merged_routes = [];
    while (routes.length > 0) {
      const first = routes.shift() as DBRunData;
      /* tslint:disable-next-line no-console */
      console.log('first', first);
      merged_routes.push(first);
      const remaining = Array.from(routes);
      while (remaining.length > 0) {
        const next = remaining.shift() as DBRunData;
        /* tslint:disable-next-line no-console */
        console.log('next', next);
        if (next.start_latlng.x === first.start_latlng.x &&
            next.start_latlng.y === first.start_latlng.y &&
            next.end_latlng.x === first.end_latlng.x &&
            next.end_latlng.y === first.end_latlng.y &&
            Math.abs(next.distance - first.distance) < 250 &&
            Math.abs(next.elevation - first.elevation) < 5 + first.elevation * 0.2) {
          /* tslint:disable-next-line no-console */
          console.log('Merging routes', first.id, next.id);
          // Remove the route from the array being processed
          routes = routes.filter((x) => x.id !== next.id);
          // Merge the routes in the database
          await this.startTransaction();
          await this.qi.query(
            'UPDATE runs SET route_id = $1 WHERE route_id = $2',
            [first.id, next.id]
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
   * @returns {Promise<number>} id of row inserted
   */
  public addWeather(strava_id: number, data: WeatherData) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
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
      .then((res: QueryResult<DBWeatherData>) => {
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
  public getWeather(strava_id: number) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    return this.qi.query(
      'SELECT * FROM weather WHERE strava_id = $1',
      [strava_id]
    )
      .then((res: QueryResult<DBWeatherData>) => {
        if (res.rowCount > 0) {
          return res.rows.map((x) => {
            x.strava_id = Number(x.strava_id);
            return x;
          });
        }
        return null;
      });
  }

  /**
   * Get the heartrate data manually associated with a run
   * @param strava_id Id of the strava activity
   */
  public getManualHR(strava_id: number): Promise<HRData|null> {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    return this.qi.query(
      'SELECT average_heartrate, max_heartrate FROM manualhr WHERE strava_id = $1',
      [strava_id]
    ).then((res: QueryResult<HRData>) => {
      if (res.rowCount === 1) {
        return res.rows[0];
      }
      return null;
    });
  }

  public async setManualHR(strava_id: number, hrdata: HRData) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    const olddata = await this.getManualHR(strava_id);
    if (!olddata) {
      await this.qi.query(
        'INSERT INTO manualhr (strava_id,average_heartrate,max_heartrate) values ($1,$2,$3)',
        [strava_id, hrdata.average_heartrate, hrdata.max_heartrate]
      );
    } else {
      await this.qi.query(
        'UPDATE manualhr SET average_heartrate = $2, max_heartrate = $3 WHERE strava_id = $1',
        [strava_id, hrdata.average_heartrate, hrdata.max_heartrate]
      );
    }
  }

  /**
   * Create a route from a run
   * @param {Object} data The strava data for the run to use to create the route
   */
  public createRoute(data: StravaRunData) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
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
      .then((res: QueryResult<DBRunData>) => {
        if (res.rowCount === 1) {
          return res.rows[0].id;
        }
        return null;
      });
  }

  /**
   * Search the database for matching runs
   * @param {String} query The string to search on
   * @param {String} before The latest start date to match
   * @returns {Promise} A promise that resolves to null or the database rows
   */
  public search(query: string, before?: string) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    if (!query) {
      return Promise.resolve([]);
    }
    const words = query.split(' ');
    const conditions = [];
    const to_match = [];
    for (const word of words) {
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
    if (before) {
      conditions.push(`start_time < '${before}'`);
    }
    if (to_match.length > 0) {
      conditions.push('name ILIKE $1');
    }
    const params = to_match.length > 0 ? ['%' + to_match.join(' ') + '%'] : undefined;
    return this.qi.query(
      'SELECT * FROM runs WHERE ' + conditions.join(' AND ') + ' ORDER BY start_time DESC LIMIT 20',
      params
    )
      .then((res: QueryResult<DBRunData>) => res.rows);

  }

  public tableExists(tableName: string) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    return this.qi.query(
      'SELECT 1 FROM pg_tables WHERE schemaname = \'public\' AND tablename = $1',
      [tableName]
    )
      .then((res) => {
        return res.rowCount === 1;
      });
  }

  public async createTables() {
    await this.startTransaction();
    try {
      await this._execSQL('properties.sql');
      await this._execSQL('routes.sql');
      await this._execSQL('runs.sql');
      await this._execSQL('weather.sql');
      await this._execSQL('manualhr.sql');
      await this.setProperty('version', '1.4');
    } catch (err) {
      await this.abortTransaction();
      throw err;
    }
    await this.endTransaction();
  }

  public _execSQL(file: string) {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    return new Promise((resolve, reject) => {
      // Only exec files in the db directory
      const parent = path.dirname(__dirname);
      const db_path = path.join(parent, 'db');
      fs.readdir(db_path, (err, files) => {
        if (err) {
          return reject(err);
        }
        const sql_files = files.filter((x) => x.endsWith('.sql'));
        if (!sql_files.includes(file)) {
          return reject(new Error(`No such sql file ${file}`));
        }
        fs.readFile(path.join(db_path, file), (err2, buffer) => {
          if (!this.qi) {
            throw Error("Not connected to database");
          }
          if (err2) {
            return reject(err2);
          }
          const sql = buffer.toString();
          this.qi.query(sql, (err3, res) => {
            if (err3) {
              return reject(err3);
            }
            return resolve(res);
          });
        });
      });
    });
  }

  public startTransaction() {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    if (this.qi !== this.pool) {
      // Transaction already in progress. Use savepoint
      if (this.savepoint) {
        this.savepoint_stack.push(this.savepoint);
      }
      this.savepoint = 'tx_savepoint_' + (++this.savepoint_id);
      return this.qi.query(`SAVEPOINT ${this.savepoint}`);
    }
    return this.pool.connect()
      .then((client) => {
        this.qi = client;
        return this.qi.query('BEGIN');
      });
  }

  public abortTransaction() {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
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
        const client = this.qi as PoolClient;
        this.qi = this.pool;
        this.savepoint_id = 0;
        client.release();
      });
  }

  public endTransaction() {
    if (!this.qi) {
      return Promise.reject("Not connected to database");
    }
    if (this.qi === this.pool) {
      throw new Error('Transaction not in progress');
    }
    if (this.savepoint) {
      this.savepoint = this.savepoint_stack.pop();
      return Promise.resolve(null);
    }
    return this.qi.query('COMMIT')
      .then(() => {
        const client = this.qi as PoolClient;
        this.qi = this.pool;
        this.savepoint_id = 0;
        client.release();
      });
  }

  public async updateTables() {
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
        /* tslint:disable-next-line no-console */
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
        /* tslint:disable-next-line no-console */
        console.log('Updated running database to version 1.2');
        // deliberate fall through
      case '1.2':
        await this._execSQL('manualhr.sql');
        await this.setProperty('version', '1.3');
        console.log('Updated running database to version 1.3');
        // deliberate fall through
      case '1.3':
        await this._execSQL('add_runtype.sql');
        await this.setProperty('version', '1.4');
        console.log('Updated running database to version 1.4');
      case '1.4':
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
  public disconnect() {
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
export const row_to_strava_run = function(row: DBRunData) {
  const data = {
    id : Number(row.strava_id),
    type : row.runtype,
    name : row.name,
    workout_type : row.is_race ? 1 : null,
    elapsed_time : row.duration,
    moving_time : row.duration,
    distance : row.distance,
    start_date : row.start_time,
    start_date_local : row.start_time,
    total_elevation_gain : row.elevation,
    has_heartrate : row.average_heartrate ? true as true : false as false,
    average_cadence : row.average_cadence,
    start_latlng : row.start_latlng ? [row.start_latlng.x, row.start_latlng.y] as [number, number] : null,
    end_latlng : row.end_latlng ? [row.end_latlng.x, row.end_latlng.y] as [number, number] : null
  };
  let strava_data: StravaRunData;
  if (row.average_heartrate) {
    strava_data = {
      ...data,
      has_heartrate: true,
      average_heartrate: row.average_heartrate,
      max_heartrate: row.max_heartrate
    };
  } else {
    strava_data = {
      ...data,
      has_heartrate: false
    };
  }
  return strava_data;
};

export const strava_activity_to_row = function(data: StravaRunData) {
  const row = {
    strava_id : Number(data.id),
    name : data.name,
    is_race : data.workout_type === 1 ? true : false,
    duration : data.elapsed_time,
    distance : data.distance,
    start_time : data.start_date_local,
    elevation : data.total_elevation_gain,
    average_heartrate : data.has_heartrate ? data.average_heartrate : null,
    max_heartrate : data.has_heartrate ? data.max_heartrate : null,
    average_cadence : data.average_cadence,
    start_latlng : data.start_latlng ? {x: data.start_latlng[0], y: data.start_latlng[1]} : null,
    end_latlng : data.end_latlng ? {x: data.end_latlng[0], y: data.end_latlng[1]} : null
  };
  return row;
};

// To start database using docker
// docker run -it --rm -p 5432:5432 -v pgdata:/var/lib/postgresql/data postgres
