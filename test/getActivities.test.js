const chai = require('chai');
const expect = chai.expect;

import { getActivities } from '../lib/dev/test_strava';

const sinon = require('sinon');
const https = require('https');

describe('getActivities', function() {
  
  before(function() {
    sinon.spy(https, 'request');
  });

  it('should load', function(done) {
    this.timeout(5000);
    this.slow(800);
    getActivities()
      .then(() => done())
      .catch(done);
  });
  it('should contain expected data', async function() {
    this.timeout(5000);
    this.slow(800);
    const data = await getActivities();
    expect(data).to.be.an('array');
    expect(data[0]).to.have.property('name');
    expect(data[0]).to.have.property('type');
    expect(data[0]).to.have.property('elapsed_time');
  });
});

describe('options', function() {
  it('before and after should work', async function() {
    this.timeout(5000);
    this.slow(800);
    // Get activities from June 2018
    let before = new Date(2018, 6, 1);
    let after = new Date(2018, 5, 1);
    const data = await getActivities({before,after});
    const inRange = function(entry) {
      const start = new Date(entry.start_date);
      return start < before && start > after;
    };
    expect(data).to.be.an('array');
    expect(data.every(inRange)).to.be.true;
  });
  
  it('per_page should work', async function() {
    this.timeout(5000);
    this.slow(800);
  
    const per_page = 7;
    const data = await getActivities({per_page});
    expect(data).to.be.an('array');
    expect(data.length).to.equal(per_page);
  });

  it('page should work', async function() {
    this.timeout(5000);
    this.slow(800);
  
    const standard = await getActivities();
    const page1 = await getActivities({page: 1});
    const page2 = await getActivities({page: 2});
    expect(page1[0]).to.deep.equal(standard[0]);
    expect(page2[0]).to.not.deep.equal(page1[0]);
  });

});

describe('caching', function() {
  it('should not make https request more than once', function() {
    expect(https.request.callCount).to.be.at.most(5);
  });

  after(function() {
    https.request.restore();
  });
});