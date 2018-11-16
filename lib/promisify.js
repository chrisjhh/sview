export const promisify = fn => (...args) => 
  new Promise((resolve, reject) => {
    fn(...args, (err,data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });