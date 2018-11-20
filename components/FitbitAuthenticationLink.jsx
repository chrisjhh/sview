import React from 'react';
//import PropTypes from 'prop-types';
import { isFitbitAuthorised } from '../lib/localhost';
import { client_id, redirect_uri } from '../lib/fitbit_client_data';


export class FitbitAuthenticationLink extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      show: false
    };
  }

  render() {
    if (!this.state.show) {
      return null;
    }
    const url = `https://www.fitbit.com/oauth2/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&scope=activity%20heartrate%20profile`;
    return (
      <a className="fitbit auth" href={url}>Authenticate Fitbit Data</a>
    );
  }

  componentDidMount() {
    if (location.port && !isNaN(Number(location.port)) && 
        Number(location.port) !== 80) {
      isFitbitAuthorised()
        .then(response => {
          if (!response.authorised) {
            // We have no token so we want to show the link so we can get one
            this.setState({show : true});
          }
        })
        .catch(err => {
          console.log(err);
        }); 
    }
  }

}