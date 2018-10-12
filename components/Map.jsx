// See https://medium.com/@cherniavskii/creating-leaflet-maps-in-react-apps-e2750372d6d6
import React from 'react';
import PropTypes from 'prop-types';
import L from 'leaflet';
import { getStreams } from '../lib/cached_strava';

// Allow console log messages for now
/*eslint no-console: off*/

const colorchart = [
  '#000000', // 0 - Black
  '#404040', // 1 - Grey
  '#800080', // 2 - Purple
  '#990000', // 3 - red
  '#cc6600', // 4 - orange
  '#e6e600', // 5 - yellow
  '#39e600', // 6 - green
  '#00e6e6', // 7 - blue
  '#0080ff', // 8 - blue
  '#531aff', // 9 - blue
  '#9933ff', // 10 - purple
  '#ff4dff', // 11 - pink
  '#ff99e6', // 12 - pink
  '#f2d9df', // 13 - pink
  '#f5efef', // 14 - pink
  '#ffffff', // 15 - white
];

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: props.id,
      view: 'route',
      streams: null
    };
  }

  componentDidMount()  {
    this.map = L.map('mapid');
    let mapurl = 'https://api.tiles.mapbox.com/v4';
    // Check if we are running on local server with its own cache
    if (location.port && !isNaN(Number(location.port)) && 
        Number(location.port) !== 80) {
      mapurl = '/api.tiles.mapbox.com/v4';
    }
    L.tileLayer(`${mapurl}/{id}/{z}/{x}/{y}.png?access_token={accessToken}`, {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.streets',
      accessToken: 'pk.eyJ1IjoiY2hyaXNqaGgiLCJhIjoiY2psZjRqYThwMHFqdTN2b2JyYjBpM2toNyJ9.LLJOL9OCB589_DijIuEj-Q'
    }).addTo(this.map);
    // Add a layer for this disposable details
    this.layer = L.layerGroup().addTo(this.map);
    if (this.state.id != null) {
      this.loadStreams();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Does the state need to be updated
    if (this.props.id !== this.state.id) {
      this.setState({id: this.props.id});
    }
    if (this.state.id !== prevState.id) {
      this.loadStreams();
    } else if (this.state.view !== prevState.view) {
      this.updateMap();
    } 
  }

  render() {
    const options = ['Route', 'Pace', 'HR', 'Cadence', 'Efficiency', 'Inclination'];
    let values = {};
    for (let opt of options) {
      let view = opt.toLowerCase();
      values[opt] = {};
      values[opt]['classes'] = ['mapoption'];
      if (this.state.view == view) {
        values[opt]['classes'].push('selected');
      }
    }
    if (!this.getStream('heartrate')) {
      for (let v of ['HR', 'Efficiency']) {
        values[v]['classes'].push('disabled');
      }
    }
    if (!this.getStream('cadence')) {
      values['Cadence']['classes'].push('disabled');
    }
    if (!this.getStream('latlng')) {
      values['Route']['classes'].push('disabled');
    }
    if (!this.getStream('distance')) {
      values['Pace']['classes'].push('disabled');
    }
    if (!this.getStream('altitude')) {
      values['Inclination']['classes'].push('disabled');
    }
    const controls = options.map(opt => (
      <span key={opt} className={values[opt].classes.join(' ')} onClick={() => this.setState({view: opt.toLowerCase()})}>{opt}</span>
    ));
    return (
      <div>
        <div id="mapid"></div>
        <div className="mapoptions">
          {controls}
        </div>
      </div>
    );
  }

  loadStreams() {
    const options = {
      keys_by_type: true,
      keys: 'cadence,distance,time,heartrate,latlng,altitude'
    };
    getStreams(this.state.id, options)
      .then(data => {
        this.setState({streams: data});
        this.fitBounds();
        this.updateMap();
      })
      .catch(err => 
        console.log('Streams failed to load', err)
      );
  }

  getStream(type) {
    if (!this.state.streams) {
      //console.log('No streams');
      return null;
    }
    if (!this.state.streams.filter) {
      console.log('streams has no filter method', this.state.streams);
    }
    const result = this.state.streams.filter(stream => stream.type === type);
    if (result.length !== 1) {
      //console.log(`Expected one ${type} stream`);
      return null;
    }
    return result[0];
  }

  fitBounds() {
    // Get the latlng stream
    const result = this.getStream('latlng');
    if (result) {
      this.map.fitBounds(result.data);
    }
  }

  updateMap() {
    this.layer.clearLayers();
    switch (this.state.view) {
      case 'route': 
        this.displayRoute();
        this.displayMileMarkers();
        break;
      case 'hr':
        this.displayHR();
        break;
      case 'cadence':
        this.displayCadence();
        break;
      case 'pace':
        this.displayPace();
        break;
      case 'efficiency':
        this.displayEfficiency();
        break;
      case 'inclination':
        this.displayInclination();
        break;
      default:
        console.log('Unknown view option:', this.view);
        this.displayRoute();
    }
  }

  displayRoute() {
    // Get the latlng stream
    const result = this.getStream('latlng');
    if (result) {
      this.route = L.polyline(result.data, {color: 'red'}).addTo(this.layer);
    }
  }

  displayHR() {
    const latlng = this.getStream('latlng');
    const hr = this.getStream('heartrate');
    if (!latlng || !hr) {
      return;
    }
    const rest = 54;
    const max = 188;
    const reserve = max - rest;
    const z1 = rest + 0.5 * reserve;
    const z2 = rest + 0.75 * reserve;
    const z3 = rest + 0.85 * reserve;
    const z4 = rest + 0.9 * reserve;
    const z5 = rest + 0.95 * reserve;
    const color = function(bpm) {
      if (bpm < z1) {
        return '#0040ff';
      }
      if (bpm < z2) {
        return '#00ffff';
      }
      if (bpm < z3) {
        return '#40ff00';
      }
      if (bpm < z4) {
        return '#ffff00';
      }
      if (bpm < z5) {
        return '#ff8000';
      }
      return '#ff0000';
    };
    let datapoints = [];
    let col = null;
    for (let i=0; i<latlng.data.length; ++i) {
      let icol = color(hr.data[i]);
      if (icol === col) {
        datapoints.push(latlng.data[i]);
      } else {
        if (datapoints.length > 0) {
          datapoints.push(latlng.data[i]);
          L.polyline(datapoints, {color: col}).addTo(this.layer);
        }
        datapoints = [];
        datapoints.push(latlng.data[i]);
        col = icol;
      }
    }
    if (datapoints.length > 1) {
      L.polyline(datapoints, {color: col}).addTo(this.layer);
    }
  }

  displayCadence() {
    const latlng = this.getStream('latlng');
    const cadence = this.getStream('cadence');
    if (!latlng || !cadence) {
      return;
    }
    const color = function(spm) {
      if (spm < 60) {
        return colorchart[0];
      }
      if (spm < 65) {
        return colorchart[1];
      }
      if (spm < 70) {
        return colorchart[2];
      }
      if (spm < 75) {
        return colorchart[3];
      }
      if (spm < 80) {
        return colorchart[4];
      }
      if (spm < 85) {
        return colorchart[5];
      }
      if (spm < 90) {
        return colorchart[6];
      }
      if (spm < 95) {
        return colorchart[7];
      }
      if (spm < 100) {
        return colorchart[8];
      }
      if (spm < 105) {
        return colorchart[9];
      }
      if (spm < 110) {
        return colorchart[10];
      }
      return colorchart[11];
    };
    let datapoints = [];
    let col = null;
    for (let i=0; i<latlng.data.length; ++i) {
      let icol = color(cadence.data[i]);
      if (icol === col) {
        datapoints.push(latlng.data[i]);
      } else {
        if (datapoints.length > 0) {
          datapoints.push(latlng.data[i]);
          L.polyline(datapoints, {color: col}).addTo(this.layer);
        }
        datapoints = [];
        datapoints.push(latlng.data[i]);
        col = icol;
      }
    }
    if (datapoints.length > 1) {
      L.polyline(datapoints, {color: col}).addTo(this.layer);
    }
  }

  displayPace() {
    const latlng = this.getStream('latlng');
    const distance = this.getStream('distance');
    const time = this.getStream('time');
    if (!latlng || !distance || !time) {
      return;
    }
    const color = function(pace) {
      if (pace > 12) {
        return colorchart[0];
      }
      if (pace > 11) {
        return colorchart[1];
      }
      if (pace > 10) {
        return colorchart[2];
      }
      if (pace > 9.5) {
        return colorchart[3];
      }
      if (pace > 9) {
        return colorchart[4];
      }
      if (pace > 8.5) {
        return colorchart[5];
      }
      if (pace > 8) {
        return colorchart[6];
      }
      if (pace > 7.5) {
        return colorchart[7];
      }
      if (pace > 7) {
        return colorchart[8];
      }
      if (pace > 6.5) {
        return colorchart[9];
      }
      if (pace > 6) {
        return colorchart[10];
      }
      if (pace > 5.5) {
        return colorchart[11];
      }
      if (pace > 5) {
        return colorchart[12];
      }
      if (pace > 4.5) {
        return colorchart[13];
      }
      if (pace > 4) {
        return colorchart[14];
      }
      return colorchart[15];
    };
    let datapoints = [];
    let col = null;
    let lastpace = null;
    let smooth = 0.4;
    for (let i=0; i<latlng.data.length; ++i) {
      let j = i - 40;
      if (j < 0) {
        datapoints.push(latlng.data[i]);
        continue;
      }
      let t = time.data[i] - time.data[j];
      let d = distance.data[i] - distance.data[j];
      let pace = d > 0 ? (t / 60)/(d / 1609.34) : 1000;
      let icol = color(pace);
      if (col === null) {
        col = icol;
        lastpace = pace;
      }
      if (icol === col) {
        datapoints.push(latlng.data[i]);
        lastpace = pace;
      } else if (Math.abs(pace - lastpace) < smooth) {
        datapoints.push(latlng.data[i]);
      } else {
        if (datapoints.length > 0) {
          datapoints.push(latlng.data[i]);
          L.polyline(datapoints, {color: col}).addTo(this.layer);
        }
        datapoints = [];
        datapoints.push(latlng.data[i]);
        col = icol;
        lastpace = pace;
      }
    }
    if (datapoints.length > 1) {
      L.polyline(datapoints, {color: col}).addTo(this.layer);
    }
  }

  displayEfficiency() {
    const latlng = this.getStream('latlng');
    const distance = this.getStream('distance');
    const time = this.getStream('time');
    const hr = this.getStream('heartrate');
    if (!latlng || !distance || !time || !hr) {
      return;
    }
    const color = function(hpm) {
      if (hpm > 1800) {
        return colorchart[0];
      }
      if (hpm > 1700) {
        return colorchart[1];
      }
      if (hpm > 1600) {
        return colorchart[2];
      }
      if (hpm > 1500) {
        return colorchart[3];
      }
      if (hpm > 1400) {
        return colorchart[4];
      }
      if (hpm > 1300) {
        return colorchart[5];
      }
      if (hpm > 1200) {
        return colorchart[6];
      }
      if (hpm > 1100) {
        return colorchart[7];
      }
      if (hpm > 1000) {
        return colorchart[8];
      }
      if (hpm > 900) {
        return colorchart[9];
      }
      if (hpm > 800) {
        return colorchart[10];
      }
      if (hpm > 700) {
        return colorchart[11];
      }
      if (hpm > 600) {
        return colorchart[12];
      }
      if (hpm > 500) {
        return colorchart[13];
      }
      if (hpm > 400) {
        return colorchart[14];
      }
      return colorchart[15];
    };
    let datapoints = [];
    let col = null;
    let lasthpm = null;
    let smooth = 60;
    for (let i=0; i<latlng.data.length; ++i) {
      let j = i - 40;
      if (j < 0) {
        datapoints.push(latlng.data[i]);
        continue;
      }
      let t = time.data[i] - time.data[j];
      let d = distance.data[i] - distance.data[j];
      let pace = d > 0 ? (t / 60)/(d / 1609.34) : 1000;
      let hpm = pace * hr.data[i];
      let icol = color(hpm);
      if (col === null) {
        col = icol;
        lasthpm = hpm;
      }
      if (icol === col) {
        datapoints.push(latlng.data[i]);
        lasthpm = hpm;
      } else if (Math.abs(hpm - lasthpm) < smooth) {
        datapoints.push(latlng.data[i]);
      } else {
        if (datapoints.length > 0) {
          datapoints.push(latlng.data[i]);
          L.polyline(datapoints, {color: col}).addTo(this.layer);
        }
        datapoints = [];
        datapoints.push(latlng.data[i]);
        col = icol;
        lasthpm = hpm;
      }
    }
    if (datapoints.length > 1) {
      L.polyline(datapoints, {color: col}).addTo(this.layer);
    }
  }

  displayInclination() {
    const latlng = this.getStream('latlng');
    const distance = this.getStream('distance');
    const altitude = this.getStream('altitude');
    if (!latlng || !distance || !altitude) {
      return;
    }
    const color = function(inc) {
      if (inc > 12) {
        return colorchart[0];
      }
      if (inc > 9) {
        return colorchart[1];
      }
      if (inc > 7) {
        return colorchart[2];
      }
      if (inc > 5) {
        return colorchart[3];
      }
      if (inc > 3) {
        return colorchart[4];
      }
      if (inc > 1) {
        return colorchart[5];
      }
      if (inc > -1) {
        return colorchart[6];
      }
      if (inc > -3) {
        return colorchart[7];
      }
      if (inc > -5) {
        return colorchart[8];
      }
      if (inc > -7) {
        return colorchart[9];
      }
      if (inc > -9) {
        return colorchart[10];
      }
      if (inc > -11) {
        return colorchart[11];
      }
      return colorchart[12];
    };
    let datapoints = [];
    let col = null;
    let lastinc = null;
    let smooth = 0.5;
    for (let i=0; i<latlng.data.length; ++i) {
      let j = i - 4;
      let k = i + 4;
      if (j < 0 || k >= latlng.data.length) {
        datapoints.push(latlng.data[i]);
        continue;
      }
      let d = distance.data[k] - distance.data[j];
      let h = altitude.data[k] - altitude.data[j];
      let inc = h * 100 / d;
      let icol = color(inc);
      if (col === null) {
        col = icol;
        lastinc = inc;
      }
      if (icol === col) {
        datapoints.push(latlng.data[i]);
        lastinc = inc;
      } else if (Math.abs(inc - lastinc) < smooth) {
        datapoints.push(latlng.data[i]);
      } else {
        if (datapoints.length > 0) {
          datapoints.push(latlng.data[i]);
          L.polyline(datapoints, {color: col}).addTo(this.layer);
        }
        datapoints = [];
        datapoints.push(latlng.data[i]);
        col = icol;
        lastinc = inc;
      }
    }
    if (datapoints.length > 1) {
      L.polyline(datapoints, {color: col}).addTo(this.layer);
    }
  }

  displayMileMarkers(interval=1609.34) {
    const latlng = this.getStream('latlng');
    const distance = this.getStream('distance');
    if (!latlng || !distance) {
      return;
    }
    let n = 1;
    let nextMarker = interval;
    for (let i=0;i<latlng.data.length; ++i) {
      if (distance.data[i] >= nextMarker) {
        let marker = L.circleMarker(latlng.data[i], {radius: 3}).addTo(this.layer);
        marker.bindTooltip(n.toString()).openTooltip();
        ++n;
        nextMarker += interval;
      }
    }
  }
}





Map.propTypes = {
  id: PropTypes.number
};

export default Map;