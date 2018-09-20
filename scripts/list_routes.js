
// Load the last year's worth of activities
/*eslint no-console: ["off"] */

import { getActivities } from '../lib/cached_strava';

// const getActivitiesSync = async function(before, after) {
//   const data = await getActivities({before,after});
//   return data;
// };

let before = new Date(2018, 9, 20);
let after = new Date(2016, 9, 20);
let per_page = 100;
getActivities({before, after, per_page})
  .then(data => {

    let details = [];

    for (let activity of data) {
      if (activity.type !== 'Run') {
        continue;
      }
      let obj = {};
      obj.name = activity.name;
      obj.distance = activity.distance;
      obj.start = activity.start_latlng;
      obj.end = activity.start_latlng;
      obj.elevation = activity.total_elevation_gain;

      if (obj.start != null) {
        details.push(obj);
      }
    }

    let routes = [];
    const route_match = function(a,b) {
      if (a.start == null || b.start == null || a.end == null || b.end == null) {
        return false;
      }
      if (a.start[0] !== b.start[0] || a.start[1] !== b.start[1] ||
          a.end[0] !== b.end[0] || a.end[1] !== b.end[1]) {
        return false;
      }
      if (Math.abs(a.distance - b.distance) > 250) {
        return false;
      }
      if (Math.abs(a.elevation - b.elevation) > 5) {
        return false;
      }
      return true;
    };

    details.sort((a,b) => a.distance - b.distance);
    for (let run of details) {
      let route = routes.find(x => route_match(run,x));
      if (route != undefined) {
        route.entries.push(run);
      } else {
        route = {...run};
        route.entries = [run];
        routes.push(route);
      }
      // console.log(run);
    }

    for (let route of routes) {
      console.log('Route: ');
      for (let run of route.entries) {
        console.log('  ', run.name, run.distance, run.elevation, run.start, run.end);
      }
      console.log(' ');
    }
  });