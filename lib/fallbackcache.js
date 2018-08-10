// A File-Systen fallback cache
// A fallback cache does not implicitly delete expired items
// (They can still be removed with an explicit call to remove())
// The idea is that if the cache returns an expired entry the client
// can attempt to retrieve a fresh copy, but if that fails the original
// cached copy is still available to be retrieved by the method fallback()

import { FSCache } from './fscache';
import { readFile } from 'fs';

export class FallbackCache extends FSCache {
  
  constructor(directory) {
    super(directory);
  }

  _expire(key,callback) {
    // Do not expire old entries
    callback();
  }


  /** 
   * Retrieve data from the cache using the key it was stored with
   * Ignores any expiry date on the cache and will always return an existing entry
   * @param {Object} key The key to use to retrieve the cached data
   * @param {{(err:Object,data:Object) => undefined}} callback The callback to call on completion.
   *   data - The data retrieved from the cache. 
   */
  fallback(key, callback) {
    const file = this.keyToFile(key);
    readFile(file,(err,fileData) => {
      if (err) {
        return callback(err);
      }
      const cacheData = JSON.parse(fileData);
      callback(null, cacheData.data);
    });
  }
}