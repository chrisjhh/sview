import React from 'react';
import PropTypes from 'prop-types';
import Kudos from './Kudos';

const SocialDetails = props => {
  if (props.activity.kudos_count === 0 &&
    props.activity.comment_count === 0) {
    return (<span></span>);
  }
  if (props.activity.comment_count === 0) {
    return (
      <div className="social">
        <Kudos activity={props.activity}/>
      </div>
    );
  }
  return (
    <div className="social">
      <span className='comments'>{'🗩' + props.activity.comment_count}</span>
      <Kudos activity={props.activity}/>
    </div>
  );
};

SocialDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default SocialDetails;