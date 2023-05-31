// Methods to fetch weather info from dark sky

let request = require('https').request;
const querystring = require('querystring');
const suncalc = require('suncalc');

const defaultHttpOptions = {
  hostname: 'weather.visualcrossing.com',
  port: 443,
  method: 'GET',
  path: '/VisualCrossingWebServices/rest/services',
  rejectUnauthorized: false
};

const defaultParams = {
  unitGroup: 'uk',
  key: '6F5DRV97QJ6A6BC9THMC5BWZ8'
};


const get = (path,userParams) =>
  new Promise((resolve,reject) => {
    let options = {...defaultHttpOptions};
    options.path += path;
    const params = {...defaultParams,...userParams};
    if (params) {
      options.path += '?' + querystring.stringify(params);
    }
    //console.log(`Visual Crossing URL: https://${options.hostname}${options.path}`);
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

const getWeatherData = (lat,lon,timestamp) => get(`/timeline/${lat},${lon}/${timestamp}`);


export const getWeather = function (lat,lon,date,duration) {
  const d = new Date(date);
  console.log(`Fetching weather info from Visual Crossing for (${lat},${lon}) ${d.toString()}`);
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
    const hourData = response.days[0].hours.filter(x => x.datetimeEpoch === t);
    if (hourData.length !== 1) {
      console.log('could not find Visual Crossing data for hour', hour + offset, t);
      return null;
    }
    const data = hourData[0];
    const solarpos = suncalc.getPosition(timestamp,lat,lon);
    row.city = null;
    row.timestamp = timestamp.toISOString();
    row.humidity = data.humidity * 100; // 0-1 -> %
    row.wind_speed = data.windspeed * 0.44704; // mph -> m/s
    row.sea_level_pressure = data.pressure;
    row.solar_azimuth = solarpos.azimuth * 180 / Math.PI;
    row.dew_point = data.dew;
    row.snow = data.snow;
    row.uv = data.uvindex;
    row.wind_direction = data.winddir;
    row.weather_description = data.summary;
    row.visibility = data.visibility * 1.60934; // mi -> km
    row.precipitation = data.precip;
    row.solar_elevation = solarpos.altitude * 180 / Math.PI;
    row.pressure = data.pressure;
    row.temperature = data.temp;
    row.cloud_coverage = data.cloudcover * 100; // 0-1 -> %
    rows.push(row);
  }
  return rows;
};
