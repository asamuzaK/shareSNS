/**
 * popup.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime, storage, tabs} = browser;

  /* constants */
  const CLASS_SNS_ITEM = "snsItem";
  const CONTEXT_INFO = "contextInfo";
  const CONTEXT_INFO_GET = "getContextInfo";
  const DATA_I18N = "data-i18n";
  const EXT_LOCALE = "extensionLocale";
  const PATH_SNS_DATA = "data/sns.json";
  const SHARE_LINK = "shareLink";
  const SHARE_PAGE = "sharePage";
  const SHARE_SNS = "shareSNS";
  const SNS_ITEMS = "snsItems";
  const SNS_ITEM = "snsItem";
  const SNS_ITEM_TMPL = "snsItemTemplate";
  const SNS_NOT_SELECTED = "warnSnsNotSelected";
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
   * send message
   * @param {*} msg - message
   * @returns {?AsyncFunction} - runtime.sendMessage();
   */
  const sendMsg = async msg => {
    const func = msg && runtime.sendMessage(msg);
    return func || null;
  };

  /**
   * get active tab
   * @returns {Object} - tabs.Tab
   */
  const getActiveTab = async () => {
    const arr = await tabs.query({
      active: true,
      currentWindow: true,
    });
    let tab;
    if (arr.length) {
      [tab] = arr;
    }
    return tab || null;
  };

  /* tab info */
  const tabInfo = {
    tab: null,
  };

  /**
   * set tab info
   * @param {Object} tab - tabs.Tab
   * @returns {void}
   */
  const setTabInfo = async tab => {
    tabInfo.tab = isObjectNotEmpty(tab) && tab || null;
  };

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

  /* context info */
  const contextInfo = {
    isLink: false,
    content: null,
    selectionText: null,
    title: null,
    url: null,
    canonicalUrl: null,
  };

  /**
   * init context info
   * @returns {Object} - context info
   */
  const initContextInfo = async () => {
    contextInfo.isLink = false;
    contextInfo.content = null;
    contextInfo.selectionText = null;
    contextInfo.title = null;
    contextInfo.url = null;
    contextInfo.canonicalUrl = null;
    return contextInfo;
  };

  /**
   * create share data
   * @param {!Object} evt - Event
   * @returns {?AsyncFunction} - sendmsg()
   */
  const createShareData = async evt => {
    const {target} = evt;
    let func;
    if (target) {
      const {id: menuItemId} = target;
      const {tab} = tabInfo;
      if (tab) {
        const info = {
          menuItemId,
        };
        const {
          canonicalUrl, content, isLink, selectionText, title, url,
        } = contextInfo;
        if (isLink) {
          info.linkText = content || title;
          info.linkUrl = url;
        }
        info.canonicalUrl = canonicalUrl || null;
        info.selectionText = selectionText || "";
        func = sendMsg({
          [SHARE_SNS]: {
            info, tab,
          },
        });
      }
    }
    return func || null;
  };

  /**
   * create html from template
   * @returns {void}
   */
  const createHtml = async () => {
    const container = document.getElementById(SNS_ITEMS);
    const tmpl = document.getElementById(SNS_ITEM_TMPL);
    if (container && tmpl) {
      sns.forEach(value => {
        const {id} = value;
        const {content} = tmpl;
        const item = content.querySelector(`.${SNS_ITEM}`);
        const {firstElementChild} = item;
        const page = item.querySelector(`.${SHARE_PAGE}`);
        const link = item.querySelector(`.${SHARE_LINK}`);
        if (item && firstElementChild && page && link) {
          item.id = id;
          firstElementChild.textContent = id;
          page.id = `${SHARE_PAGE}${id}`;
          page.dataset.i18n = `${SHARE_PAGE},${id}`;
          page.textContent = `Share page with ${id}`;
          link.id = `${SHARE_LINK}${id}`;
          link.dataset.i18n = `${SHARE_LINK},${id}`;
          link.textContent = `Share link with ${id}`;
          container.appendChild(document.importNode(content, true));
        }
      });
    }
  };

  /**
   * add listener to menu
   * @returns {void}
   */
  const addListenerToMenu = async () => {
    const nodes = document.querySelectorAll("button");
    if (nodes instanceof NodeList) {
      for (const node of nodes) {
        node.addEventListener(
          "click",
          evt => createShareData(evt).catch(logError),
          false
        );
      }
    }
  };

  /**
   * localize node
   * @param {Object} node - Element
   * @returns {Object} - node
   */
  const localizeNode = async node => {
    const [id, ph] = node.getAttribute(DATA_I18N).split(/\s*,\s*/);
    const data = await i18n.getMessage(id, ph);
    data && node.nodeType === Node.ELEMENT_NODE && (node.textContent = data);
    return node;
  };

  /**
   * localize html
   * @returns {Promise.<Array>} - results of each handler
   */
  const localizeHtml = async () => {
    const lang = await i18n.getMessage(EXT_LOCALE);
    const func = [];
    if (lang) {
      const nodes = document.querySelectorAll(`[${DATA_I18N}]`);
      document.documentElement.setAttribute("lang", lang);
      if (nodes instanceof NodeList) {
        for (const node of nodes) {
          func.push(localizeNode(node));
        }
      }
    }
    return Promise.all(func);
  };

  /**
   * update menu
   * @param {Object} data - context data;
   * @returns {void}
   */
  const updateMenu = async data => {
    await initContextInfo();
    if (isObjectNotEmpty(data)) {
      const {contextInfo: info} = data;
      if (info) {
        const {content, isLink, selectionText, title, url} = info;
        const nodes = document.getElementsByClassName(SHARE_LINK);
        contextInfo.isLink = isLink;
        contextInfo.content = content;
        contextInfo.selectionText = selectionText;
        contextInfo.title = title;
        contextInfo.url = url;
        if (nodes && nodes.length) {
          for (const node of nodes) {
            const attr = "disabled";
            if (isLink) {
              node.removeAttribute(attr);
            } else {
              node.setAttribute(attr, attr);
            }
          }
        }
      }
    }
  };

  /**
   * request context info
   * @param {Object} tab - tabs.Tab
   * @returns {void}
   */
  const requestContextInfo = async tab => {
    await initContextInfo();
    if (isObjectNotEmpty(tab)) {
      const {id} = tab;
      if (Number.isInteger(id) && id !== tabs.TAB_ID_NONE) {
        try {
          await tabs.sendMessage(id, {
            [CONTEXT_INFO_GET]: true,
          });
        } catch (e) {
          await updateMenu({
            contextInfo: {
              isLink: false,
              content: null,
              selectionText: null,
              title: null,
              url: null,
            },
          });
        }
      }
    }
  };

  /**
   * handle message
   * @param {*} msg - message
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleMsg = async msg => {
    const func = [];
    const items = msg && Object.keys(msg);
    if (items && items.length) {
      for (const item of items) {
        const obj = msg[item];
        switch (item) {
          case CONTEXT_INFO:
          case "keydown":
          case "mousedown":
            func.push(updateMenu(obj));
            break;
          default:
        }
      }
    }
    return Promise.all(func);
  };

  /**
   * toggle warning message
   * @returns {void}
   */
  const toggleWarning = async () => {
    const elm = document.getElementById(SNS_NOT_SELECTED);
    const items = document.getElementsByClassName(CLASS_SNS_ITEM);
    if (elm && items && items.length) {
      let bool = false;
      for (const item of items) {
        bool = window.getComputedStyle(item).display !== "none";
        if (bool) {
          break;
        }
      }
      elm.style.display = bool && "none" || "block";
    }
  };

  /**
   * toggle SNS item
   * @param {string} id - item ID
   * @param {Object} obj - value object
   * @param {boolean} changed - changed
   * @returns {void}
   */
  const toggleSnsItem = async (id, obj = {}) => {
    if (isString(id)) {
      const {checked} = obj;
      const elm = document.getElementById(id);
      if (elm) {
        elm.style.display = checked && "block" || "none";
      }
    }
  };

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
        sns.has(item) && func.push(toggleSnsItem(item, newValue || obj));
      }
    }
    return Promise.all(func);
  };

  /* listeners */
  storage.onChanged.addListener(data =>
    handleStoredData(data).then(toggleWarning).catch(logError)
  );
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );

  document.addEventListener("DOMContentLoaded", () =>
    fetchSnsData().then(createHtml).then(() => Promise.all([
      localizeHtml(),
      addListenerToMenu(),
      getStorage().then(handleStoredData).then(toggleWarning),
      getActiveTab().then(tab => Promise.all([
        requestContextInfo(tab),
        setTabInfo(tab),
      ])),
    ])).catch(logError)
  );
}
