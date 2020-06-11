/**
 * sns.js
 */

export default {
  Twitter: {
    id: "Twitter",
    menu: "&Twitter",
    url: "https://twitter.com/share?text=%text%&url=%url%",
  },
  Facebook: {
    id: "Facebook",
    menu: "&Facebook",
    url: "https://www.facebook.com/sharer/sharer.php?u=%url%",
  },
  LINE: {
    id: "LINE",
    menu: "&LINE",
    url: "http://line.me/R/msg/text/?%text%%20%url%",
  },
  Hatena: {
    id: "Hatena",
    menu: "&Hatena",
    url: "http://b.hatena.ne.jp/add?mode=confirm&amp;url=%url%&amp;title=%text%",
  },
  Mastodon: {
    id: "Mastodon",
    menu: "&Mastodon",
    url: null,
    subItem: {
      mastodonInstanceUrl: {
        url: "%origin%/intent?uri=%query%",
      },
    },
  },
};
