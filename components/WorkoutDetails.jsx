import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';
import HeartRate from './HeartRate';
import { addFitbitHeartRateToActivity } from '../lib/fitbit_activity';

class WorkoutDetails extends React.Component  {

  constructor(props) {
    super(props);
    this.state = {
      activity: props.activity
    };
  }

  render() {
    return (
      <span className="detail">
        <span className='duration'>
          {duration(this.state.activity.elapsed_time)}
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

WorkoutDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default WorkoutDetails;