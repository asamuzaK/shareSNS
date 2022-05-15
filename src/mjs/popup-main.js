/**
 * popup.js
 */

/* shared */
import { getType, isObjectNotEmpty, isString, throwErr } from './common.js';
import { getActiveTab, getAllStorage, sendMessage } from './browser.js';
import snsData from './sns.js';
import {
  CONTEXT_INFO, CONTEXT_INFO_GET, OPTIONS_OPEN,
  SHARE_LINK, SHARE_PAGE, SHARE_SNS,
  SNS_ITEM, SNS_ITEMS, SNS_ITEM_TMPL, SNS_NOT_SELECTED
} from './constant.js';

/* api */
const { runtime, tabs } = browser;

/* constants */
const { TAB_ID_NONE } = tabs;

/* tab info */
export const tabInfo = {
  tab: null
};

/**
 * set tab info
 *
 * @param {object} tab - tabs.Tab
 * @returns {void}
 */
export const setTabInfo = async tab => {
  tabInfo.tab = isObjectNotEmpty(tab) ? tab : null;
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

/* context info */
export const contextInfo = {
  isLink: false,
  content: null,
  selectionText: null,
  title: null,
  url: null
};

/**
 * init context info
 *
 * @returns {object} - context info
 */
export const initContextInfo = async () => {
  contextInfo.isLink = false;
  contextInfo.content = null;
  contextInfo.selectionText = null;
  contextInfo.title = null;
  contextInfo.url = null;
  return contextInfo;
};

/**
 * create share data
 *
 * @param {object} evt - Event
 * @returns {?Function} - sendMessage()
 */
export const createShareData = async evt => {
  let func;
  if (evt) {
    const { target } = evt;
    if (target) {
      const { id: menuItemId } = target;
      const { tab } = tabInfo;
      if (tab) {
        const info = {
          menuItemId
        };
        const { content, isLink, selectionText, title, url } = contextInfo;
        if (isLink) {
          info.linkText = content || title;
          info.linkUrl = url;
        }
        info.selectionText = selectionText || '';
        func = sendMessage(runtime.id, {
          [SHARE_SNS]: {
            info, tab
          }
        });
      }
    }
  }
  return func || null;
};

/**
 * create html from template
 *
 * @returns {void}
 */
export const createHtml = async () => {
  const container = document.getElementById(SNS_ITEMS);
  const tmpl = document.getElementById(SNS_ITEM_TMPL);
  if (container && tmpl) {
    sns.forEach(value => {
      if (isObjectNotEmpty(value)) {
        const { id } = value;
        const { content } = tmpl;
        const item = content.querySelector(`.${SNS_ITEM}`);
        if (item) {
          const { firstElementChild } = item;
          const page = item.querySelector(`.${SHARE_PAGE}`);
          const link = item.querySelector(`.${SHARE_LINK}`);
          item.id = id;
          if (firstElementChild) {
            firstElementChild.textContent = id;
          }
          if (page) {
            page.id = `${SHARE_PAGE}${id}`;
            page.dataset.i18n = `${SHARE_PAGE},${id}`;
            page.textContent = `Share page with ${id}`;
          }
          if (link) {
            link.id = `${SHARE_LINK}${id}`;
            link.dataset.i18n = `${SHARE_LINK},${id}`;
            link.textContent = `Share link with ${id}`;
          }
          container.appendChild(document.importNode(content, true));
        }
      }
    });
  }
};

/**
 * handle open options on click
 *
 * @returns {Function} - runtime.openOptionsPage()
 */
export const openOptionsOnClick = () => runtime.openOptionsPage();

/**
 * handle menu on click
 *
 * @param {!object} evt - Event
 * @returns {Function} - createShareData()
 */
export const menuOnClick = evt => createShareData(evt).catch(throwErr);

/**
 * add listener to menu
 *
 * @returns {void}
 */
export const addListenerToMenu = async () => {
  const nodes = document.querySelectorAll('button');
  for (const node of nodes) {
    const { id } = node;
    if (id === OPTIONS_OPEN) {
      node.addEventListener('click', openOptionsOnClick);
    } else {
      node.addEventListener('click', menuOnClick);
    }
  }
};

/**
 * update menu
 *
 * @param {object} data - context data;
 * @returns {void}
 */
export const updateMenu = async data => {
  await initContextInfo();
  if (isObjectNotEmpty(data)) {
    const { contextInfo: info } = data;
    if (info) {
      const { content, isLink, selectionText, title, url } = info;
      const {
        mastodonInstanceUrl, pleromaInstanceUrl
      } = await getAllStorage() ?? {};
      const linkNodes = document.getElementsByClassName(SHARE_LINK);
      const pageNodes = document.getElementsByClassName(SHARE_PAGE);
      contextInfo.isLink = !!isLink;
      contextInfo.content = content;
      contextInfo.selectionText = selectionText;
      contextInfo.title = title;
      contextInfo.url = url;
      for (const node of linkNodes) {
        const attr = 'disabled';
        if (isLink) {
          if (node.id.endsWith('Mastodon')) {
            if (mastodonInstanceUrl?.value) {
              node.removeAttribute(attr);
            } else {
              node.setAttribute(attr, attr);
            }
          } else if (node.id.endsWith('Pleroma')) {
            if (pleromaInstanceUrl?.value) {
              node.removeAttribute(attr);
            } else {
              node.setAttribute(attr, attr);
            }
          } else {
            node.removeAttribute(attr);
          }
        } else {
          node.setAttribute(attr, attr);
        }
      }
      for (const node of pageNodes) {
        const attr = 'disabled';
        if (node.id.endsWith('Mastodon')) {
          if (mastodonInstanceUrl?.value) {
            node.removeAttribute(attr);
          } else {
            node.setAttribute(attr, attr);
          }
        } else if (node.id.endsWith('Pleroma')) {
          if (pleromaInstanceUrl?.value) {
            node.removeAttribute(attr);
          } else {
            node.setAttribute(attr, attr);
          }
        } else {
          node.removeAttribute(attr);
        }
      }
    }
  }
};

/**
 * handle message
 *
 * @param {*} msg - message
 * @returns {Promise.<Array>} - results of each handler
 */
export const handleMsg = async msg => {
  const func = [];
  const items = msg && Object.entries(msg);
  if (items) {
    for (const item of items) {
      const [key, value] = item;
      switch (key) {
        case CONTEXT_INFO:
          func.push(updateMenu(value));
          break;
        default:
      }
    }
  }
  return Promise.all(func);
};

/**
 * toggle warning message
 *
 * @returns {void}
 */
export const toggleWarning = async () => {
  const elm = document.getElementById(SNS_NOT_SELECTED);
  const items = document.getElementsByClassName(SNS_ITEM);
  if (elm && items?.length) {
    let bool = false;
    for (const item of items) {
      bool = window.getComputedStyle(item).display !== 'none';
      if (bool) {
        break;
      }
    }
    elm.style.display = bool ? 'none' : 'block';
  }
};

/**
 * toggle SNS item
 *
 * @param {string} id - item ID
 * @param {object} obj - value object
 * @returns {void}
 */
export const toggleSnsItem = async (id, obj = {}) => {
  if (!isString(id)) {
    throw new TypeError(`Expected String but got ${getType(id)}.`);
  }
  const elm = document.getElementById(id);
  if (elm) {
    const { checked } = obj;
    elm.style.display = checked ? 'block' : 'none';
  }
};

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
        sns.has(key) && func.push(toggleSnsItem(key, newValue || value));
      }
    }
  }
  return Promise.all(func);
};

/**
 * prepare tab
 *
 * @returns {Promise.<Array>} - results of each handler
 */
export const prepareTab = async () => {
  const func = [];
  const tab = await getActiveTab();
  const { id } = tab;
  await updateMenu({
    contextInfo: {
      isLink: false,
      content: null,
      selectionText: null,
      title: null,
      url: null
    }
  });
  await setTabInfo(tab);
  if (Number.isInteger(id) && id !== TAB_ID_NONE) {
    func.push(sendMessage(runtime.id, {
      [CONTEXT_INFO_GET]: true
    }));
  }
  return Promise.all(func);
};
