import React from 'react';
import { withRouter } from 'react-router';

class ScrollToTop extends React.Component {
  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
    }
  }

  render() {
    return this.props.children;
  }
}

export default withRouter(ScrollToTop);