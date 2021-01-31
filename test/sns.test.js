/**
 * sns.test.js
 */

import { assert } from 'chai';
import { describe, it } from 'mocha';
import sns from '../src/mjs/sns.js';

describe('sns', () => {
  const itemKeys = [
    'Twitter', 'Facebook', 'LINE', 'Hatena', 'Mastodon', 'Pleroma'
  ];
  const items = Object.entries(sns);

  it('should get equal length', () => {
    assert.isTrue(items.length === itemKeys.length, 'length');
  });

  it('should get string and object', () => {
    for (const [key, value] of items) {
      assert.isTrue(itemKeys.includes(key), 'item');
      assert.isString(key, 'key');
      assert.isObject(value, 'value');
    }
  });
});
