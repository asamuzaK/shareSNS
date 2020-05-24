/**
 * content.js
 */
"use strict";
/* api */
const {runtime} = browser;

/* constants */
const CONTEXT_INFO = "contextInfo";
const CONTEXT_INFO_GET = "getContextInfo";
const MOUSE_BUTTON_RIGHT = 2;

/**
 * throw error
 *
 * @param {!object} e - Error
 * @throws
 */
const throwErr = e => {
  throw e;
};

/**
 * send message
 *
 * @param {*} msg - message
 * @returns {?Function} - runtime.sendMessage()
 */
const sendMsg = async msg => {
  let func;
  if (msg) {
    func = runtime.sendMessage(msg);
  }
  return func || null;
};

/**
 * get active element
 *
 * @returns {object} - active element
 */
const getActiveElm = async () => {
  const sel = window.getSelection();
  const {anchorNode, focusNode, isCollapsed, rangeCount} = sel;
  let elm;
  if (!isCollapsed) {
    if (anchorNode === focusNode) {
      if (anchorNode.nodeType === Node.ELEMENT_NODE) {
        elm = anchorNode;
      } else {
        elm = anchorNode.parentNode;
      }
    } else if (rangeCount === 1) {
      elm = sel.getRangeAt(0).commonAncestorContainer;
    }
  }
  return elm || document.activeElement;
};

/**
 * get anchor element
 *
 * @param {object} node - element
 * @returns {object} - anchor element
 */
const getAnchorElm = async node => {
  let elm;
  const root = document.documentElement;
  while (node && node.parentNode && node.parentNode !== root) {
    if (node.localName === "a") {
      elm = node;
      break;
    }
    node = node.parentNode;
  }
  return elm || null;
};

/* context info */
const contextInfo = {
  isLink: false,
  content: null,
  selectionText: "",
  title: null,
  url: null,
  canonicalUrl: null,
};

/**
 * init context info
 *
 * @returns {object} - context info
 */
const initContextInfo = async () => {
  contextInfo.isLink = false;
  contextInfo.content = null;
  contextInfo.title = null;
  contextInfo.selectionText = "";
  contextInfo.url = null;
  contextInfo.canonicalUrl = null;
  return contextInfo;
};

/**
 * create context info
 *
 * @param {object} node - element
 * @returns {object} - context info
 */
const createContextInfo = async node => {
  await initContextInfo();
  if (node && node.nodeType === Node.ELEMENT_NODE) {
    const anchor = await getAnchorElm(node);
    const canonical = document.querySelector("link[rel=canonical][href]");
    if (anchor) {
      const {textContent, href, title} = anchor;
      if (href) {
        const content = textContent.replace(/\s+/g, " ").trim();
        contextInfo.isLink = true;
        contextInfo.content = content;
        contextInfo.title = title || content;
        if (href.hasOwnProperty("baseVal")) {
          contextInfo.url = href.baseVal;
        } else {
          contextInfo.url = href;
        }
      }
    }
    if (canonical) {
      const {origin: docOrigin} = new URL(document.URL);
      const {href: canonicalHref} =
        new URL(canonical.getAttribute("href"), docOrigin);
      contextInfo.canonicalUrl = canonicalHref;
    }
    contextInfo.selectionText = window.getSelection().toString();
  }
  return contextInfo;
};

/**
 * send context info
 *
 * @returns {Function} - sendMsg()
 */
const sendContextInfo = async () => {
  const elm = await getActiveElm();
  const info = await createContextInfo(elm);
  const msg = {
    [CONTEXT_INFO]: {
      contextInfo: info,
    },
  };
  return sendMsg(msg);
};

/**
 * handle message
 *
 * @param {*} msg - message
 * @returns {Promise.<Array>} - results of each handler
 */
const handleMsg = async (msg = {}) => {
  const items = msg && Object.keys(msg);
  const func = [];
  if (items && items.length) {
    for (const item of items) {
      switch (item) {
        case CONTEXT_INFO_GET:
          func.push(sendContextInfo());
          break;
        default:
      }
    }
  }
  return Promise.all(func);
};

/**
 * handle UI event
 *
 * @param {!object} evt - Event
 * @returns {?(Function|Error)} - promise chain
 */
const handleUIEvt = evt => {
  const {button, key, shiftKey, type} = evt;
  let func;
  switch (type) {
    case "keydown":
      if (shiftKey && key === "F10" || key === "ContextMenu") {
        func = sendContextInfo().catch(throwErr);
      }
      break;
    case "mousedown":
      if (button === MOUSE_BUTTON_RIGHT) {
        func = sendContextInfo().catch(throwErr);
      }
      break;
    default:
  }
  return func || null;
};

/**
 * runtime on message
 *
 * @param {*} msg - message
 * @returns {(Function|Error)} - promise chain
 */
const runtimeOnMsg = msg => handleMsg(msg).catch(throwErr);

/* listeners */
runtime.onMessage.addListener(runtimeOnMsg);
window.addEventListener("keydown", handleUIEvt, true);
window.addEventListener("mousedown", handleUIEvt, true);

/* export for tests */
if (typeof module !== "undefined" && module.hasOwnProperty("exports")) {
  module.exports = {
    contextInfo,
    createContextInfo,
    getActiveElm,
    getAnchorElm,
    handleMsg,
    handleUIEvt,
    initContextInfo,
    runtimeOnMsg,
    sendContextInfo,
    sendMsg,
    throwErr,
  };
}
