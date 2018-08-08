const chai = require('chai');
const expect = chai.expect;

import { hms, vdot } from '../lib/vdot';

describe('hms', function() {
  it('should work as expected', function() {
    expect(hms('10')).to.equal(10);
    expect(hms('10.2')).to.equal(10.2);
    expect(hms('1:10.2')).to.equal(70.2);
    expect(hms('22:45')).to.equal(1365);
    expect(hms('1:31:10')).to.equal(5470);
  });
});

describe('VDOT', function() {
  it('5K times', function() {
    expect(vdot(5000,hms('22:47'))).to.equal('42.8');
    expect(vdot(5005,hms('22:41'))).to.equal('43.0');
    expect(vdot(4990,hms('22:15'))).to.equal('44.0');
    expect(vdot(5010,hms('22:27'))).to.equal('43.5');
  });
  it('10K times', function() {
    expect(vdot(10000,hms('50:00'))).to.equal('40.0');
    expect(vdot(10012,hms('45:00'))).to.equal('45.3');
    expect(vdot(9985,hms('41:41'))).to.equal('49.5');
    expect(vdot(10100,hms('47:04'))).to.equal('43.0');
  });
  it('invalid distances', function() {
    expect(vdot(0,hms('50:00'))).to.equal(null);
    expect(vdot(100,hms('50:00'))).to.equal(null);
    expect(vdot(7000,hms('50:00'))).to.equal(null);
  });
});