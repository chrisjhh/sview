
import React from 'react';

export class ErrorBoundary extends React.Component {

  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState( {hasError: true});
    // Output error
    console.log(error,info);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.hasError === true && prevState.hasError === true) {
      // Reset error state
      this.setState( {hasError: false} );
    }
  }

  render() {
    if (this.state.hasError) {
      return <div className='error'>An error occurred.</div>;
    }
    return this.props.children;
  }

}

export default ErrorBoundary;
