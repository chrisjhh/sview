import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';

const WorkoutDetails = props => (
  <span className="detail">
    <span className='duration'>{
      duration(props.activity.elapsed_time)}</span>
  </span>
);

WorkoutDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default WorkoutDetails;