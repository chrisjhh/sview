import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';
import HeartRate from './HeartRate';
import XPoints from './XPoints';
import Cadence from './Cadence';
import TrainingLoad from './TrainingLoad';

const miles = function(distance) {
  let mi = Number(distance) / 1609.34;
  return mi.toFixed(1).toString() + 'mi';
};

const distance = function(activity) {
  const a_dist = activity.distance;
  const duration = activity.elapsed_time;
  if (!a_dist || a_dist < duration) {
    // No movement or less than 1m/s likely to be exercise bike!
    const rpm = activity.average_cadence;
    const revolutions = rpm * duration / 60;
    const c_dist = revolutions * 4.48; // <- HARDCODED value TODO: Replace
    return c_dist;
  }
  return distance;
};

const speed = function(activity) {
  const miles = distance(activity)/1609.34;
  const hours = activity.elapsed_time / 3600;
  return (miles/hours).toFixed(1).toString();
};

const RideDetails = props => (
  <span className='detail'>
    <span className='distance'>{miles(distance(props.activity))}</span>
    <span className='duration'>{duration(props.activity.elapsed_time)}</span>
    <span className='speed'>{speed(props.activity)}
      <span className="units">mph</span>
    </span>
    <HeartRate  activity={props.activity}/>
    <XPoints activity={props.activity}/>
    <Cadence activity={props.activity}/>
    <TrainingLoad activity={props.activity}/>
  </span>
);

RideDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default RideDetails;
