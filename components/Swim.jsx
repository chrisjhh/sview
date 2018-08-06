import React from 'react';
import PropTypes from 'prop-types';

const metres = function(distance) {
  return Number(distance).toFixed(0).toString() +  'm';
};

const Swim = props => (
  <div className="activity swim">
    <div className="type"></div>
    <div className="contents">
      <div className="row1">
        <span className='title'>{props.activity.name}</span>
      </div>
      <div className="row2">
        <span className='distance'>{metres(props.activity.distance)}</span>
      </div>
    </div>
  </div>
);

Swim.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Swim;