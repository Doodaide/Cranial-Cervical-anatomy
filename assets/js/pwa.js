/* Offline support: registers the service worker (sw.js) and provides the "Offline use" panel.
 * Loaded by shell.js on every page. Nothing here is needed to read the site; without it pages still work online.
 * Works only on https (or localhost); a copy opened from disk (file://) skips all of it.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var root = new URL("../../", script.src).href;
  var CORE = "cca-core";
  var IMG = "cca-img";
  var supported = "serviceWorker" in navigator && "caches" in window && /^https?:$/.test(location.protocol);

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function mb(bytes) {
    return bytes >= 1048576 * 10 ? Math.round(bytes / 1048576) + " MB" : (bytes / 1048576).toFixed(1) + " MB";
  }
  function keyFor(rel, hash) {
    return root + encodeURI(rel) + "?h=" + hash;
  }

  /* ---- head tags, so every page can be installed ---- */
  function ensureHead() {
    function add(tag, attrs, match) {
      if (document.head.querySelector(match)) return;
      var n = document.createElement(tag);
      Object.keys(attrs).forEach(function (k) {
        n.setAttribute(k, attrs[k]);
      });
      document.head.appendChild(n);
    }
    add("link", { rel: "manifest", href: root + "manifest.webmanifest" }, 'link[rel="manifest"]');
    add("meta", { name: "theme-color", content: "#094260" }, 'meta[name="theme-color"]');
    add("link", { rel: "apple-touch-icon", href: root + "assets/icons/apple-touch-icon.png" }, 'link[rel="apple-touch-icon"]');
    add("meta", { name: "mobile-web-app-capable", content: "yes" }, 'meta[name="mobile-web-app-capable"]');
    add("meta", { name: "apple-mobile-web-app-capable", content: "yes" }, 'meta[name="apple-mobile-web-app-capable"]');
    add("meta", { name: "apple-mobile-web-app-title", content: "CC Anatomy" }, 'meta[name="apple-mobile-web-app-title"]');
  }

  if (!supported) {
    window.CCAOffline = { supported: false };
    return;
  }
  ensureHead();

  /* ---- registration and update notice ---- */
  var hadController = !!navigator.serviceWorker.controller;
  var toast = null;
  function showUpdated() {
    if (toast) return;
    toast = el("div", "pwa-toast");
    toast.setAttribute("role", "status");
    toast.appendChild(el("span", null, "The site was updated."));
    var b = el("button", "pwa-toast__btn", "Reload");
    b.type = "button";
    b.addEventListener("click", function () {
      location.reload();
    });
    var x = el("button", "pwa-toast__x", "Dismiss");
    x.type = "button";
    x.addEventListener("click", function () {
      toast.remove();
    });
    toast.appendChild(b);
    toast.appendChild(x);
    ensureCss();
    document.body.appendChild(toast);
  }
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (hadController) showUpdated();
    hadController = true;
  });
  window.addEventListener("load", function () {
    navigator.serviceWorker.register(root + "sw.js", { scope: root }).catch(function () {
      /* registration refused (private mode, blocked storage): the site still works online */
    });
  });

  /* ---- install prompt ---- */
  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    refresh();
  });
  window.addEventListener("appinstalled", function () {
    deferred = null;
    refresh();
  });

  var cssLoaded = false;
  function ensureCss() {
    if (cssLoaded) return;
    cssLoaded = true;
    var l = el("link");
    l.rel = "stylesheet";
    l.href = root + "assets/css/pwa.css";
    document.head.appendChild(l);
  }

  /* ---- the panel ---- */
  var ui = null;
  var running = null; // the diagram download in progress
  var files = null;

  function loadFiles(done) {
    if (files) return done(files);
    if (self.PWA) {
      files = self.PWA;
      return done(files);
    }
    var s = el("script");
    s.src = root + "pwa-files.js?" + Date.now();
    s.onload = function () {
      files = self.PWA;
      done(files);
    };
    s.onerror = function () {
      done(null);
    };
    document.head.appendChild(s);
  }

  function build() {
    ensureCss();
    var overlay = el("div", "p-overlay");
    overlay.hidden = true;
    var dlg = el("div", "p-dialog");
    dlg.setAttribute("role", "dialog");
    dlg.setAttribute("aria-modal", "true");
    dlg.setAttribute("aria-labelledby", "p-title");
    dlg.tabIndex = -1;

    var head = el("div", "p-head");
    var title = el("h2", "p-title", "Use offline");
    title.id = "p-title";
    var close = el("button", "p-close", "Close");
    close.type = "button";
    head.appendChild(title);
    head.appendChild(close);

    var body = el("div", "p-body");
    var sec1 = el("section", "p-sec");
    sec1.appendChild(el("h3", null, "Notes and search"));
    var status = el("p", "p-status");
    status.setAttribute("aria-live", "polite");
    sec1.appendChild(status);

    var secI = el("section", "p-sec");
    secI.appendChild(el("h3", null, "Install"));
    var installText = el("p", "p-note");
    var installBtn = el("button", "p-btn p-btn--primary", "Install app");
    installBtn.type = "button";
    secI.appendChild(installText);
    secI.appendChild(installBtn);

    var sec2 = el("section", "p-sec");
    sec2.appendChild(el("h3", null, "Diagrams"));
    var dText = el("p", "p-status");
    dText.setAttribute("aria-live", "polite");
    var bar = el("div", "p-bar");
    bar.hidden = true;
    var fill = el("div", "p-bar__fill");
    bar.appendChild(fill);
    var row = el("div", "p-row");
    var dBtn = el("button", "p-btn p-btn--primary", "Download all diagrams");
    dBtn.type = "button";
    var stop = el("button", "p-btn", "Stop");
    stop.type = "button";
    stop.hidden = true;
    row.appendChild(dBtn);
    row.appendChild(stop);
    var dNote = el("p", "p-note");
    sec2.appendChild(dText);
    sec2.appendChild(bar);
    sec2.appendChild(row);
    sec2.appendChild(dNote);

    var sec3 = el("section", "p-sec");
    sec3.appendChild(el("h3", null, "Saved data"));
    var storage = el("p", "p-note");
    var wipe = el("button", "p-btn", "Remove saved offline copy");
    wipe.type = "button";
    sec3.appendChild(storage);
    sec3.appendChild(wipe);
    sec3.appendChild(el("p", "p-note", "Your ticks and theme are stored separately and are not removed."));

    body.appendChild(sec1);
    body.appendChild(secI);
    body.appendChild(sec2);
    body.appendChild(sec3);
    dlg.appendChild(head);
    dlg.appendChild(body);
    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    ui = { overlay: overlay, dlg: dlg, status: status, installText: installText, installBtn: installBtn, dText: dText, bar: bar, fill: fill, dBtn: dBtn, stop: stop, dNote: dNote, storage: storage, wipe: wipe, close: close, secI: secI, last: null };

    close.addEventListener("click", closePanel);
    overlay.addEventListener("mousedown", function (e) {
      if (e.target === overlay) closePanel();
    });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePanel();
      } else if (e.key === "Tab") {
        var f = dlg.querySelectorAll("button:not([hidden]):not([disabled])");
        if (!f.length) return;
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    installBtn.addEventListener("click", function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () {
        deferred = null;
        refresh();
      });
    });
    dBtn.addEventListener("click", startDownload);
    stop.addEventListener("click", function () {
      if (running) running.cancel = true;
    });
    wipe.addEventListener("click", function () {
      if (!window.confirm("Remove the offline copy from this device? The site will still work while you are online.")) return;
      navigator.serviceWorker
        .getRegistrations()
        .then(function (regs) {
          return Promise.all(regs.map(function (r) {
            return r.unregister();
          }));
        })
        .then(function () {
          return Promise.all([caches.delete(CORE), caches.delete(IMG)]);
        })
        .then(function () {
          hadController = false;
          refresh();
        });
    });
  }

  function countCached(cacheName, keys) {
    return caches.has(cacheName).then(function (has) {
      return has ? count(cacheName, keys) : 0;
    });
  }
  function count(cacheName, keys) {
    return caches.open(cacheName).then(function (c) {
      return Promise.all(
        keys.map(function (k) {
          return c.match(k).then(function (r) {
            return r ? 1 : 0;
          });
        })
      ).then(function (a) {
        return a.reduce(function (s, v) {
          return s + v;
        }, 0);
      });
    });
  }

  function refresh() {
    if (!ui) return;
    var online = navigator.onLine !== false;
    var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    ui.secI.hidden = false;
    if (standalone) {
      ui.installText.textContent = "This is running as an installed app.";
      ui.installBtn.hidden = true;
    } else if (deferred) {
      ui.installText.textContent = "Add the site to your home screen or desktop so it opens like an app.";
      ui.installBtn.hidden = false;
    } else if (ios) {
      ui.installText.textContent = "In Safari, tap the Share button, then Add to Home Screen.";
      ui.installBtn.hidden = true;
    } else {
      ui.installText.textContent = "Use the browser menu and choose Install app or Add to Home Screen. Some browsers only offer this after a few visits.";
      ui.installBtn.hidden = true;
    }

    loadFiles(function (P) {
      navigator.serviceWorker.getRegistration(root).then(function (reg) {
        var active = reg && reg.active;
        if (!P) {
          ui.status.textContent = online ? "Could not read the file list." : "You are offline. The saved copy is in use.";
        } else if (!active) {
          ui.status.textContent = "Setting up the offline copy. Keep this page open for a moment, then reopen this panel.";
        } else {
          var coreKeys = Object.keys(P.core).map(function (r) {
            return keyFor(r, P.core[r]);
          });
          countCached(CORE, coreKeys).then(function (n) {
            ui.status.textContent =
              n === coreKeys.length
                ? "Saved on this device: all pages, theory notes and search (" + mb(P.coreBytes) + "). They work without a connection."
                : "Saving pages: " + n + " of " + coreKeys.length + ". Stay online until this finishes.";
          });
        }
        if (P) {
          var packKeys = P.pack.map(function (r) {
            return keyFor(r, P.img[r]);
          });
          countCached(IMG, packKeys).then(function (n) {
            var done = n === packKeys.length;
            if (!running) {
              ui.dText.textContent = done
                ? "All " + packKeys.length + " diagram layers are saved on this device."
                : n + " of " + packKeys.length + " diagram layers are saved (" + mb(P.packBytes) + " in total). Diagrams you open are saved automatically.";
              ui.dBtn.hidden = done;
              ui.dBtn.disabled = !online || !active;
              ui.dBtn.textContent = n ? "Download the remaining diagrams" : "Download all diagrams (" + mb(P.packBytes) + ")";
              ui.dNote.textContent = done ? "" : online ? "Use wifi if you are on mobile data. You can stop at any time and resume later." : "Reconnect to download.";
            }
          });
        }
        if (navigator.storage && navigator.storage.estimate) {
          navigator.storage.estimate().then(function (s) {
            ui.storage.textContent = "This site is using " + mb(s.usage || 0) + " on this device.";
          });
        } else {
          ui.storage.textContent = "";
        }
        ui.wipe.hidden = !reg;
      });
    });
  }

  function startDownload() {
    if (running || !files) return;
    var P = files;
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
    var queue = P.pack.slice();
    var total = queue.length;
    var done = 0;
    var failed = 0;
    running = { cancel: false };
    ui.bar.hidden = false;
    ui.stop.hidden = false;
    ui.dBtn.hidden = true;
    ui.dNote.textContent = "";
    function paint() {
      ui.fill.style.width = Math.round((100 * done) / total) + "%";
      ui.dText.textContent = "Saving diagrams: " + done + " of " + total + (failed ? " (" + failed + " failed)" : "");
    }
    paint();
    caches.open(IMG).then(function (cache) {
      function next() {
        if (running.cancel) return Promise.resolve();
        var rel = queue.shift();
        if (!rel) return Promise.resolve();
        var key = keyFor(rel, P.img[rel]);
        return cache
          .match(key)
          .then(function (hit) {
            if (hit) return null;
            return fetch(root + encodeURI(rel), { cache: "reload" }).then(function (res) {
              if (!res.ok) throw new Error(String(res.status));
              return cache.put(key, res);
            });
          })
          .then(
            function () {
              done++;
            },
            function () {
              failed++;
            }
          )
          .then(function () {
            paint();
            return next();
          });
      }
      Promise.all([next(), next(), next(), next()]).then(function () {
        var cancelled = running.cancel;
        running = null;
        ui.bar.hidden = true;
        ui.stop.hidden = true;
        refresh();
        if (cancelled) ui.dNote.textContent = "Stopped. Saved diagrams are kept.";
        else if (failed) ui.dNote.textContent = failed + " could not be saved. Check your connection and download again.";
      });
    });
  }

  function openPanel() {
    if (!ui) build();
    ui.last = document.activeElement;
    ui.overlay.hidden = false;
    document.documentElement.classList.add("p-lock");
    refresh();
    ui.dlg.focus();
  }
  function closePanel() {
    if (!ui) return;
    ui.overlay.hidden = true;
    document.documentElement.classList.remove("p-lock");
    if (ui.last && ui.last.focus) ui.last.focus();
  }
  window.addEventListener("online", refresh);
  window.addEventListener("offline", refresh);

  /* "Offline use" links (the footer has one) stay hidden until this script is ready */
  function showLinks() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-offline]"), function (n) {
      n.hidden = false;
    });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-offline]") : null;
    if (t) {
      e.preventDefault();
      openPanel();
    }
  });
  document.addEventListener("DOMContentLoaded", showLinks);
  if (document.readyState !== "loading") showLinks();

  window.CCAOffline = { supported: true, open: openPanel, close: closePanel };
})();
