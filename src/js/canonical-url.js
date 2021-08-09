/**
 * canonical-url.js
 */
'use strict';

(() => {
  /**
   * get canonical URL
   *
   * @returns {?string} - canonical URL
   */
  const getCanonicalUrl = () => {
    const canonical = document.querySelector('link[rel=canonical][href]');
    let canonicalUrl;
    if (canonical) {
      const { origin: docOrigin } = new URL(document.URL);
      const { href: canonicalHref } =
        new URL(canonical.getAttribute('href'), docOrigin);
      canonicalUrl = canonicalHref;
    }
    return canonicalUrl || null;
  };

  /* export for tests */
  if (typeof module !== 'undefined' &&
      Object.prototype.hasOwnProperty.call(module, 'exports')) {
    module.exports = {
      getCanonicalUrl
    };
  }

  /* execute */
  return getCanonicalUrl();
})();
