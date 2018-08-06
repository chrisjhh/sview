import React from 'react';
import PropTypes from 'prop-types';

const Swim = props => (
  <div className="activity swim">
    <div className="type"></div>
    <div className="contents">
      <span className='title'>{props.activity.name}</span>
    </div>
  </div>
);

Swim.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Swim;