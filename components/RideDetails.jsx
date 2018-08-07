import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';
import HeartRate from './HeartRate';

const miles = function(distance) {
  let mi = Number(distance) / 1609.34;
  return mi.toFixed(1).toString() + 'mi';
};

const RideDetails = props => (
  <span className='detail'>
    <span className='distance'>{miles(props.activity.distance)}</span>
    <span className='duration'>{duration(props.activity.elapsed_time)}</span>
    <HeartRate  activity={props.activity}/>
  </span>
);

RideDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default RideDetails;