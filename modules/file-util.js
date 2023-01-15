/**
 * file-util.js
 */

import { getType, isString } from './common.js';
import { promises as fsPromise } from 'node:fs';
import path from 'node:path';

/* constants */
const CHAR = 'utf8';
const PERM_FILE = 0o644;

/**
 * create a file
 *
 * @param {string} file - file path to create
 * @param {string} value - value to write
 * @returns {string} - file path
 */
export const createFile = async (file, value) => {
  if (!isString(file)) {
    throw new TypeError(`Expected String but got ${getType(file)}.`);
  }
  if (!isString(value)) {
    throw new TypeError(`Expected String but got ${getType(value)}.`);
  }
  const filePath = path.resolve(file);
  await fsPromise.writeFile(filePath, value, {
    encoding: CHAR, flag: 'w', mode: PERM_FILE
  });
  return filePath;
};

/**
 * fetch text
 *
 * @param {string} url - URL
 * @returns {string} - content text
 */
export const fetchText = async url => {
  if (!isString(url)) {
    throw new TypeError(`Expected String but got ${getType(url)}.`);
  }
  const res = await fetch(url);
  const { ok, status } = res;
  if (!ok) {
    const msg = `Network response was not ok. status: ${status} url: ${url}`;
    throw new Error(msg);
  }
  return res.text();
};
