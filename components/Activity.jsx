import React from 'react';
import PropTypes from 'prop-types';
import ActivityDetails from './ActivityDetails'; 
import SocialDetails from './SocialDetails';
import { dateFormat } from '../lib/duration';

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
