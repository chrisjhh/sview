import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';
import HeartRate from './HeartRate';
import XPoints from './XPoints';
import VDot from './VDot';
import HBPerMile from './HBPerMile';
import { getStats } from '../lib/localhost';

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
      stats: null
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
    }
  }

  award() {
    if (!this.state.stats) {
      return null;
    }
    const ordinals = ['first','second','third'];
    // Is this a PB?
    if (this.state.stats.pbs && this.state.stats.pbs.length >= 3) {
      for(let i=0; i<3; ++i) {
        if (this.props.activity.elapsed_time == this.state.stats.pbs[i]) {
          return (
            <span className={'award pb ' + ordinals[i]}></span>
          );
        }
      }
    }
    // Is this an SB?
    if (this.state.stats.sbs && this.state.stats.sbs.length >= 3) {
      for(let i=0; i<3; ++i) {
        if (this.props.activity.elapsed_time == this.state.stats.sbs[i]) {
          return (
            <span className={'award sb ' + ordinals[i]}></span>
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
          <span className="award faster"></span>
        );
      }
      if (this.props.activity.elapsed_time > average + tol) {
        return (
          <span className="award slower"></span>
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