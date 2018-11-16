import React from 'react';
import PropTypes from 'prop-types';
import { getToken } from '../lib/fitbit_token';
import { client_id } from '../lib/fitbit_client_data';

export const FitbitAuthenticationLink = props => {
  if (location.port && !isNaN(Number(location.port)) && 
        Number(location.port) !== 80) {
    const redirect_url = 'http://localhost:7676/fitbit/auth';
    const url = `https://www.fitbit.com/oauth2/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_url}&scope=activity%%20heartrate%%20profile`;
    return (
      <a className="fitbit auth" href={url}>Authenticate Fitbit Data</a>
    );
  }
  return null;
};