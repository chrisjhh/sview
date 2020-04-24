import React from 'react';
import { useLocal, getAthlete } from '../lib/strava';
import { getActivities, getStats } from '../lib/cached_strava';
import ActivityList from './ActivityList';
import Stats from './Stats';
import Map from './Map';
import { ErrorBoundary } from './ErrorBoundary';
import { FitbitAuthenticationLink } from './FitbitAuthenticationLink';
import CurrentActivity from './CurrentActivity';
import { getRunsFromSearch } from '../lib/localhost';
import NavBar from './NavBar';
import Attribution from './Attribution';

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
      activities: defaultActivities,
      error : null,
      query: null,
      currentActivity: defaultActivities ? defaultActivities[0] : null
    };
  }

  //<Stats stats={this.state.stats}/>
  render() {
    return (
      <div>
        <NavBar searchActivities={callAfterDelay(this.searchActivities.bind(this),1000)}/>
        <CurrentActivity activity={this.state.currentActivity}/>
        <div className="activities">
          
          <ActivityList activities={this.state.activities} selectActivity={this.selectActivity.bind(this)} 
            error={this.state.error}
            moreActivities={this.moreActivities.bind(this)}/>
        </div>
        <Attribution/>
      </div>
    );
  }

  componentDidMount() {
    // Load data from Strava
    if (!testing) {
      getActivities()
        .then(data => this.setState({activities: data, currentActivity: data[0]}))
        .catch(e => this.setState({error: e}));
      //getAthlete()
      //  .then(data => getStats(data.id))
      //  .then(data => this.setState({stats: data}));
    }
  }

  selectActivity(activity) {
    this.setState({currentActivity: activity});
  }

  moreActivities() {
    const lastActivity = this.state.activities[this.state.activities.length - 1];
    const lastTime = lastActivity.start_date;
    const before = new Date(lastTime);
    if (this.state.query) {
      getRunsFromSearch(this.state.query,lastTime)
        .then(data => this.setState(
          {activities: this.state.activities.concat(data)}
        ));
    } else {
      getActivities({before})
        .then(data => this.setState(
          {activities: this.state.activities.concat(data)}
        ));
    }
  }

  searchActivities(query) {
    this.setState({activities: null, query});
    if (query) {
      getRunsFromSearch(query)
        .then(data => this.setState({activities: data}));
    } else {
      getActivities()
        .then(data => this.setState({activities: data}));
    }
  }

}

function callAfterDelay(fn,delay) {
  let handle = null;
  return function(...args) {
    if (handle) {
      clearTimeout(handle);
    }
    handle = setTimeout(function(){ fn(...args); }, delay);
  };
}

export default App;
