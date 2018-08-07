import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';
import HeartRate from './HeartRate';

const metres = function(distance) {
  return Number(distance).toFixed(0).toString() +  'm';
};

const pace = function(distance, time) {
  let hundredYards = Number(distance) / 91.44;
  return duration(time/hundredYards);
};

const SwimDetails = props => (
  <span className="detail">
    <span className='distance'>{metres(props.activity.distance)}</span>
    <span className='duration'>{
      duration(props.activity.elapsed_time)}</span>
    <span className='pace'>{pace(props.activity.distance,props.activity.elapsed_time)}
      <span className="units">/100y</span>
    </span>
    <HeartRate activity={props.activity}/>
  </span>
);

SwimDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default SwimDetails;