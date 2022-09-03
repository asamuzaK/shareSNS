/**
 * popup.js
 */

/* shared */
import { throwErr } from './common.js';
import { getStorage } from './browser.js';
import { localizeHtml } from './localize.js';
import {
  addListenerToMenu, createHtml, handleMsg, handleStoredData, prepareTab,
  setSnsItems, toggleWarning
} from './popup-main.js';

/* api */
const { storage, runtime } = browser;

/* listeners */
storage.onChanged.addListener((data, area) =>
  handleStoredData(data, area).then(toggleWarning).catch(throwErr)
);
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);

/* startup */
document.addEventListener('DOMContentLoaded', () =>
  setSnsItems().then(createHtml).then(() => Promise.all([
    localizeHtml(),
    addListenerToMenu(),
    getStorage().then(handleStoredData).then(toggleWarning),
    prepareTab()
  ])).catch(throwErr)
);
