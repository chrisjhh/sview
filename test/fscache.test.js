const chai = require('chai');
const expect = chai.expect;

const os = require('os');
const path = require('path');
const fs = require('fs');
const testDir = path.join(os.tmpdir(), 'fscache.test');
console.log('testDir:', testDir);

import { FSCache } from '../lib/fscache';

describe.only('File System Cache', function() {

  it('should store and retrieve', function(done) {
    let cache = new FSCache(testDir);
    let value = {x: 3, y: 5};
    cache.store('test1',value,null,() => {
      cache.retrieve('test1', (err,data) => {
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

  it('should remove an item from the cache', function(done) {
    let cache = new FSCache(testDir);
    let value = {x: 3, y: 5};
    cache.store('test2',value,null,() => {
      cache.remove('test2',() => {
        cache.retrieve('test2', (err,data) => {
          if (err) done(err);
          expect(data).to.be.undefined;
          done();
        });
      });
    });
  });

  it('should expire old entries', function(done) {
    this.slow(160);
    let cache = new FSCache(testDir);
    let value = {x: 3, y: 5};
    cache.store('test3',value,0.1,(err)=> {
      if (err) done(err);
      setTimeout(() => {
        cache.retrieve('test3', (err,retrieved) => {
          if (err) done(err);
          expect(retrieved).to.deep.equal(value);
        });
      }, 50);
      setTimeout(() => {
        cache.retrieve('test3', (err,retrieved) => {
          if (err) done(err);
          expect(retrieved).to.be.undefined;
          done();
        });
      }, 150);
    }); 
  });

});

describe.only('After File System Cache', function() {
  it('Should be persistent', function(done) {
    let cache = new FSCache(testDir);
    let value = {x: 3, y: 5};
    cache.retrieve('test1', (err,data) => {
      if (err) done(err);
      expect(data).to.deep.equal(value);
      done();
    });
  });
  it('Should clean up expired items', function() {
    let cache = new FSCache(testDir);
    let file = cache.keyToFile('test3');
    expect(fs.accessSync(file)).to.not.throw();
  });
});