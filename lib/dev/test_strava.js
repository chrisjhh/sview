import { setCache } from '../cached_strava';
import { TestCache } from './testcache';

// Override the cache to read from the cache area of tests
const testingCache = new TestCache();
setCache(testingCache);

// Provide all the cached methods as normal
export * from '../cached_strava';