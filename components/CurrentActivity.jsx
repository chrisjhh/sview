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
      <span className='title'>{props.activity ? props.activity.name : '...'}</span>
      <span className='date'>{props.activity ? dateFormat(props.activity.start_date) : ''}</span>
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
