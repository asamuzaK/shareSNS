/**
 * popup.js
 */
"use strict";
{
  /* api */
  const {i18n, runtime, tabs} = browser;

  /* constants */
  const DATA_I18N = "data-i18n";
  const EXT_LOCALE = "extensionLocale";
  const PAGE_SHARE = "sharePage";
  const TWITTER = "twitter";

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

  /**
   * create copy data
   * @param {!Object} evt - Event
   * @returns {void}
   */
  const createShareData = async evt => {
    const {target} = evt;
    const func = [];
    if (target) {
      const {id: menuItemId} = target;
      const tab = await getActiveTab();
      if (tab) {
        const info = {
          menuItemId,
        };
        const data = {
          info, tab,
        };
        switch (menuItemId) {
          case TWITTER:
            func.push(sendMsg({
              [PAGE_SHARE]: data,
            }));
            break;
          default:
        }
      }
    }
    return Promise.all(func);
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
   * @returns {void}
   */
  const localizeNode = async node => {
    const data = await i18n.getMessage(node.getAttribute(DATA_I18N));
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

  document.addEventListener("DOMContentLoaded", () => Promise.all([
    localizeHtml(),
    addListenerToMenu(),
  ]).catch(logError), false);
}
