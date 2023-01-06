/**
 * main.js
 */

/* shared */
import { getType, isObjectNotEmpty, isString, logErr } from './common.js';
import {
  createTab, executeScriptToTab, getActiveTabId, getAllStorage, getStorage,
  queryTabs, sendMessage, updateTab
} from './browser.js';
import snsData from './sns.js';
import {
  CONTEXT_INFO, CONTEXT_INFO_GET, JS_CANONICAL, JS_CONTEXT_INFO, OPTIONS_OPEN,
  PREFER_CANONICAL, SHARE_LINK, SHARE_PAGE, SHARE_SNS, SHARE_TAB
} from './constant.js';

/* api */
const { i18n, menus, runtime, tabs } = browser;

/* constant */
const { TAB_ID_NONE } = tabs;

/* user options */
export const userOpts = new Map();

/**
 * set user options
 *
 * @param {object} opt - user option
 * @returns {object} - userOpts
 */
export const setUserOpts = async (opt = {}) => {
  let opts;
  if (isObjectNotEmpty(opt)) {
    opts = opt;
  } else {
    opts = await getStorage([PREFER_CANONICAL]);
  }
  const items = Object.entries(opts);
  for (const [key, value] of items) {
    const { checked } = value;
    userOpts.set(key, !!checked);
  }
  return userOpts;
};

/* sns */
export const sns = new Map();

/**
 * set sns items
 *
 * @returns {object} - sns
 */
export const setSnsItems = async () => {
  const items = Object.entries(snsData);
  for (const item of items) {
    const [key, value] = item;
    sns.set(key, value);
  }
  return sns;
};

/**
 * set user enabled sns items
 *
 * @param {string} id - item ID
 * @param {object} obj - value object
 * @returns {object} - sns
 */
export const setUserEnabledSns = async (id, obj = {}) => {
  const items = [];
  if (isString(id)) {
    items.push({
      [id]: obj
    });
  } else {
    const storedData = await getAllStorage();
    const storedItems = Object.entries(storedData);
    const excludeKeys = [PREFER_CANONICAL];
    for (const [key, value] of storedItems) {
      if (!excludeKeys.includes(key)) {
        items.push({
          [key]: value
        });
      }
    }
  }
  for (const item of items) {
    const [[itemId, itemValue]] = Object.entries(item);
    const { checked, subItemOf, value } = itemValue;
    const snsId = subItemOf ?? itemId;
    const data = sns.get(snsId);
    if (data) {
      if (subItemOf) {
        const { subItem } = data;
        if (isObjectNotEmpty(subItem) &&
            Object.prototype.hasOwnProperty.call(subItem, itemId)) {
          data.subItem[itemId].value = value || null;
          sns.set(snsId, data);
        }
      } else {
        data.enabled = !!checked;
        sns.set(snsId, data);
      }
    }
  }
  return sns;
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
        snsUrl = null;
        logErr(e);
      }
    }
  }
  return snsUrl || url;
};

/**
 * get context info
 *
 * @param {number} tabId - tab ID
 * @returns {object} - context info
 */
export const getContextInfo = async tabId => {
  let info;
  if (!Number.isInteger(tabId)) {
    tabId = await getActiveTabId();
  }
  const arr = await executeScriptToTab({
    files: [JS_CONTEXT_INFO],
    target: {
      tabId
    }
  }).catch(logErr);
  if (Array.isArray(arr)) {
    const [res] = arr;
    if (isObjectNotEmpty(res)) {
      if (Object.prototype.hasOwnProperty.call(res, 'error')) {
        throw res.error;
      }
      const { result } = res;
      info = result;
    }
  }
  return info ?? null;
};

/**
 * send context info
 *
 * @returns {?Function} - sendMessage();
 */
export const sendContextInfo = async () => {
  const contextInfo = await getContextInfo();
  let func;
  if (isObjectNotEmpty(contextInfo)) {
    func = sendMessage(null, {
      [CONTEXT_INFO]: {
        contextInfo
      }
    });
  }
  return func || null;
};

/**
 * extract clicked data
 *
 * @param {object} info - clicked menu info
 * @param {object} tab - tabs.Tab
 * @returns {Promise.<Array>} - results of each handler
 */
export const extractClickedData = async (info = {}, tab = {}) => {
  const { linkText, linkUrl, menuItemId, selectionText } = info;
  const {
    cookieStoreId, id: tabId, index: tabIndex, title: tabTitle, url: tabUrl,
    windowId
  } = tab;
  const func = [];
  if (menuItemId === OPTIONS_OPEN) {
    func.push(runtime.openOptionsPage());
  } else if (Number.isInteger(tabId) && tabId !== TAB_ID_NONE &&
             Number.isInteger(tabIndex)) {
    if (!userOpts.size) {
      await setUserOpts();
    }
    if (!sns.size) {
      await setSnsItems();
      await setUserEnabledSns();
    }
    const snsItem = await getSnsItemFromId(menuItemId);
    if (snsItem) {
      const { matchPattern, subItem, url: tmpl } = snsItem;
      const selText =
        isString(selectionText) ? selectionText.replace(/\s+/g, ' ') : '';
      const { hash: tabUrlHash } = new URL(tabUrl);
      let shareText;
      let shareUrl;
      let url;
      if (menuItemId.startsWith(SHARE_LINK)) {
        shareText = selText || linkText;
        shareUrl = linkUrl;
      } else {
        if (tabUrlHash || !userOpts.get(PREFER_CANONICAL)) {
          shareUrl = tabUrl;
        } else {
          const arr = await executeScriptToTab({
            files: [JS_CANONICAL],
            target: {
              tabId
            }
          }).catch(logErr);
          if (Array.isArray(arr)) {
            const [res] = arr;
            if (isObjectNotEmpty(res)) {
              if (Object.prototype.hasOwnProperty.call(res, 'error')) {
                throw res.error;
              }
              const { result } = res;
              shareUrl = result || tabUrl;
            } else {
              shareUrl = tabUrl;
            }
          } else {
            shareUrl = tabUrl;
          }
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
  const { mastodonInstanceUrl, pleromaInstanceUrl } = await getStorage([
    'mastodonInstanceUrl',
    'pleromaInstanceUrl'
  ]);
  const func = [createMenuItem(
    `${OPTIONS_OPEN}`,
    i18n.getMessage(`${OPTIONS_OPEN}_menu`, '(&T)'),
    {
      enabled: true,
      contexts: ['browser_action']
    }
  )];
  sns.forEach(value => {
    if (isObjectNotEmpty(value)) {
      const { enabled: itemEnabled, id, menu } = value;
      const key = menu || id;
      let enabled;
      if (id === 'Mastodon' && itemEnabled) {
        enabled = !!(mastodonInstanceUrl?.value);
      } else if (id === 'Pleroma' && itemEnabled) {
        enabled = !!(pleromaInstanceUrl?.value);
      } else {
        enabled = !!itemEnabled;
      }
      if (itemEnabled && isString(id) && isString(key)) {
        func.push(
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
        case CONTEXT_INFO_GET:
          if (value) {
            func.push(sendContextInfo());
          }
          break;
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
 * handle storage
 *
 * @param {object} data - stored data
 * @param {string} area - storage area
 * @param {boolean} changed - storage changed
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleStorage = async (data, area = 'local', changed = false) => {
  const func = [];
  if (isObjectNotEmpty(data) && area === 'local') {
    const items = Object.entries(data);
    if (items.length) {
      if (changed) {
        if (!userOpts.size) {
          await setUserOpts();
        }
        if (!sns.size) {
          await setSnsItems();
          await setUserEnabledSns();
        }
      }
      for (const item of items) {
        const [key, value] = item;
        if (isObjectNotEmpty(value)) {
          const { newValue } = value;
          if (key === PREFER_CANONICAL) {
            func.push(setUserOpts({
              [key]: newValue || value
            }));
          } else {
            func.push(setUserEnabledSns(key, newValue || value));
          }
        }
      }
    }
  }
  return Promise.all(func);
};

/**
 * startup
 *
 * @returns {Function} - promise chain
 */
export const startup = async () => {
  await setSnsItems();
  return getAllStorage().then(handleStorage).then(createMenu);
};
