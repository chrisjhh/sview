import React from 'react';
import PropTypes from 'prop-types';

const HeartRate = props => {
  if (!props.activity.has_heartrate) {
    return (null);
  }
  let classes = 'hr';
  if (props.activity.heartrate_from_fitbit) {
    classes += ' fitbit';
  }
  return (
    <span className={classes} title={'Max HR: ' + Number(props.activity.max_heartrate).toFixed(0)}>
      {Number(props.activity.average_heartrate).toFixed(0)}
      <span className="units">♥</span>
    </span>
  );
};

HeartRate.propTypes = {
  activity: PropTypes.object.isRequired
};

export default HeartRate;
