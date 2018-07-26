const chai = require('chai');
const expect = chai.expect;

import { getAthlete } from '../lib/strava';

describe('getAthlete', function() {
  it('should load', function(done) {
    this.slow(800);
    getAthlete()
      .then(() => done())
      .catch(done);
  });
  it('should contain expected data', async function() {
    this.slow(800);
    const data = await getAthlete();
    expect(data).to.have.property('id');
    expect(data).to.have.property('username');
    expect(data).to.have.property('firstname');
    expect(data).to.have.property('lastname');
  });
});