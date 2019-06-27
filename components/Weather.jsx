import React from 'react';
import { getWeather } from '../lib/localhost';
import PropTypes from 'prop-types';

class Weather extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      weather: null
    };
  }

  render() {
    if (!this.state.weather) {
      return null;
    }
    let cold = null;
    let temp = this.state.weather[0].temperature;
    if (temp) {
      if (temp < 5) {
        cold = (
          <span className="icon cold" title="Cold"></span>
        );
      } else if (temp > 20) {
        cold = (
          <span className="icon hot" title="Hot"></span>
        );
      }
    }
    let night = null;
    if (this.state.weather[0].solar_elevation && 
        this.state.weather[0].solar_elevation < -6) {
      night = (
        <span className="icon night" title="Dark"></span>
      );
    }
    let rain = null;
    const precipitation = this.state.weather[0].precipitation;
    const description = this.state.weather[0].description;
    if (precipitation && precipitation > 0) {
      if (precipitation < 2.5) {
        rain = (
          <span className="icon rain light" title="Light rain"></span>
        );
      } else if (precipitation < 7.6) {
        rain = (
          <span className="icon rain moderate" title="Rain"></span>
        );
      } else {
        rain = (
          <span className="icon rain heavy" title="Heavy rain"></span>
        );
      }
    } else if (description && description.match(/drizzle|rain/i)) {
      if (description.match(/drizzle/i)) {
        rain = (
          <span className="icon rain light" title="Light rain"></span>
        );
      } else if (description.match(/heavy rain/i)) {
        rain = (
          <span className="icon rain heavy" title="Heavy rain"></span>
        );
      } else {
        rain = (
          <span className="icon rain moderate" title="Rain"></span>
        );
      }
    }
    let wind = null;
    const windspeed = this.state.weather[0].wind_speed;
    if (windspeed && windspeed > 5.5) {
      wind = (
        <span className="icon wind" title="Windy"></span>
      );
    }
    return (
      <span className="weather">
        {this.state.weather[0].temperature.toFixed(1)}
        <span className="units">°C</span>
        { cold }
        { night }
        { rain }
        { wind }
      </span>
    );
  }

  componentDidMount() {
    // Check if we are running on local server with its own cache
    if (location.port && !isNaN(Number(location.port)) && 
        Number(location.port) !== 80) {
      getWeather(this.props.activity.id)
        .then(weather => this.setState({weather}))
        .catch(err => console.log(err));
    }
  }

}

Weather.propTypes = {
  activity: PropTypes.object.isRequired
};

export default Weather;
