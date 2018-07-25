const chai = require('chai');
const expect = chai.expect;

// Import the JS to test
const strava_token = require('../lib/strava_token');

describe('Check Strava Token is set', function() {
  it('should be defined', function() {
    expect(strava_token).to.not.be(undefined);
  });
});
