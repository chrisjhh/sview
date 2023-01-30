import React from 'react';
import PropTypes from 'prop-types';

const Elevation = props => {
  if (!props.activity.average_watts) {
    //console.log(props.activity)
    return (null);
  }
  return (
    <span className="elevation">
      {(props.activity.total_elevation_gain * 3.2804).toFixed(0)}
      <span className="units">ft</span>
    </span>
  );
};

Elevation.propTypes = {
  activity: PropTypes.object.isRequired
};

export default  Elevation;