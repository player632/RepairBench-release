import { createStore } from 'redux';
import rootReducer from '../reducers';
import { installProbe } from '../instrumentationProbe';

const store = createStore(rootReducer, window.devToolsExtension && window.devToolsExtension());

// instrumentation: attach verification probe
installProbe(store);

export default store;
