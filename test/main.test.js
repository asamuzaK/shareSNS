/**
 * main.test.js
 */

/* api */
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser } from './mocha/setup.js';
import sinon from 'sinon';
import {
  CONTEXT_INFO_GET, PREFER_CANONICAL,
  SHARE_LINK, SHARE_PAGE, SHARE_SNS, SHARE_TAB
} from '../src/mjs/constant.js';

/* test */
import * as mjs from '../src/mjs/main.js';

describe('main', () => {
  beforeEach(() => {
    browser._sandbox.reset();
    browser.i18n.getMessage.callsFake((...args) => args.toString());
    browser.permissions.contains.resolves(true);
    global.browser = browser;
  });
  afterEach(() => {
    delete global.browser;
    browser._sandbox.reset();
  });

  it('should get browser object', () => {
    assert.isObject(browser, 'browser');
  });

  describe('set sns item', () => {
    const func = mjs.setSnsItems;

    it('should set map', async () => {
      const itemKeys = [
        'Twitter', 'Facebook', 'LINE', 'Hatena', 'Mastodon', 'Pleroma'
      ];
      await func();
      assert.strictEqual(mjs.sns.size, itemKeys.length, 'length');
      for (const key of itemKeys) {
        assert.isObject(mjs.sns.get(key), `result ${key}`);
      }
      mjs.sns.clear();
    });
  });

  describe('get sns item from menu item ID', () => {
    const func = mjs.getSnsItemFromId;
    beforeEach(() => {
      mjs.sns.clear();
    });
    afterEach(() => {
      mjs.sns.clear();
    });

    it('should throw if no argument given', async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, 'Expected String but got Undefined.');
      });
    });

    it('should throw if argument is not string', async () => {
      await func(1).catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, 'Expected String but got Number.');
      });
    });

    it('should get object', async () => {
      mjs.sns.set('foo', {
        bar: 'baz'
      });
      const res = await func('foo');
      assert.deepEqual(res, { bar: 'baz' }, 'result');
    });

    it('should get object', async () => {
      mjs.sns.set('foo', {
        bar: 'baz'
      });
      const res = await func(`${SHARE_PAGE}foo`);
      assert.deepEqual(res, { bar: 'baz' }, 'result');
    });

    it('should get object', async () => {
      mjs.sns.set('foo', {
        bar: 'baz'
      });
      const res = await func(`${SHARE_TAB}foo`);
      assert.deepEqual(res, { bar: 'baz' }, 'result');
    });

    it('should get object', async () => {
      mjs.sns.set('foo', {
        bar: 'baz'
      });
      const res = await func(`${SHARE_LINK}foo`);
      assert.deepEqual(res, { bar: 'baz' }, 'result');
    });

    it('should get null', async () => {
      mjs.sns.set('foo', {
        bar: 'baz'
      });
      const res = await func(`${SHARE_LINK}qux`);
      assert.isNull(res, 'result');
    });
  });

  describe('toggle sns item', () => {
    const func = mjs.toggleSnsItem;
    beforeEach(() => {
      mjs.sns.clear();
    });
    afterEach(() => {
      mjs.sns.clear();
    });

    it('should throw if first argument is not given', async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, 'Expected String but got Undefined.');
      });
    });

    it('should not set map', async () => {
      await func('foo');
      assert.isUndefined(mjs.sns.get('foo'), 'result');
    });

    it('should set map', async () => {
      mjs.sns.set('foo', {});
      await func('foo');
      assert.deepEqual(mjs.sns.get('foo'), { enabled: false }, 'result');
    });

    it('should set map', async () => {
      mjs.sns.set('foo', {});
      await func('foo', { checked: false });
      assert.deepEqual(mjs.sns.get('foo'), { enabled: false }, 'result');
    });

    it('should set map', async () => {
      mjs.sns.set('foo', {});
      await func('foo', { checked: true });
      assert.deepEqual(mjs.sns.get('foo'), { enabled: true }, 'result');
    });

    it('should not set map', async () => {
      mjs.sns.set('foo', {
        id: 'foo',
        subItem: {}
      });
      await func('bar', { subItemOf: 'foo', value: 'baz' });
      assert.deepEqual(mjs.sns.get('foo'), {
        id: 'foo',
        subItem: {}
      }, 'result');
    });

    it('should set map', async () => {
      mjs.sns.set('foo', {
        id: 'foo',
        subItem: {
          bar: {}
        }
      });
      await func('bar', { subItemOf: 'foo', value: 'baz' });
      assert.deepEqual(mjs.sns.get('foo'), {
        id: 'foo',
        subItem: {
          bar: {
            value: 'baz'
          }
        }
      }, 'result');
    });

    it('should set map', async () => {
      mjs.sns.set('foo', {
        id: 'foo',
        subItem: {
          bar: {}
        }
      });
      await func('bar', { subItemOf: 'foo' });
      assert.deepEqual(mjs.sns.get('foo'), {
        id: 'foo',
        subItem: {
          bar: {
            value: null
          }
        }
      }, 'result');
    });
  });

  describe('create sns item url', () => {
    const func = mjs.createSnsUrl;

    it('should throw if 2nd argument is not string', async () => {
      await func({}, 1).catch(e => {
        assert.strictEqual(e.message, 'Expected String but got Number.',
          'throws');
      });
    });

    it('should get string', async () => {
      const res = await func(null, 'foo');
      assert.strictEqual(res, 'foo', 'result');
    });

    it('should get string', async () => {
      const res = await func({}, 'foo');
      assert.strictEqual(res, 'foo', 'result');
    });

    it('should get string', async () => {
      const item = {
        url: '%origin%/?uri=%url%',
        value: 'https://example.com'
      };
      const res = await func(item, 'http://www.example.com');
      assert.strictEqual(res,
        'https://example.com/?uri=http%3A%2F%2Fwww.example.com', 'result');
    });

    it('should get string', async () => {
      const item = {
        url: '%origin%/?message=%text%%20%url%',
        value: 'https://example.com'
      };
      const res = await func(item, 'http://www.example.com', 'foo bar');
      assert.strictEqual(res,
        'https://example.com/?message=foo%20bar%20http%3A%2F%2Fwww.example.com',
        'result');
    });

    it('should get string', async () => {
      const item = {
        url: '%origin%/?message=%text%%20%url%',
        value: 'file:///foo/bar'
      };
      const res = await func(item, 'http://www.example.com');
      assert.strictEqual(res, 'http://www.example.com', 'result');
    });

    it('should log error', async () => {
      const stub = sinon.stub(console, 'error');
      const item = {
        url: '%origin%/?uri=%url%',
        value: 'foo/bar'
      };
      const res = await func(item, 'http://www.example.com');
      const { calledOnce } = stub;
      stub.restore();
      assert.isTrue(calledOnce, 'called');
      assert.strictEqual(res, 'http://www.example.com', 'result');
    });
  });

  describe('send context info', () => {
    const func = mjs.sendContextInfo;

    it('should get null', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.tabs.executeScript.resolves(null);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.tabs.executeScript.resolves([]);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i,
        'not called');
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      const i = browser.runtime.sendMessage.callCount;
      browser.runtime.sendMessage.resolves({});
      browser.tabs.executeScript.resolves(['foo']);
      const res = await func();
      assert.strictEqual(browser.runtime.sendMessage.callCount, i + 1,
        'called');
      assert.deepEqual(res, {}, 'result');
    });
  });

  describe('extract clicked data', () => {
    const func = mjs.extractClickedData;
    beforeEach(() => {
      mjs.sns.clear();
      mjs.vars[PREFER_CANONICAL] = false;
    });
    afterEach(() => {
      mjs.sns.clear();
      mjs.vars[PREFER_CANONICAL] = false;
    });

    it('should get empty array', async () => {
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const { TAB_ID_NONE } = browser.tabs;
      const tab = {
        id: TAB_ID_NONE
      };
      const res = await func({}, tab);
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const tab = {
        id: 1
      };
      const res = await func({}, tab);
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        url: 'https://example.com?u=%url%&t=%text%'
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        url: 'http://example.com'
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        url: 'https://example.com?u=%url%&t=%text%'
      });
      mjs.vars[PREFER_CANONICAL] = true;
      browser.tabs.create.resolves({});
      browser.tabs.executeScript.resolves(['https://www.example.com/']);
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        url: 'http://example.com'
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        url: 'https://example.com?u=%url%&t=%text%'
      });
      mjs.vars[PREFER_CANONICAL] = true;
      browser.tabs.create.resolves({});
      browser.tabs.executeScript.resolves([null]);
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        url: 'http://example.com'
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      const stubErr = sinon.stub(console, 'error');
      mjs.sns.set('foo', {
        url: 'https://example.com?u=%url%&t=%text%'
      });
      mjs.vars[PREFER_CANONICAL] = true;
      browser.tabs.create.resolves({});
      browser.tabs.executeScript.rejects(new Error('error'));
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        url: 'http://example.com'
      };
      const res = await func(info, tab);
      const { calledOnce: errCalled } = stubErr;
      stubErr.restore();
      assert.isTrue(errCalled, 'called error');
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        url: 'https://example.com?u=%url%&t=%text%'
      });
      mjs.vars[PREFER_CANONICAL] = true;
      browser.tabs.executeScript.resolves([null]);
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        url: 'http://example.com'
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        url: 'https://example.com?u=%url%&t=%text%'
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        url: 'http://example.com/#bar'
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        url: 'https://example.com?u=%url%&t=%text%'
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        title: 'bar',
        url: 'http://example.com',
        windowId: 2
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        url: 'https://example.com?u=%url%&t=%text%'
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: `${SHARE_LINK}foo`,
        linkText: 'baz',
        linkUrl: 'http://www.example.com',
        selectionText: 'foo  bar'
      };
      const tab = {
        id: 1,
        index: 0,
        title: 'bar',
        url: 'http://example.com',
        windowId: 2
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        url: 'https://example.com?u=%url%&t=%text%'
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: `${SHARE_LINK}foo`,
        linkText: 'baz',
        linkUrl: 'http://www.example.com'
      };
      const tab = {
        id: 1,
        index: 0,
        title: 'bar',
        url: 'http://example.com',
        windowId: 2
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        url: 'https://example.com?u=%url%&t=%text%'
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: `${SHARE_PAGE}foo`,
        linkText: 'baz',
        linkUrl: 'http://www.example.com',
        selectionText: 'foo  bar'
      };
      const tab = {
        id: 1,
        index: 0,
        title: 'bar',
        url: 'http://example.com',
        windowId: 2
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        url: null,
        subItem: {
          bar: {
            url: '%origin%/?q=%url%'
          }
        }
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        title: 'bar',
        url: 'http://example.com',
        windowId: 2
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get empty array', async () => {
      mjs.sns.set('foo', {
        url: null,
        subItem: {}
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        title: 'bar',
        url: 'http://example.com',
        windowId: 2
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      mjs.sns.set('foo', {
        url: null,
        subItem: {
          foo: 'bar'
        }
      });
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        title: 'bar',
        url: 'http://example.com',
        windowId: 2
      };
      const res = await func(info, tab);
      assert.deepEqual(res, [], 'result');
    });

    it('should get array', async () => {
      const i = browser.tabs.update.callCount;
      const j = browser.tabs.create.callCount;
      mjs.sns.set('foo', {
        matchPattern: 'https://example.com/*',
        url: 'https://example.com?u=%url%&t=%text%'
      });
      browser.tabs.query.withArgs({
        cookieStoreId: 'bar',
        currentWindow: true,
        url: 'https://example.com/*'
      }).resolves([{
        id: 2
      }]);
      browser.tabs.update.resolves({});
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        cookieStoreId: 'bar',
        url: 'http://example.com'
      };
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.update.callCount, i + 1, 'called');
      assert.strictEqual(browser.tabs.create.callCount, j, 'not called');
      assert.deepEqual(res, [{}], 'result');
    });

    it('should get array', async () => {
      const i = browser.tabs.update.callCount;
      const j = browser.tabs.create.callCount;
      mjs.sns.set('foo', {
        matchPattern: 'https://example.com/*',
        url: 'https://example.com?u=%url%&t=%text%'
      });
      browser.tabs.query.withArgs({
        cookieStoreId: 'bar',
        currentWindow: true,
        url: 'https://example.com/*'
      }).resolves([]);
      browser.tabs.create.resolves({});
      const info = {
        menuItemId: 'foo'
      };
      const tab = {
        id: 1,
        index: 0,
        cookieStoreId: 'bar',
        url: 'http://example.com'
      };
      const res = await func(info, tab);
      assert.strictEqual(browser.tabs.update.callCount, i, 'not called');
      assert.strictEqual(browser.tabs.create.callCount, j + 1, 'called');
      assert.deepEqual(res, [{}], 'result');
    });
  });

  describe('remove context menu', () => {
    const func = mjs.removeMenu;

    it('should get undefined', async () => {
      browser.menus.removeAll.resolves(undefined);
      const i = browser.menus.removeAll.callCount;
      const res = await func();
      assert.strictEqual(browser.menus.removeAll.callCount, i + 1, 'called');
      assert.isUndefined(res, 'result');
    });
  });

  describe('create context menu item', () => {
    const func = mjs.createMenuItem;

    it('should throw if no argument given', async () => {
      await func().catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, 'Expected String but got Undefined.');
      });
    });

    it('should throw if 2nd arg is not string', async () => {
      await func('foo').catch(e => {
        assert.instanceOf(e, TypeError);
        assert.strictEqual(e.message, 'Expected String but got Undefined.');
      });
    });

    it('should get null if 3rd arg does not contain contexts', async () => {
      const res = await func('foo', 'bar', {});
      assert.isNull(res, 'result');
    });

    it('should get null if contexts is not array', async () => {
      const res = await func('foo', 'bar', { contexts: 1 });
      assert.isNull(res, 'result');
    });

    it('should call function', async () => {
      browser.menus.create.withArgs({
        id: 'foo',
        title: 'bar',
        contexts: [],
        enabled: false
      }).resolves('foo');
      const i = browser.menus.create.callCount;
      const res = await func('foo', 'bar', { contexts: [] });
      assert.strictEqual(browser.menus.create.callCount, i + 1, 'called');
      assert.strictEqual(res, 'foo', 'result');
    });
  });

  describe('create context menu items', () => {
    const func = mjs.createMenu;
    beforeEach(() => {
      mjs.sns.clear();
    });
    afterEach(() => {
      mjs.sns.clear();
    });

    it('should get empty array', async () => {
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      mjs.sns.set('foo', {});
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      mjs.sns.set('foo', {
        enabled: false
      });
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      mjs.sns.set('foo', {
        enabled: true
      });
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        enabled: true,
        id: 'foo'
      });
      browser.i18n.getMessage.withArgs(SHARE_PAGE, 'foo').returns('baz');
      browser.i18n.getMessage.withArgs(SHARE_TAB, 'foo').returns('qux');
      browser.i18n.getMessage.withArgs(SHARE_LINK, 'foo').returns('quux');
      browser.menus.create.withArgs({
        id: `${SHARE_PAGE}foo`,
        contexts: ['page', 'selection'],
        title: 'baz',
        enabled: true
      }).resolves(SHARE_PAGE);
      browser.menus.create.withArgs({
        id: `${SHARE_TAB}foo`,
        contexts: ['tab'],
        title: 'qux',
        enabled: true
      }).resolves(SHARE_TAB);
      browser.menus.create.withArgs({
        id: `${SHARE_LINK}foo`,
        contexts: ['link'],
        title: 'quux',
        enabled: true
      }).resolves(SHARE_LINK);
      const i = browser.menus.create.callCount;
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i + 3, 'call count');
      assert.deepEqual(res, [`${SHARE_PAGE}`, `${SHARE_TAB}`, `${SHARE_LINK}`],
        'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {
        enabled: true,
        id: 'foo',
        menu: 'bar'
      });
      browser.i18n.getMessage.withArgs(SHARE_PAGE, 'bar').returns('baz');
      browser.i18n.getMessage.withArgs(SHARE_TAB, 'bar').returns('qux');
      browser.i18n.getMessage.withArgs(SHARE_LINK, 'bar').returns('quux');
      browser.menus.create.withArgs({
        id: `${SHARE_PAGE}foo`,
        contexts: ['page', 'selection'],
        title: 'baz',
        enabled: true
      }).resolves(SHARE_PAGE);
      browser.menus.create.withArgs({
        id: `${SHARE_TAB}foo`,
        contexts: ['tab'],
        title: 'qux',
        enabled: true
      }).resolves(SHARE_TAB);
      browser.menus.create.withArgs({
        id: `${SHARE_LINK}foo`,
        contexts: ['link'],
        title: 'quux',
        enabled: true
      }).resolves(SHARE_LINK);
      const i = browser.menus.create.callCount;
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i + 3, 'call count');
      assert.deepEqual(res, [`${SHARE_PAGE}`, `${SHARE_TAB}`, `${SHARE_LINK}`],
        'result');
    });

    it('should get array', async () => {
      mjs.sns.set('Mastodon', {
        enabled: true,
        id: 'Mastodon',
        menu: '&Mastodon'
      });
      browser.i18n.getMessage.withArgs(SHARE_PAGE, '&Mastodon').returns('baz');
      browser.i18n.getMessage.withArgs(SHARE_TAB, '&Mastodon').returns('qux');
      browser.i18n.getMessage.withArgs(SHARE_LINK, '&Mastodon').returns('quux');
      browser.menus.create.withArgs({
        id: `${SHARE_PAGE}Mastodon`,
        contexts: ['page', 'selection'],
        title: 'baz',
        enabled: false
      }).resolves(SHARE_PAGE);
      browser.menus.create.withArgs({
        id: `${SHARE_TAB}Mastodon`,
        contexts: ['tab'],
        title: 'qux',
        enabled: false
      }).resolves(SHARE_TAB);
      browser.menus.create.withArgs({
        id: `${SHARE_LINK}Mastodon`,
        contexts: ['link'],
        title: 'quux',
        enabled: false
      }).resolves(SHARE_LINK);
      const i = browser.menus.create.callCount;
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i + 3, 'call count');
      assert.deepEqual(res, [`${SHARE_PAGE}`, `${SHARE_TAB}`, `${SHARE_LINK}`],
        'result');
    });

    it('should get array', async () => {
      mjs.sns.set('Mastodon', {
        enabled: true,
        id: 'Mastodon',
        menu: '&Mastodon'
      });
      browser.storage.local.get.resolves({
        mastodonInstanceUrl: {
          value: 'https://example.com'
        }
      });
      browser.i18n.getMessage.withArgs(SHARE_PAGE, '&Mastodon').returns('baz');
      browser.i18n.getMessage.withArgs(SHARE_TAB, '&Mastodon').returns('qux');
      browser.i18n.getMessage.withArgs(SHARE_LINK, '&Mastodon').returns('quux');
      browser.menus.create.withArgs({
        id: `${SHARE_PAGE}Mastodon`,
        contexts: ['page', 'selection'],
        title: 'baz',
        enabled: true
      }).resolves(SHARE_PAGE);
      browser.menus.create.withArgs({
        id: `${SHARE_TAB}Mastodon`,
        contexts: ['tab'],
        title: 'qux',
        enabled: true
      }).resolves(SHARE_TAB);
      browser.menus.create.withArgs({
        id: `${SHARE_LINK}Mastodon`,
        contexts: ['link'],
        title: 'quux',
        enabled: true
      }).resolves(SHARE_LINK);
      const i = browser.menus.create.callCount;
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i + 3, 'call count');
      assert.deepEqual(res, [`${SHARE_PAGE}`, `${SHARE_TAB}`, `${SHARE_LINK}`],
        'result');
    });

    it('should get array', async () => {
      mjs.sns.set('Pleroma', {
        enabled: true,
        id: 'Pleroma',
        menu: '&Pleroma'
      });
      browser.storage.local.get.resolves({
        pleromaInstanceUrl: {
          value: 'https://example.com'
        }
      });
      browser.i18n.getMessage.withArgs(SHARE_PAGE, '&Pleroma').returns('baz');
      browser.i18n.getMessage.withArgs(SHARE_TAB, '&Pleroma').returns('qux');
      browser.i18n.getMessage.withArgs(SHARE_LINK, '&Pleroma').returns('quux');
      browser.menus.create.withArgs({
        id: `${SHARE_PAGE}Pleroma`,
        contexts: ['page', 'selection'],
        title: 'baz',
        enabled: true
      }).resolves(SHARE_PAGE);
      browser.menus.create.withArgs({
        id: `${SHARE_TAB}Pleroma`,
        contexts: ['tab'],
        title: 'qux',
        enabled: true
      }).resolves(SHARE_TAB);
      browser.menus.create.withArgs({
        id: `${SHARE_LINK}Pleroma`,
        contexts: ['link'],
        title: 'quux',
        enabled: true
      }).resolves(SHARE_LINK);
      const i = browser.menus.create.callCount;
      const res = await func();
      assert.strictEqual(browser.menus.create.callCount, i + 3, 'call count');
      assert.deepEqual(res, [`${SHARE_PAGE}`, `${SHARE_TAB}`, `${SHARE_LINK}`],
        'result');
    });
  });

  describe('handle runtime message', () => {
    const func = mjs.handleMsg;

    it('should get empty array', async () => {
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({});
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({
        foo: 'bar'
      });
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({
        foo: 'bar'
      }, {
        id: 'treestyletab@piro.sakura.ne.jp'
      });
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      browser.runtime.getManifest.returns({ icons: {} });
      const res = await func({
        type: 'ready'
      }, {
        id: 'treestyletab@piro.sakura.ne.jp'
      });
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      browser.runtime.getManifest.returns({ icons: {} });
      const res = await func({
        type: 'fake-contextMenu-click'
      }, {
        id: 'treestyletab@piro.sakura.ne.jp'
      });
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      browser.tabs.executeScript.resolves([]);
      const i = browser.tabs.executeScript.callCount;
      const res = await func({
        [CONTEXT_INFO_GET]: false
      });
      assert.strictEqual(browser.tabs.executeScript.callCount, i, 'not called');
      assert.deepEqual(res, [], 'result');
    });

    it('should get array', async () => {
      browser.tabs.executeScript.resolves([]);
      const i = browser.tabs.executeScript.callCount;
      const res = await func({
        [CONTEXT_INFO_GET]: true
      });
      assert.strictEqual(browser.tabs.executeScript.callCount, i + 1, 'called');
      assert.deepEqual(res, [null], 'result');
    });

    it('should get array', async () => {
      const res = await func({
        [SHARE_SNS]: {}
      });
      assert.deepEqual(res, [[]], 'result');
    });
  });

  describe('handle stored data', () => {
    const func = mjs.handleStoredData;
    beforeEach(() => {
      mjs.sns.clear();
      mjs.vars[PREFER_CANONICAL] = false;
    });
    afterEach(() => {
      mjs.sns.clear();
      mjs.vars[PREFER_CANONICAL] = false;
    });

    it('should get empty array if no argument given', async () => {
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({});
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const res = await func({
        foo: {}
      });
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      mjs.sns.set('foo', {});
      const res = await func({
        foo: {
          checked: true
        }
      }, 'bar');
      assert.deepEqual(res, [], 'result');
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {});
      const spy = sinon.spy(mjs.sns, 'set');
      const res = await func({
        foo: {
          checked: true
        }
      });
      assert.deepEqual(spy.args, [['foo', { enabled: true }]], 'spy');
      assert.deepEqual(res, [undefined], 'result');
      mjs.sns.set.restore();
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {});
      const spy = sinon.spy(mjs.sns, 'set');
      const res = await func({
        foo: {
          checked: true
        }
      }, 'local');
      assert.deepEqual(spy.args, [['foo', { enabled: true }]], 'spy');
      assert.deepEqual(res, [undefined], 'result');
      mjs.sns.set.restore();
    });

    it('should get array', async () => {
      mjs.sns.set('foo', {});
      const spy = sinon.spy(mjs.sns, 'set');
      const res = await func({
        foo: {
          newValue: {
            checked: true
          }
        }
      });
      assert.deepEqual(spy.args, [['foo', { enabled: true }]], 'spy');
      assert.deepEqual(res, [undefined], 'result');
      mjs.sns.set.restore();
    });

    it('should set vars', async () => {
      const res = await func({
        [PREFER_CANONICAL]: {
          checked: true
        }
      });
      assert.isTrue(mjs.vars[PREFER_CANONICAL]);
      assert.deepEqual(res, [], 'result');
    });

    it('should set vars', async () => {
      const res = await func({
        [PREFER_CANONICAL]: {
          newValue: {
            checked: true
          }
        }
      });
      assert.isTrue(mjs.vars[PREFER_CANONICAL]);
      assert.deepEqual(res, [], 'result');
    });

    it('should set vars', async () => {
      mjs.vars[PREFER_CANONICAL] = true;
      const res = await func({
        [PREFER_CANONICAL]: {
          newValue: {
            checked: false
          }
        }
      });
      assert.isFalse(mjs.vars[PREFER_CANONICAL]);
      assert.deepEqual(res, [], 'result');
    });
  });

  describe('startup', () => {
    const func = mjs.startup;
    beforeEach(() => {
      mjs.sns.clear();
    });
    afterEach(() => {
      mjs.sns.clear();
    });

    it('should get empty array', async () => {
      const res = await func();
      assert.deepEqual(res, [], 'result');
    });
  });
});
