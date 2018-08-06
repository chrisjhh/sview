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

const dateFormat = function(time) {
  const date = new Date(time);
  const day = date.getDate();
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  const hour = date.getHours();
  const min = date.getMinutes();
  return `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')} ${weekday} ${day} ${month}`;
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
          <span className='date'>{dateFormat(props.activity.start_date)}</span>
        </div>
        <div className="row2">
          <span className='detail distance'>{miles(props.activity.distance)}</span>
          <span className='detail duration'>{duration(time)}</span>
          <span className='detail pace'>{pace(props.activity.distance,time)}
            <span className="units">/mi</span>
          </span>
          <span className='detail hr'>{Number(props.activity.average_heartrate).toFixed(0)}
            <span className="units">♥</span>
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