import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { publishRbProbe } from './rbProbe';

// Read-only verifier bridge. Published exactly once, before React mounts, and it never writes.
publishRbProbe();

ReactDOM.render(<App />, document.getElementById('root'));

if (module.hot) {
    module.hot.accept('./App', () => {
      ReactDOM.render(<App />, document.getElementById('root'))
    })
  }