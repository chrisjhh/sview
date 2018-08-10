// File System Cache
//
// See cache.js for details of cache interface

const fs = require('fs');
const path = require('path');

/**
 * @class
 * An File-system cache. Stores the data in a flat file system
 * in the given directory.
 */
export class FSCache {
  constructor(directory) {
    this.directory = directory;
    try {
      fs.accessSync(directory);
    } catch(e) {
      fs.mkdirSync(directory);
    }
  }

  /** 
   * Store data in the cache.
   * @param {Object} key The key to use to store the data
   * @param {Object} data The data to store
   * @param {number} expiresIn Time in seconds the cache is valid for (null = forever)
   * @param {function() => undefined} callback The callback to call when the store is complete.
  */
  store(key,data,expiresIn,callback) {
    let now = new Date().valueOf();
    expiresIn = expiresIn || 'never';
    let cacheData = {
      data,
      expiresIn,
      cachedAt: now
    };
    const file = this.keyToFile(key);
    fs.writeFile(file,JSON.stringify(cacheData),callback);
  }

  /** 
   * Retrieve data from the cache using the key it was stored with
   * @param {Object} key The key to use to retrieve the cached data
   * @param {{(err:Object,data:Object) => undefined}} callback The callback to call on completion.
   *   data - The data retrieved from the cache. Undefined if cache missing or expired.
   */
  retrieve(key, callback) {
    const file = this.keyToFile(key);
    fs.access(file, err => {
      if (err) {
        // File does not exist
        // Return undefined data
        return callback(null, undefined);
      }
      fs.readFile(file,(err,fileData) => {
        if (err) {
          return callback(err);
        }
        const cacheData = JSON.parse(fileData);
        const now = new Date().valueOf();
        const then = cacheData.cachedAt;
        if (cacheData.expiresIn !== 'never' && 
            now - then > cacheData.expiresIn * 1000) {
          // File exists but cache period has expired
          this._expire(key, err => callback(err, undefined)); 
        } else {
          // File exists and is still valid
          callback(null, cacheData.data);
        }
      });
    });
  }
   
  /**
   * What to do when a cached entry expires
   * For this type of cache - Delete it from the file system
   * (Subclasses may choose to override this behaviour)
   * @param {string} file 
   * @param {{(err:Object) => undefined}} callback 
   * @private
   */
  _expire(key, callback) {
    const file = this.keyToFile(key);
    fs.unlink(file,err => callback(err));
  }

  /**
   * Remove an item from the cache
   * @param {Object} key The key referencing the cached item to remove 
   * @param {function() => undefined} callback The callback to call when done
   */
  remove(key, callback) {
    // Although this is the same as _expire for this type of cache
    // They are kept separate so subclasses can do something different for _expire
    fs.unlink(this.keyToFile(key),callback);
  }

  /** 
   * Convert a key to a file in the cache directory.
   * For internal use only!
  */
  keyToFile(key) {
    key = key.toString().replace(/[.:?&,/]/g, '_');
    return path.join(this.directory,key);
  }
}

