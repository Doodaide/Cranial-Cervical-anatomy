/* Diagram viewer.
 * Reads one diagram ("set") from data/atlas.js, chosen by ?set=<id>, and lets you switch its
 * layers on and off, pan and zoom. Layer images are only downloaded when first needed.
 *
 * URL options:  viewer.html?set=arteries&on=bones,common-carotid-artery
 *   on=  comma-separated layer ids to show (overrides the diagram's defaults)
 */
(function () {
  "use strict";

  var ATLAS = window.ATLAS;
  var INK = window.ATLAS_INK || {};
  var BOUNDS = window.ATLAS_BOUNDS || {};
  var $ = function (id) { return document.getElementById(id); };
  var stage = $("stage");
  var plate = $("plate");
  var panel = $("panel");
  var statusEl = $("stage-status");
  var zoomLabel = $("zoom-label");
  var toastEl = $("toast");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ICON = {
    back: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
    link: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/></svg>',
    save: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>'
  };

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function button(label, cls, onClick) {
    var b = h("button", cls, label);
    b.type = "button";
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }

  var toastTimer = null;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 3200);
  }

  /* ---------------------------------------------------------------- which diagram */
  var params = new URLSearchParams(location.search);
  var set = ATLAS.sets.filter(function (s) { return s.id === params.get("set"); })[0];
  if (!set) {
    renderNotFound();
    return;
  }
  document.title = set.title + " | Cranial Cervical Anatomy";

  function renderNotFound() {
    var main = $("main");
    var items = ATLAS.sets.map(function (s) {
      return '<li><a href="viewer.html?set=' + s.id + '">' + s.title + "</a></li>";
    }).join("");
    main.className = "";
    main.innerHTML = '<div class="container notfound"><h1>That diagram does not exist</h1>' +
      "<p>The link may be out of date. Choose a diagram from the list.</p><ul>" + items + "</ul></div>";
    document.title = "Diagram not found | Cranial Cervical Anatomy";
  }

  /* ---------------------------------------------------------------- layers and state */
  var layers = set.layers;
  var byId = {};
  var W = set.size[0];
  var H = set.size[1];
  var BOX = BOUNDS[set.id] || {}; // layer id -> [x0, y0, x1, y1]: where that layer's drawing is

  layers.forEach(function (l) {
    byId[l.id] = l;
    l.state = "idle";
  });
  layers.forEach(function (l) {
    if (l.labelFor && byId[l.labelFor]) byId[l.labelFor].labelLayer = l;
  });
  var mainLayers = layers.filter(function (l) { return !l.labelFor; });
  var labelLayers = layers.filter(function (l) { return l.labelFor; });

  var on = {};
  function applyDefaults() {
    layers.forEach(function (l) { on[l.id] = !!l.on; });
  }
  applyDefaults();

  var requested = params.get("on");
  if (requested !== null) {
    layers.forEach(function (l) { on[l.id] = false; });
    requested.split(",").forEach(function (id) { if (byId[id]) on[id] = true; });
  }

  function isShown(l) {
    return l.labelFor ? !!(on[l.id] && on[l.labelFor]) : !!on[l.id];
  }

  /* ---------------------------------------------------------------- plate and lazy loading */
  plate.style.width = W + "px";
  plate.style.height = H + "px";
  layers.forEach(function (l) {
    var img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.draggable = false;
    l.img = img;
    plate.appendChild(img); // DOM order = stacking order, as in the original site
  });

  function load(l) {
    if (l.promise) return l.promise;
    l.state = "loading";
    paintRow(l);
    l.promise = new Promise(function (resolve, reject) {
      l.img.onload = function () {
        l.state = "ready";
        paintRow(l);
        refreshStatus();
        resolve(l);
      };
      l.img.onerror = function () {
        l.state = "error";
        on[l.id] = false;
        paintRow(l);
        toast("Could not load “" + l.name + "”. Check that " + set.dir + "/" + l.file + " exists.");
        render();
        reject(new Error("failed: " + l.file));
      };
      l.img.src = encodeURI(set.dir + "/" + l.file);
    });
    l.promise.catch(function () { /* already reported through the toast */ });
    return l.promise;
  }

  function refreshStatus() {
    var anyReady = layers.some(function (l) { return l.state === "ready" && isShown(l); });
    var anyLoading = layers.some(function (l) { return l.state === "loading" && isShown(l); });
    var nothingShown = !layers.some(isShown);
    if (anyReady || nothingShown) {
      statusEl.hidden = !nothingShown;
      if (nothingShown) statusEl.textContent = "No layers are showing. Tick a layer to begin.";
    } else if (anyLoading) {
      statusEl.hidden = false;
      statusEl.textContent = "Loading diagram";
    }
  }

  /* ---------------------------------------------------------------- panel (the legend) */
  var rowEls = {};
  var groupEls = [];
  var labelsBtn = null;
  var countEl;
  var peekTimer = null;
  var peeked = null;

  function buildPanel() {
    var top = h("div", "panel__top");
    var back = h("a", "panel__back");
    back.href = "index.html#atlas";
    back.innerHTML = ICON.back + "<span>All diagrams</span>";
    top.appendChild(back);
    top.appendChild(h("h1", "panel__title", set.title));
    if (set.hint) top.appendChild(h("p", "panel__hint", set.hint));
    countEl = h("p", "panel__count");
    countEl.setAttribute("aria-live", "polite");
    top.appendChild(countEl);
    panel.appendChild(top);

    var rowOne = h("div", "panel__tools");
    rowOne.appendChild(button("Show all", "btn btn--small", showAll));
    rowOne.appendChild(button("Hide all", "btn btn--small", hideAll));
    rowOne.appendChild(button("Reset", "btn btn--small", resetAll));
    panel.appendChild(rowOne);

    var rowTwo = h("div", "panel__tools");
    if (labelLayers.length) {
      labelsBtn = button("Labels", "btn btn--small", toggleAllLabels);
      labelsBtn.setAttribute("aria-pressed", "false");
      labelsBtn.title = "Show or hide the written labels on every layer that has them";
      rowTwo.appendChild(labelsBtn);
    }
    var copy = button("", "btn btn--small", copyLink);
    copy.innerHTML = ICON.link + "<span>Copy link</span>";
    copy.title = "Copy a link to this diagram with the current layers";
    rowTwo.appendChild(copy);
    var save = button("", "btn btn--small", saveImage);
    save.innerHTML = ICON.save + "<span>Save image</span>";
    save.title = "Download what is showing as a PNG";
    rowTwo.appendChild(save);
    panel.appendChild(rowTwo);

    var scroll = h("div", "panel__scroll");

    if (mainLayers.length > 12) {
      var search = h("label", "search");
      search.appendChild(h("span", "visually-hidden", "Find a layer"));
      var input = h("input");
      input.type = "search";
      input.placeholder = "Find a layer";
      input.autocomplete = "off";
      input.addEventListener("input", function () { filterRows(input.value); });
      search.appendChild(input);
      scroll.appendChild(search);
    }

    set.groups.forEach(function (name) {
      var members = mainLayers.filter(function (l) { return l.group === name; });
      if (!members.length) return;
      var g = h("section", "group");
      var head = h("div", "group__head");
      head.appendChild(h("h2", "group__title", name));
      var gc = h("span", "group__count");
      head.appendChild(gc);
      head.appendChild(button("All", "link-btn", function () { members.forEach(function (l) { on[l.id] = true; }); changed(); }));
      head.appendChild(button("None", "link-btn", function () { members.forEach(function (l) { on[l.id] = false; }); changed(); }));
      g.appendChild(head);
      var ul = h("ul", "layers");
      members.forEach(function (l) { ul.appendChild(buildRow(l)); });
      g.appendChild(ul);
      scroll.appendChild(g);
      groupEls.push({ el: g, members: members, countEl: gc });
    });

    var siblings = ATLAS.sets.filter(function (s) { return s.home === set.home && s.id !== set.id; });
    if (siblings.length) {
      var homeGroup = ATLAS.homeGroups.filter(function (g) { return g.id === set.home; })[0];
      var more = h("nav", "more");
      more.setAttribute("aria-label", "Related diagrams");
      more.appendChild(h("p", "more__title", "More in " + (homeGroup ? homeGroup.title.toLowerCase() : "this section")));
      var ul2 = h("ul");
      siblings.forEach(function (s) {
        var li = h("li");
        var a = h("a", null, s.title);
        a.href = "viewer.html?set=" + s.id;
        li.appendChild(a);
        ul2.appendChild(li);
      });
      more.appendChild(ul2);
      scroll.appendChild(more);
    }
    panel.appendChild(scroll);
  }

  function buildRow(l) {
    var li = h("li", "layer");
    var main = h("label", "layer__main");
    var input = h("input", "layer__input");
    input.type = "checkbox";
    input.addEventListener("change", function () {
      on[l.id] = input.checked;
      changed();
    });
    var box = h("span", "layer__box");
    box.setAttribute("aria-hidden", "true");
    var dot = h("span", "ink-dot");
    dot.setAttribute("aria-hidden", "true");
    var colour = INK[set.id + "/" + l.id];
    if (colour) dot.style.setProperty("--ink", colour);
    else dot.classList.add("ink-dot--pencil");
    var text = h("span", "layer__text");
    text.appendChild(h("span", "layer__name", l.name));
    if (l.note) text.appendChild(h("span", "layer__note", l.note));
    main.appendChild(input);
    main.appendChild(box);
    main.appendChild(dot);
    main.appendChild(text);
    li.appendChild(main);

    var extras = h("span", "layer__extras");
    if (l.labelLayer) {
      var aa = button("Aa", "mini", function () {
        var turnOn = !on[l.labelLayer.id];
        on[l.labelLayer.id] = turnOn;
        if (turnOn) on[l.id] = true; // asking for labels means you want to see the layer
        changed();
      });
      aa.title = "Show labels for " + l.name.toLowerCase();
      aa.setAttribute("aria-label", "Labels for " + l.name);
      aa.setAttribute("aria-pressed", "false");
      extras.appendChild(aa);
      l.labelBtn = aa;
    }
    var only = button("Only", "mini layer__only", function () {
      mainLayers.forEach(function (x) { on[x.id] = x === l; });
      changed();
    });
    only.title = "Show only " + l.name.toLowerCase();
    only.setAttribute("aria-label", "Show only " + l.name);
    extras.appendChild(only);
    li.appendChild(extras);

    /* Hover (or keyboard focus) previews the layer: everything else dims */
    li.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") startPeek(l); });
    li.addEventListener("pointerleave", endPeek);
    li.addEventListener("focusin", function () { startPeek(l); });
    li.addEventListener("focusout", endPeek);

    l.row = li;
    l.input = input;
    rowEls[l.id] = li;
    return li;
  }

  function paintRow(l) {
    if (!l.row) return;
    l.row.classList.toggle("is-loading", l.state === "loading");
    l.row.classList.toggle("is-error", l.state === "error");
    l.row.setAttribute("aria-busy", l.state === "loading" ? "true" : "false");
  }

  function filterRows(query) {
    var q = query.trim().toLowerCase();
    mainLayers.forEach(function (l) {
      l.row.hidden = !!q && (l.name + " " + (l.note || "")).toLowerCase().indexOf(q) === -1;
    });
    groupEls.forEach(function (g) {
      g.el.hidden = g.members.every(function (l) { return l.row.hidden; });
    });
  }

  function startPeek(l) {
    clearTimeout(peekTimer);
    peekTimer = setTimeout(function () {
      peeked = l;
      load(l).then(function () {
        if (peeked !== l) return;
        plate.dataset.peek = l.id;
        l.img.classList.add("is-peeked");
      }).catch(function () {});
    }, 140);
  }
  function endPeek() {
    clearTimeout(peekTimer);
    if (peeked) {
      peeked.img.classList.remove("is-peeked");
      peeked = null;
    }
    delete plate.dataset.peek;
  }

  /* ---------------------------------------------------------------- bulk actions */
  function showAll() { mainLayers.forEach(function (l) { on[l.id] = true; }); changed(); }
  function hideAll() { mainLayers.forEach(function (l) { on[l.id] = false; }); changed(); }
  function resetAll() { applyDefaults(); changed(); }
  function toggleAllLabels() {
    var allOn = labelLayers.every(function (l) { return on[l.id]; });
    labelLayers.forEach(function (l) { on[l.id] = !allOn; });
    changed();
  }

  /* ---------------------------------------------------------------- render + url */
  var touched = false;
  var syncTimer = null;

  function changed() {
    touched = true;
    render();
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncUrl, 250);
  }

  function render() {
    var names = [];
    layers.forEach(function (l) {
      var shown = isShown(l);
      l.img.classList.toggle("is-shown", shown);
      if (shown) load(l);
      if (shown && !l.labelFor) names.push(l.name);
      if (l.row) {
        l.input.checked = !!on[l.id];
        l.row.classList.toggle("is-on", !!on[l.id]);
      }
      if (l.labelBtn) l.labelBtn.setAttribute("aria-pressed", on[l.labelLayer.id] ? "true" : "false");
    });
    var onCount = mainLayers.filter(function (l) { return on[l.id]; }).length;
    countEl.textContent = onCount + " of " + mainLayers.length + " layers showing";
    groupEls.forEach(function (g) {
      var n = g.members.filter(function (l) { return on[l.id]; }).length;
      g.countEl.textContent = n + "/" + g.members.length;
    });
    if (labelsBtn) {
      labelsBtn.setAttribute("aria-pressed", labelLayers.every(function (l) { return on[l.id]; }) ? "true" : "false");
    }
    stage.setAttribute("aria-label", set.title + ". " +
      (names.length === 0 ? "No layers showing." : names.length <= 6 ? "Showing: " + names.join(", ") + "." : "Showing " + names.length + " layers."));
    refreshStatus();
  }

  function syncUrl() {
    var ids = layers.filter(function (l) { return on[l.id]; }).map(function (l) { return l.id; });
    var def = layers.filter(function (l) { return l.on; }).map(function (l) { return l.id; });
    var same = ids.length === def.length && ids.every(function (id, i) { return id === def[i]; });
    var q = "?set=" + encodeURIComponent(set.id) + (same ? "" : "&on=" + (ids.length ? ids.join(",") : "none"));
    try {
      history.replaceState(null, "", location.pathname + q + location.hash);
    } catch (e) { /* some browsers block this on local files; the viewer still works */ }
  }

  function copyLink() {
    clearTimeout(syncTimer);
    syncUrl();
    var url = location.href;
    function fallback() {
      var t = document.createElement("textarea");
      t.value = url;
      t.setAttribute("readonly", "");
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(t);
      toast(ok ? "Link copied" : "Could not copy. Copy the address from the browser bar instead.");
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }, fallback);
    } else {
      fallback();
    }
  }

  function saveImage() {
    var shown = layers.filter(isShown);
    if (!shown.length) { toast("Switch on at least one layer first."); return; }
    toast("Preparing image");
    Promise.all(shown.map(load)).then(function () {
      var c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      var g = c.getContext("2d");
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, W, H);
      layers.forEach(function (l) { if (isShown(l) && l.state === "ready") g.drawImage(l.img, 0, 0); });
      try {
        c.toBlob(function (blob) {
          if (!blob) { toast("Could not create the image."); return; }
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = set.id + ".png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          toast("Image saved");
        }, "image/png");
      } catch (e) {
        toast("The browser blocks saving from a local file. Open the site from GitHub Pages or a local web server.");
      }
    }).catch(function () { toast("Some layers did not load, so the image was not saved."); });
  }

  /* ---------------------------------------------------------------- camera: pan and zoom */
  var view = { s: 1, x: 0, y: 0 };
  var sw = 0, sh = 0, fitS = 0.1, minS = 0.05, maxS = 2;
  var userMoved = false;
  var frame = { x: 0, y: 0, w: W, h: H }; // the part of the canvas the last "fit" framed

  /* Box around a list of layers' drawings, with a little breathing room */
  function regionOf(list) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    list.forEach(function (l) {
      var b = BOX[l.id];
      if (!b) return;
      x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]);
      x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]);
    });
    if (x1 <= x0 || y1 <= y0) return { x: 0, y: 0, w: W, h: H };
    var px = Math.max(40, (x1 - x0) * 0.03);
    var py = Math.max(40, (y1 - y0) * 0.03);
    x0 = Math.max(0, x0 - px);
    y0 = Math.max(0, y0 - py);
    x1 = Math.min(W, x1 + px);
    y1 = Math.min(H, y1 + py);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function measure() {
    var r = stage.getBoundingClientRect();
    sw = r.width;
    sh = r.height;
    var whole = regionOf(layers);
    var base = Math.min((sw - 32) / whole.w, (sh - 32) / whole.h);
    if (!(base > 0)) base = 0.1;
    minS = base * 0.5;
    maxS = Math.max(base * 10, 1.5);
  }
  function clamp() {
    var w = W * view.s, hh = H * view.s;
    var m = Math.min(120, sw * 0.2, sh * 0.2);
    view.x = Math.min(sw - m, Math.max(m - w, view.x));
    view.y = Math.min(sh - m, Math.max(m - hh, view.y));
  }
  function apply(animate) {
    clamp();
    plate.style.transition = animate && !reduceMotion ? "transform 0.22s cubic-bezier(0.2, 0.7, 0.2, 1)" : "none";
    plate.style.transform = "translate(" + view.x + "px," + view.y + "px) scale(" + view.s + ")";
    zoomLabel.textContent = Math.round((view.s / fitS) * 100) + "%";
  }
  /* Frame the layers that are showing (the whole drawing if none are).
   * reuseFrame keeps the previously framed region, e.g. when the window is resized. */
  function fit(animate, reuseFrame) {
    if (!reuseFrame) {
      var shown = layers.filter(isShown);
      frame = regionOf(shown.length ? shown : layers);
    }
    fitS = Math.min((sw - 32) / frame.w, (sh - 32) / frame.h, 1.5);
    if (!(fitS > 0)) fitS = 0.1;
    view.s = fitS;
    view.x = (sw - frame.w * fitS) / 2 - frame.x * fitS;
    view.y = (sh - frame.h * fitS) / 2 - frame.y * fitS;
    userMoved = false;
    apply(animate);
  }
  function zoomAt(factor, cx, cy, animate) {
    var ns = Math.min(maxS, Math.max(minS, view.s * factor));
    var k = ns / view.s;
    view.x = cx - (cx - view.x) * k;
    view.y = cy - (cy - view.y) * k;
    view.s = ns;
    userMoved = true;
    apply(animate);
  }

  $("zoom-in").addEventListener("click", function () { zoomAt(1.4, sw / 2, sh / 2, true); });
  $("zoom-out").addEventListener("click", function () { zoomAt(1 / 1.4, sw / 2, sh / 2, true); });
  $("zoom-fit").addEventListener("click", function () { fit(true); });

  var fsBtn = $("fullscreen");
  if (stage.requestFullscreen) {
    fsBtn.addEventListener("click", function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else stage.requestFullscreen().catch(function () { toast("Full screen is not available here."); });
    });
  } else {
    fsBtn.parentNode.hidden = true;
  }

  stage.addEventListener("wheel", function (e) {
    e.preventDefault();
    var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;
    var r = stage.getBoundingClientRect();
    zoomAt(Math.exp(-dy * (e.ctrlKey ? 0.012 : 0.0015)), e.clientX - r.left, e.clientY - r.top, false);
  }, { passive: false });

  var pointers = new Map();
  var last = null;
  var tap = null;
  var lastTap = null;

  function gesture() {
    var a = Array.from(pointers.values());
    if (!a.length) return null;
    if (a.length === 1) return { cx: a[0].x, cy: a[0].y, d: 0, n: 1 };
    return { cx: (a[0].x + a[1].x) / 2, cy: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), n: 2 };
  }

  stage.addEventListener("pointerdown", function (e) {
    if (e.target.closest(".stage__tools")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    tap = pointers.size === 1 ? { t: performance.now(), x: e.clientX, y: e.clientY, moved: false } : null;
    last = gesture();
    stage.classList.add("is-dragging");
  });

  stage.addEventListener("pointermove", function (e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    var g = gesture();
    var r = stage.getBoundingClientRect();
    if (last && last.n === g.n) {
      if (g.n === 2 && last.d > 0) zoomAt(g.d / last.d, g.cx - r.left, g.cy - r.top, false);
      view.x += g.cx - last.cx;
      view.y += g.cy - last.cy;
      userMoved = true;
      apply(false);
    }
    last = g;
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 6) tap.moved = true;
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    last = gesture();
    if (pointers.size > 0) return;
    stage.classList.remove("is-dragging");
    var now = performance.now();
    if (e.type === "pointerup" && tap && !tap.moved && now - tap.t < 300) {
      if (lastTap && now - lastTap.t < 350 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
        var r = stage.getBoundingClientRect();
        if (view.s < fitS * 1.8) zoomAt((fitS * 2.5) / view.s, e.clientX - r.left, e.clientY - r.top, true);
        else fit(true, true);
        lastTap = null;
      } else {
        lastTap = { t: now, x: e.clientX, y: e.clientY };
      }
    }
    tap = null;
  }
  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);

  stage.addEventListener("keydown", function (e) {
    var step = 60;
    var handled = true;
    switch (e.key) {
      case "+": case "=": zoomAt(1.25, sw / 2, sh / 2, true); break;
      case "-": case "_": zoomAt(0.8, sw / 2, sh / 2, true); break;
      case "0": fit(true); break;
      case "ArrowLeft": view.x += step; userMoved = true; apply(true); break;
      case "ArrowRight": view.x -= step; userMoved = true; apply(true); break;
      case "ArrowUp": view.y += step; userMoved = true; apply(true); break;
      case "ArrowDown": view.y -= step; userMoved = true; apply(true); break;
      default: handled = false;
    }
    if (handled) e.preventDefault();
  });

  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      var ow = sw, oh = sh;
      measure();
      if (!userMoved) {
        fit(false, true);
      } else {
        view.x += (sw - ow) / 2;
        view.y += (sh - oh) / 2;
        apply(false);
      }
    }).observe(stage);
  }

  /* ---------------------------------------------------------------- go */
  buildPanel();
  measure();
  fit(false);
  render();
})();
