import { activityType } from "./StravaRunData"

export type DBRunData = {
  id: number,
  name: string,
  start_time: string,
  distance: number,
  duration: number,
  elevation: number,
  start_latlng: point,
  end_latlng: point,
  is_race: boolean,
  average_heartrate: number,
  max_heartrate: number,
  average_cadence: number,
  strava_id: number,
  moving_time: number,
  runtype: activityType
};

type point = {
  x: number,
  y: number
};
