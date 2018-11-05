import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';
import HeartRate from './HeartRate';
import XPoints from './XPoints';
import VDot from './VDot';
import HBPerMile from './HBPerMile';
import { getStats, getWeather } from '../lib/localhost';

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
      stats: null,
      weather: null
    };
  }

  render() {
    const isRace = this.props.activity.workout_type === 1;
    const time = isRace ? this.props.activity.elapsed_time : this.props.activity.moving_time;
    const strPace = pace(this.props.activity.distance,time);
    return (
      <span className='detail'>
        <span className='distance'>{miles(this.props.activity.distance)}</span>
        <span className='duration'>{duration(time)}
          { this.award() }
        </span>
        { strPace ?
          <span className='pace'>{strPace}
            <span className="units">/mi</span>
          </span>
          : null }
        <HeartRate activity={this.props.activity}/>
        <XPoints activity={this.props.activity}/>
        <VDot activity={this.props.activity}/>
        <HBPerMile activity={this.props.activity}/>
        { this.weather() }
      </span>
    );
  }

  componentDidMount() {
    // Check if we are running on local server with its own cache
    if (location.port && !isNaN(Number(location.port)) && 
        Number(location.port) !== 80) {
      getStats(this.props.activity.id, {date: this.props.activity.start_date_local})
        .then(stats => this.setState({stats}))
        .catch(err => console.log(err));
      getWeather(this.props.activity.id)
        .then(weather => this.setState({weather}))
        .catch(err => console.log(err));
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
        if (this.props.activity.elapsed_time == this.state.stats.pbs[i]) {
          return (
            <span className={'award pb ' + ordinals[i]} title={pb_titles[i]}></span>
          );
        }
      }
    }
    // Is this an SB?
    if (this.state.stats.sbs && this.state.stats.sbs.length >= 3) {
      for(let i=0; i<3; ++i) {
        if (this.props.activity.elapsed_time == this.state.stats.sbs[i]) {
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
      const miles = this.props.activity.distance / 1609.34;
      const tol = 10 * miles;
      if (this.props.activity.elapsed_time < average - tol) {
        return (
          <span className="award faster" title="Faster than recent average."></span>
        );
      }
      if (this.props.activity.elapsed_time > average + tol) {
        return (
          <span className="award slower" title="Slower than recent average."></span>
        );
      }
    }
    // Nothing of note
    return null; 
  }

  weather() {
    if (!this.state.weather) {
      return null;
    }
    let night = null;
    if (this.state.weather[0].solar_elevation && 
        this.state.weather[0].solar_elevation < -6) {
      night = (
        <span className="night" title="Night time."></span>
      );
    }
    return (
      <span className="weather">
        {this.state.weather[0].temperature}
        <span className="units">°C</span>
        { night }
      </span>
    );
  }
  
}

RunDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default RunDetails;