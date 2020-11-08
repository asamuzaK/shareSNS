/**
 * popup.js
 */

import {
  throwErr
} from './common.js';
import {
  getStorage
} from './browser.js';
import {
  localizeHtml
} from './localize.js';
import {
  addListenerToMenu, createHtml, handleMsg, handleStoredData, prepareTab,
  setSnsItems, toggleWarning
} from './popup-main.js';

const { storage, runtime } = browser;

/* listeners */
storage.onChanged.addListener(data =>
  handleStoredData(data).then(toggleWarning).catch(throwErr)
);
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);

/* startup */
setSnsItems().then(createHtml).then(() => Promise.all([
  localizeHtml(),
  addListenerToMenu(),
  getStorage().then(handleStoredData).then(toggleWarning),
  prepareTab()
])).catch(throwErr);
