/**
 * options-main.test.js
 */

/* api */
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { browser, createJsdom } from './mocha/setup.js';
import sinon from 'sinon';

/* test */
import * as mjs from '../src/mjs/options-main.js';

describe('options-main', () => {
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

  it('should get browser object', () => {
    assert.isObject(browser, 'browser');
  });

  describe('create pref', () => {
    const func = mjs.createPref;

    it('should get null if argument not given', async () => {
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get object', async () => {
      const res = await func({
        id: 'foo'
      });
      assert.deepEqual(res, {
        foo: {
          id: 'foo',
          checked: false,
          value: '',
          subItemOf: null
        }
      }, 'result');
    });
  });

  describe('store pref', () => {
    const func = mjs.storePref;

    it('should call function', async () => {
      const i = browser.storage.local.set.callCount;
      const evt = {
        target: {
          id: 'foo',
          type: 'text'
        }
      };
      const res = await func(evt);
      assert.strictEqual(browser.storage.local.set.callCount, i + 1, 'called');
      assert.strictEqual(res.length, 1, 'array length');
      assert.deepEqual(res, [undefined], 'result');
    });

    it('should call function', async () => {
      const i = browser.storage.local.set.callCount;
      const elm = document.createElement('input');
      const elm2 = document.createElement('input');
      const body = document.querySelector('body');
      const evt = {
        target: {
          id: 'foo',
          name: 'bar',
          type: 'radio'
        }
      };
      elm.id = 'foo';
      elm.name = 'bar';
      elm.type = 'radio';
      elm2.id = 'baz';
      elm2.name = 'bar';
      elm2.type = 'radio';
      body.appendChild(elm);
      body.appendChild(elm2);
      const res = await func(evt);
      assert.strictEqual(browser.storage.local.set.callCount, i + 2, 'called');
      assert.strictEqual(res.length, 2, 'array length');
      assert.deepEqual(res, [undefined, undefined], 'result');
    });
  });

  describe('handle input change', () => {
    const func = mjs.handleInputChange;

    it('should call function', async () => {
      const i = browser.storage.local.set.callCount;
      const evt = {
        target: {
          id: 'foo',
          type: 'text'
        }
      };
      const res = await func(evt);
      assert.strictEqual(browser.storage.local.set.callCount, i + 1, 'called');
      assert.strictEqual(res.length, 1, 'array length');
      assert.deepEqual(res, [undefined], 'result');
    });
  });

  describe('add event listener to input elements', () => {
    const func = mjs.addInputChangeListener;

    it('should set listener', async () => {
      const elm = document.createElement('input');
      const body = document.querySelector('body');
      const spy = sinon.spy(elm, 'addEventListener');
      body.appendChild(elm);
      await func();
      assert.isTrue(spy.calledOnce, 'called');
      elm.addEventListener.restore();
    });
  });

  describe('set html input value', () => {
    const func = mjs.setHtmlInputValue;

    it('should not set value if argument not given', async () => {
      const elm = document.createElement('input');
      const body = document.querySelector('body');
      elm.id = 'foo';
      elm.type = 'checkbox';
      body.appendChild(elm);
      await func();
      assert.strictEqual(elm.checked, false, 'checked');
    });

    it('should not set value if element not found', async () => {
      const elm = document.createElement('input');
      const body = document.querySelector('body');
      elm.id = 'foo';
      elm.type = 'checkbox';
      body.appendChild(elm);
      await func({
        id: 'bar',
        checked: true
      });
      assert.strictEqual(elm.checked, false, 'checked');
    });

    it('should not set value if type does not match', async () => {
      const elm = document.createElement('input');
      const body = document.querySelector('body');
      elm.id = 'foo';
      elm.type = 'search';
      elm.checked = false;
      elm.value = 'baz';
      body.appendChild(elm);
      await func({
        id: 'foo',
        checked: true,
        value: 'qux'
      });
      assert.strictEqual(elm.checked, false, 'checked');
      assert.strictEqual(elm.value, 'baz', 'checked');
    });

    it('should set checkbox value', async () => {
      const elm = document.createElement('input');
      const body = document.querySelector('body');
      elm.id = 'foo';
      elm.type = 'checkbox';
      body.appendChild(elm);
      await func({
        id: 'foo',
        checked: true
      });
      assert.strictEqual(elm.checked, true, 'checked');
    });

    it('should set checkbox value', async () => {
      const elm = document.createElement('input');
      const body = document.querySelector('body');
      elm.id = 'foo';
      elm.type = 'checkbox';
      body.appendChild(elm);
      await func({
        id: 'foo'
      });
      assert.strictEqual(elm.checked, false, 'checked');
    });

    it('should set radio value', async () => {
      const elm = document.createElement('input');
      const body = document.querySelector('body');
      elm.id = 'foo';
      elm.type = 'radio';
      body.appendChild(elm);
      await func({
        id: 'foo',
        checked: true
      });
      assert.strictEqual(elm.checked, true, 'checked');
    });

    it('should set text value', async () => {
      const elm = document.createElement('input');
      const body = document.querySelector('body');
      elm.id = 'foo';
      elm.type = 'text';
      body.appendChild(elm);
      await func({
        id: 'foo',
        value: 'bar'
      });
      assert.strictEqual(elm.value, 'bar', 'value');
    });

    it('should set text value', async () => {
      const elm = document.createElement('input');
      const body = document.querySelector('body');
      elm.id = 'foo';
      elm.type = 'text';
      body.appendChild(elm);
      await func({
        id: 'foo'
      });
      assert.strictEqual(elm.value, '', 'value');
    });

    it('should set url value', async () => {
      const elm = document.createElement('input');
      const body = document.querySelector('body');
      elm.id = 'foo';
      elm.type = 'url';
      body.appendChild(elm);
      await func({
        id: 'foo',
        value: 'bar/baz'
      });
      assert.strictEqual(elm.value, 'bar/baz', 'value');
    });
  });

  describe('set html input values from storage', () => {
    const func = mjs.setValuesFromStorage;

    it('should get empty array', async () => {
      const i = browser.storage.local.get.callCount;
      browser.storage.local.get.resolves({});
      const res = await func();
      assert.strictEqual(browser.storage.local.get.callCount, i + 1, 'called');
      assert.strictEqual(res.length, 0, 'array length');
      assert.deepEqual(res, [], 'result');
    });

    it('should get empty array', async () => {
      const i = browser.storage.local.get.callCount;
      browser.storage.local.get.resolves({
        foo: {},
        bar: {}
      });
      const res = await func();
      assert.strictEqual(browser.storage.local.get.callCount, i + 1, 'called');
      assert.strictEqual(res.length, 0, 'array length');
      assert.deepEqual(res, [], 'result');
    });

    it('should get array', async () => {
      const i = browser.storage.local.get.callCount;
      browser.storage.local.get.resolves({
        foo: {
          bar: {}
        },
        baz: {
          qux: {}
        }
      });
      const res = await func();
      assert.strictEqual(browser.storage.local.get.callCount, i + 1, 'called');
      assert.strictEqual(res.length, 2, 'array length');
      assert.deepEqual(res, [undefined, undefined], 'result');
    });
  });
});
