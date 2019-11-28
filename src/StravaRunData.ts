export type StravaRunData = BaseRunData & HRdata;

type activityType = ("AlpineSki" |
  "BackcountrySki" |
  "Canoeing" |
  "Crossfit" |
  "EBikeRide" |
  "Elliptical" |
  "Golf" |
  "Handcycle" |
  "Hike" |
  "IceSkate" |
  "InlineSkate" |
  "Kayaking" |
  "Kitesurf" |
  "NordicSki" |
  "Ride" |
  "RockClimbing" |
  "RollerSki" |
  "Rowing"  |
  "Run" |
  "Sail" |
  "Skateboard" |
  "Snowboard" |
  "Snowshoe" |
  "Soccer" |
  "StairStepper" |
  "StandUpPaddling" |
  "Surfing" |
  "Swim"  |
  "Velomobile" |
  "VirtualRide" |
  "VirtualRun" |
  "Walk" |
  "WeightTraining" |
  "Wheelchair" |
  "Windsurf" |
  "Workout"  |
  "Yoga");

type BaseRunData = {
  name: string,
  distance: number,
  moving_time: number,
  elapsed_time: number,
  total_elevation_gain: number,
  type: activityType,
  id: number,
  workout_type: number | null,
  start_date: string,
  start_date_local: string,
  timezone?: string,
  utc_offset?: number,
  start_latlng: [number, number] | null,
  end_latlng: [number, number] | null,
  kudos_count?: number,
  achievement_count?: number,
  comment_count?: number,
  average_cadence: number | null,
  location_city?: string,
  location_state?: string,
  location_country?: string,
  start_longitude?: number,
  start_latitude?: number
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
