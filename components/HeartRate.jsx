import React, { useState } from 'react';
import PropTypes from 'prop-types';
import HRInputForm from './HRInputForm';

//create your forceUpdate hook
function useForceUpdate(){
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value => ++value); // update the state to force render
}

const HeartRate = props => {
  const forceUpdate = useForceUpdate();
  if (!props.activity.has_heartrate) {
    return (null);
  }
  let classes = 'hr tooltip';
  if (props.activity.heartrate_from_fitbit) {
    classes += ' fitbit';
  } else if (props.activity.heartrate_set_manually) {
    classes += ' manual';
  }
  return (
    <span className={classes} title={'Max HR: ' + Number(props.activity.max_heartrate).toFixed(0)}>
      {Number(props.activity.average_heartrate).toFixed(0)}
      <span className="units">♥</span>
      <span className='tooltiptext'>
        <HRInputForm activity={props.activity} onSubmit={forceUpdate} />
      </span>
    </span>
  );
};

HeartRate.propTypes = {
  activity: PropTypes.object.isRequired
};

export default HeartRate;
