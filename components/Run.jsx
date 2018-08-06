import React from 'react';
import PropTypes from 'prop-types';

const miles = function(distance) {
  let mi = Number(distance) / 1609.34;
  return mi.toFixed(1).toString() + 'mi';
}

const Run = props => (
  <div className="activity run">
    <div className={props.activity.workout_type === 1 ? 'type race' : 'type'}></div>
    <div className="contents">
      <div className="row1">
        <span className='title'>{props.activity.name}</span>
      </div>
      <div className="row2">
        <span className='distance'>{miles(props.activity.distance)}</span>
      </div>
    </div>
  </div>
);

Run.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Run;