/**
 * options.js
 */

import {
  isObjectNotEmpty, isString, throwErr,
} from "./common.js";
import {
  getStorage, setStorage,
} from "./browser.js";

/**
 * create pref
 *
 * @param {object} elm - element
 * @returns {object} - pref data
 */
export const createPref = async (elm = {}) => {
  const {checked, dataset, id, value} = elm;
  return id && {
    [id]: {
      id,
      checked: !!checked,
      value: value || "",
      subItemOf: dataset && dataset.subItemOf || null,
    },
  } || null;
};

/**
 * store pref
 *
 * @param {!object} evt - Event
 * @returns {Promise.<Array>} - results of each handler
 */
export const storePref = async evt => {
  const {target} = evt;
  const {name, type} = target;
  const func = [];
  if (type === "radio") {
    const nodes = document.querySelectorAll(`[name=${name}]`);
    for (const node of nodes) {
      func.push(createPref(node).then(setStorage));
    }
  } else {
    func.push(createPref(target).then(setStorage));
  }
  return Promise.all(func);
};

/* html */
/**
 * handle input change
 *
 * @param {!object} evt - Event
 * @returns {Function} - storePref()
 */
export const handleInputChange = evt => storePref(evt).catch(throwErr);

/**
 * add event listener to input elements
 *
 * @returns {void}
 */
export const addInputChangeListener = async () => {
  const nodes = document.querySelectorAll("input");
  for (const node of nodes) {
    node.addEventListener("change", handleInputChange);
  }
};

/**
 * set html input value
 *
 * @param {object} data - storage data
 * @returns {void}
 */
export const setHtmlInputValue = async (data = {}) => {
  const {checked, id, value} = data;
  const elm = id && document.getElementById(id);
  if (elm) {
    const {type} = elm;
    switch (type) {
      case "checkbox":
      case "radio":
        elm.checked = !!checked;
        break;
      case "text":
      case "url":
        elm.value = isString(value) && value || "";
        break;
      default:
    }
  }
};

/**
 * set html input values from storage
 *
 * @returns {Promise.<Array>} - results of each handler
 */
export const setValuesFromStorage = async () => {
  const func = [];
  const pref = await getStorage();
  if (isObjectNotEmpty(pref)) {
    const items = Object.values(pref);
    for (const item of items) {
      if (isObjectNotEmpty(item)) {
        func.push(setHtmlInputValue(item));
      }
    }
  }
  return Promise.all(func);
};
