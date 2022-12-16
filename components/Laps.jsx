import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';
import Activity from './Activity';
import { getLaps } from '../lib/cached_strava';

const milesOrMetres = function(distance) {
  let mi = Number(distance) / 1609.34;
  if (mi > 0.9) {
    return mi.toFixed(1).toString() + 'mi';
  }
  return (Math.round(Number(distance)/10.0) * 10).toString() + 'm';
};

class Laps extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      laps: null
    };
  }

  render() {
    if (!this.props.activity) {
      return (null);
    }
    if (!this.state.laps) {
      if (this.state.laps === null) {
        this.loadLaps();
      }
      return (null);
    }
    let laps = <span>Loading...</span>;
    if (this.state.loaded) {
      laps = this.state.laps.map((l,i) => {
        const strPace = this.pace(l.distance,l.moving_time);
        return (
        <tr key={i} className="detail">
          <td><span>{l.name}</span></td>
          <td><span className='duration'>{duration(l.elapsed_time)}</span></td>
          <td><span className='distance'>{milesOrMetres(l.distance)}</span></td>
          { strPace ?
          <tr><span className='pace'>{strPace}
            <span className="units">{this.paceUnits()}</span>
          </span></tr>
          : null }
        </tr>
        );
        });
    }
    return (
      <table className='laps'>
        <tbody>
        {laps}
        </tbody>
      </table>
    );
  }

  pace(distance, time) {
    if (!distance) {
      return null;
    }
    if (this.props.activity.type == 'Swim') {
      let hy = Number(distance) / 91.44;
      return duration(time/hy);
    }
    let mi = Number(distance) / 1609.34;
    return duration(time/mi);
  };

  paceUnits() {
    if (this.props.activity.type == 'Swim') {
      return "/100yd";
    }
    return "/mi";
  }

  componentDidUpdate(prevProps, prevState) {
    // Does the state need to be updated
    if (this.props.activity !== prevProps.activity) {
      this.loading = false;
      this.setState({loaded: false, laps: null});
    }
    if (!this.state.loaded) {
      this.loadLaps();
    }
  }

  loadLaps() {
    const self = this;
    if (!this.state.loaded && !this.loading) {
      this.loading = true;
      getLaps(this.props.activity.id)
        .then(data => self.setState({
          loaded: true,
          laps: data
        }));
    }
  }
}



Laps.propTypes = {
  activity: PropTypes.object
};

export default Laps;