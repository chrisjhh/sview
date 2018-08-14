import React from 'react';
import PropTypes from 'prop-types';
import { estimatedTimes, vdot } from '../lib/vdot';
import { duration } from '../lib/duration';


const VDot = props => {
  if (props.activity.workout_type !== 1) {
    // Only valid for races!
    return (null);
  }
  const vdotVal = vdot(props.activity.distance, props.activity.elapsed_time);
  const estimated = estimatedTimes(vdotVal);
  return (
    <span className='vdot tooltip'>
      {vdotVal}
      <span className="units">VDOT</span>
      <span className="tooltiptext">
        <div>Estimated race times</div>
        <table>
          <tr><td>5K</td><td>{duration(estimated[4])}</td></tr>
          <tr><td>10K</td><td>{duration(estimated[5])}</td></tr> 
          <tr><td>HM</td><td>{duration(estimated[7])}</td></tr>
        </table>
      </span>
    </span>
  );
};

VDot.propTypes = {
  activity: PropTypes.object.isRequired
};

export default VDot;