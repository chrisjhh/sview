const chai = require('chai');
const expect = chai.expect;

// Import the JS to test
import strava_token from '../lib/strava_token';

describe('Check Strava Token is set', function() {
  it('should be defined', function() {
    expect(strava_token).to.not.equal(undefined);
  });
  it('should not be default value', function() {
    expect(strava_token).to.not.equal('TOKEN_GOES_HERE');
  });
  it('should have correct length', function() {
    expect(strava_token).to.have.lengthOf(40);
  });
});
