import React from 'react';
import PropTypes from 'prop-types';
import { getComments } from '../lib/cached_strava';

class Comments extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      count: props.activity.comment_count,
      loaded: false,
      comments: []
    };
  }

  render() {
    if (!this.state.count) {
      if (this.state.count === undefined) {
        this.loadComments();
      }
      return (null);
    }
    let comments = <span>Loading...</span>;
    if (this.state.loaded) {
      comments = this.state.comments.map((c,i) => 
        <div key={i}>
          <span className="athlete">{c.athlete.firstname + ' ' + c.athlete.lastname}</span>
          <span className="text">{c.text}</span>
        </div>);
    }
    return (
      <span className='comments tooltip' onMouseOver={this.loadComments.bind(this)}>
        {'🗩' + this.state.count}
        <span className='tooltiptext'>
          {comments}
        </span>
      </span>
    );
  }

  loadComments() {
    const self = this;
    if (!this.state.loaded && !this.loading) {
      this.loading = true;
      getComments(this.props.activity.id)
        .then(data => self.setState({
          loaded: true,
          comments: data,
          count: data.length
        }));
    }
  }
}

Comments.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Comments;
