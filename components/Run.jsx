import React from 'react';
import PropTypes from 'prop-types';

const Run = props => (
  <div className="activity run">
    <div className={props.activity.workout_type === 1 ? 'type race' : 'type'}></div>
    <div className="contents">
      <span className='title'>{props.activity.name}</span>
    </div>
  </div>
);

Run.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Run;