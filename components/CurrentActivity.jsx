import React from 'react';
import { dateFormat } from '../lib/duration';
import FitbitAuthenticationLink from './FitbitAuthenticationLink';
import ErrorBoundary from './ErrorBoundary';
import Map from './Map';
import PropTypes from 'prop-types';

const CurrentActivity = props => (
  <div className='currentactivity'>
    <FitbitAuthenticationLink/>
    <div className='titlebar'>
      <a href={props.activity ? 'https://www.strava.com/activities/' + props.activity.id : '.'}>
        <span className='title'>{props.activity ? props.activity.name : '...'}</span>
        <span className='date'>{props.activity ? dateFormat(props.activity.start_date) : ''}</span>
      </a>
    </div>
    <ErrorBoundary>
      <Map activity={props.activity}/>
    </ErrorBoundary>
  </div>
);

CurrentActivity.propTypes = {
  activity: PropTypes.object
};

export default CurrentActivity;
