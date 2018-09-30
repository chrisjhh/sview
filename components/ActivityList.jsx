import React from 'react';
import PropTypes from 'prop-types';
import Activity from './Activity';

const ActivityList = props => {
  if (props.activities === null) {
    return (
      <div className='loading'>Loading...</div>
    );
  }
  const activities = props.activities.map(activity => 
    <Activity activity={activity} key={activity.id} selectActivity={props.selectActivity}/>
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
  moreActivities: PropTypes.func.isRequired
};

export default ActivityList;