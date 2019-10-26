/**
 * main.test.js
 */
/*
  eslint-disable array-bracket-newline,  max-nested-callbacks, no-magic-numbers
*/

import {assert} from "chai";
import {afterEach, beforeEach, describe, it} from "mocha";
import sinon from "sinon";
import {browser} from "./mocha/setup.js";
import * as mjs from "../src/mjs/main.js";
import {
  CONTEXT_INFO, SHARE_LINK, SHARE_PAGE, SHARE_SNS, SHARE_TAB,
} from "../src/mjs/constant.js";

describe("main", () => {
  beforeEach(() => {
    global.browser = browser;
  });
  afterEach(() => {
    delete global.browser;
  });

  it("should get browser object", () => {
    assert.isObject(browser, "browser");
  });

  describe("set sns item", () => {
    const func = mjs.setSnsItems;

    it("should set map", async () => {
      const itemKeys = [
        "Twitter", "Facebook", "LINE", "Hatena", "Mastodon",
      ];
      await func();
      assert.strictEqual(mjs.sns.size, itemKeys.length, "length");
      for (const key of itemKeys) {
        assert.isObject(mjs.sns.get(key), `result ${key}`);
      }
      mjs.sns.clear();
    });
  });

  describe("get sns item from menu item ID", () => {
    const func = mjs.getSnsItemFromId;
    beforeEach(() => {
      mjs.sns.clear();
    });
    afterEach(() => {
      mjs.sns.clear();
    });

    it("should get null if no argument given", async () => {
      const res = await func();
      assert.isNull(res, "result");
    });

    it("should get null argument is not string", async () => {
      const res = await func(1);
      assert.isNull(res, "result");
    });

    it("should get object", async () => {
      mjs.sns.set("foo", {
        bar: "baz",
      });
      const res = await func("foo");
      assert.deepEqual(res, {bar: "baz"}, "result");
    });

    it("should get object", async () => {
      mjs.sns.set("foo", {
        bar: "baz",
      });
      const res = await func(`${SHARE_PAGE}foo`);
      assert.deepEqual(res, {bar: "baz"}, "result");
    });

    it("should get object", async () => {
      mjs.sns.set("foo", {
        bar: "baz",
      });
      const res = await func(`${SHARE_TAB}foo`);
      assert.deepEqual(res, {bar: "baz"}, "result");
    });

    it("should get object", async () => {
      mjs.sns.set("foo", {
        bar: "baz",
      });
      const res = await func(`${SHARE_LINK}foo`);
      assert.deepEqual(res, {bar: "baz"}, "result");
    });

    it("should get null", async () => {
      mjs.sns.set("foo", {
        bar: "baz",
      });
      const res = await func(`${SHARE_LINK}qux`);
      assert.isNull(res, "result");
    });
  });

  describe("toggle sns item", () => {
    const func = mjs.toggleSnsItem;
    beforeEach(() => {
      mjs.sns.clear();
    });
    afterEach(() => {
      mjs.sns.clear();
    });

    it("should set map", async () => {
      mjs.sns.set("foo", {});
      await func("foo");
      assert.deepEqual(mjs.sns.get("foo"), {enabled: false}, "result");
    });

    it("should set map", async () => {
      mjs.sns.set("foo", {});
      await func("foo", {checked: false});
      assert.deepEqual(mjs.sns.get("foo"), {enabled: false}, "result");
    });

    it("should set map", async () => {
      mjs.sns.set("foo", {});
      await func("foo", {checked: true});
      assert.deepEqual(mjs.sns.get("foo"), {enabled: true}, "result");
    });

    it("should set map", async () => {
      mjs.sns.set("foo", {
        id: "foo",
        subItem: {
          bar: {},
        },
      });
      await func("bar", {subItemOf: "foo", value: "baz"});
      assert.deepEqual(mjs.sns.get("foo"), {
        id: "foo",
        subItem: {
          bar: {
            value: "baz",
          },
        },
      }, "result");
    });
  });

  describe("create sns item url", () => {
    const func = mjs.createSnsUrl;

    it("should throw if no argument given", async () => {
      await func().catch(e => {
        assert.strictEqual(e.message, "Expected String but got Undefined.",
                           "throws");
      });
    });

    it("should throw if 1st argument is not string", async () => {
      await func(1).catch(e => {
        assert.strictEqual(e.message, "Expected String but got Number.",
                           "throws");
      });
    });

    it("should get string", async () => {
      const res = await func("foo");
      assert.strictEqual(res, "foo", "result");
    });

    it("should get string", async () => {
      const res = await func("foo", {});
      assert.strictEqual(res, "foo", "result");
    });

    it("should get string", async () => {
      const item = {
        url: "%origin%/?uri=%query%",
        value: "https://example.com",
      };
      const res = await func("http://www.example.com", item);
      assert.strictEqual(
        res, "https://example.com/?uri=http%3A%2F%2Fwww.example.com", "result",
      );
    });

    it("should log error", async () => {
      const stub = sinon.stub(console, "error");
      const item = {
        url: "%origin%/?uri=%query%",
        value: "foo/bar",
      };
      const res = await func("http://www.example.com", item);
      const {calledOnce} = stub;
      stub.restore();
      assert.isTrue(calledOnce, "called");
      assert.strictEqual(res, "http://www.example.com", "result");
    });
  });

  describe("init context info", () => {
    const func = mjs.initContextInfo;

    it("should init context info", async () => {
      mjs.contextInfo.canonicalUrl = "https://example.com";
      const res = await func();
      assert.deepEqual(res, {canonicalUrl: null}, "result");
    });
  });

  describe("update context info", () => {
    const func = mjs.updateContextInfo;

    it("should init context info", async () => {
      mjs.contextInfo.canonicalUrl = "https://example.com";
      const res = await func();
      assert.deepEqual(res, {canonicalUrl: null}, "result");
    });

    it("should set context info", async () => {
      mjs.contextInfo.canonicalUrl = null;
      const res = await func({
        contextInfo: {
          canonicalUrl: "https://example.com",
        },
      });
      assert.deepEqual(res, {canonicalUrl: "https://example.com"}, "result");
    });
  });

  describe("extract clicked data", () => {
    const func = mjs.extractClickedData;
    beforeEach(() => {
      mjs.sns.clear();
    });
    afterEach(() => {
      mjs.sns.clear();
    });

    it("should get array", async () => {
      const res = await func();
      assert.deepEqual(res, [{canonicalUrl: null}], "result");
    });

    it("should get array", async () => {
      const {TAB_ID_NONE} = browser.tabs;
      const tab = {
        id: TAB_ID_NONE,
      };
      const res = await func({}, tab);
      assert.deepEqual(res, [{canonicalUrl: null}], "result");
    });

    it("should get array", async () => {
      const tab = {
        id: 1,
      };
      const res = await func({}, tab);
      assert.deepEqual(res, [{canonicalUrl: null}], "result");
    });

    it("should get array", async () => {
      const info = {
        menuItemId: "foo",
      };
      const tab = {
        id: 1,
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{canonicalUrl: null}], "result");
    });

    it("should get array", async () => {
      const info = {
        menuItemId: "foo",
      };
      const tab = {
        id: 1,
        index: 0,
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{canonicalUrl: null}], "result");
    });

    it("should get array", async () => {
      mjs.sns.set("foo", {
        url: "https://example.com?u=%url%&amp;t=%text%",
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: "foo",
      };
      const tab = {
        id: 1,
        index: 0,
        url: "http://example.com",
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}, {canonicalUrl: null}], "result");
      browser.tabs.create.flush();
    });

    it("should get array", async () => {
      mjs.sns.set("foo", {
        url: "https://example.com?u=%url%&amp;t=%text%",
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: "foo",
      };
      const tab = {
        id: 1,
        index: 0,
        title: "bar",
        url: "http://example.com",
        windowId: 2,
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}, {canonicalUrl: null}], "result");
      browser.tabs.create.flush();
    });

    it("should get array", async () => {
      mjs.sns.set("foo", {
        url: "https://example.com?u=%url%&amp;t=%text%",
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: `${SHARE_LINK}foo`,
        linkText: "baz",
        linkUrl: "http://www.example.com",
      };
      const tab = {
        id: 1,
        index: 0,
        title: "bar",
        url: "http://example.com",
        windowId: 2,
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}, {canonicalUrl: null}], "result");
      browser.tabs.create.flush();
    });

    it("should get array", async () => {
      mjs.sns.set("foo", {
        url: "https://example.com?u=%url%&amp;t=%text%",
        subItem: {
          bar: {
            url: "%origin%/?q=%query%",
          },
        },
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: "foo",
      };
      const tab = {
        id: 1,
        index: 0,
        title: "bar",
        url: "http://example.com",
        windowId: 2,
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}, {canonicalUrl: null}], "result");
      browser.tabs.create.flush();
    });
  });

  describe("remove context menu", () => {
    const func = mjs.removeMenu;

    it("should get undefined", async () => {
      browser.menus.removeAll.resolves(undefined);
      const i = browser.menus.removeAll.callCount;
      const res = await func();
      assert.strictEqual(browser.menus.removeAll.callCount, i + 1, "called");
      assert.isUndefined(res, "result");
      browser.menus.removeAll.flush();
    });
  });

  describe("create context menu item", () => {
    const func = mjs.createMenuItem;

    it("should get null if no argument given", async () => {
      const res = await func();
      assert.isNull(res, "result");
    });

    it("should get null if 1st arg is not string", async () => {
      const res = await func(1, "foo", {contexts: []});
      assert.isNull(res, "result");
    });

    it("should get null if 2nd arg is not string", async () => {
      const res = await func("foo", 1, {contexts: []});
      assert.isNull(res, "result");
    });

    it("should get null if 3rd arg does not contain contexts", async () => {
      const res = await func("foo", "bar", {});
      assert.isNull(res, "result");
    });

    it("should get null if contexts is not array", async () => {
      const res = await func("foo", "bar", {contexts: 1});
      assert.isNull(res, "result");
    });

    it("should call function", async () => {
      browser.menus.create.withArgs({
        id: "foo",
        title: "bar",
        contexts: [],
        enabled: false,
      }).resolves("foo");
      const i = browser.menus.create.callCount;
      const res = await func("foo", "bar", {contexts: []});
      assert.strictEqual(browser.menus.create.callCount, i + 1, "called");
      assert.strictEqual(res, "foo", "result");
      browser.menus.create.flush();
    });
  });

  describe("create context menu items", () => {
    const func = mjs.createMenu;
    beforeEach(() => {
      mjs.sns.clear();
    });
    afterEach(() => {
      mjs.sns.clear();
    });

    it("should get empty array", async () => {
      const res = await func();
      assert.deepEqual(res, [], "result");
    });

    it("should get empty array", async () => {
      const res = await func();
      mjs.sns.set("foo", {
        enabled: false,
      });
      assert.deepEqual(res, [], "result");
    });

    it("should get empty array", async () => {
      const res = await func();
      mjs.sns.set("foo", {
        enabled: true,
      });
      assert.deepEqual(res, [], "result");
    });

    it("should get array", async () => {
      mjs.sns.set("foo", {
        enabled: true,
        id: "foo",
      });
      browser.i18n.getMessage.withArgs(SHARE_PAGE, "foo").returns("baz");
      browser.i18n.getMessage.withArgs(SHARE_TAB, "foo").returns("qux");
      browser.i18n.getMessage.withArgs(SHARE_LINK, "foo").returns("quux");
      browser.menus.create.withArgs({
        id: `${SHARE_PAGE}foo`,
        contexts: ["page", "selection"],
        title: "baz",
        enabled: true,
      }).resolves(SHARE_PAGE);
      browser.menus.create.withArgs({
        id: `${SHARE_TAB}foo`,
        contexts: ["tab"],
        title: "qux",
        enabled: true,
      }).resolves(SHARE_TAB);
      browser.menus.create.withArgs({
        id: `${SHARE_LINK}foo`,
        contexts: ["link"],
        title: "quux",
        enabled: true,
      }).resolves(SHARE_LINK);
      const i = browser.menus.create.callCount;
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i + 3, "call count");
      assert.deepEqual(res, [`${SHARE_PAGE}`, `${SHARE_TAB}`, `${SHARE_LINK}`],
                       "result");
      browser.i18n.getMessage.flush();
      browser.menus.create.flush();
    });

    it("should get array", async () => {
      mjs.sns.set("foo", {
        enabled: true,
        id: "foo",
        menu: "bar",
      });
      browser.i18n.getMessage.withArgs(SHARE_PAGE, "bar").returns("baz");
      browser.i18n.getMessage.withArgs(SHARE_TAB, "bar").returns("qux");
      browser.i18n.getMessage.withArgs(SHARE_LINK, "bar").returns("quux");
      browser.menus.create.withArgs({
        id: `${SHARE_PAGE}foo`,
        contexts: ["page", "selection"],
        title: "baz",
        enabled: true,
      }).resolves(SHARE_PAGE);
      browser.menus.create.withArgs({
        id: `${SHARE_TAB}foo`,
        contexts: ["tab"],
        title: "qux",
        enabled: true,
      }).resolves(SHARE_TAB);
      browser.menus.create.withArgs({
        id: `${SHARE_LINK}foo`,
        contexts: ["link"],
        title: "quux",
        enabled: true,
      }).resolves(SHARE_LINK);
      const i = browser.menus.create.callCount;
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i + 3, "call count");
      assert.deepEqual(res, [`${SHARE_PAGE}`, `${SHARE_TAB}`, `${SHARE_LINK}`],
                       "result");
      browser.i18n.getMessage.flush();
      browser.menus.create.flush();
    });
  });

  describe("handle runtime message", () => {
    const func = mjs.handleMsg;

    it("should get empty array", async () => {
      const res = await func();
      assert.deepEqual(res, [], "result");
    });

    it("should get empty array", async () => {
      const res = await func({});
      assert.deepEqual(res, [], "result");
    });

    it("should get empty array", async () => {
      const res = await func({
        foo: "bar",
      });
      assert.deepEqual(res, [], "result");
    });

    it("should get empty array", async () => {
      const res = await func({
        foo: "bar",
      }, {
        id: "treestyletab@piro.sakura.ne.jp",
      });
      assert.deepEqual(res, [], "result");
    });

    it("should get array", async () => {
      browser.runtime.getManifest.returns({icons: {}});
      const res = await func({
        type: "ready",
      }, {
        id: "treestyletab@piro.sakura.ne.jp",
      });
      assert.deepEqual(res, [], "result");
      browser.runtime.getManifest.flush();
    });

    it("should get array", async () => {
      browser.runtime.getManifest.returns({icons: {}});
      const res = await func({
        type: "fake-contextMenu-click",
      }, {
        id: "treestyletab@piro.sakura.ne.jp",
      });
      assert.deepEqual(res, [], "result");
      browser.runtime.getManifest.flush();
    });

    it("should get array", async () => {
      const res = await func({
        [SHARE_SNS]: {},
      });
      assert.deepEqual(res, [[{canonicalUrl: null}]], "result");
    });

    it("should get array", async () => {
      const res = await func({
        [CONTEXT_INFO]: {},
      });
      assert.deepEqual(res, [{canonicalUrl: null}], "result");
    });

    it("should get array", async () => {
      const res = await func({
        [CONTEXT_INFO]: {
          [CONTEXT_INFO]: {
            canonicalUrl: "//example.com",
          },
        },
      });
      assert.deepEqual(res, [{canonicalUrl: "//example.com"}], "result");
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
      mjs.sns.set("foo", {});
      const spy = sinon.spy(mjs.sns, "set");
      const res = await func({
        foo: {
          checked: true,
        },
      });
      assert.deepEqual(spy.args, [["foo", {enabled: true}]], "spy");
      assert.deepEqual(res, [undefined], "result");
      mjs.sns.set.restore();
    });

    it("should get array", async () => {
      mjs.sns.set("foo", {});
      const spy = sinon.spy(mjs.sns, "set");
      const res = await func({
        foo: {
          newValue: {
            checked: true,
          },
        },
      });
      assert.deepEqual(spy.args, [["foo", {enabled: true}]], "spy");
      assert.deepEqual(res, [undefined], "result");
      mjs.sns.set.restore();
    });
  });
});
