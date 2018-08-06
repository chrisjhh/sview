import React from 'react';
import PropTypes from 'prop-types';
import Run from './Run';
import Swim from './Swim';
import Workout from './Workout';
import Ride from './Ride';

const Activity = props => {
  switch (props.activity.type) {
    case 'Run': {
      return (
        <Run activity={props.activity}/>
      );
    }
    case 'Swim': {
      return (
        <Swim activity={props.activity}/>
      );
    }
    case 'Workout' : {
      return (
        <Workout activity={props.activity}/>
      );
    }
    case 'Ride' : {
      return (
        <Ride activity={props.activity}/>
      );
    }
    default: {
      return (
        <div className='activity'>
          <span className='type'>{props.activity.type}</span>
          <span className='title'>{props.activity.name}</span>
        </div>
      );
    }
  }

};

Activity.propTypes = {
  activity: PropTypes.object
};

export default Activity;