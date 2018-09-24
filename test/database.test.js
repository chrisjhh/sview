const chai = require('chai');
const expect = chai.expect;

import { Database } from '../db/database';

describe.only('Connection', function() {
  it('should report version', async function() {
    let db = new Database();
    let version = await db.version();
    expect(version).to.equal('1.0');
    await db.disconnect();
  });
});