/**
 * background.js
 */

import {
  throwErr
} from './common.js';
import {
  getStorage
} from './browser.js';
import {
  createMenu, extractClickedData, handleMsg, handleStoredData, removeMenu,
  setSnsItems
} from './main.js';

/* api */
const { menus, runtime, storage } = browser;

/* listeners */
menus.onClicked.addListener((info, tab) =>
  extractClickedData(info, tab).catch(throwErr)
);
storage.onChanged.addListener(data =>
  handleStoredData(data).then(removeMenu).then(createMenu).catch(throwErr)
);
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);

/* startup */
document.addEventListener('DOMContentLoaded', () =>
  setSnsItems().then(getStorage).then(handleStoredData).then(createMenu)
    .catch(throwErr)
);
