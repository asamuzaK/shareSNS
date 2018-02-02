/**
 * background.js
 */
"use strict";
{
  /* api */
  const {i18n, menus, runtime, storage, tabs} = browser;

  /* contants */
  const CONTEXT_INFO = "contextInfo";
  const PATH_SNS_DATA = "data/sns.json";
  const SHARE_LINK = "shareLink";
  const SHARE_PAGE = "sharePage";
  const SHARE_SNS = "shareSNS";
  const TYPE_FROM = 8;
  const TYPE_TO = -1;

  const MASTODON = "Mastodon";
  const MASTODON_INSTANCE_URL = "mastodonInstanceUrl";

  /**
   * log error
   * @param {!Object} e - Error
   * @returns {boolean} - false
   */
  const logError = e => {
    console.error(e);
    return false;
  };

  /**
   * get type
   * @param {*} o - object to check
   * @returns {string} - type of object
   */
  const getType = o =>
    Object.prototype.toString.call(o).slice(TYPE_FROM, TYPE_TO);

  /**
   * is string
   * @param {*} o - object to check
   * @returns {boolean} - result
   */
  const isString = o => typeof o === "string" || o instanceof String;

  /**
   * is object, and not an empty object
   * @param {*} o - object to check;
   * @returns {boolean} - result
   */
  const isObjectNotEmpty = o => {
    const items = /Object/i.test(getType(o)) && Object.keys(o);
    return !!(items && items.length);
  };

  /**
   * create tab
   * @param {Object} opt - options
   * @returns {AsyncFunction} - tabs.create()
   */
  const createTab = async (opt = {}) =>
    tabs.create(isObjectNotEmpty(opt) && opt || null);

  /* sns */
  const sns = new Map();

  /**
   * fetch sns data
   * @returns {void}
   */
  const fetchSnsData = async () => {
    const path = await runtime.getURL(PATH_SNS_DATA);
    const data = await fetch(path).then(res => res && res.json());
    if (data) {
      const items = Object.keys(data);
      for (const item of items) {
        const obj = data[item];
        sns.set(item, obj);
      }
    }
  };

  /**
   * get sns item from menu item ID
   * @param {string} id - menu item id
   * @returns {Object} - sns item
   */
  const getSnsItemFromId = async id => {
    let item;
    if (isString(id)) {
      if (id.startsWith(SHARE_LINK)) {
        item = sns.get(id.replace(SHARE_LINK, ""));
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
    if (isString(id)) {
      const {checked} = obj;
      const data = sns.get(id);
      if (data) {
        data.enabled = !!checked;
        sns.set(id, data);
      }
    }
  };

  /* mastodon instance */
  const mastodonInstance = {
    value: null,
  };

  /**
   * init mastodon instance
   * @returns {Object} - mastodonInstance
   */
  const initMastodonInstance = async () => {
    mastodonInstance.value = null;
    return mastodonInstance;
  };

  /**
   * update mastodon instance
   * @param {Object} data - mastodon instance data
   * @returns {Object} - mastodon instance
   */
  const updateMastodonInstance = async (data = {}) => {
    const {value} = data;
    if (isString(value) && value.length) {
      mastodonInstance.value = value.trim();
    } else {
      await initMastodonInstance();
    }
    return mastodonInstance;
  };

  /**
   * create mastodon URL
   * @param {!string} url - web+mastodon scheme URL
   * @returns {string} - mastodon share URL
   */
  const createMastodonUrl = async url => {
    if (!isString(url)) {
      throw new TypeError(`Expected String but got ${getType(url)}.`);
    }
    const {value} = mastodonInstance;
    if (isString(value) && value.length) {
      try {
        const {origin, protocol} = new URL(value.trim());
        if (/^https?:$/.test(protocol)) {
          url = `${origin}/intent?uri=${encodeURIComponent(url)}`;
        }
      } catch (e) {
        await initMastodonInstance();
      }
    }
    return url;
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
   * @param {Object} data - clicked data
   * @returns {Promise.<Array>} - results of each handler
   */
  const extractClickedData = async (data = {}) => {
    const {info, tab} = data;
    const {
      id: tabId, index: tabIndex, title: tabTitle, url: tabUrl, windowId,
    } = tab;
    const func = [];
    if (Number.isInteger(tabId) && tabId !== tabs.TAB_ID_NONE) {
      const {linkText, linkUrl, menuItemId, selectionText} = info;
      const snsItem = await getSnsItemFromId(menuItemId);
      if (snsItem) {
        const selText =
          isString(selectionText) && selectionText.replace(/\s+/g, " ") || "";
        const canonicalUrl =
          info.canonicalUrl || contextInfo.canonicalUrl || null;
        const {hash: tabUrlHash} = new URL(tabUrl);
        let {url} = snsItem, shareText, shareUrl;
        if (menuItemId.startsWith(SHARE_LINK)) {
          shareText = encodeURIComponent(selText || linkText);
          shareUrl = encodeURIComponent(linkUrl);
        } else {
          shareText = encodeURIComponent(selText || tabTitle);
          shareUrl = encodeURIComponent(!tabUrlHash && canonicalUrl || tabUrl);
        }
        url = url.replace("%url%", shareUrl).replace("%text%", shareText);
        if (menuItemId.endsWith(MASTODON)) {
          url = await createMastodonUrl(url);
        }
        func.push(createTab({
          url, windowId,
          active: true,
          index: tabIndex + 1,
        }));
      }
    }
    func.push(initContextInfo());
    return Promise.all(func);
  };

  /* context menu */
  /**
   * remove context menu
   * @returns {AsyncFunction} - menus.removeAll()
   */
  const removeMenu = async () => menus.removeAll();

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
    sns.forEach((value, key) => {
      const {enabled} = value;
      if (enabled) {
        func.push(
          createMenuItem(
            `${SHARE_PAGE}${key}`,
            i18n.getMessage(SHARE_PAGE, key),
            {
              enabled,
              contexts: ["page", "selection"],
            }
          ),
          createMenuItem(
            `${SHARE_LINK}${key}`,
            i18n.getMessage(SHARE_LINK, key),
            {
              enabled,
              contexts: ["link"],
            }
          ),
        );
      }
    });
    return Promise.all(func);
  };

  /* runtime */
  /**
   * handle runtime message
   * @param {Object} msg - message
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleMsg = async msg => {
    const items = Object.keys(msg);
    const func = [];
    for (const item of items) {
      const obj = msg[item];
      switch (item) {
        case CONTEXT_INFO: {
          func.push(updateContextInfo(obj));
          break;
        }
        case SHARE_SNS: {
          func.push(extractClickedData(obj));
          break;
        }
        default:
      }
    }
    return Promise.all(func);
  };

  /* storage */
  /**
   * get storage
   * @param {*} key - key
   * @returns {AsyncFunction} - storage.local.get
   */
  const getStorage = async key => storage.local.get(key);

  /**
   * handle stored data
   * @param {Object} data - stored data
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleStoredData = async data => {
    const func = [];
    if (isObjectNotEmpty(data)) {
      const items = Object.keys(data);
      for (const item of items) {
        const obj = data[item];
        const {newValue} = obj;
        if (item === MASTODON_INSTANCE_URL) {
          func.push(updateMastodonInstance(newValue || obj));
        } else {
          sns.has(item) && func.push(toggleSnsItem(item, newValue || obj));
        }
      }
    }
    return Promise.all(func);
  };

  menus.onClicked.addListener((info, tab) =>
    extractClickedData({info, tab}).catch(logError)
  );
  storage.onChanged.addListener(data =>
    handleStoredData(data).then(removeMenu).then(createMenu).catch(logError)
  );
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );

  /* startup */
  document.addEventListener("DOMContentLoaded", () =>
    fetchSnsData().then(getStorage).then(handleStoredData).then(createMenu)
      .catch(logError)
  );
}
