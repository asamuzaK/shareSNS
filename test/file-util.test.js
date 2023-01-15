/* api */
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici';
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/* test */
import {
  createFile, fetchText
} from '../modules/file-util.js';

/* constants */
const TMPDIR = process.env.TMP || process.env.TMPDIR || process.env.TEMP ||
               os.tmpdir();

describe('createFile', () => {
  const dirPath = path.join(TMPDIR, 'sidebartabs');
  beforeEach(() => {
    fs.rmSync(dirPath, { force: true, recursive: true });
  });
  afterEach(() => {
    fs.rmSync(dirPath, { force: true, recursive: true });
  });

  it('should get string', async () => {
    fs.mkdirSync(dirPath);
    const filePath = path.join(dirPath, 'test.txt');
    const value = 'test file.\n';
    const file = await createFile(filePath, value);
    assert.strictEqual(file, filePath);
  });

  it('should throw if first argument is not a string', () => {
    createFile().catch(e => {
      assert.strictEqual(e.message, 'Expected String but got Undefined.');
    });
  });

  it('should throw if second argument is not a string', () => {
    const file = path.join(dirPath, 'test.txt');
    createFile(file).catch(e => {
      assert.strictEqual(e.message, 'Expected String but got Undefined.');
    });
  });
});

describe('fetch text', () => {
  const globalDispatcher = getGlobalDispatcher();
  const mockAgent = new MockAgent();
  beforeEach(() => {
    setGlobalDispatcher(mockAgent);
    mockAgent.disableNetConnect();
  });
  afterEach(() => {
    mockAgent.enableNetConnect();
    setGlobalDispatcher(globalDispatcher);
  });

  it('should throw', async () => {
    await fetchText().catch(e => {
      assert.instanceOf(e, TypeError, 'error');
      assert.strictEqual(e.message, 'Expected String but got Undefined.');
    });
  });

  it('should throw', async () => {
    const base = 'https://example.com';
    mockAgent.get(base).intercept({ path: '/', method: 'GET' }).reply(404);
    await fetchText(base).catch(e => {
      assert.instanceOf(e, Error, 'error');
      assert.strictEqual(e.message,
        `Network response was not ok. status: 404 url: ${base}`);
    });
  });

  it('should get result', async () => {
    const base = 'https://example.com';
    mockAgent.get(base).intercept({ path: '/', method: 'GET' })
      .reply(200, 'foo');
    const res = await fetchText('https://example.com');
    assert.strictEqual(res, 'foo', 'result');
  });
});
