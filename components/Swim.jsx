import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';

const metres = function(distance) {
  return Number(distance).toFixed(0).toString() +  'm';
};

const pace = function(distance, time) {
  let hundredYards = Number(distance) / 91.44;
  return duration(time/hundredYards);
};

const Swim = props => (
  <div className="activity swim">
    <div className="type"></div>
    <div className="contents">
      <div className="row1">
        <span className='title'>{props.activity.name}</span>
      </div>
      <div className="row2">
        <span className='detail distance'>{metres(props.activity.distance)}</span>
        <span className='detail duration'>{
          duration(props.activity.elapsed_time)}</span>
        <span className='detail pace'>{pace(props.activity.distance,props.activity.elapsed_time)}
          <span className="units">/100y</span>
        </span>
      </div>
    </div>
  </div>
);

Swim.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Swim;