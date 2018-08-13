import React from 'react';
import PropTypes from 'prop-types';
import Kudos from './Kudos';
import Comments from './Comments';

const SocialDetails = props => 
  (
    <div className="social">
      <Comments activity={props.activity}/>
      <Kudos activity={props.activity}/>
    </div>
  );


SocialDetails.propTypes = {
  activity: PropTypes.object.isRequired
};

export default SocialDetails;