export type StavaRunData = BaseRunData & HRdata;

type BaseRunData = {
  name: string,
  distance: number,
  moving_time: number,
  elapsed_time: number,
  total_elevation_gain: number,
  type: ("Run"|"Swim"|"Ride"|"Walk"|"Workout"),
  id: number,
  workout_type: number,
  start_date: string,
  start_date_local: string,
  timezone: string,
  utc_offset: number,
  start_latlng: [number, number],
  end_latlng: [number, number],
  kudos_count: number,
  achievement_count: number,
  comment_count: number,
  average_cadence: number | null,
  location_city: string | null,
  location_state: string | null,
  location_country: string | null,
  start_longitude: number,
  start_latitude: number
};

type HRdata = noHRdata | hasHRdata;

type noHRdata = {
  has_heartrate: false
};

type hasHRdata = {
  has_heartrate: true,
  max_heartrate: number,
  average_heartrate: number
};
