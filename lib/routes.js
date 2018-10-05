// Interface to database to get info on routes

export class Routes {
  constructor(database) {
    this.db = database;
  }

  /**
   * Return the route id of the run with the given strava id
   * @param {Number} strava_id 
   */
  route(strava_id) {
    if (!/^\d+$/.test(strava_id)) {
      throw new Error('strava_id not in correct format');
    }
    return this.db.qi.query(
      'SELECT route_id FROM runs WHERE strava_id = $1',
      [strava_id]
    )
      .then(res => {
        if (res.rowCount > 1) {
          throw new Error('More than one run with same strava_id');
        }
        if (res.rowCount == 1) {
          return res.rows[0].route_id;
        }
        return null;
      });
  }

  /**
   * Return the list of runs for a particular route
   * @param {Integer} route_id 
   */
  runs(route_id, options) {
    if (!/^\d+$/.test(route_id)) {
      throw new Error('route_id not in correct format');
    }
    let max_entries = 20;
    if (options && options.max_entries) {
      if (!/^\d+$/.test(options.max_entries)) {
        throw new Error('options.max_entries not in correct format');
      }
      max_entries = options.max_entries;
    }
    let where_clause = '';
    if (options) {
      let conditions = [];
      if (options.before) {
        let time = new Date(options.before).toISOString();
        conditions.push(`start_time < ${time}`);
      }
      if (options.after) {
        let time = new Date(options.after).toISOString();
        conditions.push(`start_time > ${time}`);
      }
      if (conditions.length) {
        where_clause = 'AND ' + conditions.join(' AND '); 
      }
    }
    return this.db.qi.query(
      `SELECT * FROM runs WHERE route_id = $1 ${where_clause}
      ORDER BY start_time LIMIT $2`,
      [route_id, max_entries]
    )
      .then(res => res.rows.map(toStrava));
  }
}

/**
 * Convert database row data to psudo strava format
 */
export const toStrava = function(rowData) {
  return {
    id: Number(rowData.strava_id),
    name: rowData.name,
    distance: rowData.distance,
    elapsed_time: rowData.duration,
    moving_time: rowData.moving_time,
    total_elevation_gain: rowData.elevation,
    type: 'Run',
    workout_type: rowData.is_race ? 1 : 0,
    start_date_local: rowData.start_time,
    start_date: rowData.start_time,
    start_latlng: [rowData.start_latlng.x, rowData.start_latlng.y],
    end_latlng: [rowData.end_latlng.x, rowData.end_latlng.y],
    has_heartrate: rowData.average_heartrate ? true : false,
    average_heartrate: rowData.average_heartrate,
    max_heartrate: rowData.max_heartrate,
    average_cadence: rowData.average_cadence
  };
};