import React from 'react';
import { useLocal, getAthlete } from '../lib/strava';
import { getActivities, getStats } from '../lib/cached_strava';
import ActivityList from './ActivityList';
import Stats from './Stats';
import Map from './Map';
import { ErrorBoundary } from './ErrorBoundary';
import { FitbitAuthenticationLink } from './FitbitAuthenticationLink';
import CurrentActivity from './CurrentActivity';

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
      currentActivity: defaultActivities ? defaultActivities[0] : null
    };
  }

  render() {
    return (
      <div>
        <CurrentActivity activity={this.state.currentActivity}/>
        <div className="activities">
          <Stats stats={this.state.stats}/>
          <ActivityList activities={this.state.activities} selectActivity={this.selectActivity.bind(this)}
            moreActivities={this.moreActivities.bind(this)}/>
        </div>
      </div>
    );
  }

  componentDidMount() {
    // Load data from Strava
    if (!testing) {
      getActivities()
        .then(data => this.setState({activities: data, currentActivity: data[0]}));
      getAthlete()
        .then(data => getStats(data.id))
        .then(data => this.setState({stats: data}));
    }
  }

  selectActivity(activity) {
    this.setState({currentActivity: activity});
  }

  moreActivities() {
    const lastActivity = this.state.activities[this.state.activities.length - 1];
    const lastTime = lastActivity.start_date;
    const before = new Date(lastTime);
    getActivities({before})
      .then(data => this.setState(
        {activities: this.state.activities.concat(data)}
      ));
  }

}

export default App;
