/**
 * main.js
 */

/* shared */
import { getType, isObjectNotEmpty, isString, logErr } from './common.js';
import { createTab, getAllStorage, queryTabs, updateTab } from './browser.js';
import snsData from './sns.js';
import {
  CONTEXT_INFO, PREFER_CANONICAL, SHARE_LINK, SHARE_PAGE, SHARE_SNS, SHARE_TAB
} from './constant.js';

/* api */
const { i18n, menus, tabs } = browser;

/* constant */
const { TAB_ID_NONE } = tabs;

/* variables */
export const vars = {
  [PREFER_CANONICAL]: false
};

/* sns */
export const sns = new Map();

/**
 * set sns items
 *
 * @returns {void}
 */
export const setSnsItems = async () => {
  const items = Object.entries(snsData);
  for (const item of items) {
    const [key, value] = item;
    sns.set(key, value);
  }
};

/**
 * get sns item from menu item ID
 *
 * @param {string} id - menu item ID
 * @returns {object} - sns item
 */
export const getSnsItemFromId = async id => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  let item;
  if (id.startsWith(SHARE_LINK)) {
    item = sns.get(id.replace(SHARE_LINK, ''));
  } else if (id.startsWith(SHARE_TAB)) {
    item = sns.get(id.replace(SHARE_TAB, ''));
  } else {
    item = sns.get(id.replace(SHARE_PAGE, ''));
  }
  return item || null;
};

/**
 * toggle sns item
 *
 * @param {string} id - item ID
 * @param {object} obj - value object
 * @returns {void}
 */
export const toggleSnsItem = async (id, obj = {}) => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const { checked, subItemOf, value } = obj;
  const item = subItemOf || id;
  const data = sns.get(item);
  if (data) {
    if (subItemOf) {
      const { subItem } = data;
      if (isObjectNotEmpty(subItem) &&
          Object.prototype.hasOwnProperty.call(subItem, id)) {
        data.subItem[id].value = value || null;
        sns.set(item, data);
      }
    } else {
      data.enabled = !!checked;
      sns.set(item, data);
    }
  }
};

/**
 * create sns item url
 *
 * @param {object} info - sns item url info
 * @param {string} url - url
 * @param {string} text - text
 * @returns {string} - sns url
 */
export const createSnsUrl = async (info, url, text = '') => {
  if (!isString(url)) {
    throw new TypeError(`Expected String but got ${getType(url)}.`);
  }
  let snsUrl;
  if (isObjectNotEmpty(info)) {
    const { url: tmpl, value } = info;
    if (isString(tmpl) && isString(value)) {
      try {
        const { origin, protocol } = new URL(value.trim());
        if (/^https?:$/.test(protocol)) {
          const encUrl = encodeURIComponent(url);
          if (isString(text) && tmpl.includes('%text%')) {
            const encText = encodeURIComponent(text);
            snsUrl = tmpl.replace('%origin%', origin).replace('%text%', encText)
              .replace('%url%', encUrl);
          } else {
            snsUrl =
              tmpl.replace('%origin%', origin).replace('%url%', encUrl);
          }
        }
      } catch (e) {
        logErr(e);
        snsUrl = null;
      }
    }
  }
  return snsUrl || url;
};

/* context info */
export const contextInfo = {
  canonicalUrl: null
};

/**
 * init context info
 *
 * @returns {object} - context info
 */
export const initContextInfo = async () => {
  contextInfo.canonicalUrl = null;
  return contextInfo;
};

/**
 * update context info
 *
 * @param {object} data - context info data
 * @returns {object} - context info
 */
export const updateContextInfo = async (data = {}) => {
  const { contextInfo: info } = data;
  if (info) {
    const { canonicalUrl } = info;
    contextInfo.canonicalUrl = canonicalUrl || null;
  } else {
    await initContextInfo();
  }
  return contextInfo;
};

/**
 * extract clicked data
 *
 * @param {object} info - clicked menu info
 * @param {object} tab - tabs.Tab
 * @returns {Promise.<Array>} - results of each handler
 */
export const extractClickedData = async (info = {}, tab = {}) => {
  const {
    cookieStoreId, id: tabId, index: tabIndex, title: tabTitle, url: tabUrl,
    windowId
  } = tab;
  const func = [];
  if (Number.isInteger(tabId) && tabId !== TAB_ID_NONE &&
      Number.isInteger(tabIndex)) {
    const { linkText, linkUrl, menuItemId, selectionText } = info;
    const snsItem = await getSnsItemFromId(menuItemId);
    if (snsItem) {
      const { matchPattern, subItem, url: tmpl } = snsItem;
      const selText =
        isString(selectionText) ? selectionText.replace(/\s+/g, ' ') : '';
      const canonicalUrl =
        info.canonicalUrl || contextInfo.canonicalUrl || null;
      const { hash: tabUrlHash } = new URL(tabUrl);
      let shareText;
      let shareUrl;
      let url;
      if (menuItemId.startsWith(SHARE_LINK)) {
        shareText = selText || linkText;
        shareUrl = linkUrl;
      } else {
        if (tabUrlHash || !vars[PREFER_CANONICAL]) {
          shareUrl = tabUrl;
        } else {
          shareUrl = canonicalUrl || tabUrl;
        }
        shareText = selText || tabTitle;
      }
      if (subItem) {
        const items = Object.values(subItem);
        let itemInfo;
        for (const item of items) {
          if (isObjectNotEmpty(item) &&
              Object.prototype.hasOwnProperty.call(item, 'url')) {
            itemInfo = item;
            break;
          }
        }
        if (itemInfo) {
          url = await createSnsUrl(itemInfo, shareUrl, shareText);
        }
      } else {
        url = tmpl.replace('%url%', encodeURIComponent(shareUrl))
          .replace('%text%', encodeURIComponent(shareText));
      }
      if (url) {
        if (matchPattern) {
          const [targetTab] = await queryTabs({
            cookieStoreId,
            currentWindow: true,
            url: matchPattern
          });
          if (isObjectNotEmpty(targetTab)) {
            const { id: targetTabId } = targetTab;
            func.push(updateTab(targetTabId, {
              url,
              active: true
            }));
          } else {
            func.push(createTab({
              cookieStoreId,
              url,
              windowId,
              active: true,
              index: tabIndex + 1,
              openerTabId: tabId
            }));
          }
        } else {
          func.push(createTab({
            cookieStoreId,
            url,
            windowId,
            active: true,
            index: tabIndex + 1,
            openerTabId: tabId
          }));
        }
      }
    }
  }
  func.push(initContextInfo());
  return Promise.all(func);
};

/* context menu */
/**
 * remove context menu
 *
 * @returns {Function} - menus.removeAll()
 */
export const removeMenu = async () => menus.removeAll();

/**
 * create context menu item
 *
 * @param {string} id - menu item ID
 * @param {string} title - menu item title
 * @param {object} data - context data
 * @returns {?Function} - menus.create()
 */
export const createMenuItem = async (id, title, data = {}) => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  if (!isString(title)) {
    throw new TypeError(`Expected String but got ${getType(title)}.`);
  }
  const { contexts, enabled } = data;
  let func;
  if (Array.isArray(contexts)) {
    const opt = {
      id,
      contexts,
      title,
      enabled: !!enabled
    };
    func = menus.create(opt);
  }
  return func || null;
};

/**
 * create context menu items
 *
 * @returns {Promise.<Array>} - results of each handler
 */
export const createMenu = async () => {
  const func = [];
  const {
    mastodonInstanceUrl, pleromaInstanceUrl
  } = await getAllStorage() || {};
  sns.forEach(value => {
    if (isObjectNotEmpty(value)) {
      const { enabled: itemEnabled, id, menu } = value;
      const key = menu || id;
      let enabled;
      if (id === 'Mastodon' && itemEnabled) {
        enabled = !!(mastodonInstanceUrl && mastodonInstanceUrl.value);
      } else if (id === 'Pleroma' && itemEnabled) {
        enabled = !!(pleromaInstanceUrl && pleromaInstanceUrl.value);
      } else {
        enabled = !!itemEnabled;
      }
      itemEnabled && isString(id) && isString(key) && func.push(
        createMenuItem(
          `${SHARE_PAGE}${id}`,
          i18n.getMessage(SHARE_PAGE, key),
          {
            enabled,
            contexts: ['page', 'selection']
          }
        ),
        createMenuItem(
          `${SHARE_TAB}${id}`,
          i18n.getMessage(SHARE_TAB, key),
          {
            enabled,
            contexts: ['tab']
          }
        ),
        createMenuItem(
          `${SHARE_LINK}${id}`,
          i18n.getMessage(SHARE_LINK, key),
          {
            enabled,
            contexts: ['link']
          }
        )
      );
    }
  });
  return Promise.all(func);
};

/* runtime */
/**
 * handle runtime message
 *
 * @param {object} msg - message
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleMsg = async msg => {
  const func = [];
  if (isObjectNotEmpty(msg)) {
    const items = Object.entries(msg);
    for (const item of items) {
      const [key, value] = item;
      switch (key) {
        case CONTEXT_INFO: {
          func.push(updateContextInfo(value));
          break;
        }
        case SHARE_SNS: {
          const { info, tab } = value;
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
 *
 * @param {object} data - stored data
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleStoredData = async data => {
  const func = [];
  if (isObjectNotEmpty(data)) {
    const items = Object.entries(data);
    for (const item of items) {
      const [key, value] = item;
      if (isObjectNotEmpty(value)) {
        const { newValue } = value;
        if (key === PREFER_CANONICAL) {
          let bool;
          if (newValue) {
            bool = newValue.checked;
          } else {
            bool = value.checked;
          }
          vars[PREFER_CANONICAL] = !!bool;
        } else {
          func.push(toggleSnsItem(key, newValue || value));
        }
      }
    }
  }
  return Promise.all(func);
};
