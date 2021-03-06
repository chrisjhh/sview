// Methods to fetch weather info from weatherbit

let request = require('http').request;
const querystring = require('querystring');


const defaultHttpOptions = {
  hostname: 'api.weatherbit.io',
  port: 80,
  method: 'GET',
};
const api = '/v2.0';

const defaultParams = {
  key: '5b34887556674ea2b864b29b6432e9a4',
  tz: 'local'
};


const get = (path,userParams) =>
  new Promise((resolve,reject) => {
    const params = {...defaultParams,...userParams};
    if (params) {
      path += '?' + querystring.stringify(params);
    }
    let options = {...defaultHttpOptions, path: api + path};
    const req = request(options, (res) => {
      let data = [];
      res.setEncoding('utf8');
      res.on('data', chunk => {
        data.push(chunk);
      });
      res.on('end', () => {
        let buffer = data.join('');
        resolve(JSON.parse(buffer.toString()));
      });
    });
    req.on('error', e => reject(e));
    req.end();
  });



 
function pad(number) {
  if (number < 10) {
    return '0' + number;
  }
  return number;
}      

export const getWeather = function (lat,lon,date,duration) {
  const d = new Date(date);
  let hour = d.getHours();
  const mins = d.getMinutes();
  if (mins > 30) {
    ++hour;
  }
  const day = d.getFullYear() + '-' + pad(d.getMonth() + 1) +
    '-' + pad(d.getDate());
  const start_date = day + ':' + pad(hour);
  let end_hour = hour + 1;
  if (duration && duration > 3600) {
    let extra_hours = Math.floor(duration/3600);
    end_hour += extra_hours;
  }
  const end_date = day + ':' + pad(end_hour);
  return get('/history/hourly', {lat,lon,start_date,end_date})
    .then(convert_format);
};

const convert_format = function(weather) {
  if (!weather.data) {
    return null;
  }
  const rows = [];
  for (let data of weather.data) {
    const row = {};
    row.city = weather.city_name;
    row.timestamp = data.timestamp_local;
    row.humidity = data.rh; // %
    row.wind_speed = data.wind_spd; // m/s
    row.sea_level_pressure = data.slp; // mb
    row.solar_azimuth = data.azimuth; // degrees
    row.dew_point = data.dewpt; // celcius
    row.snow = data.snow; // mm
    row.uv = data.uv; // index 0-11
    row.wind_direction = data.wind_dir; // degrees
    row.visibility = data.vis; // km
    row.precipitation = data.precip; // mm
    row.solar_elevation = data.elev_angle;
    row.pressure = data.pres; // mb
    row.temperature = data.temp; // celcius
    row.cloud_coverage = data.clouds; // %
    rows.push(row);
  }
  return rows;
};
