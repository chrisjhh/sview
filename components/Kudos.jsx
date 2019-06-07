import React from 'react';
import PropTypes from 'prop-types';
import { getKudos } from '../lib/cached_strava';

class Kudos extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      count : props.activity.kudos_count,
      loaded: false,
      kudos: []
    };
  }

  render() {
    if (!this.state.count) {
      if (this.state.count == undefined) {
        this.loadKudos();
      }
      return (null);
    }
    let kudos = <span>Loading...</span>;
    if (this.state.loaded) {
      kudos = this.state.kudos.map((k,i) => <div key={i}>{k.firstname + ' ' + k.lastname}</div>);
    }
    return (
      <span className='kudos tooltip' onMouseOver={this.loadKudos.bind(this)}>
        {'👍' + this.state.count}
        <span className='tooltiptext'>
          {kudos}
        </span>
      </span>
    );
  }

  loadKudos() {
    const self = this;
    if (!this.state.loaded && !this.loading) {
      this.loading = true;
      getKudos(this.props.activity.id)
        .then(data => self.setState({
          loaded: true,
          kudos: data,
          count: data.length
        }));
    }
  }
}

Kudos.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Kudos;
