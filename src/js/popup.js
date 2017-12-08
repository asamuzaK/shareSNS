/**
 * popup.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime, storage, tabs} = browser;

  /* constants */
  const CLASS_LINK = "link";
  const CLASS_SNS_ITEM = "snsItem";
  const CONTEXT_INFO = "contextInfo";
  const CONTEXT_INFO_GET = "getContextInfo";
  const DATA_I18N = "data-i18n";
  const EXT_LOCALE = "extensionLocale";
  const SHARE_SNS = "shareSNS";
  const SNS_NOT_SELECTED = "warnSnsNotSelected";
  const TYPE_FROM = 8;
  const TYPE_TO = -1;

  const FACEBOOK = "Facebook";
  const GOOGLE = "Google+";
  const HATENA = "Hatena";
  const LINE = "LINE";
  const TWITTER = "Twitter";

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

  /* context info */
  const contextInfo = {
    isLink: false,
    content: null,
    selectionText: null,
    title: null,
    url: null,
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
        const {content, isLink, selectionText, title, url} = contextInfo;
        info.selectionText = selectionText || "";
        if (isLink) {
          info.linkText = content || title;
          info.linkUrl = url;
        }
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
  const updateMenu = async (data = {}) => {
    const {contextInfo: info} = data;
    await initContextInfo();
    if (info) {
      const {content, isLink, selectionText, title, url} = info;
      const nodes = document.getElementsByClassName(CLASS_LINK);
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
  };

  /**
   * request context info
   * @param {Object} tab - tabs.Tab
   * @returns {void}
   */
  const requestContextInfo = async (tab = {}) => {
    const {id} = tab;
    await initContextInfo();
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
   * handle stored data
   * @param {Object} data - stored data
   * @returns {Promise.<Array>} - results of each handler
   */
  const handleStoredData = async (data = {}) => {
    const func = [];
    const items = Object.keys(data);
    if (items.length) {
      for (const item of items) {
        const obj = data[item];
        const {newValue} = obj;
        switch (item) {
          case FACEBOOK:
          case GOOGLE:
          case HATENA:
          case LINE:
          case TWITTER:
            func.push(toggleSnsItem(item, newValue || obj));
            break;
          default:
        }
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

  document.addEventListener("DOMContentLoaded", () => Promise.all([
    localizeHtml(),
    addListenerToMenu(),
    storage.local.get().then(handleStoredData).then(toggleWarning),
    getActiveTab().then(tab => Promise.all([
      requestContextInfo(tab),
      setTabInfo(tab),
    ])),
  ]).catch(logError));
}
