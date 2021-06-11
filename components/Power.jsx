import React from 'react';
import PropTypes from 'prop-types';

const Power = props => {
  if (!props.activity.average_watts) {
    return (null);
  }
  return (
    <span className="power" title={'Max power: ' + props.activity.max_watts + ' w'}>
      {'🗲' + (props.activity.average_watts).toFixed(0)}
      <span className="units">w</span>
    </span>
  );
};

Power.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Power;