export type WeatherData = CommonData & ExternalData;
export type DBWeatherData = CommonData & DBData;

type CommonData = {
  timestamp: string,
  city?: string,
  wind_speed?: number,
  wind_direction?: string,
  humidity?: number,
  dew_point?: number,
  pressure?: number,
  snow?: number,
  precipitation?: number,
  temperature: number,
  cloud_coverage?: number,
  solar_elevation?: number,
  solar_azimuth?: number,
  visibility?: number,
  sea_level_pressure?: number,
  uv?: number
};

type ExternalData = {
  weather_description?: string
};

type DBData = {
  id: number,
  strava_id: number,
  description?: string
};
