import { fitbitHeartrate } from './localhost';
import { hms } from './duration';

export const addFitbitHeartRateToActivity = function(activity) {
  if (activity.has_heartrate) {
    return Promise.reject(new Error('Heartrate data already set'));
  }
  return fitbitHeartrate(activity.start_date_local, activity.elapsed_time)
    .then(response => {
      const series = response['activities-heart-intraday'];
      if (series) {
        const start = new Date(activity.start_date);
        const offset = start.getHours() * 3600 + start.getMinutes() * 60 + start.getSeconds();
        let data = series.dataset.map(x => ({time: hms(x.time) - offset, value: x.value}));
        // Remove preceeding time data from start of first minute
        // and any excess time from the end
        data = data.filter(x => x.time >= 0 && x.time <= activity.elapsed_time);
        const values = data.map(x => x.value);
        if (values.length === 0) {
          return activity;
        }
        let max = 0;
        let sum = 0;
        values.forEach(x => {
          sum += x;
          max = Math.max(max,x);
        });
        const newActivity = {...activity};
        newActivity.has_heartrate = true;
        newActivity.average_heartrate = sum / values.length;
        newActivity.max_heartrate = max;
        newActivity.heartrate_from_fitbit = true;
        return newActivity;
      }
      return Promise.reject(new Error('Could not get fitbit heartrate data'));
    });
};
