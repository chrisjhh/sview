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
    <Activity activity={activity} key={activity.id}/>
  );
  return (
    <div className='activities'>
      {activities}
    </div>
  );
};

ActivityList.propTypes = {
  activities: PropTypes.array
};

export default ActivityList;