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
      const items = Object.entries(data);
      for (const item of items) {
        const [key, value] = item;
        sns.set(key, value);
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
    sns.forEach(value => {
      if (isObjectNotEmpty(value)) {
        const {enabled, id} = value;
        if (enabled && isString(id)) {
          func.push(
            createMenuItem(
              `${SHARE_PAGE}${id}`,
              i18n.getMessage(SHARE_PAGE, id),
              {
                enabled,
                contexts: ["page", "tab", "selection"],
              }
            ),
            createMenuItem(
              `${SHARE_LINK}${id}`,
              i18n.getMessage(SHARE_LINK, id),
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
   * handle runtime message
   * @param {Object} msg - message
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleMsg = async msg => {
    const items = Object.entries(msg);
    const func = [];
    for (const item of items) {
      const [key, value] = item;
      switch (key) {
        case CONTEXT_INFO: {
          func.push(updateContextInfo(value));
          break;
        }
        case SHARE_SNS: {
          func.push(extractClickedData(value));
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
    extractClickedData({info, tab}).catch(logError)
  );
  storage.onChanged.addListener(data =>
    handleStoredData(data).then(removeMenu).then(createMenu).catch(logError)
  );
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );

  /* startup */
  fetchSnsData().then(getStorage).then(handleStoredData).then(createMenu)
    .catch(logError);
}
