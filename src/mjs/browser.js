/**
 * browser.js
 */

import {isObjectNotEmpty, isString} from "./common.js";

/* api */
const {runtime, storage, tabs, windows} = browser;

/* constants */
const {TAB_ID_NONE} = tabs;

/* runtime */
/**
 * fetch data
 * @param {string} path - data path
 * @returns {?Object} - JSON data
 */
export const fetchData = async path => {
  let data;
  if (isString(path)) {
    path = await runtime.getURL(path);
    data = await fetch(path).then(res => res && res.json());
  }
  return data || null;
};

/**
 * get manifest icons
 * @returns {Object|string} - icons
 */
export const getManifestIcons = () => {
  const {icons} = runtime.getManifest();
  return icons;
};

/** send message
 * @param {number|string} id - tabId or extension ID
 * @param {*} msg - message
 * @param {Object} opt - options
 * @returns {?AsyncFunction} - tabs.sendMessage | runtime.sendMessage
 */
export const sendMessage = async (id, msg, opt) => {
  let func;
  if (msg) {
    opt = isObjectNotEmpty(opt) && opt || null;
    if (Number.isInteger(id) && id !== TAB_ID_NONE) {
      func = tabs.sendMessage(id, msg, opt);
    } else if (id && isString(id)) {
      func = runtime.sendMessage(id, msg, opt);
    } else {
      func = runtime.sendMessage(runtime.id, msg, opt);
    }
  }
  return func || null;
};

/* storage */
/**
 * get all storage
 * @returns {AsyncFunction} - storage.local.get
 */
export const getAllStorage = async () => storage.local.get();

/**
 * get storage
 * @param {*} key - key
 * @returns {AsyncFunction} - storage.local.get
 */
export const getStorage = async key => storage.local.get(key);

/**
 * remove storage
 * @param {*} key - key
 * @returns {AsyncFunction} - storage.local.remove
 */
export const removeStorage = async key => storage.local.remove(key);

/**
 * set storage
 * @param {Object} obj - object to store
 * @returns {?AsyncFunction} - storage.local.set
 */
export const setStorage = async obj =>
  obj && storage && storage.local.set(obj) || null;

/* tabs */
/**
 * create tab
 * @param {Object} opt - options
 * @returns {AsyncFunction} - tabs.create
 */
export const createTab = async (opt = {}) =>
  tabs.create(isObjectNotEmpty(opt) && opt || null);

/**
 * get active tab
 * @param {number} windowId - window ID
 * @returns {Object} - tabs.Tab
 */
export const getActiveTab = async windowId => {
  if (!Number.isInteger(windowId)) {
    windowId = windows.WINDOW_ID_CURRENT;
  }
  const arr = await tabs.query({
    windowId,
    active: true,
    windowType: "normal",
  });
  let tab;
  if (arr.length) {
    [tab] = arr;
  }
  return tab || null;
};
