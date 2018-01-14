/**
 * background.js
 */
"use strict";
{
  /* api */
  const {i18n, menus, runtime, storage, tabs} = browser;

  /* contants */
  const CONTEXT_INFO = "contextInfo";
  const SHARE_LINK = "shareLink";
  const SHARE_PAGE = "sharePage";
  const SHARE_SNS = "shareSNS";
  const TYPE_FROM = 8;
  const TYPE_TO = -1;

  const FACEBOOK = "Facebook";
  const FACEBOOK_URL = "https://www.facebook.com/sharer/sharer.php";
  const GOOGLE = "Google+";
  const GOOGLE_URL = "https://plus.google.com/share";
  const HATENA = "Hatena";
  const HATENA_URL = "http://b.hatena.ne.jp/add";
  const LINE = "LINE";
  const LINE_URL = "http://line.me/R/msg/text/";
  const MASTODON = "Mastodon";
  const MASTODON_INSTANCE_URL = "mastodonInstanceUrl";
  const MASTODON_URL = "web+mastodon://share";
  const TWITTER = "Twitter";
  const TWITTER_URL = "https://twitter.com/share";

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

  /* SNS */
  const sns = {
    [TWITTER]: false,
    [FACEBOOK]: false,
    [LINE]: false,
    [HATENA]: false,
    [GOOGLE]: false,
    [MASTODON]: false,
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
      if (sns.hasOwnProperty(id)) {
        sns[id] = !!checked;
      }
    }
  };

  /* mastodon instance */
  const mastodonInstance = {
    url: null,
    value: null,
  };

  /**
   * init mastodon instance
   * @returns {Object} - mastodonInstance
   */
  const initMastodonInstance = async () => {
    mastodonInstance.url = null;
    mastodonInstance.value = null;
    return mastodonInstance;
  };

  /**
   * update mastodon instance
   * @param {Object} data - mastodon instance data
   * @returns {Object} - mastodon instance
   */
  const updateMastodonInstance = async (data = {}) => {
    const {value} = data;
    if (isString(value) && value.length) {
      try {
        const instanceUrl = new URL(value.trim());
        const {origin, protocol} = instanceUrl;
        mastodonInstance.url =
          /^https?:$/.test(protocol) && origin || null;
        mastodonInstance.value = value;
      } catch (e) {
        await initMastodonInstance();
      }
    } else {
      await initMastodonInstance();
    }
    return mastodonInstance;
  };

  /**
   * create mastodon URL
   * @param {!string} url - web+mastodon scheme URL
   * @returns {string} - mastodon share URL
   */
  const createMastodonUrl = url => {
    if (!isString(url)) {
      throw new TypeError(`Expected String but got ${getType(url)}.`);
    }
    const {url: instanceUrl} = mastodonInstance;
    if (isString(instanceUrl) && instanceUrl.length) {
      url = `${instanceUrl}/intent?uri=${encodeURIComponent(url)}`;
    }
    return url;
  };

  /* context info */
  const contextInfo = {
    canonicalUrl: null,
  };

  /**
   * init context info
   * @returns {Object} - context info
   */
  const initContextInfo = async () => {
    contextInfo.canonicalUrl = null;
    return contextInfo;
  };

  /**
   * update context info
   * @param {Object} data - context info data
   * @returns {Object} - context info
   */
  const updateContextInfo = async (data = {}) => {
    const {contextInfo: info} = data;
    if (info) {
      const {canonicalUrl} = info;
      contextInfo.canonicalUrl = canonicalUrl || null;
    } else {
      await initContextInfo();
    }
    return contextInfo;
  };

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
      const selText =
        isString(selectionText) && selectionText.replace(/\s+/g, " ") || "";
      const canonicalUrl =
        info.canonicalUrl || contextInfo.canonicalUrl || null;
      let text, url;
      if (menuItemId.startsWith(SHARE_LINK)) {
        text = encodeURIComponent(selText || linkText);
        url = encodeURIComponent(linkUrl);
      } else {
        text = encodeURIComponent(selText || tabTitle);
        url = encodeURIComponent(canonicalUrl || tabUrl);
      }
      switch (menuItemId) {
        case `${SHARE_LINK}${TWITTER}`:
          opt.url = `${TWITTER_URL}?text=${text}&amp;url=${url}`;
          func.push(createTab(opt));
          break;
        case `${SHARE_PAGE}${TWITTER}`:
          opt.url = `${TWITTER_URL}?text=${text}&amp;url=${url}`;
          func.push(createTab(opt));
          break;
        case `${SHARE_LINK}${FACEBOOK}`:
          opt.url = `${FACEBOOK_URL}?u=${url}`;
          func.push(createTab(opt));
          break;
        case `${SHARE_PAGE}${FACEBOOK}`:
          opt.url = `${FACEBOOK_URL}?u=${url}`;
          func.push(createTab(opt));
          break;
        case `${SHARE_LINK}${LINE}`:
          opt.url = `${LINE_URL}?${text}%20${url}`;
          func.push(createTab(opt));
          break;
        case `${SHARE_PAGE}${LINE}`:
          opt.url = `${LINE_URL}?${text}%20${url}`;
          func.push(createTab(opt));
          break;
        case `${SHARE_LINK}${HATENA}`:
          opt.url =
            `${HATENA_URL}?mode=confirm&amp;url=${url}&amp;title=${text}`;
          func.push(createTab(opt));
          break;
        case `${SHARE_PAGE}${HATENA}`:
          opt.url =
            `${HATENA_URL}?mode=confirm&amp;url=${url}&amp;title=${text}`;
          func.push(createTab(opt));
          break;
        case `${SHARE_LINK}${GOOGLE}`:
          opt.url = `${GOOGLE_URL}?url=${url}`;
          func.push(createTab(opt));
          break;
        case `${SHARE_PAGE}${GOOGLE}`:
          opt.url = `${GOOGLE_URL}?url=${url}`;
          func.push(createTab(opt));
          break;
        case `${SHARE_LINK}${MASTODON}`:
          opt.url = createMastodonUrl(`${MASTODON_URL}?text=${text}+${url}`);
          func.push(createTab(opt));
          break;
        case `${SHARE_PAGE}${MASTODON}`:
          opt.url = createMastodonUrl(`${MASTODON_URL}?text=${text}+${url}`);
          func.push(createTab(opt));
          break;
        default:
      }
    }
    return Promise.all(func).then(initContextInfo);
  };

  /* context menu */
  /**
   * remove context menu
   * @returns {AsyncFunction} - menus.removeAll()
   */
  const removeMenu = async () => menus.removeAll();

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
  const createMenu = async () => {
    const func = [];
    const items = Object.keys(sns);
    for (const item of items) {
      if (sns[item]) {
        const enabled = true;
        func.push(
          createMenuItem(
            `${SHARE_PAGE}${item}`,
            i18n.getMessage(SHARE_PAGE, item), {
              enabled,
              contexts: ["page", "selection"],
            }
          ),
          createMenuItem(
            `${SHARE_LINK}${item}`,
            i18n.getMessage(SHARE_LINK, item), {
              enabled,
              contexts: ["link"],
            }
          ),
        );
      }
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
        case CONTEXT_INFO: {
          func.push(updateContextInfo(obj));
          break;
        }
        case SHARE_SNS: {
          func.push(extractClickedData(obj));
          break;
        }
        default:
      }
    }
    return Promise.all(func);
  };

  /* storage */
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
          case MASTODON:
          case TWITTER:
            func.push(toggleSnsItem(item, newValue || obj));
            break;
          case MASTODON_INSTANCE_URL:
            func.push(updateMastodonInstance(newValue || obj));
            break;
          default:
        }
      }
    }
    return Promise.all(func);
  };

  menus.onClicked.addListener((info, tab) =>
    extractClickedData({info, tab}).catch(logError)
  );
  storage.onChanged.addListener(data =>
    handleStoredData(data).then(removeMenu).then(createMenu).catch(logError)
  );
  runtime.onMessage.addListener((msg, sender) =>
    handleMsg(msg, sender).catch(logError)
  );

  /* startup */
  document.addEventListener(
    "DOMContentLoaded",
    () => storage.local.get().then(handleStoredData).then(createMenu)
      .catch(logError),
    false
  );
}
