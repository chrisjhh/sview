let request = require('https').request;
const querystring = require('querystring');


const defaultHttpOptions = {
  hostname: 'www.fitbit.com',
  port: 443,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};
const api = '/1/user/-/activities';

const get = (path,params) =>
  new Promise((resolve,reject) => {
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