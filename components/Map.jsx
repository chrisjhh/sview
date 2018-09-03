// See https://medium.com/@cherniavskii/creating-leaflet-maps-in-react-apps-e2750372d6d6
import React from 'react';
import PropTypes from 'prop-types';
import L from 'leaflet';
import { getStreams } from '../lib/cached_strava';

// Allow console log messages for now
/*eslint no-console: off*/

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: props.id,
      view: 'route'
    };
  }

  componentDidMount()  {
    this.map = L.map('mapid');
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
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
    return (
      <div>
        <div id="mapid"></div>
        <div>
          <span onClick={() => this.setState({view: 'route'})}>Route</span>|
          <span onClick={() => this.setState({view: 'pace'})}>Pace</span>|
          <span onClick={() => this.setState({view: 'hr'})}>HR</span>|
          <span onClick={() => this.setState({view: 'cadence'})}>Cadence</span>|
          <span onClick={() => this.setState({view: 'efficiency'})}>Efficiency</span>
        </div>
      </div>
    );
  }

  loadStreams() {
    const options = {
      keys_by_type: true,
      keys: 'cadence,distance,time,heartrate,latlng'
    };
    getStreams(this.state.id, options)
      .then(data => {
        this.streams = data;
        this.fitBounds();
        this.updateMap();
      })
      .catch(err => 
        console.log('Streams failed to load', err)
      );
  }

  getStream(type) {
    if (!this.streams) {
      console.log('No streams');
      return null;
    }
    const result = this.streams.filter(stream => stream.type === type);
    if (result.length !== 1) {
      console.log(`Expected one ${type} stream`);
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
      if (spm < 70) {
        return 'black';
      }
      if (spm < 75) {
        return 'red';
      }
      if (spm < 80) {
        return 'orange';
      }
      if (spm < 85) {
        return 'yellow';
      }
      if (spm < 90) {
        return 'green';
      }
      return 'blue';
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
        return 'black';
      }
      if (pace > 10) {
        return 'purple';
      }
      if (pace > 9.5) {
        return 'red';
      }
      if (pace > 9) {
        return 'orange';
      }
      if (pace > 8.5) {
        return 'yellow';
      }
      if (pace > 8) {
        return 'green';
      }
      if (pace > 7.5) {
        return 'lightgreen';
      }
      if (pace > 7) {
        return 'blue';
      }
      if (pace > 6.5) {
        return 'lightblue';
      }
      if (pace > 6) {
        return 'plum';
      }
      if (pace > 5.5) {
        return 'lightpink';
      }
      if (pace > 5) {
        return 'mistyrose';
      }
      if (pace > 4.5) {
        return 'lightcyan';
      }
      return 'white';
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
      if (hpm > 1450) {
        return 'purple';
      }
      if (hpm > 1400) {
        return 'red';
      }
      if (hpm > 1350) {
        return 'orange';
      }
      if (hpm > 1300) {
        return 'yellow';
      }
      if (hpm > 1250) {
        return 'green';
      }
      if (hpm > 1200) {
        return 'lightgreen';
      }
      if (hpm > 1150) {
        return 'blue';
      }
      if (hpm > 1100) {
        return 'lightblue';
      }
      if (hpm > 1050) {
        return 'pink';
      }
      if (hpm > 1000) {
        return 'lightpink';
      }
      if (hpm > 950) {
        return 'mistyrose';
      }
      return 'white';
    };
    let datapoints = [];
    let col = null;
    let lasthpm = null;
    let smooth = 40;
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
}





Map.propTypes = {
  id: PropTypes.number
};

export default Map;