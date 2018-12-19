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
  const efficiency = hbPerMile(props.activity);
  let classes = 'hbpermile';
  if (props.activity.heartrate_from_fitbit) {
    classes += ' fitbit';
  }
  return (
    <span className={classes} title={'Running efficiency ' + (160934/efficiency).toFixed(0) + ' cm/♥'}>
      {efficiency}
      <span className="units">♥/mi</span>
    </span>
  );
};

HBPerMile.propTypes = {
  activity: PropTypes.object.isRequired
};

export default HBPerMile;
