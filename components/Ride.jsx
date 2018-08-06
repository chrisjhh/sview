import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';

const miles = function(distance) {
  let mi = Number(distance) / 1609.34;
  return mi.toFixed(1).toString() + 'mi';
};



const Ride = props => (
  <div className="activity ride">
    <div className="type"></div>
    <div className="contents">
      <div className="row1">
        <span className='title'>{props.activity.name}</span>
      </div>
      <div className="row2">
        <span className='detail distance'>{miles(props.activity.distance)}</span>
        <span className='detail duration'>{
          duration(props.activity.elapsed_time)}</span>
      </div>
    </div>
  </div>
);

Ride.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Ride;