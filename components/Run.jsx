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



const Run = props => {
  const isRace = props.activity.workout_type === 1;
  const time = isRace ? props.activity.elapsed_time : props.activity.moving_time;
  return (
    <div className="activity run">
      <div className={props.activity.workout_type === 1 ? 'type race' : 'type'}></div>
      <div className="contents">
        <div className="row1">
          <span className='title'>{props.activity.name}</span>
        </div>
        <div className="row2">
          <span className='detail distance'>{miles(props.activity.distance)}</span>
          <span className='detail duration'>{duration(time)}</span>
          <span className='detail pace'>{pace(props.activity.distance,time)}
            <span className="units">/mi</span>
          </span>
        </div>
      </div>
    </div>
  );
};

Run.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Run;