import React from 'react';
import PropTypes from 'prop-types';

const miles = function(distance) {
  let mi = Number(distance) / 1609.34;
  return mi.toFixed(1).toString() + 'mi';
};

const duration = function(time) {
  let mins = Math.floor(time/60);
  let secs = time - mins * 60;
  let hours = 0;
  if (mins > 60) {
    hours = Math.floor(mins/60);
    mins = mins - 60 * hours;
    return `${hours}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  }
  return `${mins}:${secs.toString().padStart(2,'0')}`;
};

const Run = props => (
  <div className="activity run">
    <div className={props.activity.workout_type === 1 ? 'type race' : 'type'}></div>
    <div className="contents">
      <div className="row1">
        <span className='title'>{props.activity.name}</span>
      </div>
      <div className="row2">
        <span className='detail distance'>{miles(props.activity.distance)}</span>
        <span className='detail duration'>{
          duration(props.activity.workout_type === 1 ? 
            props.activity.elapsed_time : props.activity.moving_time)}</span>
      </div>
    </div>
  </div>
);

Run.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Run;