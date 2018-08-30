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
    console.log('componentDidUpdate', this.props.id, prevProps.id);
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
      <div id="mapid"></div>
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
    return result;
  }

  fitBounds() {
    // Get the latlng stream
    const result = this.getStream('latlng');
    if (result) {
      this.map.fitBounds(result[0].data);
    }
  }

  updateMap() {
    this.layer.clearLayers();
    switch (this.view) {
      case 'route': 
        this.displayRoute();
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
      this.route = L.polyline(result[0].data, {color: 'red'}).addTo(this.layer);
    }
  }
}

Map.propTypes = {
  id: PropTypes.number
};

export default Map;