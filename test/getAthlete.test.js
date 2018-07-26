import { getAthlete } from '../lib/strava';

describe('getAthlete', function() {
  it('should load', function(done) {
    getAthlete()
      .then(done());
  });
});