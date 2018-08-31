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
          <span onClick={() => this.setState({view: 'cadence'})}>Cadence</span>
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
        return 'white';
      }
      if (bpm < z2) {
        return 'blue';
      }
      if (bpm < z3) {
        return 'green';
      }
      if (bpm < z4) {
        return 'yellow';
      }
      if (bpm < z5) {
        return 'orange';
      }
      return 'red';
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
        return 'purple';
      }
      if (pace > 5.5) {
        return 'plum';
      }
      if (pace > 5) {
        return 'lightpink';
      }
      if (pace > 4.5) {
        return 'mistyrose';
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
}





Map.propTypes = {
  id: PropTypes.number
};

export default Map;