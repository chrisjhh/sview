const React = require('react');
import PropTypes from 'prop-types';
import { duration } from '../lib/duration';

const Stats = props => {
  if (props.stats == null) {
    return (
      <div className="stats">Loading...</div>
    );
  }
  return (
    <div className="stats">
      <span className="runs">
      Runs: <span className="count">{props.stats.recent_run_totals.count}</span>
        <span className="distance">{(Number(props.stats.recent_run_totals.distance)/1609.34).toFixed(1)}
          <span className="units">mi</span>
        </span>
        <span className="duration">
          {duration(props.stats.recent_run_totals.moving_time)}
        </span>
      </span>
    </div>
  );
};

Stats.propTypes = {
  stats: PropTypes.object
};

export default Stats;