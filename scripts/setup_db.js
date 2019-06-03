// Setup database ready for a dump
/*eslint no-console: ["off"] */

import { Database } from '../db/database';
import { getActivities } from '../lib/dev/test_strava';

async function setup() {
  let db = new Database({database: 'temp_db'});
  let connected = await db.connected();
  if (!connected) {
    console.log('Not connected');
    throw Error('Database not connected');
  }
  if (await db.exists()) {
    await db.drop();
  }
  await db.init();
  let data = await getActivities();
  await db.updateRunData(data);
  await db.disconnect();
}

setup();
