import React from 'react';
import PropTypes from 'prop-types';
import ActivityDetails from './ActivityDetails'; 
import SocialDetails from './SocialDetails';

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

const Activity = props => (
  <div className={'activity ' + props.activity.type.toLowerCase()} onClick={() => props.selectActivity(props.activity)}>
    <div className={props.activity.workout_type === 1 ? 'type race' : 'type'}></div>
    <div className="contents">
      <div className="row1">
        <span className='title'>{props.activity.name}</span>
        <span className='date'>{dateFormat(props.activity.start_date)}</span>
      </div>
      <div className="row2">
        <ActivityDetails activity={props.activity}/>
        <SocialDetails activity={props.activity}/>
      </div>
    </div>
  </div>
);

Activity.propTypes = {
  activity: PropTypes.object,
  selectActivity: PropTypes.func.isRequired
};

export default Activity;