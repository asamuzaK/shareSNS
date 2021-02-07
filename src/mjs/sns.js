/**
 * sns.js
 */

export default {
  Twitter: {
    id: 'Twitter',
    matchPattern: 'https://twitter.com/*',
    menu: '&Twitter',
    url: 'https://twitter.com/share?text=%text%&url=%url%'
  },
  Facebook: {
    id: 'Facebook',
    menu: '&Facebook',
    url: 'https://www.facebook.com/sharer/sharer.php?u=%url%'
  },
  LINE: {
    id: 'LINE',
    menu: '&LINE',
    url: 'https://social-plugins.line.me/lineit/share?url=%url%'
  },
  Hatena: {
    id: 'Hatena',
    menu: '&Hatena',
    url: 'http://b.hatena.ne.jp/add?mode=confirm&url=%url%&title=%text%'
  },
  Mastodon: {
    id: 'Mastodon',
    menu: '&Mastodon',
    url: null,
    subItem: {
      mastodonInstanceUrl: {
        url: '%origin%/share?text=%text%&url=%url%'
      }
    }
  },
  Pleroma: {
    id: 'Pleroma',
    menu: '&Pleroma',
    url: null,
    subItem: {
      pleromaInstanceUrl: {
        url: '%origin%/share?message=%text%%20%url%'
      }
    }
  }
};
