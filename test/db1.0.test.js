const chai = require('chai');
const expect = chai.expect;

import { Database } from '../db/database';
import { getActivities } from '../lib/dev/test_strava';

let current_version = '1.0';
let db = null;
let data = null;
let connected = null;

describe('DB1.0', function() {

  before(async function() {
    db = new Database({database: 'running_1_0'});
    connected = await db.connected();
    if (!connected) {
      console.log('Not connected');
      this.skip();
    }
    if (await db.exists()) {
      await db.drop();
    }
    if (current_version == '1.0x') {
      await db.init();
      data = await getActivities();
      await db.updateRunData(data);
    } else {
      await db.create();
      await db._execSQL('db1.0.sql');
      // A reconnect seems necessary here!
      db.disconnect();
      db = new Database({database: 'running_1_0'});
    }
  });

  it('should report version', async function() {
    let version = await db.version();
    expect(version).to.equal('1.0');
  });

  it('should update to latest version', async function() {
    await db.init();
    let version = await db.version();
    expect(version).to.equal(current_version);
  });

  

  after(async function() {
    if (connected) {
      await db.disconnect();
      await db.drop();
    }
  });
});
