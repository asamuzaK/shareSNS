/**
 * popup.js
 */

/* shared */
import { getStorage } from './browser.js';
import { throwErr } from './common.js';
import { localizeHtml } from './localize.js';
import {
  addListenerToMenu, createHtml, handleMsg, handleStoredData, prepareTab,
  setSnsItems, toggleWarning
} from './popup-main.js';

/* api */
const { runtime } = browser;

/* listeners */
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
