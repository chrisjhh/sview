// Methods to fetch weather info from dark sky

let request = require('https').request;
const querystring = require('querystring');
const suncalc = require('suncalc');

const defaultHttpOptions = {
  hostname: 'api.darksky.net',
  port: 443,
  method: 'GET',
};

const defaultParams = {
  units: 'uk2'
};

const api_key = 'd40aeb92442392f50136109af655b3af';


const get = (path,userParams) =>
  new Promise((resolve,reject) => {
    const params = {...defaultParams,...userParams};
    if (params) {
      path += '?' + querystring.stringify(params);
    }
    let options = {...defaultHttpOptions, path};
    const req = request(options, (res) => {
      let data = [];
      res.setEncoding('utf8');
      res.on('data', chunk => {
        data.push(chunk);
      });
      res.on('end', () => {
        try {
          let buffer = data.join('');
          resolve(JSON.parse(buffer.toString()));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', e => reject(e));
    req.end();
  });

const getWeatherData = (lat,lon,timestamp) => get(`/forecast/${api_key}/${lat},${lon},${timestamp}`);


export const getWeather = function (lat,lon,date,duration) {
  const d = new Date(date);
  console.log(`Fetching weather info from Dark Sky for (${lat},${lon}) ${d.toString()}`);
  const timestamp = d.getTime() / 1000;

  return getWeatherData(lat,lon,timestamp)
    .then(response => convert_format(response,lat,lon,date,duration));
  
};


const convert_format = function(response,lat,lon,date,duration) {
  if (response.error) {
    console.log(`Error (${response.code}: ${response.error})`);
    return null;
  }
  const d = new Date(date);
  let hour = d.getHours();
  const mins = d.getMinutes();
  if (mins > 30) {
    ++hour;
  }
  const rows = [];
  for (let offset = 0; offset < duration/3600; ++offset) {
    const row = {};
    let timestamp = new Date(date);
    timestamp.setHours(hour + offset,0,0,0);
    let t = timestamp.getTime() / 1000;
    const hourData = response.hourly.data.filter(x => x.time === t);
    if (hourData.length !== 1) {
      console.log('could not find Dark Sky data for hour', hour + offset, t);
      return null;
    }
    const data = hourData[0];
    const solarpos = suncalc.getPosition(timestamp,lat,lon);
    row.city = null;
    row.timestamp = timestamp.toISOString();
    row.humidity = data.humidity * 100; // 0-1 -> %
    row.wind_speed = data.windSpeed * 0.44704; // mph -> m/s
    row.sea_level_pressure = data.pressure;
    row.solar_azimuth = solarpos.azimuth * 180 / Math.PI;
    row.dew_point = data.dewPoint;
    row.snow = data.precipitationType === 'snow' ? data.precipIntensity : null;
    row.uv = data.uvIndex;
    row.wind_direction = data.windBearing;
    row.weather_description = data.summary;
    row.visibility = data.visibility * 1.60934; // mi -> km
    row.precipitation = data.precipIntensity;
    row.solar_elevation = solarpos.altitude * 180 / Math.PI;
    row.pressure = null;
    row.temperature = data.temperature;
    row.cloud_coverage = data.cloudCover * 100; // 0-1 -> %
    rows.push(row);
  }
  return rows;
};
