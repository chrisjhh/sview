import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';

const miles = function(distance) {
  let mi = Number(distance) / 1609.34;
  return mi.toFixed(1).toString() + 'mi';
};

const pace = function(distance, time) {
  let mi = Number(distance) / 1609.34;
  return duration(time/mi);
};


const RunDetails = props => {
  const isRace = props.activity.workout_type === 1;
  const time = isRace ? props.activity.elapsed_time : props.activity.moving_time;
  return (
    <span className='detail'>
      <span className='distance'>{miles(props.activity.distance)}</span>
      <span className='duration'>{duration(time)}</span>
      <span className='pace'>{pace(props.activity.distance,time)}
        <span className="units">/mi</span>
      </span>
      <span className='hr'>{Number(props.activity.average_heartrate).toFixed(0)}
        <span className="units">♥</span>
      </span>
    </span>
  );
};

RunDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default RunDetails;