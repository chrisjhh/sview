const chai = require('chai');
const expect = chai.expect;

import { Database } from '../db/database';
import { getActivities } from '../lib/dev/test_strava';
import { Routes } from '../lib/routes';

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
    expect(version).to.equal('1.1');
  });

  it('should be able to add run', async function() {
    const id = await db.addRun(data[0]);
    expect(id).to.be.a('number');
  });

  it('should be able to fetch run', async function() {
    const rowData = await db.fetchRun(data[0]);
    expect(Number(rowData.strava_id)).to.equal(data[0].id);
  });

  it('should be able to update run', async function() {
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

  it('should be able to create and find route', async function() {
    const id = await db.createRoute(data[0]);
    expect(id).to.be.a('number');
    let found = await db.findRoute(data[0]);
    expect(found).to.equal(id);
    data[0].distance -= 200;
    const original_elevation = data[0].total_elevation_gain;
    data[0].total_elevation_gain -= 3;
    found = await db.findRoute(data[0]);
    expect(found).to.equal(id);
    data[0].distance -= 200;
    found = await db.findRoute(data[0]);
    expect(found).to.be.null;
    data[0].distance += 200;
    const elevation_change = Math.max(5,original_elevation*0.2);
    data[0].total_elevation_gain -= elevation_change;
    found = await db.findRoute(data[0]);
    expect(found).to.be.null;
    data[0].total_elevation_gain += (elevation_change + 3);
    data[0].distance += 200;
    found = await db.findRoute(data[0]);
    expect(found).to.equal(id);
    data[0].start_latlng[0] += 0.01;
    found = await db.findRoute(data[0]);
    expect(found).to.be.null;
  });

  it('setRunAndRoute', async function() {
    // Check if will set run and route for new run
    await db.setRunAndRoute(data[1]);
    const rowData = await db.fetchRun(data[1]);
    expect(rowData).to.not.be.null;
    expect(rowData.route_id).to.be.a('number');
    let found = await db.findRoute(data[1]);
    expect(found).to.equal(rowData.route_id);
    // Check it will update
    data[1].name = 'More Testing';
    await db.setRunAndRoute(data[1]);
    let updatedRowData = await db.fetchRun(data[1]);
    expect(updatedRowData.id).to.equal(rowData.id);
    expect(updatedRowData.route_id).to.equal(rowData.route_id);
    expect(updatedRowData.name).to.equal('More Testing');
    // Check it doesn't complain when no update required
    await db.setRunAndRoute(data[1]);
    updatedRowData = await db.fetchRun(data[1]);
    expect(updatedRowData.id).to.equal(rowData.id);
  });

  it('routes.runs', async function() {
    const run = await db.fetchRun(data[1]);
    expect(run.route_id).to.be.a('number');
    const r = new Routes(db);
    const route_id = await r.route(run.strava_id);
    expect(route_id).to.equal(run.route_id);
    const runs = await r.runs(route_id);
    expect(runs).to.be.an('array');
    let result = await db.updateRun(runs[0]);
    expect(result).to.be.false;
  });

  it('routes.stats', async function() {
    const run = await db.fetchRun(data[1]);
    expect(run.route_id).to.be.a('number');
    const r = new Routes(db);
    const stats = await r.stats(run.route_id,{date: run.start_time});
    //console.log('stats',stats);
    // Types
    expect(stats).to.be.an('object');
    expect(stats.count).to.be.a('number');
    expect(stats.average).to.be.a('number');
    expect(stats.recent).to.be.an('array');
    expect(stats.pbs).to.be.an('array');
    expect(stats.sbs).to.be.an('array');
    // Values
    expect(stats.count).to.equal(1);
    expect(stats.average).to.equal(run.duration);
    expect(stats.recent[0]).to.equal(run.duration);
    expect(stats.pbs[0]).to.equal(run.duration);
    expect(stats.sbs[0]).to.equal(run.duration);
  });

  after(async function() {
    if (connected) {
      await db.disconnect();
      await db.drop();
    }
  });
});