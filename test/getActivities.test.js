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

describe('caching', function() {
  it('should not make https request more than once', function() {
    expect(https.request.callCount).to.be.at.most(1);
  });

  after(function() {
    https.request.restore();
  });
});