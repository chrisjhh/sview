const chai = require('chai');
const expect = chai.expect;

import { Database } from '../db/database';
import { getActivities } from '../lib/dev/test_strava';

let db = null;
let data = null;
let connected = null;

describe.only('Database', function() {

  before(async function() {
    db = new Database({database: 'running_test'});
    data = await getActivities();
    data = data.filter(x => x.type === 'Run');
    connected = await db.connected();
    if (!connected) {
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
    let exception_throw = false;
    try {
      await db.updateRun(data[0]);
    } catch(err) {
      exception_throw = true;
    }
    expect(exception_throw).to.be.true;
    --data[0].id;
    const old_name = data[0].name;
    data[0].name = 'Testing';
    result = await db.updateRun(data[0]);
    expect(result).to.be.true;
    data[0].name = old_name;
    result = await db.updateRun(data[0]);
    expect(result).to.be.true;
  });

  it('should be able to set and get properties', async function() {
    let value = await db.property('dummy');
    expect(value).to.be.undefined;
    await db.setProperty('dummy', '1');
    value = await db.property('dummy');
    expect(value).to.equal('1');
    await db.setProperty('dummy', '2');
    value = await db.property('dummy');
    expect(value).to.equal('2');
  });

  it('should be able to abort transaction', async function() {
    // Aborted transaction
    let value = await db.property('a');
    expect(value).to.be.undefined;
    await db.startTransaction();
    await db.setProperty('a', '1');
    value = await db.property('a');
    expect(value).to.equal('1');
    await db.abortTransaction();
    value = await db.property('a');
    expect(value).to.be.undefined;
  });

  it('should be able to accept transaction', async function() {
    // Completed transaction
    let value = await db.property('z');
    expect(value).to.be.undefined;
    await db.startTransaction();
    await db.setProperty('z', '1');
    value = await db.property('z');
    expect(value).to.equal('1');
    await db.endTransaction();
    value = await db.property('z');
    expect(value).to.equal('1');
  });

  it('should be able to use nested transactions', async function() {
    // Start root transaction
    let value = await db.property('c');
    expect(value).to.be.undefined;
    await db.startTransaction();
    await db.setProperty('c', '1');
    value = await db.property('c');
    expect(value).to.equal('1');


    value = await db.property('d');
    expect(value).to.be.undefined;
    // Start nested transaction
    await db.startTransaction();
    await db.setProperty('d', '2');
    value = await db.property('d');
    expect(value).to.equal('2');

    // Abort nested transaction
    await db.abortTransaction();
    value = await db.property('d');
    expect(value).to.be.undefined;
    value = await db.property('c');
    expect(value).to.equal('1');

    // Accept root transaction
    await db.endTransaction();
    value = await db.property('c');
    expect(value).to.equal('1');
    value = await db.property('d');
    expect(value).to.be.undefined;

    // Start new root transaction
    await db.startTransaction();
    await db.startTransaction();
    await db.setProperty('c', '9');
    await db.endTransaction();
    value = await db.property('c');
    expect(value).to.equal('9');

    await db.startTransaction();
    await db.setProperty('c', '10');
    value = await db.property('c');
    expect(value).to.equal('10');
    await db.abortTransaction();
    value = await db.property('c');
    expect(value).to.equal('9');

    await db.abortTransaction();
    value = await db.property('c');
    expect(value).to.equal('1');
  });

  after(async function() {
    if (connected) {
      await db.disconnect();
      await db.drop();
    }
  });
});