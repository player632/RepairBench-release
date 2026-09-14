import { POINTER_ICONS, TABS_IDS } from 'utils/constants';

export const SELECT_TAB = 'SELECT_TAB';

const selectTab = (state, payload) =>
  payload.tabId === state.tabId
    ? state
    : {
        ...state,
        tabId: payload.tabId,
        selectionsIds: [],
        pointerCssIcon:
          payload.tabId === TABS_IDS.ANNOTATE
            ? POINTER_ICONS.DRAW
            : POINTER_ICONS.DEFAULT,
      };

export default selectTab;
