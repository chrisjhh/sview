// A cache is an object that implements the following interface
//  store(key, data, expiresIn, callback)
//     key is the key to use to store the data
//     data is the data to store
//     expiresIn is the time (in seconds) the cache is valid for
//     callback is a function that takes (err) and is called when store completes
//       err is undefined on success 
//  retrieve(key, callback)
//     fetches the data cached for the given key
//     callback is a function that takes (err, data)
//       data is undefined if no data cached for this key or it has expired
//       err is not undefined if an error occurred while trying to obtain the cache
//  remove(key, callback)
//     removes the data for the key from the cache
//     callback is a function that takes (err)
//       err is undefined on success

export class InMemoryCache {
  constructor() {
    this.cache = new Map();
  }

  store(key,data,expiresIn,callback) {
    let now = new Date().valueOf();
    let cacheData = {
      data,
      expiresIn,
      cachedAt: now
    };
    this.cache.set(key,cacheData);
    if (callback) callback();
  }

  retrieve(key, callback) {
    let cacheData = this.cache.get(key);
    if (cacheData === undefined) {
      if (callback) callback();
      return;
    }
    let now = new Date().valueOf();
    let then = cacheData.cachedAt;
    if (now - then > cacheData.expiresIn * 1000) {
      if (callback) callback();
      return;
    }
    if (callback) callback(undefined, cacheData.data);
    return cacheData.data;
  }
}