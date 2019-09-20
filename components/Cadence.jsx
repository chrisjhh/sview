import React from 'react';
import PropTypes from 'prop-types';

const Cadence = props => {
  if (!props.activity.average_cadence) {
    return (null);
  }
  return (
    <span className="cadence" title="cadence">
      {Number(props.activity.average_cadence).toFixed(0)}
      <span className="units">rpm</span>
    </span>
  );
};

Cadence.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Cadence;
