import React from 'react';


function handleInput(event) {
  this.searchActivities(event.target.value);
}

const Search = (props) => (
  <span className="searchbar">
    <input type="text" onChange={handleInput.bind(props)} />
    <span className="searchicon"></span>
  </span>
);

export default Search;
