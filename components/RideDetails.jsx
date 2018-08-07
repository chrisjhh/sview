import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';

const miles = function(distance) {
  let mi = Number(distance) / 1609.34;
  return mi.toFixed(1).toString() + 'mi';
};

const RideDetails = props => (
  <span className='detail'>
    <span className='distance'>{miles(props.activity.distance)}</span>
    <span className='duration'>{duration(props.activity.elapsed_time)}</span>
    <span className='hr'>{Number(props.activity.average_heartrate).toFixed(0)}
      <span className="units">♥</span>
    </span>
  </span>
);

RideDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default RideDetails;