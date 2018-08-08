import React from 'react';
import { getActivities } from '../lib/cached_strava';
import ActivityList from './ActivityList';

const testing = false;
let defaultActivities = null;
if (testing) {
  defaultActivities = require('../examples/activities');
}

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      activities: defaultActivities
    };
  }

  render() {
    return (
      <ActivityList activities={this.state.activities}/>
    );
  }

  componentDidMount() {
    // Load data from Strava
    if (!testing) {
      getActivities()
        .then(data => this.setState({activities: data}));
    }
  }

}

export default App;