import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';
import HeartRate from './HeartRate';
import XPoints from './XPoints';
import VDot from './VDot';
import HBPerMile from './HBPerMile';
import { getStats, getManualHR } from '../lib/localhost';
import { addFitbitHeartRateToActivity } from '../lib/fitbit_activity';
import Weather from './Weather';
import TrainingLoad from './TrainingLoad';

const miles = function(distance) {
  let mi = Number(distance) / 1609.34;
  return mi.toFixed(1).toString() + 'mi';
};

const pace = function(distance, time) {
  if (!distance) {
    return null;
  }
  let mi = Number(distance) / 1609.34;
  return duration(time/mi);
};


class RunDetails extends React.Component  {

  constructor(props) {
    super(props);
    this.state = {
      activity: props.activity,
      stats: null,
      weather: null
    };
  }

  render() {
    const isRace = this.state.activity.workout_type === 1;
    const time = isRace ? this.state.activity.elapsed_time : this.state.activity.moving_time;
    const strPace = pace(this.state.activity.distance,time);
    return (
      <span className='detail'>
        <span className='distance'>{miles(this.state.activity.distance)}</span>
        <span className='duration'>{duration(time)}
          { this.award() }
        </span>
        { strPace ?
          <span className='pace'>{strPace}
            <span className="units">/mi</span>
          </span>
          : null }
        <HeartRate activity={this.state.activity}/>
        <XPoints activity={this.state.activity}/>
        <VDot activity={this.state.activity}/>
        <HBPerMile activity={this.state.activity}/>
        <TrainingLoad activity={this.state.activity}/>
        { this.state.activity.type == 'VirtualRun' ? null : <Weather activity={this.state.activity}/> }
      </span>
    );
  }

  componentDidMount() {
    // Check if we are running on local server with its own cache
    if (location.port && !isNaN(Number(location.port)) && 
        Number(location.port) !== 80) {
      getStats(this.state.activity.id, {date: this.state.activity.start_date_local})
        .then(stats => this.setState({stats}))
        .catch(err => console.log(err));
      // Get fitbit hr info if no hr data
      if (!this.state.activity.has_heartrate) {
        getManualHR(this.state.activity.id)
          .then((response) => {
            if (response && response.average_heartrate) {
              this.setState(
                {activity: {
                  ...this.state.activity, 
                  ...response,
                  has_heartrate: true,
                  heartrate_set_manually: true
                }}
              );
            } else {
              return addFitbitHeartRateToActivity(this.state.activity)
                .then(activity => this.setState({activity}));
            }
          })
          .catch(err => console.log(err));
      }
    }
  }

  award() {
    if (!this.state.stats) {
      return null;
    }
    const ordinals = ['first','second','third'];
    const pb_titles = ['Personal Best!', 'Second-best time!', 'Third-best time!'];
    const sb_titles = ['Best time this year!', 'Second-best time this year!', 'Third-best time this year!'];
    // Is this a PB?
    if (this.state.stats.pbs && this.state.stats.pbs.length >= 3) {
      for(let i=0; i<3; ++i) {
        if (this.state.activity.elapsed_time == this.state.stats.pbs[i]) {
          return (
            <span className={'award pb ' + ordinals[i]} title={pb_titles[i]}></span>
          );
        }
      }
    }
    // Is this an SB?
    if (this.state.stats.sbs && this.state.stats.sbs.length >= 3) {
      for(let i=0; i<3; ++i) {
        if (this.state.activity.elapsed_time == this.state.stats.sbs[i]) {
          return (
            <span className={'award sb ' + ordinals[i]} title={sb_titles[i]}></span>
          );
        }
      }
    }
    // Was it faster or slower than recent average?
    if (this.state.stats.recent && this.state.stats.recent.length >= 4) {
      // Take all except the first one as this is us!
      const recent = this.state.stats.recent.slice(1);
      const average = recent.reduce((p,c) => p + c, 0) / recent.length;
      const miles = this.state.activity.distance / 1609.34;
      const tol = 10 * miles;
      if (this.state.activity.elapsed_time < average - tol) {
        return (
          <span className="award faster" title="Faster than recent average."></span>
        );
      }
      if (this.state.activity.elapsed_time > average + tol) {
        return (
          <span className="award slower" title="Slower than recent average."></span>
        );
      }
    }
    // Nothing of note
    return null; 
  }
  
}

RunDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default RunDetails;
