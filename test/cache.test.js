const chai = require('chai');
const expect = chai.expect;

import { InMemoryCache } from '../lib/cache';

describe('In Memory Cache', function() {
  it('should store and retrieve (Sync)', function() {
    let cache = new InMemoryCache();
    let value = {x: 3, y: 5};
    cache.store('test',value,null);
    let retrieved = cache.retrieve('test');
    expect(retrieved).to.deep.equal(value);
    // Should be deep copy
    expect(retrieved).to.not.equal(value);
  });
});