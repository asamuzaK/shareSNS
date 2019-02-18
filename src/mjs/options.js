/**
 * options.js
 */

import {
  throwErr,
} from "./common.js";
import {
  localizeHtml,
} from "./localize.js";
import {
  addInputChangeListener,
  setValuesFromStorage,
} from "./options-main.js";

/* startup */
document.addEventListener("DOMContentLoaded", () => Promise.all([
  localizeHtml(),
  setValuesFromStorage(),
  addInputChangeListener(),
]).catch(throwErr));
