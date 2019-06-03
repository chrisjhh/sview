// Cleanup database after a dump
/*eslint no-console: ["off"] */

import { Database } from '../db/database';

async function cleanup() {
  let db = new Database({database: 'temp_db'});
  let connected = await db.connected();
  if (!connected) {
    console.log('Not connected');
    throw Error('Database not connected');
  }
  if (await db.exists()) {
    await db.drop();
  }
  await db.disconnect();
}

cleanup();
