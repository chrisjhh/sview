const chai = require('chai');
const expect = chai.expect;

import { getAthlete } from '../lib/cached_strava';

const sinon = require('sinon');
const https = require('https');
sinon.spy(https, 'request');

describe('getAthlete', function() {
  it('should load', function(done) {
    this.timeout(5000);
    this.slow(800);
    getAthlete()
      .then(() => done())
      .catch(done);
  });
  it('should contain expected data', async function() {
    this.timeout(5000);
    this.slow(800);
    const data = await getAthlete();
    expect(data).to.have.property('id');
    expect(data).to.have.property('username');
    expect(data).to.have.property('firstname');
    expect(data).to.have.property('lastname');
  });
});

describe('caching', function() {
  it('should only make https request once', function() {
    expect(https.request.callCount).to.equal(1);
  });

  after(function() {
    https.request.restore();
  });
});