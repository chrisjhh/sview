const chai = require('chai');
const expect = chai.expect;

import { Database } from '../db/database';
import { getActivities } from '../lib/dev/test_strava';

let db = null;
let data = null;

describe.only('Connection', function() {

  before(async function() {
    db = new Database();
    data = await getActivities();
  });

  it('should report version', async function() {
    let version = await db.version();
    expect(version).to.equal('1.0');
  });

  it.skip('should be able to add run', async function() {
    const id = await db.addRun(data[0]);
    expect(id).to.be.a('number');
  });

  it('should be able to fetch run', async function() {
    const rowData = await db.fetchRun(data[0]);
    expect(Number(rowData.strava_id)).to.equal(data[0].id);
  });

  after(async function() {
    await db.disconnect();
  });
});