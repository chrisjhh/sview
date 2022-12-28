import React from 'react';
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';
import Activity from './Activity';
import { getLaps } from '../lib/cached_strava';
import { paceColor } from '../lib/colours';

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
          <td>{this.heartRate(l)}</td>
          <td>{ strPace ?
          <span className='pace'>{strPace}
            <span className="units">{this.paceUnits()}</span>
          </span>
          : null }</td>
          <td><div className="lapBar">{this.lapBar(l)}</div></td>
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

  lapBar(lap) {
    if (!this.state.laps.maxSpeed) {
      this.state.laps.maxSpeed = this.state.laps.reduce((val, l) => {
        if (!l.distance || !l.moving_time) {
          return val;
        }
        const speed = l.distance / l.moving_time;
        return speed > val ? speed : val;
      }, 0);
    }
    const maxSpeed = this.state.laps.maxSpeed;
    if (!lap.distance || !lap.moving_time) {
      return null;
    }
    const speed = lap.distance / lap.moving_time;
    const widthPercent = (speed / maxSpeed * 100).toFixed(2) + "%";
    const bgCol = paceColor((lap.moving_time/60)/(lap.distance/1609.34));
    return (
      <div style={{width: widthPercent, backgroundColor: bgCol, height: "100%" }}></div>
    );
  }

  heartRate(lap) {
    if (!lap.average_heartrate) {
      return null;
    }
    return (
    <span className="hr" title={'Max HR: ' + Number(lap.max_heartrate).toFixed(0)}>
      {Number(lap.average_heartrate).toFixed(0)}
      <span className="units">♥</span>
    </span>
    );
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