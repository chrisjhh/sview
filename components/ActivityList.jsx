import React from 'react';
import PropTypes from 'prop-types';
import Activity from './Activity';
import { ErrorBoundary } from './ErrorBoundary';
const querystring = require('querystring');
import { client_id, redirect_uri } from '../lib/strava_client_data';

const ActivityList = props => {
  if (props.error) { 
    if (props.error.message == 'Authorization Error') {
      let authURL = 'https://www.strava.com/oauth/authorize';
      const queryData = querystring.stringify({
        client_id,
        redirect_uri,
        response_type : 'code',
        scope: 'read,activity:read'
      });
      authURL += '?' + queryData;
      return (
        <div className='loading'>
          Authentication Error:<br/>
          <a href={authURL}>Please click here to authenticate with Strava.</a>
        </div>
      );
    }
    return (
      <div className='loading'>Error! {props.error.message}</div>
    );
  }
  if (props.activities === null) {
    return (
      <div className='loading'>Loading...</div>
    );
  }
  const activities = props.activities.map(activity => 
    (
      <ErrorBoundary key={activity.id}>
        <Activity activity={activity} key={activity.id} selectActivity={props.selectActivity}/>
      </ErrorBoundary>
    )
  );
  return (
    <div className='activitylist'>
      {activities}
      <a onClick={props.moreActivities}>More...</a>
    </div>
  );
};

ActivityList.propTypes = {
  activities: PropTypes.array,
  selectActivity: PropTypes.func.isRequired,
  moreActivities: PropTypes.func.isRequired,
  error: PropTypes.object
};

export default ActivityList;
