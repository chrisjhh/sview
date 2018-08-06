import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';

const Workout = props => (
  <div className="activity workout">
    <div className="type"></div>
    <div className="contents">
      <div className="row1">
        <span className='title'>{props.activity.name}</span>
      </div>
      <div className="row2">
        <span className='detail duration'>{
          duration(props.activity.elapsed_time)}</span>
      </div>
    </div>
  </div>
);

Workout.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Workout;