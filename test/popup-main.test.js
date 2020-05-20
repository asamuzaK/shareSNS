/**
 * popup-main.test.js
 */
/* eslint-disable no-magic-numbers */

import {JSDOM} from "jsdom";
import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import sinon from "sinon";
import {browser} from "./mocha/setup.js";
import * as mjs from "../src/mjs/popup-main.js";
import {
  CONTEXT_INFO, SHARE_LINK, SHARE_PAGE, SHARE_SNS,
} from "../src/mjs/constant.js";
const OPTIONS_OPEN = "openOptions";
const SNS_ITEMS = "snsItems";
const SNS_ITEM = "snsItem";
const SNS_ITEM_TMPL = "snsItemTemplate";
const SNS_NOT_SELECTED = "warnSnsNotSelected";

describe("popup-main", () => {
  /**
   * create jsdom
   *
   * @returns {object} - jsdom instance
   */
  const createJsdom = () => {
    const domstr = "<!DOCTYPE html><html><head></head><body></body></html>";
    const opt = {
      runScripts: "dangerously",
    };
    return new JSDOM(domstr, opt);
  };
  let window, document;
  beforeEach(() => {
    const dom = createJsdom();
    window = dom && dom.window;
    document = window && window.document;
    browser._sandbox.reset();
    browser.i18n.getMessage.callsFake((...args) => args.toString());
    browser.permissions.contains.resolves(true);
    global.browser = browser;
    global.window = window;
    global.document = document;
  });
  afterEach(() => {
    window = null;
    document = null;
    delete global.browser;
    delete global.window;
    delete global.document;
    browser._sandbox.reset();
  });

  it("should get browser object", () => {
    assert.isObject(browser, "browser");
  });

  describe("set tab info", () => {
    const func = mjs.setTabInfo;
    beforeEach(() => {
      mjs.tabInfo.tab = null;
    });
    afterEach(() => {
      mjs.tabInfo.tab = null;
    });

    it("should set null", async () => {
      mjs.tabInfo.tab = {};
      await func();
      assert.isNull(mjs.tabInfo.tab, "result");
    });

    it("should set object", async () => {
      await func({
        foo: "bar",
      });
      assert.deepEqual(mjs.tabInfo.tab, {foo: "bar"}, "result");
    });
  });

  describe("init context info", () => {
    const func = mjs.initContextInfo;

    it("should get initialized object", async () => {
      mjs.contextInfo.isLink = true;
      mjs.contextInfo.content = "foo";
      mjs.contextInfo.selectionText = "bar";
      mjs.contextInfo.title = "baz";
      mjs.contextInfo.url = "https://example.com";
      mjs.contextInfo.canonicalUrl = "https://www.example.com";
      const res = await func();
      assert.isFalse(res.isLink, "isLink");
      assert.isNull(res.content, "content");
      assert.isNull(res.selectionText, "selectionText");
      assert.isNull(res.title, "title");
      assert.isNull(res.url, "url");
      assert.isNull(res.canonicalUrl, "canonicalUrl");
    });
  });

  describe("set sns items", () => {
    const func = mjs.setSnsItems;
    beforeEach(() => {
      mjs.sns.clear();
    });
    afterEach(() => {
      mjs.sns.clear();
    });

    it("should set map", async () => {
      await func();
      assert.strictEqual(mjs.sns.size, 5, "size");
    });
  });

  describe("create share data", () => {
    const func = mjs.createShareData;

    it("should get null if no argument given", async () => {
      const res = await func();
      assert.isNull(res, "result");
    });

    it("should get null if given argument is empty object", async () => {
      const res = await func({});
      assert.isNull(res, "result");
    });

    it("should get null", async () => {
      const res = await func({target: {}});
      assert.isNull(res, "result");
    });

    it("should get null if tabInfo.tab not found", async () => {
      mjs.tabInfo.tab = null;
      const res = await func({
        target: {
          id: "foo",
        },
      });
      assert.isNull(res, "result");
    });

    it("should call function", async () => {
      mjs.tabInfo.tab = {};
      browser.runtime.sendMessage.withArgs(browser.runtime.id, {
        [SHARE_SNS]: {
          info: {
            canonicalUrl: null,
            menuItemId: "foo",
            selectionText: "",
          },
          tab: {},
        },
      }, null).resolves(undefined);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        target: {
          id: "foo",
        },
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.isUndefined(res, "result");
      mjs.tabInfo.tab = null;
    });

    it("should call function", async () => {
      mjs.tabInfo.tab = {};
      mjs.contextInfo.isLink = true;
      mjs.contextInfo.title = "bar";
      mjs.contextInfo.url = "https://example.com";
      browser.runtime.sendMessage.withArgs(browser.runtime.id, {
        [SHARE_SNS]: {
          info: {
            canonicalUrl: null,
            linkText: "bar",
            linkUrl: "https://example.com",
            menuItemId: "foo",
            selectionText: "",
          },
          tab: {},
        },
      }, null).resolves(undefined);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        target: {
          id: "foo",
        },
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.isUndefined(res, "result");
      mjs.tabInfo.tab = null;
      mjs.contextInfo.isLink = false;
      mjs.contextInfo.title = null;
      mjs.contextInfo.url = null;
    });

    it("should call function", async () => {
      mjs.tabInfo.tab = {};
      mjs.contextInfo.canonicalUrl = "https://www.example.com";
      mjs.contextInfo.content = "baz";
      mjs.contextInfo.isLink = true;
      mjs.contextInfo.selectionText = "qux";
      mjs.contextInfo.title = "bar";
      mjs.contextInfo.url = "https://example.com";
      browser.runtime.sendMessage.withArgs(browser.runtime.id, {
        [SHARE_SNS]: {
          info: {
            canonicalUrl: "https://www.example.com",
            linkText: "baz",
            linkUrl: "https://example.com",
            menuItemId: "foo",
            selectionText: "qux",
          },
          tab: {},
        },
      }, null).resolves(undefined);
      const i = browser.runtime.sendMessage.callCount;
      const res = await func({
        target: {
          id: "foo",
        },
      });
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
                         "called");
      assert.isUndefined(res, "result");
      mjs.tabInfo.tab = null;
      mjs.contextInfo.canonicalUrl = null;
      mjs.contextInfo.content = null;
      mjs.contextInfo.isLink = false;
      mjs.contextInfo.selectionText = null;
      mjs.contextInfo.title = null;
      mjs.contextInfo.url = null;
    });
  });

  describe("create html from template", () => {
    const func = mjs.createHtml;
    beforeEach(() => {
      mjs.sns.clear();
    });
    afterEach(() => {
      mjs.sns.clear();
    });

    it("should not create html", async () => {
      const body = document.querySelector("body");
      await func();
      assert.isFalse(body.hasChildNodes(), "result");
    });

    it("should create html", async () => {
      mjs.sns.set("foo", {
        id: "bar",
      });
      const cnt = document.createElement("main");
      const tmpl = document.createElement("template");
      const elm = document.createElement("section");
      const h1 = document.createElement("h1");
      const btn = document.createElement("button");
      const btn2 = document.createElement("button");
      const body = document.querySelector("body");
      cnt.id = SNS_ITEMS;
      tmpl.id = SNS_ITEM_TMPL;
      elm.classList.add(SNS_ITEM);
      btn.classList.add(SHARE_PAGE);
      btn2.classList.add(SHARE_LINK);
      elm.appendChild(h1);
      elm.appendChild(btn);
      elm.appendChild(btn2);
      tmpl.content.appendChild(elm);
      body.appendChild(cnt);
      body.appendChild(tmpl);
      await func();
      const item = document.getElementById("bar");
      assert.isOk(item, "result");
      assert.isTrue(item.parentNode === cnt, "parentNode");
      assert.isTrue(item.classList.contains(SNS_ITEM), "classList");
      assert.strictEqual(item.childNodes.length, 3, "childNodes");
      assert.strictEqual(item.firstElementChild.textContent, "bar", "h1");
      assert.strictEqual(item.firstElementChild.nextElementSibling.id,
                         `${SHARE_PAGE}bar`, "page id");
      assert.strictEqual(item.firstElementChild.nextElementSibling.dataset.i18n,
                         `${SHARE_PAGE},bar`, "page dataset");
      assert.strictEqual(item.firstElementChild.nextElementSibling.textContent,
                         "Share page with bar", "page text");
      assert.strictEqual(item.lastElementChild.id,
                         `${SHARE_LINK}bar`, "link id");
      assert.strictEqual(item.lastElementChild.dataset.i18n,
                         `${SHARE_LINK},bar`, "link dataset");
      assert.strictEqual(item.lastElementChild.textContent,
                         "Share link with bar", "link text");
    });

    it("should not create html", async () => {
      mjs.sns.set("foo", {});
      const cnt = document.createElement("main");
      const tmpl = document.createElement("template");
      const elm = document.createElement("section");
      const h1 = document.createElement("h1");
      const btn = document.createElement("button");
      const btn2 = document.createElement("button");
      const body = document.querySelector("body");
      cnt.id = SNS_ITEMS;
      tmpl.id = SNS_ITEM_TMPL;
      elm.classList.add(SNS_ITEM);
      btn.classList.add(SHARE_PAGE);
      btn2.classList.add(SHARE_LINK);
      elm.appendChild(h1);
      elm.appendChild(btn);
      elm.appendChild(btn2);
      tmpl.content.appendChild(elm);
      body.appendChild(cnt);
      body.appendChild(tmpl);
      await func();
      const item = document.getElementById("bar");
      assert.isNull(item, "result");
    });

    it("should not create html", async () => {
      mjs.sns.set("foo", {
        id: "bar",
      });
      const cnt = document.createElement("main");
      const tmpl = document.createElement("template");
      const elm = document.createElement("section");
      const h1 = document.createElement("h1");
      const btn = document.createElement("button");
      const btn2 = document.createElement("button");
      const body = document.querySelector("body");
      cnt.id = SNS_ITEMS;
      tmpl.id = SNS_ITEM_TMPL;
      elm.classList.add(`${SNS_ITEM}2`);
      btn.classList.add(SHARE_PAGE);
      btn2.classList.add(SHARE_LINK);
      elm.appendChild(h1);
      elm.appendChild(btn);
      elm.appendChild(btn2);
      tmpl.content.appendChild(elm);
      body.appendChild(cnt);
      body.appendChild(tmpl);
      await func();
      const item = document.getElementById("bar");
      assert.isNull(item, "result");
    });

    it("should create html", async () => {
      mjs.sns.set("foo", {
        id: "bar",
      });
      const cnt = document.createElement("main");
      const tmpl = document.createElement("template");
      const elm = document.createElement("section");
      const body = document.querySelector("body");
      cnt.id = SNS_ITEMS;
      tmpl.id = SNS_ITEM_TMPL;
      elm.classList.add(SNS_ITEM);
      tmpl.content.appendChild(elm);
      body.appendChild(cnt);
      body.appendChild(tmpl);
      await func();
      const item = document.getElementById("bar");
      assert.isOk(item, "result");
      assert.isTrue(item.parentNode === cnt, "parentNode");
      assert.isTrue(item.classList.contains(SNS_ITEM), "classList");
      assert.isFalse(item.hasChildNodes(), "childNodes");
    });

  });

  describe("handle open options on click", () => {
    const func = mjs.openOptionsOnClick;

    it("should call function", async () => {
      browser.runtime.openOptionsPage.resolves(undefined);
      const res = await func();
      assert.isUndefined(res, "result");
    });
  });

  describe("handle menu on click", () => {
    const func = mjs.menuOnClick;

    it("should call function", async () => {
      const res = await func({});
      assert.isNull(res, "result");
    });
  });

  describe("add listener to menu", () => {
    const func = mjs.addListenerToMenu;

    it("should set listener", async () => {
      const elm = document.createElement("button");
      const body = document.querySelector("body");
      const spy = sinon.spy(elm, "addEventListener");
      body.appendChild(elm);
      await func();
      assert.isTrue(spy.calledOnce, "result");
      elm.addEventListener.restore();
    });

    it("should set listener", async () => {
      const elm = document.createElement("button");
      const body = document.querySelector("body");
      const spy = sinon.spy(elm, "addEventListener");
      elm.id = OPTIONS_OPEN;
      body.appendChild(elm);
      await func();
      assert.isTrue(spy.calledOnce, "result");
      elm.addEventListener.restore();
    });
  });

  describe("update menu", () => {
    const func = mjs.updateMenu;

    it("should not set attribute", async () => {
      const elm = document.createElement("p");
      const elm2 = document.createElement("p");
      const body = document.querySelector("body");
      elm.classList.add(SHARE_PAGE);
      elm.removeAttribute("disabled");
      elm2.classList.add(SHARE_LINK);
      elm2.removeAttribute("disabled");
      body.appendChild(elm);
      body.appendChild(elm2);
      await func();
      assert.isFalse(elm.hasAttribute("disabled"), "result");
      assert.isFalse(elm2.hasAttribute("disabled"), "result");
    });

    it("should not set attribute", async () => {
      const elm = document.createElement("p");
      const elm2 = document.createElement("p");
      const body = document.querySelector("body");
      elm.classList.add(SHARE_PAGE);
      elm.removeAttribute("disabled");
      elm2.classList.add(SHARE_LINK);
      elm2.removeAttribute("disabled");
      body.appendChild(elm);
      body.appendChild(elm2);
      await func({
        foo: "bar",
      });
      assert.isFalse(elm.hasAttribute("disabled"), "result");
      assert.isFalse(elm2.hasAttribute("disabled"), "result");
    });

    it("should set attribute", async () => {
      const elm = document.createElement("p");
      const elm2 = document.createElement("p");
      const body = document.querySelector("body");
      elm.classList.add(SHARE_PAGE);
      elm.setAttribute("disabled", "disabled");
      elm2.classList.add(SHARE_LINK);
      elm2.removeAttribute("disabled");
      body.appendChild(elm);
      body.appendChild(elm2);
      await func({
        contextInfo: {
          isLink: false,
        },
      });
      assert.isFalse(elm.hasAttribute("disabled"), "result");
      assert.strictEqual(elm2.getAttribute("disabled"), "disabled", "result");
    });

    it("should set attribute", async () => {
      const elm = document.createElement("p");
      const elm2 = document.createElement("p");
      const body = document.querySelector("body");
      elm.classList.add(SHARE_PAGE);
      elm.setAttribute("disabled", "disabled");
      elm2.classList.add(SHARE_LINK);
      elm2.setAttribute("disabled", "disabled");
      body.appendChild(elm);
      body.appendChild(elm2);
      await func({
        contextInfo: {
          isLink: true,
        },
      });
      assert.isFalse(elm.hasAttribute("disabled"), "result");
      assert.isFalse(elm2.hasAttribute("disabled"), "result");
    });

    it("should set attribute", async () => {
      const elm = document.createElement("p");
      const elm2 = document.createElement("p");
      const body = document.querySelector("body");
      elm.classList.add(SHARE_PAGE);
      elm.id = `${SHARE_PAGE}Mastodon`;
      elm.setAttribute("disabled", "disabled");
      elm2.classList.add(SHARE_LINK);
      elm2.id = `${SHARE_LINK}Mastodon`;
      elm2.setAttribute("disabled", "disabled");
      body.appendChild(elm);
      body.appendChild(elm2);
      browser.storage.local.get.withArgs("mastodonInstanceUrl").resolves({
        mastodonInstanceUrl: {
          value: "https://example.com",
        },
      });
      await func({
        contextInfo: {
          isLink: true,
        },
      });
      assert.isFalse(elm.hasAttribute("disabled"), "result");
      assert.isFalse(elm2.hasAttribute("disabled"), "result");
    });

    it("should set attribute", async () => {
      const elm = document.createElement("p");
      const elm2 = document.createElement("p");
      const body = document.querySelector("body");
      elm.classList.add(SHARE_PAGE);
      elm.id = `${SHARE_PAGE}Mastodon`;
      elm2.classList.add(SHARE_LINK);
      elm2.id = `${SHARE_LINK}Mastodon`;
      body.appendChild(elm);
      body.appendChild(elm2);
      browser.storage.local.get.withArgs("mastodonInstanceUrl").resolves({
        mastodonInstanceUrl: {
          value: "",
        },
      });
      await func({
        contextInfo: {
          isLink: true,
        },
      });
      assert.strictEqual(elm.getAttribute("disabled"), "disabled", "result");
      assert.strictEqual(elm2.getAttribute("disabled"), "disabled", "result");
    });

    it("should set attribute", async () => {
      const elm = document.createElement("p");
      const elm2 = document.createElement("p");
      const body = document.querySelector("body");
      elm.classList.add(SHARE_PAGE);
      elm.id = `${SHARE_PAGE}Mastodon`;
      elm2.classList.add(SHARE_LINK);
      elm2.id = `${SHARE_LINK}Mastodon`;
      body.appendChild(elm);
      body.appendChild(elm2);
      browser.storage.local.get.withArgs("mastodonInstanceUrl").resolves(null);
      await func({
        contextInfo: {
          isLink: true,
        },
      });
      assert.strictEqual(elm.getAttribute("disabled"), "disabled", "result");
      assert.strictEqual(elm2.getAttribute("disabled"), "disabled", "result");
    });
  });

  describe("request context info", () => {
    const func = mjs.requestContextInfo;

    it("should not call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      await func();
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
    });

    it("should not call function", async () => {
      const i = browser.tabs.sendMessage.callCount;
      await func({
        id: browser.tabs.TAB_ID_NONE,
      });
      assert.strictEqual(browser.tabs.sendMessage.callCount, i, "not called");
    });

    it("should call function", async () => {
      browser.tabs.sendMessage.resolves(undefined);
      const i = browser.tabs.sendMessage.callCount;
      await func({
        id: 1,
      });
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1, "called");
    });

    it("should call function", async () => {
      browser.tabs.sendMessage.rejects(new Error("error"));
      const stub = sinon.stub(console, "error");
      const i = browser.tabs.sendMessage.callCount;
      const elm = document.createElement("p");
      const body = document.querySelector("body");
      elm.classList.add(SHARE_LINK);
      elm.removeAttribute("disabled");
      body.appendChild(elm);
      await func({
        id: 1,
      }).catch(e => {
        assert.strictEqual(e.message, "error", "error");
      });
      const {calledOnce} = stub;
      stub.restore();
      assert.strictEqual(browser.tabs.sendMessage.callCount, i + 1,
                         "called sendMessage");
      assert.isTrue(calledOnce, "called console");
      assert.strictEqual(elm.getAttribute("disabled"), "disabled", "disabled");
    });
  });

  describe("handle message", () => {
    const func = mjs.handleMsg;

    it("should get empty array if no arguments given", async () => {
      const res = await func();
      assert.deepEqual(res, [], "result");
    });

    it("should get empty array", async () => {
      const res = await func({foo: "bar"});
      assert.deepEqual(res, [], "result");
    });

    it("should get array", async () => {
      const res = await func({[CONTEXT_INFO]: {}});
      assert.deepEqual(res, [undefined], "result");
    });

    it("should get array", async () => {
      const res = await func({keydown: {}});
      assert.deepEqual(res, [undefined], "result");
    });

    it("should get array", async () => {
      const res = await func({mousedown: {}});
      assert.deepEqual(res, [undefined], "result");
    });
  });

  describe("toggle warning message", () => {
    const func = mjs.toggleWarning;

    it("should not set display", async () => {
      const elm = document.createElement("p");
      const body = document.querySelector("body");
      elm.id = SNS_NOT_SELECTED;
      elm.style.display = "block";
      body.appendChild(elm);
      await func();
      assert.strictEqual(elm.style.display, "block", "result");
    });

    it("should set display", async () => {
      const elm = document.createElement("p");
      const elm2 = document.createElement("p");
      const body = document.querySelector("body");
      elm.id = SNS_NOT_SELECTED;
      elm.style.display = "block";
      elm2.classList.add(SNS_ITEM);
      elm2.style.display = "block";
      body.appendChild(elm);
      body.appendChild(elm2);
      await func();
      assert.strictEqual(elm.style.display, "none", "result");
      assert.strictEqual(elm2.style.display, "block", "result");
    });

    it("should set display", async () => {
      const elm = document.createElement("p");
      const elm2 = document.createElement("p");
      const body = document.querySelector("body");
      elm.id = SNS_NOT_SELECTED;
      elm.style.display = "none";
      elm2.classList.add(SNS_ITEM);
      elm2.style.display = "none";
      body.appendChild(elm);
      body.appendChild(elm2);
      await func();
      assert.strictEqual(elm.style.display, "block", "result");
      assert.strictEqual(elm2.style.display, "none", "result");
    });
  });

  describe("toggle SNS item", () => {
    const func = mjs.toggleSnsItem;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, "Expected String but got Undefined.");
      });
    });

    it("should not set display", async () => {
      const elm = document.createElement("p");
      const body = document.querySelector("body");
      elm.id = "foo";
      elm.style.display = "none";
      body.appendChild(elm);
      await func("bar", {
        checked: true,
      });
      assert.strictEqual(elm.style.display, "none", "display");
    });

    it("should set display", async () => {
      const elm = document.createElement("p");
      const body = document.querySelector("body");
      elm.id = "foo";
      elm.style.display = "none";
      body.appendChild(elm);
      await func("foo", {
        checked: true,
      });
      assert.strictEqual(elm.style.display, "block", "display");
    });

    it("should set display", async () => {
      const elm = document.createElement("p");
      const body = document.querySelector("body");
      elm.id = "foo";
      elm.style.display = "block";
      body.appendChild(elm);
      await func("foo", {
        checked: false,
      });
      assert.strictEqual(elm.style.display, "none", "display");
    });
  });

  describe("handle stored data", () => {
    const func = mjs.handleStoredData;
    beforeEach(() => {
      mjs.sns.clear();
    });
    afterEach(() => {
      mjs.sns.clear();
    });

    it("should get empty array if no argument given", async () => {
      const res = await func();
      assert.deepEqual(res, [], "result");
    });

    it("should get empty array", async () => {
      const res = await func({});
      assert.deepEqual(res, [], "result");
    });

    it("should get empty array", async () => {
      const res = await func({
        foo: {},
      });
      assert.deepEqual(res, [], "result");
    });

    it("should get array", async () => {
      mjs.sns.set("foo", {
        bar: "baz",
      });
      const elm = document.createElement("p");
      const body = document.querySelector("body");
      elm.id = "foo";
      elm.style.display = "none";
      body.appendChild(elm);
      const res = await func({
        foo: {
          checked: true,
        },
      });
      assert.strictEqual(elm.style.display, "block", "display");
      assert.deepEqual(res, [undefined], "result");
    });

    it("should get array", async () => {
      mjs.sns.set("foo", {
        bar: "baz",
      });
      const elm = document.createElement("p");
      const body = document.querySelector("body");
      elm.id = "foo";
      elm.style.display = "block";
      body.appendChild(elm);
      const res = await func({
        foo: {
          checked: false,
        },
      });
      assert.strictEqual(elm.style.display, "none", "display");
      assert.deepEqual(res, [undefined], "result");
    });

    it("should get array", async () => {
      mjs.sns.set("foo", {
        bar: "baz",
      });
      const elm = document.createElement("p");
      const body = document.querySelector("body");
      elm.id = "foo";
      elm.style.display = "none";
      body.appendChild(elm);
      const res = await func({
        foo: {
          newValue: {
            checked: true,
          },
        },
      });
      assert.strictEqual(elm.style.display, "block", "display");
      assert.deepEqual(res, [undefined], "result");
    });

    it("should get array", async () => {
      mjs.sns.set("foo", {
        bar: "baz",
      });
      const elm = document.createElement("p");
      const body = document.querySelector("body");
      elm.id = "foo";
      elm.style.display = "block";
      body.appendChild(elm);
      const res = await func({
        foo: {
          newValue: {
            checked: false,
          },
        },
      });
      assert.strictEqual(elm.style.display, "none", "display");
      assert.deepEqual(res, [undefined], "result");
    });
  });

  describe("prepare tab", () => {
    const func = mjs.prepareTab;

    it("should get array", async () => {
      browser.tabs.query.resolves([{}]);
      const res = await func();
      assert.deepEqual(res, [undefined, undefined], "result");
    });
  });
});
