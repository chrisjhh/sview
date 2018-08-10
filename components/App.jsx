import React from 'react';
import { useLocal, getAthlete } from '../lib/strava';
import { getActivities, getStats } from '../lib/cached_strava';
import ActivityList from './ActivityList';
import Stats from './Stats';

let testing = true;
let defaultActivities = null;
let defaultStats = null;

// Check if we are running on local server with its own cache
if (location.port && !isNaN(Number(location.port)) && 
    Number(location.port) !== 80) {
  useLocal(location.port);
  testing = false;
}

if (testing) {
  defaultActivities = require('../examples/activities');
  defaultStats = require('../examples/stats');
}

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      stats : defaultStats,
      activities: defaultActivities
    };
  }

  render() {
    return (
      <div>
        <Stats stats={this.state.stats}/>
        <ActivityList activities={this.state.activities}/>
      </div>
    );
  }

  componentDidMount() {
    // Load data from Strava
    if (!testing) {
      getActivities()
        .then(data => this.setState({activities: data}));
      getAthlete()
        .then(data => getStats(data.id))
        .then(data => this.setState({stats: data}));
    }
  }

}

export default App;