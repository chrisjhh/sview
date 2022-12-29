import React from 'react';
import { dateFormat } from '../lib/duration';
import FitbitAuthenticationLink from './FitbitAuthenticationLink';
import ErrorBoundary from './ErrorBoundary';
import Map from './Map';
import Laps from './Laps';
import PropTypes from 'prop-types';

class CurrentActivity extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      lap: null
    }
  }

  render() {
    const props = this.props;
    return (
      <div className='currentactivity'>
        <FitbitAuthenticationLink/>
        <div className='titlebar'>
          <a href={props.activity ? 'https://www.strava.com/activities/' + props.activity.id : '.'} target='_blank' rel='noopener noreferrer'>
            <span className='title'>{props.activity ? props.activity.name : '...'}</span>
            <span className='date'>{props.activity ? dateFormat(props.activity.start_date) : ''}</span>
          </a>
        </div>
        <ErrorBoundary>
          <Map activity={props.activity} lap={this.state.lap}/>
        </ErrorBoundary>
        <Laps activity={props.activity} selectLap={this.selectLap.bind(this)} currentLap={this.state.lap}/>
      </div>
    );
  }

  selectLap(lap) {
    if (!this.state.lap || lap.id !== this.state.lap.id) {
      this.setState({lap: lap});
    } else {
      this.setState({lap: null});
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Does the state need to be updated
    if (this.props.activity !== prevProps.activity) {
      this.setState({lap: null});
    }
  }

}

CurrentActivity.propTypes = {
  activity: PropTypes.object
};

export default CurrentActivity;
