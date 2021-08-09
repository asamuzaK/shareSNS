/**
 * canonical-url.test.js
 */

const { assert } = require('chai');
const { afterEach, beforeEach, describe, it } = require('mocha');
const { browser, createJsdom } = require('./mocha/setup.js');
const cjs = require('../src/js/canonical-url.js');

describe('canonical-url', () => {
  let window, document;
  const globalKeys = ['Node'];
  beforeEach(() => {
    const dom = createJsdom();
    window = dom && dom.window;
    document = window && window.document;
    global.window = window;
    global.document = document;
    for (const key of globalKeys) {
      if (window[key] && !global[key]) {
        global[key] = window[key];
      }
    }
  });
  afterEach(() => {
    window = null;
    document = null;
    delete global.window;
    delete global.document;
    for (const key of globalKeys) {
      delete global[key];
    }
  });

  it('should get browser object', () => {
    assert.isObject(browser, 'browser');
  });

  describe('get canonical URL', () => {
    const func = cjs.getCanonicalUrl;

    it('should get null', () => {
      const res = func();
      assert.isNull(res, 'result');
    });

    it('should get value', () => {
      const canonical = document.createElement('link');
      const head = document.querySelector('head');
      canonical.rel = 'canonical';
      canonical.href = 'https://example.com/';
      head.appendChild(canonical);
      const res = func();
      assert.strictEqual(res, 'https://example.com/', 'result');
    });
  });
});
