import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';

const metres = function(distance) {
  return Number(distance).toFixed(0).toString() +  'm';
};

const pace = function(distance, time) {
  let hundredYards = Number(distance) / 91.44;
  return duration(time/hundredYards);
};

const SwimDetails = props => (
  <div className="detail">
    <span className='distance'>{metres(props.activity.distance)}</span>
    <span className='duration'>{
      duration(props.activity.elapsed_time)}</span>
    <span className='pace'>{pace(props.activity.distance,props.activity.elapsed_time)}
      <span className="units">/100y</span>
    </span>
    <span className='hr'>{Number(props.activity.average_heartrate).toFixed(0)}
      <span className="units">♥</span>
    </span>
  </div>
);

SwimDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default SwimDetails;