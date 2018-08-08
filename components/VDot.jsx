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
    <span className='vdot' title={`Estimated race times: 5K ${duration(estimated[4])} 10K ${duration(estimated[5])} HM ${duration(estimated[7])}`}>
      {vdotVal}
      <span className="units">VDOT</span>
    </span>
  );
};

VDot.propTypes = {
  activity: PropTypes.object.isRequired
};

export default VDot;