import React from 'react';
import PropTypes from 'prop-types';
import RunDetails from './RunDetails';
import SwimDetails from './SwimDetails';
import WorkoutDetails from './WorkoutDetails';
import RideDetails from './RideDetails';
import { duration } from '../lib/duration';
import WalkDetails from './WalkDetails';

const ActivityDetails = props => {
  switch (props.activity.type) {
    case 'Run': {
      return (
        <RunDetails activity={props.activity}/>
      );
    }
    case 'Swim': {
      return (
        <SwimDetails activity={props.activity}/>
      );
    }
    case 'Workout' : {
      return (
        <WorkoutDetails activity={props.activity}/>
      );
    }
    case 'Ride' : {
      return (
        <RideDetails activity={props.activity}/>
      );
    }
    case 'Walk' : {
      return (
        <WalkDetails activity={props.activity}/>
      );
    }
    default: {
      return (
        <span className='detail'>
          <span className='duration'>{duration(props.activity.elapsed_time)}</span>
        </span>
      );
    }
  }
};
        

ActivityDetails.propTypes = {
  activity: PropTypes.object
};

export default ActivityDetails;