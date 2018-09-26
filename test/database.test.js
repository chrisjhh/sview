const chai = require('chai');
const expect = chai.expect;

import { Database } from '../db/database';
import { getActivities } from '../lib/dev/test_strava';

let db = null;
let data = null;

describe('Database', function() {

  before(async function() {
    db = new Database({database: 'running_test'});
    data = await getActivities();
    
    if (!await db.connected()) {
      console.log('Not connected');
      this.skip();
    }
    if (await db.exists()) {
      await db.drop();
    } 
    await db.init();
  });

  it('should report version', async function() {
    let version = await db.version();
    expect(version).to.equal('1.0');
  });

  it('should be able to add run', async function() {
    const id = await db.addRun(data[0]);
    expect(id).to.be.a('number');
  });

  it('should be able to fetch run', async function() {
    const rowData = await db.fetchRun(data[0]);
    expect(Number(rowData.strava_id)).to.equal(data[0].id);
  });

  it('should be able to update', async function() {
    let result = await db.updateRun(data[0]);
    expect(result).to.be.false;
    result = await db.updateRun(data[1]);
    expect(result).to.be.null;
    ++data[0].id;
    const bad_update = async function() {await db.updateRun(data[0]);};
    //expect(bad_update).to.throw();
    --data[0].id;
    const old_name = data[0].name;
    data[0].name = 'Testing';
    result = await db.updateRun(data[0]);
    expect(result).to.be.true;
    data[0].name = old_name;
    result = await db.updateRun(data[0]);
    expect(result).to.be.true;
  });

  after(async function() {
    await db.disconnect();
    await db.drop();
  });
});