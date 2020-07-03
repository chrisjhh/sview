import React from 'react';
import PropTypes from 'prop-types';
import {trainingLoad} from '../lib/trainingload';
import { getStreams } from '../lib/cached_strava';
import KalmanFilter from 'kalmanjs';

class TrainingLoad extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activity: props.activity,
      value: null
    };
  }

  render() {
    if (!this.state.value) {
      return null;
    }
    return (
      <span className="trainingload" title="Training Load">
        <span className="units">TL</span>
        {Number(this.state.value).toFixed(0)}
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
        }
        const value = trainingLoad(hr.data,t.data,190); //TODO: Hardcoded max HR
        self.setState({value});
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
