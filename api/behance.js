'use strict';

/**
 * GET /api/behance — Mayank's Behance projects, newest first, as JSON.
 *
 * Runs as a Vercel serverless function in the deployed site, and is mounted
 * by server.js locally. It reads Behance's public RSS feed (the profile page
 * itself refuses scripts) and Vercel's edge caches the answer for 1 minute,
 * so Behance is asked at most once a minute however busy the site is.
 *
 *   { "items": [{ "id", "title", "link", "cover" }] }
 *
 * On any failure it answers 502 and the page keeps the cards it was built with.
 */

const USERNAME = 'mayankbharti2529';
const FEED = `https://www.behance.net/feeds/user?username=${USERNAME}`;

const cdata = (s) => (s || '').replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
const tag = (xml, name) => {
  const m = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml);
  return m ? cdata(m[1]) : '';
};
const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");

function parse(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml))) {
    const body = m[1];
    const link = tag(body, 'link');
    const id = (/\/gallery\/(\d+)/.exec(link) || [])[1];
    if (!id) continue;
    const img = /<img[^>]+src=['"]([^'"]+)['"]/.exec(tag(body, 'description'));
    items.push({
      id,
      title: decode(tag(body, 'title')),
      link,
      // The feed links a small cover; the site's cards use the 808px one.
      cover: img ? img[1].replace('/projects/404/', '/projects/max_808/') : null,
    });
  }
  return items;
}

module.exports = async function handler(req, res) {
  const send = (status, body, cache) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', cache);
    res.end(JSON.stringify(body));
  };

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(FEED, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (portfolio feed reader)', Accept: 'application/rss+xml, application/xml' },
    });
    clearTimeout(timer);
    if (!r.ok) throw new Error(`feed answered ${r.status}`);
    const items = parse(await r.text());
    if (!items.length) throw new Error('feed had no projects');
    send(200, { items }, 'public, s-maxage=60, stale-while-revalidate=30');
  } catch (err) {
    send(502, { error: String(err.message || err) }, 'no-store');
  }
};

module.exports.parse = parse;
