import React from 'react';
import PropTypes from 'prop-types';
import {trainingLoad, trainingLoad_accurate} from '../lib/trainingload';
import { getStreams } from '../lib/cached_strava';
import KalmanFilter from 'kalmanjs';

const xpoints = function(activity) {
  const hr = activity.average_heartrate;
  const time = activity.elapsed_time;
  const xp = ((Number(hr) - 100) * (time /60)) / 450;
  return xp.toFixed(1);
};

class TrainingLoad extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activity: props.activity,
      value: null,
      accurate: null
    };
  }

  render() {
    if (!this.state.value) {
      return null;
    }
    return (
      <span className='trainingload tooltip'>
        <span className='units'>TL</span>
        {Number(this.state.accurate).toFixed(0)}
        <span className="tooltiptext">
          <div>Training Load</div>
          <table>
            <tr><td>Traditional</td><td>{(this.state.value).toFixed(0)}</td></tr>
            <tr><td>XP</td><td>{xpoints(this.state.activity)}</td></tr>
          </table>
        </span>
      </span>
    );
  }

  componentDidMount()  {
    if (this.state.activity != null) {
      this.loadAndUpdate();
    }
  }

  loadAndUpdate() {
    const options = {
      keys_by_type: true,
      keys: 'cadence,distance,time,heartrate,latlng,altitude'
    };
    const self = this;
    getStreams(this.state.activity.id, options)
      .then(data => {
        const hr_list = data.filter(stream => stream.type === 'heartrate');
        const hr = hr_list.length === 1 ? hr_list[0] : null;
        const t_list = data.filter(stream => stream.type === 'time');
        const t = t_list.length === 1 ? t_list[0] : null;
        if (hr) {
          // Do a noise filter on the HR data
          var kf = new KalmanFilter({R: 0.3, Q: 5});
          for (let i=0;i<3;++i) {
            hr.data = hr.data.map((v) => kf.filter(v));
          }
          const value = trainingLoad(hr.data,t.data,190); //TODO: Hardcoded max HR
          const accurate = trainingLoad_accurate(hr.data,t.data,190);
          self.setState({value, accurate});
        }
      })
      .catch(err => 
        console.log('Streams failed to load', err)
      );
  }

}

TrainingLoad.propTypes = {
  activity: PropTypes.object.isRequired
};

export default TrainingLoad;
