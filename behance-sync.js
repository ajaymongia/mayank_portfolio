/* Keeps the work carousel in step with Mayank's Behance profile.
 *
 * The page ships with the cards it was built with. On load this asks
 * /api/behance for the current project list and then:
 *   - adds a card for any project new on Behance (title and cover),
 *   - removes Behance cards for projects no longer on Behance,
 *   - orders them as Behance does, newest first,
 *   - sets the "case studies published on Behance" stat to the feed's count.
 * Cards with hand-written text keep it. Case studies that live on this site
 * (not on Behance) are left alone. If the feed is slow or fails, nothing
 * changes. main.js waits for window.BEHANCE_SYNC (at most 2.5s) before it
 * starts the carousel, so the carousel always loops over the final cards. */
(function () {
  'use strict';

  var root = document.querySelector('.work-carousel');
  var track = root && root.querySelector('.carousel-track');
  if (!track || !window.fetch || !window.Promise) { window.BEHANCE_SYNC = null; return; }

  var galleryId = function (href) {
    var m = /\/gallery\/(\d+)/.exec(href || '');
    return m ? m[1] : null;
  };
  var cardOf = function (li) { return li.querySelector('a.project-card'); };

  function makeSlide(template, item) {
    var li = template.cloneNode(true);
    var a = cardOf(li);
    a.setAttribute('href', item.link);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');

    var cover = a.querySelector('.cover');
    if (cover) {
      cover.className = 'cover' + (item.cover ? ' cover-photo' : '');
      cover.textContent = '';
      if (item.cover) {
        var img = document.createElement('img');
        img.src = item.cover;
        img.alt = item.title;
        img.loading = 'lazy';
        img.decoding = 'async';
        cover.appendChild(img);
      }
    }

    var title = a.querySelector('.project-card-title');
    if (title) title.textContent = item.title;
    var kicker = a.querySelector('.project-kicker');
    if (kicker) kicker.textContent = 'Behance';
    // No description or tags in the feed: leave them out rather than guess.
    ['.project-card-sub', '.tags'].forEach(function (sel) {
      var el = a.querySelector(sel);
      if (el) el.parentNode.removeChild(el);
    });
    var label = a.querySelector('.link-arrow');
    if (label) label.innerHTML = 'View on Behance <span aria-hidden="true">↗</span>';
    return li;
  }

  function apply(items) {
    var slides = Array.prototype.slice.call(track.children);
    var byId = {};
    var local = [];
    var template = null;

    slides.forEach(function (li) {
      var a = cardOf(li);
      var id = a && galleryId(a.getAttribute('href'));
      if (id) {
        byId[id] = li;
        if (!template && li.querySelector('.cover-photo')) template = li;
      } else {
        local.push(li);
      }
    });
    template = template || slides[0];
    if (!template) return;

    var next = items.map(function (it) { return byId[it.id] || makeSlide(template, it); });
    next = next.concat(local);

    var frag = document.createDocumentFragment();
    next.forEach(function (li, i) {
      var n = li.querySelector('.project-index');
      if (n) n.textContent = String(i + 1).padStart(2, '0');
      frag.appendChild(li);
    });
    track.textContent = '';
    track.appendChild(frag);

    // The "case studies published on Behance" stat follows the feed too.
    Array.prototype.forEach.call(document.querySelectorAll('.stat-label'), function (label) {
      if (!/behance/i.test(label.textContent)) return;
      var value = label.parentNode.querySelector('[data-count]');
      if (!value) return;
      var n = String(items.length);
      value.setAttribute('data-count', n);
      value.textContent = n;
      // A count-up already running would finish on the old number.
      setTimeout(function () { value.textContent = n; }, 1300);
    });
  }

  window.BEHANCE_SYNC = new Promise(function (resolve) {
    var settled = false;
    var finish = function () { if (!settled) { settled = true; resolve(); } };
    var timer = setTimeout(finish, 2500);

    fetch('/api/behance', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        // Too late (the carousel has started) or nothing usable: keep the built cards.
        if (!settled && data && data.items && data.items.length) apply(data.items);
      })
      .catch(function () {})
      .then(function () { clearTimeout(timer); finish(); });
  });
})();
