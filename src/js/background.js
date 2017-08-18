/**
 * background.js
 */
"use strict";
{
  /* api */
  const {contextMenus, i18n, runtime, tabs} = browser;

  /* contants */
  const PAGE_SHARE = "sharePage";
  const TWITTER = "twitter";
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
  const createTab = async (opt = {}) => {
    opt = isObjectNotEmpty(opt) && opt || null;
    return tabs.create(opt);
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
      const {menuItemId, selectionText} = info;
      const opt = {
        windowId,
        active: true,
        index: tabIndex + 1,
      };
      switch (menuItemId) {
        case TWITTER: {
          const text = selectionText || tabTitle;
          const url = `https://twitter.com/share?text=${encodeURIComponent(text)}&amp;url=${encodeURIComponent(tabUrl)}`;
          opt.url = url;
          func.push(createTab(opt));
          break;
        }
        default:
      }
    }
    return Promise.all(func);
  };

  /* menu items */
  const menuItems = {
    [TWITTER]: {
      id: TWITTER,
      contexts: ["all"],
      title: i18n.getMessage(TWITTER),
    },
  };

  /**
   * create context menu item
   * @param {string} id - menu item ID
   * @param {string} title - menu item title
   * @param {Object} data - context data
   * @returns {void}
   */
  const createMenuItem = async (id, title, data = {}) => {
    const {contexts, enabled} = data;
    if (isString(id) && isString(title) && Array.isArray(contexts)) {
      const opt = {
        id, contexts, title,
        enabled: !!enabled,
      };
      contextMenus.create(opt);
    }
  };

  /**
   * create context menu items
   * @returns {Promise.<Array>} - results of each handler
   */
  const createContextMenu = async () => {
    const func = [];
    const items = Object.keys(menuItems);
    for (const item of items) {
      const {contexts, id, title} = menuItems[item];
      const enabled = true;
      const itemData = {contexts, enabled};
      func.push(createMenuItem(id, title, itemData));
    }
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
        case PAGE_SHARE:
          func.push(extractClickedData(obj));
          break;
        default:
      }
    }
    return Promise.all(func);
  };

  contextMenus.onClicked.addListener((info, tab) =>
    extractClickedData({info, tab}).catch(logError)
  );
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );

  /* startup */
  createContextMenu().catch(logError);
}
