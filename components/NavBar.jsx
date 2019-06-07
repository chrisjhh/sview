import React from 'react';
import PropTypes from 'prop-types';

import Search from './Search';

const NavBar = (props) => (
  <nav className="navbar">
    <div>
      <Search searchActivities={props.searchActivities}/>
    </div>
  </nav>
);

NavBar.propTypes = {
  searchActivities: PropTypes.func.isRequired
};

export default NavBar;
