const chai = require('chai');
const expect = chai.expect;

import { getAthlete, getStats } from '../lib/dev/test_strava';

const sinon = require('sinon');
const https = require('https');
let athleteID = null;

describe('getStats', function() {

  before(function(done) {
    sinon.spy(https, 'request');
    getAthlete()
      .then(data => {
        athleteID = data.id;
        //console.log('athleteID',athleteID);
        done();
      });
  });

  it('should load', function(done) {
    this.timeout(5000);
    this.slow(800);
    getStats(athleteID)
      .then(() => done())
      .catch(done);
  });
  it('should contain expected data', async function() {
    this.timeout(5000);
    this.slow(800);
    const data = await getStats(athleteID);
    expect(data).to.have.property('recent_run_totals');
    expect(data).to.have.property('recent_swim_totals');
    expect(data).to.have.property('ytd_ride_totals');
    expect(data.ytd_run_totals).to.be.an('object').that.has.all.keys(
      'count', 'distance', 'moving_time', 'elapsed_time', 'elevation_gain'
    );
  });
});

describe('caching', function() {
  it('should not make https request more than once', function() {
    expect(https.request.callCount).to.be.at.most(1);
  });

  after(function() {
    https.request.restore();
  });
});