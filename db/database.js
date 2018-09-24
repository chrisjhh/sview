const { Pool } = require('pg');

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

  disconnect() {
    return this.pool.end();
  }
}