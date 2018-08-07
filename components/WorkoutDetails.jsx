import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';
import HeartRate from './HeartRate';

const WorkoutDetails = props => (
  <span className="detail">
    <span className='duration'>{
      duration(props.activity.elapsed_time)}</span>
    <HeartRate activity={props.activity}/>
  </span>
);

WorkoutDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default WorkoutDetails;