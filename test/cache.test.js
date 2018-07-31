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

  it('should remove an item from the cache (Sync)', function() {
    let cache = new InMemoryCache();
    let value = {x: 3, y: 5};
    cache.store('test',value,null);
    cache.remove('test');
    let retrieved = cache.retrieve('test');
    expect(retrieved).to.be.undefined;
  });

  it('should store and retrieve (Async)', function(done) {
    let cache = new InMemoryCache();
    let value = {x: 3, y: 5};
    cache.store('test',value,null,() => {
      cache.retrieve('test', (err,data) => {
        if (err) {
          done(err);
        }
        expect(data).to.deep.equal(value);
        // Should be deep copy
        expect(data).to.not.equal(value);
        done();
      });
    }); 
  });

  it('should remove an item from the cache (Async)', function(done) {
    let cache = new InMemoryCache();
    let value = {x: 3, y: 5};
    cache.store('test',value,null,() => {
      cache.remove('test',() => {
        cache.retrieve('test', (err,data) => {
          if (err) done(err);
          expect(data).to.be.undefined;
          done();
        });
      });
    });
  });

});