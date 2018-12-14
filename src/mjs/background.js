/**
 * background.js
 */

import {
  throwErr,
} from "./common.js";
import {
  getStorage,
} from "./browser.js";
import {
  extractClickedData, handleMsg, handleStoredData, prepareMenu, removeMenu,
  setExternalExts, setSnsItems,
} from "./main.js";

/* api */
const {menus, runtime, storage} = browser;

/* listeners */
menus.onClicked.addListener((info, tab) =>
  extractClickedData(info, tab).catch(throwErr)
);
storage.onChanged.addListener(data =>
  handleStoredData(data).then(removeMenu).then(prepareMenu).catch(throwErr)
);
runtime.onMessage.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);
runtime.onMessageExternal.addListener((msg, sender) =>
  handleMsg(msg, sender).catch(throwErr)
);

/* startup */
Promise.all([
  setSnsItems().then(getStorage).then(handleStoredData),
  setExternalExts(),
]).then(prepareMenu).catch(throwErr);
