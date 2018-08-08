import React from 'react';
import PropTypes from 'prop-types';


const xpoints = function(hr,time) {
  const xp = ((Number(hr) - 100) * (time /60)) / 450;
  return xp.toFixed(1);
};

const XPoints = props => {
  if (!props.activity.has_heartrate) {
    return (null);
  }
  if (Number(props.activity.average_heartrate) < 100) {
    return (null);
  }
  return (
    <span className='xp' title='xp: Exercise points. Function of heart-rate elevation and time. 1xp roughly equals one easy mile of running.'>
      {xpoints(props.activity.average_heartrate, props.activity.elapsed_time)}
      <span className="units">xp</span>
    </span>
  );
};

XPoints.propTypes = {
  activity: PropTypes.object.isRequired
};

export default XPoints;