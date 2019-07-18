// See https://medium.com/@cherniavskii/creating-leaflet-maps-in-react-apps-e2750372d6d6
import React from 'react';
import PropTypes from 'prop-types';
import L from 'leaflet';
import { getStreams } from '../lib/cached_strava';
import { Graph } from '../lib/graph';
import { fitbitHeartrate } from '../lib/localhost';
import { paceColor, walkingPaceColor, hrColor, cadenceColor, walkingCadenceColor, efficiencyColor, inclinationColor, colorchart } from '../lib/colours';
import { duration, hms } from '../lib/duration';
import { velocity } from '../lib/velocity';
import { inclination } from '../lib/inclination';

// Allow console log messages for now
/*eslint no-console: off*/



class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activity: props.activity,
      view: 'route',
      streams: null
    };
  }

  componentDidMount()  {
    // Create map
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
    if (this.state.activity != null) {
      this.loadStreams();
    }
    // Create graph
    this.graph = new Graph('graph');
    this.dynamic_layer = L.layerGroup().addTo(this.map);
    this.graph.moveHook = this.dynamicMove.bind(this);
    this.graph.outHook = this.dynamicClear.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    // Does the state need to be updated
    if (this.props.activity !== this.state.activity) {
      this.setState({activity: this.props.activity});
    }
    if (this.state.activity !== prevState.activity) {
      this.loadStreams();
    } else if (this.state.view !== prevState.view) {
      this.updateAll();
    } 
  }

  updateAll() {
    this.updateMap();
    this.updateGraph();
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
      if (!values['Efficiency']['classes'].includes('disabled')) {
        values['Efficiency']['classes'].push('disabled');
      }
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
        <span className="graphbox" width="600" height="150">
          <canvas id="graph" width="600" height="150"></canvas>
          <div id="graphdetails" className="graphdetails">Some text</div>
        </span>
      </div>
    );
  }

  loadStreams() {
    const options = {
      keys_by_type: true,
      keys: 'cadence,distance,time,heartrate,latlng,altitude'
    };
    getStreams(this.state.activity.id, options)
      .then(data => {
        this.setState({streams: data});
        this.fitBounds();
        this.updateAll();
        if (!this.getStream('heartrate')) {
          this.loadFitbitHeartRate();
        }
      })
      .catch(err => 
        console.log('Streams failed to load', err)
      );
  }

  loadFitbitHeartRate() {
    fitbitHeartrate(
      this.state.activity.start_date_local,
      this.state.activity.elapsed_time
    )
      .then(response =>{
        const series = response['activities-heart-intraday'];
        if (!series) {
          return;
        }
        let times = series.dataset.map(x => hms(x.time));
        const start = new Date(this.state.activity.start_date);
        const offset = start.getHours() * 3600 + start.getMinutes() * 60 + start.getSeconds();
        times = times.map(t => t - offset);
        const values = series.dataset.map(x => x.value);
        const timeStream = this.getStream('time');
        const newStreams = [...this.state.streams];
        if (!timeStream) {
          // Add both streams from fitbit
          newStreams.push({type : 'time', data : times});
          newStreams.push({type : 'heartrate', data : values});
        } else {
          // We want to insert the data we have got
          const hrStream = {type : 'heartrate', data : []};
          for (let i = 0; i < timeStream.data.length; ++i) {
            let found = false;
            for (let j = 0; j < times.length; ++j) {
              if (timeStream.data[i] == times[j]) {
                hrStream.data.push(values[j]);
                found = true;
                break;
              }
            }
            if (!found) {
              hrStream.data.push(null);
            }
          }
          newStreams.push(hrStream);
        }
        this.setState({streams : newStreams});
        this.updateAll();
      })
      .catch(err => console.log(err));
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

  getPaceData(span = 40) {
    const distance = this.getStream('distance');
    const time = this.getStream('time');
    if (!distance || !time) {
      return null;
    }
    const tol = 2;
    let velocities = velocity(distance.data,time.data,tol,span);
    const pace = velocities.map(v => v > 0 ? 1609.43 / (v * 60) : 1000);
    return pace;
  }

  getIntervals() {
    const timeStream = this.getStream('time');
    const distanceStream = this.getStream('distance');
    let intervals = [];
    if (!timeStream || !distanceStream) {
      return null;
    }
    const paceData = this.getPaceData(20);
    let intervalStart = null;
    for (let i = 0; i< paceData.length; ++i) {
      const pace = paceData[i];
      if (intervalStart === null) {
        // Check if interval has started
        if (pace < 7.25) {
          intervalStart = i;
        }
      } else {
        // Check if interval has ended
        if (pace > 8.5 || i === paceData.length - 1) {
          const start_time = timeStream.data[intervalStart];
          const end_time = timeStream.data[i];
          const distance = distanceStream.data[i] - distanceStream.data[intervalStart];
          const time = timeStream.data[i] - timeStream.data[intervalStart];
          const average_pace = (time / 60) / (distance / 1609.34);
          const interval = {start_time,end_time,distance,time,average_pace};
          if (distance > 50 && distance < 1500 && average_pace < 7.25) {
            intervals.push(interval);
          }
          intervalStart = null;
        }
      }
    }
    return intervals.length ? intervals : null;
  }

  updateGraph() {
    this.graph.clear();
    let xdata = this.getStream('time');
    let ydata = null;
    const intervals = this.getIntervals();
    console.log('intervals',intervals);
    let span = undefined;
    if (intervals && intervals.length > 3) {
      span = 20;
    }
    if (this.state.activity.type === 'Walk') {
      span = 40;
    }
    this.graph.setXLabels('time');
    switch (this.state.view) {
      case 'route': 
        ydata = this.getStream('distance');
        break;
      case 'hr':
        ydata = this.getStream('heartrate');
        this.graph.setYLabels('hr');
        break;
      case 'cadence':
        ydata = this.getStream('cadence');
        this.graph.setYLabels('cadence');
        break;
      case 'pace':
        xdata = this.getStream('distance');
        this.graph.setXLabels('distance');
        this.graph.setYLabels('pace');
        ydata = this.getPaceData(span);
        if (ydata) {
          ydata = ydata.map(a => -a);
        }
        break;
      case 'efficiency':
        xdata = this.getStream('distance');
        this.graph.setXLabels('distance');
        ydata = this.getPaceData(span);
        if (ydata) {
          const hr = this.getStream('heartrate');
          ydata = hr ? ydata.map((curr,i) => hr.data[i] ? -curr * hr.data[i] : null) : null;
        }
        break;
      case 'inclination':
        xdata = this.getStream('distance');
        this.graph.setXLabels('distance');
        ydata = this.getStream('altitude');
        //ydata = inclination(xdata.data,ydata.data);
        break;
      default:
        console.log('Unknown view option:', this.view);
    }
    this.graph.setXData((xdata && xdata.data) ? xdata.data : xdata);
    this.graph.setYData((ydata && ydata.data) ? ydata.data : ydata);
    // Set limits
    switch (this.state.view) {
      case 'cadence':
        if (this.state.activity.type === 'Walk') {
          this.graph.min_y = Math.max(this.graph.min_y, 20);
          this.graph.max_y = Math.min(this.graph.max_y, 90);
        } else {
          this.graph.min_y = Math.max(this.graph.min_y, 60);
        }
        break;
      case 'pace':
        if (this.state.activity.type === 'Walk') {
          this.graph.min_y = Math.max(this.graph.min_y, -60);
        } else {
          this.graph.min_y = Math.max(this.graph.min_y, -12);
        }
        break;
    }
    // Draw coulour sections under graph
    try {
      switch (this.state.view) {
        case 'pace':
          if (this.state.activity.type === 'Walk') {
            this.graph.colourGraph(pace => walkingPaceColor(-pace),1.0);
          } else {
            this.graph.colourGraph(pace => paceColor(-pace),0.4);
          }
          break;
        case 'hr':
          this.graph.colourGraph(hrColor,0);
          break;
        case 'cadence':
          if (this.state.activity.type === 'Walk') {
            this.graph.colourGraph(walkingCadenceColor,8);
          } else {
            this.graph.colourGraph(cadenceColor,2);
          }
          break;
        case 'inclination':
          this.graph.colourGraph(this.inclinationColorFn(), 0);
          break;
        case 'efficiency':
          this.graph.colourGraph(e => efficiencyColor(-e), 60);
          break;
      }
      // Draw the axes
      this.graph.drawAxes();

      // Draw the trace
      this.graph.draw();
    } catch(err) {
      console.log(err);
    }
  }

  inclinationColorFn() {
    let dist = this.getStream('distance');
    let alt = this.getStream('altitude');
    let inc = inclination(dist.data,alt.data);
    function colourFn(y,i) {
      return inclinationColor(inc[i]);
    } 
    return colourFn;
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
    
    let datapoints = [];
    let col = null;
    for (let i=0; i<latlng.data.length; ++i) {
      if (hr.data[i] == null) {
        datapoints.push(latlng.data[i]);
        continue;
      }
      let icol = hrColor(hr.data[i]);
      if (col === null) {
        col = icol;
      }
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
    let colourFn = cadenceColor;
    if (this.state.activity.type === 'Walk') {
      colourFn = walkingCadenceColor;
    }
    
    let datapoints = [];
    let col = null;
    for (let i=0; i<latlng.data.length; ++i) {
      let icol = colourFn(cadence.data[i]);
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

    const intervals = this.getIntervals();
    let span = undefined;
    if (intervals && intervals.length > 3) {
      span = 20;
    }
    if (this.state.activity.type === 'Walk') {
      span = 40;
    }
    
    let datapoints = [];
    let col = null;
    let lastpace = null;
    let smooth = 0.4;
    let colourFn = paceColor;
    if (this.state.activity.type === 'Walk') {
      smooth = 0.8;
      colourFn = walkingPaceColor;
    }
    let pacedata = this.getPaceData(span);
    for (let i=0; i<latlng.data.length; ++i) {
      let pace = pacedata[i];
      let icol = colourFn(pace);
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
    
    let datapoints = [];
    let col = null;
    let lasthpm = null;
    let smooth = 60;
    for (let i=0; i<latlng.data.length; ++i) {
      let j = i - 40;
      if (j < 0 || hr.data[i] == null) {
        datapoints.push(latlng.data[i]);
        continue;
      }
      let t = time.data[i] - time.data[j];
      let d = distance.data[i] - distance.data[j];
      let pace = d > 0 ? (t / 60)/(d / 1609.34) : 1000;
      let hpm = pace * hr.data[i];
      let icol = efficiencyColor(hpm);
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
    const inc = inclination(distance.data,altitude.data);
    let datapoints = [];
    let col = null;
    for (let i=0; i<latlng.data.length; ++i) {
      let icol = inclinationColor(inc[i]);
      if (col === null) {
        col = icol;
      }
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

  dynamicMove(xpos,pos) {
    this.dynamic_layer.clearLayers();
    const latlng = this.getStream('latlng');
    let xstream;
    if (this.graph.xlabel == 'distance') {
      xstream = this.getStream('distance');
    } else {
      xstream = this.getStream('time');
    }
    let i = 0;
    for (i=0;i<xstream.data.length; ++i) {
      if (xstream.data[i] >= xpos) {
        L.circleMarker(latlng.data[i], {radius: 3}).addTo(this.dynamic_layer);
        break;
      }
    }
    let details = document.getElementById('graphdetails');
    details.style.visibility = 'visible';
    if (pos.x + details.clientWidth + 20 > this.graph.width) {
      details.style.left = 'auto';
      details.style.right = `${this.graph.width - pos.x + 5}px`;
    } else {
      details.style.left = `${pos.x + 5}px`;
      details.style.right = 'auto';
    }
    details.innerHTML = this.details(i);
  }

  dynamicClear() {
    this.dynamic_layer.clearLayers();
    let details = document.getElementById('graphdetails');
    details.style.visibility = 'hidden';
  }

  details(pos) {
    let html = '';
    let dist = this.getStream('distance');
    if (dist) {
      let val = dist.data[pos];
      if (this.state.activity.distance < 1609) {
        html += `Distance: ${val}m`;
      } else {
        html += `Distance: ${(val/1609.34).toFixed(1)} miles`;
      }
    }
    let t = this.getStream('time');
    if (t) {
      if (html) {
        html += '<br/>';
      }
      let val = t.data[pos];
      html += `Time: ${duration(val)}`;
    }
    let p = this.getPaceData();
    if (p) {
      if (html) {
        html += '<br/>';
      }
      let val = p[pos];
      html += `Pace: ${duration(val * 60)}/mi`;
    }
    let hr = this.getStream('heartrate');
    if (hr) {
      if (html) {
        html += '<br/>';
      }
      let j = pos;
      while(j >= 0 && hr.data[j] === null) {
        // Data from fitbit includes nulls so wind back
        --j;
      }
      let val = hr.data[j];
      html += `Heartrate: ${val ? val : '-'}bpm`;
    }
    let cad = this.getStream('cadence');
    if (cad) {
      if (html) {
        html += '<br/>';
      }
      let val = cad.data[pos];
      html += `Cadence: ${val * 2}`;
    }
    let alt = this.getStream('altitude');
    if (alt && dist) {
      let inc = inclination(dist.data,alt.data);
      if (html) {
        html += '<br/>';
      }
      let val = inc[pos];
      html += `Inclination: ${val.toFixed(1)}%`;
    }
    return html;
  }
}





Map.propTypes = {
  activity: PropTypes.object
};

export default Map;
