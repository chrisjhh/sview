import React from 'react';
import PropTypes from 'prop-types';
import { setManualHR } from '../lib/localhost';

class HRInputForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      average_heartrate: props.activity.average_heartrate,
      max_heartrate: props.activity.max_heartrate
    };

    this.handleAvChange = this.handleAvChange.bind(this);
    this.handleMaxChange = this.handleMaxChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleAvChange(event) {
    this.setState({average_heartrate: event.target.value});
  }

  handleMaxChange(event) {
    this.setState({max_heartrate: event.target.value});
  }

  handleSubmit(event) {
    //alert('A name was submitted: ' + this.state.value);
    setManualHR(this.props.activity.id, this.state)
      .then(() => {
        this.props.activity.average_heartrate = this.state.average_heartrate;
        this.props.activity.max_heartrate = this.state.max_heartrate;
        this.props.activity.has_heartrate = true;
        this.props.activity.heartrate_set_manually = true;
        if (this.props.activity.heartrate_from_fitbit) {
          delete this.props.activity.heartrate_from_fitbit;
        }
      })
      .then(this.props.onSubmit)
      .catch((err) => console.log(err));
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Average HR
          <input type="text" value={this.state.average_heartrate} onChange={this.handleAvChange} />
        </label>
        <label>
          Max HR
          <input type="text" value={this.state.max_heartrate} onChange={this.handleMaxChange} />
        </label>
        <input type="submit" value=">" />
      </form>
    );
  }
}

HRInputForm.propTypes = {
  activity: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default HRInputForm;
