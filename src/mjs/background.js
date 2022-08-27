/**
 * background.js
 */

/* shared */
import { throwErr } from './common.js';
import {
  createMenu, extractClickedData, handleMsg, handleStoredData, removeMenu,
  startup
} from './main.js';

/* api */
const { menus, runtime, storage } = browser;

/* listeners */
menus.onClicked.addListener((info, tab) =>
  extractClickedData(info, tab).catch(throwErr)
);
runtime.onInstalled.addListener(() => startup().catch(throwErr));
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);
runtime.onStartup.addListener(() => startup().catch(throwErr));
storage.onChanged.addListener((data, area) =>
  handleStoredData(data, area).then(removeMenu).then(createMenu).catch(throwErr)
);
