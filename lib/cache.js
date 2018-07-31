// A cache is an object that implements the following interface
//  store(key, data, expiresIn, callback)
//     key is the key to use to store the data
//     data is the data to store
//     expiresIn is the time (in seconds) the cache is valid for.
//     If expiresIn is null or undefined then cache should never expire
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

/*
 * An in-memory cache. Supports both syncronous and asyncronous use.
 */
export class InMemoryCache {
  constructor() {
    this.cache = new Map();
  }

  /** 
   * Store data in the cache. This happens syncronously but a callback is provided
   * so it can be used in places where an asyncronous process is expected.
   * @param {Object} key - The key to use to store the data
   * @param {Object} data - The data to store (a deep copy will be taken)
   * @param {number} expiresIn - Time in seconds the cache is valid for (null = forever)
   * @param {emptyCallback} [callback] - The optional callback to call when the store is complete.
  */
  store(key,data,expiresIn,callback) {
    let now = new Date().valueOf();
    expiresIn = expiresIn || 'never';
    let cacheData = {
      data: JSON.parse(JSON.stringify(data)), // deep copy
      expiresIn,
      cachedAt: now
    };
    this.cache.set(key,cacheData);
    if (callback) callback();
  }

  /** 
   * Retrieve data from the cache using the key it was stored with
   * @param {Object} key - The key to use to retrieve the cached data
   * @param {emptyCallback} [callback] - The optional callback to call on completion.
   * @returns {Object} The data retrieved from the cache
   */
  retrieve(key, callback) {
    let cacheData = this.cache.get(key);
    if (cacheData === undefined) {
      if (callback) callback();
      return;
    }
    let now = new Date().valueOf();
    let then = cacheData.cachedAt;
    if (cacheData.expiresIn !== 'never' && 
        now - then > cacheData.expiresIn * 1000) {
      if (callback) callback();
      return;
    }
    if (callback) callback(undefined, cacheData.data);
    return cacheData.data;
  }

  remove(key, callback) {
    this.cache.delete(key);
    if (callback) callback();
    return;
  }
}

/**
 * @callback emptyCallback
 */
