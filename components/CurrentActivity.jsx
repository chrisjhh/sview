import React from 'react';
import { dateFormat } from '../lib/duration';
import FitbitAuthenticationLink from './FitbitAuthenticationLink';
import ErrorBoundary from './ErrorBoundary';
import Map from './Map';
import Laps from './Laps';
import PropTypes from 'prop-types';

const CurrentActivity = props => (
  <div className='currentactivity'>
    <FitbitAuthenticationLink/>
    <div className='titlebar'>
      <a href={props.activity ? 'https://www.strava.com/activities/' + props.activity.id : '.'} target='_blank' rel='noopener noreferrer'>
        <span className='title'>{props.activity ? props.activity.name : '...'}</span>
        <span className='date'>{props.activity ? dateFormat(props.activity.start_date) : ''}</span>
      </a>
    </div>
    <ErrorBoundary>
      <Map activity={props.activity}/>
    </ErrorBoundary>
    <Laps activity={props.activity}/>
  </div>
);

CurrentActivity.propTypes = {
  activity: PropTypes.object
};

export default CurrentActivity;
