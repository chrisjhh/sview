import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';
import { addFitbitHeartRateToActivity } from '../lib/fitbit_activity';
import HeartRate from './HeartRate';

const miles = function(distance) {
  let mi = Number(distance) / 1609.34;
  return mi.toFixed(1).toString() + 'mi';
};

const location = function(activity) {
  if (activity.location_city) {
    return activity.location_city;
  }
  if (activity.location_state) {
    return activity.location_state;
  }
  if (activity.timezone.indexOf('/') !== -1) {
    return activity.timezone.replace(/.*\//,'');
  }
  return null;
};

const elevation = function(gain) {
  const ft = gain * 3.28084;
  return ft.toFixed(0);
};

class WalkDetails extends React.Component  {

  constructor(props) {
    super(props);
    this.state = {
      activity: props.activity
    };
  }

  render() {
    return(
      <span className="detail">
        <span className="location">{location(this.state.activity)}</span>
        <span className='distance'>{miles(this.state.activity.distance)}</span>
        <span className='duration'>{
          duration(this.state.activity.elapsed_time)}</span>
        <span className='elevation'>{elevation(this.state.activity.total_elevation_gain)}
          <span className='units'>ft</span>
        </span>
        <HeartRate activity={this.state.activity}/>
      </span>
    );
  }

  componentDidMount() {
    // Get fitbit hr info if no hr data
    if (!this.state.activity.has_heartrate) {
      addFitbitHeartRateToActivity(this.state.activity)
        .then(activity => this.setState({activity}))
        .catch(err => console.log(err));
    }
  }
}

WalkDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default WalkDetails;
