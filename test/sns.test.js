/**
 * sns.test.js
 */

import {assert} from "chai";
import {describe, it} from "mocha";
import sns from "../src/mjs/sns.js";

describe("sns", () => {
  const items = Object.entries(sns);
  for (const [key, value] of items) {
    it("should get string and object", () => {
      assert.isString(key);
      assert.isObject(value);
    });
  }
});
