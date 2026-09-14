import React from 'react';
import ReactDOM from 'react-dom';
import './css/imports.css';
import configureStore from './store/configureStore';
import Root from './components/Root';

const devMode = process.env.NODE_ENV === 'development';
const store = configureStore(devMode);

// Instrumentation bridge: re-installed on every store change; DSL readers must
// read window.__PAR__ fresh on every access (never cache the object).
const installParBridge = () => {
  const present = store.getState().present;
  const frames = present.get('frames');
  const palette = present.get('palette');
  window.__PAR__ = {
    tool: present.get('drawingTool'),
    duration: present.get('duration'),
    cellSize: present.get('cellSize'),
    loading: present.get('loading'),
    framesCount: frames.get('list').size,
    activeFrameIndex: frames.get('activeIndex'),
    columns: frames.get('columns'),
    rows: frames.get('rows'),
    palettePosition: palette.get('position'),
    notificationCount: present.get('notifications').size
  };
};
store.subscribe(installParBridge);
installParBridge();

ReactDOM.render(<Root store={store} />, document.getElementById('app'));
