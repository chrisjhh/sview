import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';

const miles = function(distance) {
  let mi = Number(distance) / 1609.34;
  return mi.toFixed(1).toString() + 'mi';
};

const location = function(activity) {
  if (activity.location_city) {
    return activity.location_city;
  }
  if (activity.location_state) {
    return activity.location_state;
  }
  if (activity.timezone.indexOf('/') !== -1) {
    return activity.timezone.replace(/.*\//,'');
  }
  return null;
};

const elevation = function(gain) {
  const ft = gain * 3.28084;
  return ft.toFixed(0);
};

const WalkDetails = props => (
  <span className="detail">
    <span className="location">{location(props.activity)}</span>
    <span className='distance'>{miles(props.activity.distance)}</span>
    <span className='duration'>{
      duration(props.activity.elapsed_time)}</span>
    <span className='elevation'>{elevation(props.activity.total_elevation_gain)}
      <span className='units'>ft</span>
    </span>
  </span>
);

WalkDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default WalkDetails;