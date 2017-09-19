/**
 * background.js
 */
"use strict";
{
  /* api */
  const {i18n, menus, runtime, tabs} = browser;

  /* contants */
  const LINK_TWITTER = "linkTwitter";
  const PAGE_SHARE = "sharePage";
  const PAGE_TWITTER = "pageTwitter";
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
      const opt = {
        windowId,
        active: true,
        index: tabIndex + 1,
      };
      switch (menuItemId) {
        case LINK_TWITTER: {
          const text = selectionText || linkText;
          const url = `https://twitter.com/share?text=${encodeURIComponent(text)}&amp;url=${encodeURIComponent(linkUrl)}`;
          opt.url = url;
          func.push(createTab(opt));
          break;
        }
        case PAGE_TWITTER: {
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
    [LINK_TWITTER]: {
      id: LINK_TWITTER,
      contexts: ["link"],
      title: i18n.getMessage(LINK_TWITTER),
    },
    [PAGE_TWITTER]: {
      id: PAGE_TWITTER,
      contexts: ["page"],
      title: i18n.getMessage(PAGE_TWITTER),
    },
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

  menus.onClicked.addListener((info, tab) =>
    extractClickedData({info, tab}).catch(logError)
  );
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );

  /* startup */
  createContextMenu().catch(logError);
}
