// A cache to use for testing
//
// Only fetches the files once. After that fetches them from the cache
// directory of the tests
const path = require('path');

import { FSCache } from '../fscache';

export class TestCache extends FSCache {
  constructor() {
    super(path.join(__dirname, '../../test/cache'));
  }

  store(key,data,expiresIn,callback) {
    // Never expire the test cache data
    return super.store(key,data,'never',callback);
  }
}