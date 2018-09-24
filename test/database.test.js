const chai = require('chai');
const expect = chai.expect;

import { Database } from '../db/database';
import { getActivities } from '../lib/dev/test_strava';

let db = null;

describe.only('Connection', function() {

  before(function() {
    db = new Database();
  });

  it('should report version', async function() {
    let version = await db.version();
    expect(version).to.equal('1.0');
  });

  it('should be able to add run', async function() {
    const data = await getActivities();
    const id = await db.addRun(data[0]);
    expect(id).to.be.a('number');
  });

  after(async function() {
    await db.disconnect();
  });
});