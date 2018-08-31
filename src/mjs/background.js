/**
 * background.js
 */

import {
  CONTEXT_INFO, EXT_NAME, PATH_SNS_DATA, SHARE_LINK, SHARE_PAGE, SHARE_SNS,
  SHARE_TAB,
} from "./constant.js";
import {getType, isObjectNotEmpty, isString, throwErr} from "./common.js";
import {
  createTab, fetchData, getExtensionInfo, getExternalExtensions,
  getManifestIcons, getStorage, isAccessKeySupported, sendMessage,
} from "./browser.js";

/* api */
const {i18n, menus, runtime, storage, tabs} = browser;

/**
 * constants */
const {TAB_ID_NONE} = tabs;
const WEBEXT_TST = "treestyletab@piro.sakura.ne.jp";

/* external extensions */
const externalExts = new Set();

/**
 * remove external extension
 * @param {string} id - extension ID
 * @returns {void}
 */
const removeExternalExt = async id => {
  id && externalExts.has(id) && externalExts.delete(id);
};

/**
 * add external extension
 * @param {string} id - extension ID
 * @returns {void}
 */
const addExternalExt = async id => {
  const exts = [WEBEXT_TST];
  id && exts.includes(id) && externalExts.add(id);
};

/**
 * set external extensions
 * @returns {Promise.<Array>} - results of each handler
 */
const setExternalExts = async () => {
  const items = await getExternalExtensions();
  const func = [];
  for (const item of items) {
    const {enabled, id} = item;
    if (enabled) {
      func.push(addExternalExt(id));
    } else {
      func.push(removeExternalExt(id));
    }
  }
  return Promise.all(func);
};

/** send message
 * @param {string} id - extension ID
 * @param {*} msg - message
 * @param {Object} opt - options
 * @returns {Promise.<Array>} - results of each handler
 */
const sendMsg = async (id, msg, opt) => {
  const func = [];
  if (msg) {
    opt = isObjectNotEmpty(opt) && opt || null;
    if (id && isString(id)) {
      const ext = await getExtensionInfo(id);
      if (ext) {
        const {enabled} = ext;
        if (enabled) {
          func.push(sendMessage(id, msg, opt));
          !externalExts.has(id) && func.push(addExternalExt(id));
        } else {
          func.push(removeExternalExt(id));
        }
      } else {
        func.push(removeExternalExt(id));
      }
    } else {
      func.push(sendMessage(null, msg, opt));
    }
  }
  return Promise.all(func);
};

/* sns */
const sns = new Map();

/**
 * fetch sns data
 * @returns {void}
 */
const fetchSnsData = async () => {
  const data = await fetchData(PATH_SNS_DATA);
  if (data) {
    const items = Object.entries(data);
    for (const item of items) {
      const [key, value] = item;
      sns.set(key, value);
    }
  }
};

/**
 * get sns item from menu item ID
 * @param {string} id - menu item ID
 * @returns {Object} - sns item
 */
const getSnsItemFromId = async id => {
  let item;
  if (isString(id)) {
    if (id.startsWith(SHARE_LINK)) {
      item = sns.get(id.replace(SHARE_LINK, ""));
    } else if (id.startsWith(SHARE_TAB)) {
      item = sns.get(id.replace(SHARE_TAB, ""));
    } else {
      item = sns.get(id.replace(SHARE_PAGE, ""));
    }
  }
  return item || null;
};

/**
 * toggle sns item
 * @param {string} id - item ID
 * @param {Object} obj - value object
 * @returns {void}
 */
const toggleSnsItem = async (id, obj = {}) => {
  const {checked, subItemOf, value} = obj;
  const item = subItemOf || id;
  if (item) {
    const data = sns.get(item);
    if (data) {
      if (subItemOf) {
        const {subItem} = data;
        if (isObjectNotEmpty(subItem) && subItem.hasOwnProperty(id)) {
          data.subItem[id].value = value || null;
          sns.set(item, data);
        }
      } else {
        data.enabled = !!checked;
        sns.set(item, data);
      }
    }
  }
};

/**
 * create sns item url
 * @param {string} url - url
 * @param {Object} info - sns item url info
 * @returns {string} - sns url
 */
const createSnsUrl = async (url, info) => {
  if (!isString(url)) {
    throw new TypeError(`Expected String but got ${getType(url)}.`);
  }
  let snsUrl;
  if (isObjectNotEmpty(info)) {
    const {url: tmpl, value} = info;
    if (isString(tmpl) && isString(value)) {
      try {
        const {origin, protocol} = new URL(value.trim());
        if (/^https?:$/.test(protocol)) {
          const query = encodeURIComponent(url);
          snsUrl = tmpl.replace("%origin%", origin).replace("%query%", query);
        }
      } catch (e) {
        snsUrl = null;
      }
    }
  }
  return snsUrl || url;
};

/* context info */
const contextInfo = {
  canonicalUrl: null,
};

/**
 * init context info
 * @returns {Object} - context info
 */
const initContextInfo = async () => {
  contextInfo.canonicalUrl = null;
  return contextInfo;
};

/**
 * update context info
 * @param {Object} data - context info data
 * @returns {Object} - context info
 */
const updateContextInfo = async (data = {}) => {
  const {contextInfo: info} = data;
  if (info) {
    const {canonicalUrl} = info;
    contextInfo.canonicalUrl = canonicalUrl || null;
  } else {
    await initContextInfo();
  }
  return contextInfo;
};

/**
 * extract clicked data
 * @param {Object} info - clicked menu info
 * @param {Object} tab - tabs.Tab
 * @returns {Promise.<Array>} - results of each handler
 */
const extractClickedData = async (info = {}, tab = {}) => {
  const {
    id: tabId, index: tabIndex, title: tabTitle, url: tabUrl, windowId,
  } = tab;
  const func = [];
  if (Number.isInteger(tabId) && tabId !== TAB_ID_NONE) {
    const {linkText, linkUrl, menuItemId, selectionText} = info;
    const snsItem = await getSnsItemFromId(menuItemId);
    if (snsItem) {
      const {subItem, url: tmpl} = snsItem;
      const selText =
        isString(selectionText) && selectionText.replace(/\s+/g, " ") || "";
      const canonicalUrl =
        info.canonicalUrl || contextInfo.canonicalUrl || null;
      const {hash: tabUrlHash} = new URL(tabUrl);
      let shareText, shareUrl, url;
      if (menuItemId.startsWith(SHARE_LINK)) {
        shareText = encodeURIComponent(selText || linkText);
        shareUrl = encodeURIComponent(linkUrl);
      } else {
        shareText = encodeURIComponent(selText || tabTitle);
        shareUrl = encodeURIComponent(!tabUrlHash && canonicalUrl || tabUrl);
      }
      url = tmpl.replace("%url%", shareUrl).replace("%text%", shareText);
      if (subItem) {
        const items = Object.values(subItem);
        let itemInfo;
        for (const item of items) {
          if (isObjectNotEmpty(item) && item.hasOwnProperty("url")) {
            itemInfo = item;
            break;
          }
        }
        if (itemInfo) {
          url = await createSnsUrl(url, itemInfo);
        }
      }
      func.push(createTab({
        url, windowId,
        active: true,
        index: tabIndex + 1,
        openerTabId: tabId,
      }));
    }
  }
  func.push(initContextInfo());
  return Promise.all(func);
};

/* context menu */
/**
 * remove context menu
 * @returns {Promise.<Array>} - results of each handler
 */
const removeMenu = async () => {
  const func = [menus.removeAll()];
  // Tree Style Tab
  if (externalExts.has(WEBEXT_TST)) {
    func.push(sendMsg(WEBEXT_TST, {
      type: "fake-contextMenu-removeAll",
    }));
  }
  return Promise.all(func);
};

/**
 * create context menu item
 * @param {string} id - menu item ID
 * @param {string} title - menu item title
 * @param {Object} data - context data
 * @returns {?AsyncFunction} - menus.create()
 */
const createMenuItem = async (id, title, data = {}) => {
  const {contexts, enabled} = data;
  let func;
  if (isString(id) && isString(title) && Array.isArray(contexts)) {
    const opt = {
      id, contexts, title,
      enabled: !!enabled,
    };
    func = menus.create(opt);
  }
  return func || null;
};

/**
 * create context menu items
 * @returns {Promise.<Array>} - results of each handler
 */
const createMenu = async () => {
  const func = [];
  const acckey = await isAccessKeySupported();
  sns.forEach(value => {
    if (isObjectNotEmpty(value)) {
      const {enabled, id, menu} = value;
      const key = acckey && menu || id;
      if (enabled && isString(id) && isString(key)) {
        func.push(
          createMenuItem(
            `${SHARE_PAGE}${id}`,
            i18n.getMessage(SHARE_PAGE, key),
            {
              enabled,
              contexts: ["page", "selection"],
            }
          ),
          createMenuItem(
            `${SHARE_TAB}${id}`,
            i18n.getMessage(SHARE_TAB, key),
            {
              enabled,
              contexts: ["tab"],
            }
          ),
          createMenuItem(
            `${SHARE_LINK}${id}`,
            i18n.getMessage(SHARE_LINK, key),
            {
              enabled,
              contexts: ["link"],
            }
          ),
        );
      }
    }
  });
  return Promise.all(func);
};

/* runtime */
/**
 * handle external extension
 * @returns {Promise.<Array>} - results of each handler
 */
const handleExternalExts = async () => {
  const func = [];
  // Tree Style Tab
  if (externalExts.has(WEBEXT_TST)) {
    const acckey = await isAccessKeySupported();
    func.push(sendMsg(WEBEXT_TST, {
      type: "register-self",
      name: i18n.getMessage(EXT_NAME),
      icons: getManifestIcons(),
      listeningTypes: ["ready", "fake-contextMenu-click"],
    }));
    sns.forEach(value => {
      if (isObjectNotEmpty(value)) {
        const {enabled, id, menu} = value;
        const key = acckey && menu || id;
        if (enabled && isString(id) && isString(key)) {
          func.push(sendMsg(WEBEXT_TST, {
            type: "fake-contextMenu-create",
            params: {
              id: `${SHARE_TAB}${id}`,
              title: i18n.getMessage(SHARE_TAB, key),
              contexts: ["tab"],
            },
          }));
        }
      }
    });
  }
  return Promise.all(func);
};

/**
 * prepare menu
 * @returns {Promise.<Array>} - results of each handler
 */
const prepareMenu = () => Promise.all([
  createMenu(),
  handleExternalExts(),
]);

/**
 * handle runtime message
 * @param {Object} msg - message
 * @param {Object} sender - sender
 * @returns {Promise.<Array>} - results of each handler
 */
const handleMsg = async (msg, sender) => {
  const {id: senderId} = sender;
  const func = [];
  // Tree Style Tab
  if (senderId === WEBEXT_TST) {
    const {info, tab, type} = msg;
    switch (type) {
      case "ready": {
        func.push(addExternalExt(WEBEXT_TST).then(handleExternalExts));
        break;
      }
      case "fake-contextMenu-click": {
        func.push(extractClickedData(info, tab));
        break;
      }
      default:
    }
  } else {
    const items = Object.entries(msg);
    for (const item of items) {
      const [key, value] = item;
      switch (key) {
        case CONTEXT_INFO: {
          func.push(updateContextInfo(value));
          break;
        }
        case SHARE_SNS: {
          const {info, tab} = value;
          func.push(extractClickedData(info, tab));
          break;
        }
        default:
      }
    }
  }
  return Promise.all(func);
};

/* storage */
/**
 * handle stored data
 * @param {Object} data - stored data
 * @returns {Promise.<Array>} - results of each handler
 */
const handleStoredData = async data => {
  const func = [];
  if (isObjectNotEmpty(data)) {
    const items = Object.entries(data);
    for (const item of items) {
      const [key, value] = item;
      if (isObjectNotEmpty(value)) {
        const {newValue} = value;
        func.push(toggleSnsItem(key, newValue || value));
      }
    }
  }
  return Promise.all(func);
};

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
  fetchSnsData().then(getStorage).then(handleStoredData),
  setExternalExts(),
]).then(prepareMenu).catch(throwErr);
