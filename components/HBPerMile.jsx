import React from 'react';
import PropTypes from 'prop-types';

const hbPerMile = function(activity) {
  const mins = activity.elapsed_time / 60;
  const miles = activity.distance / 1609.34;
  const minsPerMile = mins / miles;
  const hbeats = minsPerMile * activity.average_heartrate;
  return hbeats.toFixed(0);
};

const HBPerMile = props => {
  if (!props.activity.has_heartrate) {
    return (null);
  }
  return (
    <span className='hbpermile'>
      {hbPerMile(props.activity)}
      <span className="units">♥/mi</span>
    </span>
  );
};

HBPerMile.propTypes = {
  activity: PropTypes.object.isRequired
};

export default HBPerMile;