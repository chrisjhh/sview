import React from 'react';
import PropTypes from 'prop-types';

const HeartRate = props => {
  if (!props.activity.has_heartrate) {
    return (null);
  }
  return (
    <span className='hr'>{Number(props.activity.average_heartrate).toFixed(0)}
      <span className="units">♥</span>
    </span>
  );
};

HeartRate.propTypes = {
  activity: PropTypes.object.isRequired
};

export default HeartRate;