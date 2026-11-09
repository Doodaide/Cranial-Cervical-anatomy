/* Site-wide search. Loaded the first time the search button is used (see shell.js), together with
 * data/search-index.js. Opens a dialog; results are grouped by page, with the matching sections
 * listed under each page. Theory results open with the search term highlighted.
 */
(function () {
  "use strict";

  var ROOT = new URL("../../", document.currentScript.src).href;
  var ENTRIES = (window.SEARCH_INDEX && window.SEARCH_INDEX.e) || [];
  var KIND_LABEL = { Theory: "Theory", Diagram: "Diagram", Anki: "Anki deck", Topic: "Not written yet" };
  var KIND_WEIGHT = { Theory: 3, Diagram: 2, Anki: 1, Topic: 0 };
  var MAX_GROUPS = 8;
  var MAX_PER_GROUP = 4;

  function fold(s) {
    return s.replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').toLowerCase();
  }
  var prepared = ENTRIES.map(function (e) {
    return { e: e, t: fold(e.t), x: fold(e.x) };
  });

  /* ---- searching ---- */
  function countOf(hay, needle) {
    var n = 0;
    var i = hay.indexOf(needle);
    while (i !== -1 && n < 5) {
      n++;
      i = hay.indexOf(needle, i + needle.length);
    }
    return n;
  }
  function search(query) {
    var q = fold(query.trim());
    var tokens = q.split(/\s+/).filter(Boolean);
    if (!tokens.length || q.length < 2) return null;
    var hits = [];
    prepared.forEach(function (p) {
      var score = KIND_WEIGHT[p.e.k] || 0;
      for (var i = 0; i < tokens.length; i++) {
        var tk = tokens[i];
        var inT = p.t.indexOf(tk) !== -1;
        var inX = p.x.indexOf(tk) !== -1;
        if (!inT && !inX) return;
        if (inT) score += p.t.indexOf(tk) === 0 ? 14 : 10;
        score += countOf(p.x, tk);
      }
      if (tokens.length > 1) {
        if (p.t.indexOf(q) !== -1) score += 8;
        else if (p.x.indexOf(q) !== -1) score += 4;
      }
      hits.push({ p: p, score: score });
    });
    var groups = {};
    var order = [];
    hits.forEach(function (h) {
      var key = h.p.e.p;
      if (!groups[key]) {
        groups[key] = { page: key, kind: h.p.e.k, best: 0, items: [] };
        order.push(groups[key]);
      }
      var g = groups[key];
      g.items.push(h);
      if (h.score > g.best) g.best = h.score;
    });
    order.forEach(function (g) {
      g.items.sort(function (a, b) {
        return b.score - a.score;
      });
    });
    // pages that exist rank above topics that are only listed in the table of contents
    order.sort(function (a, b) {
      var ta = a.kind === "Topic" ? 0 : 1;
      var tb = b.kind === "Topic" ? 0 : 1;
      return tb - ta || b.best - a.best;
    });
    return { tokens: tokens, groups: order, total: hits.length };
  }

  /* ---- snippets ---- */
  function highlight(text, tokens) {
    var low = fold(text);
    var hits = [];
    tokens.forEach(function (t) {
      var i = low.indexOf(t);
      while (i !== -1) {
        hits.push([i, i + t.length]);
        i = low.indexOf(t, i + t.length);
      }
    });
    hits.sort(function (a, b) {
      return a[0] - b[0] || b[1] - a[1];
    });
    var frag = document.createDocumentFragment();
    var pos = 0;
    hits.forEach(function (h) {
      if (h[0] < pos) return;
      if (h[0] > pos) frag.appendChild(document.createTextNode(text.slice(pos, h[0])));
      var m = document.createElement("mark");
      m.textContent = text.slice(h[0], h[1]);
      frag.appendChild(m);
      pos = h[1];
    });
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    return frag;
  }
  function snippet(entry, tokens) {
    var low = fold(entry.x);
    var at = -1;
    for (var i = 0; i < tokens.length; i++) {
      var k = low.indexOf(tokens[i]);
      if (k !== -1 && (at === -1 || k < at)) at = k;
    }
    var text = entry.x;
    if (at === -1) at = 0;
    var from = Math.max(0, at - 60);
    var to = Math.min(text.length, at + 120);
    if (from > 0) {
      var sp = text.indexOf(" ", from);
      if (sp !== -1 && sp < at) from = sp + 1;
    }
    if (to < text.length) {
      var sp2 = text.lastIndexOf(" ", to);
      if (sp2 > at) to = sp2;
    }
    var span = document.createElement("span");
    span.className = "s-snip";
    if (from > 0) span.appendChild(document.createTextNode("…"));
    span.appendChild(highlight(text.slice(from, to), tokens));
    if (to < text.length) span.appendChild(document.createTextNode("…"));
    return span;
  }

  /* ---- dialog ---- */
  var overlay;
  var input;
  var list;
  var status;
  var options = [];
  var active = -1;
  var lastFocus = null;
  var query = "";

  function build(done) {
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = ROOT + "assets/css/search.css";
    var finished = false;
    function ready() {
      if (finished) return;
      finished = true;
      construct();
      done();
    }
    css.onload = css.onerror = ready;
    document.head.appendChild(css);
    setTimeout(ready, 1500); // never wait long for the stylesheet
  }

  function construct() {
    overlay = document.createElement("div");
    overlay.className = "s-overlay";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="s-dialog" role="dialog" aria-modal="true" aria-label="Search the site">' +
      '<div class="s-bar">' +
      '<svg class="s-bar__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>' +
      '<input class="s-input" type="search" role="combobox" aria-expanded="true" aria-controls="s-list" aria-autocomplete="list" ' +
      'placeholder="Search theory, diagrams and topics" autocomplete="off" spellcheck="false" aria-label="Search the site">' +
      '<button class="s-close" type="button" aria-label="Close search">Esc</button>' +
      "</div>" +
      '<div class="s-body"><div class="s-list" id="s-list" role="listbox" aria-label="Results"></div></div>' +
      '<p class="s-status" aria-live="polite"></p>' +
      '<p class="s-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> to move, <kbd>Enter</kbd> to open.</span> ' +
      '<span>On a theory page, press <kbd>/</kbd> to search only that page.</span></p>' +
      "</div>";
    document.body.appendChild(overlay);
    input = overlay.querySelector(".s-input");
    list = overlay.querySelector(".s-list");
    status = overlay.querySelector(".s-status");

    overlay.addEventListener("mousedown", function (e) {
      if (e.target === overlay) close();
    });
    overlay.querySelector(".s-close").addEventListener("click", close);
    input.addEventListener("input", function () {
      render(input.value);
    });
    overlay.addEventListener("keydown", onKey);
    list.addEventListener("mousemove", function (e) {
      var li = e.target.closest("[role=option]");
      if (li) setActive(options.indexOf(li), false);
    });
    list.addEventListener("click", function (e) {
      if (e.target.closest("a")) close(true);
    });
    render("");
  }

  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(active + 1, true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(active - 1, true);
    } else if (e.key === "Enter" && e.target === input) {
      e.preventDefault();
      var a = options[active] && options[active].querySelector("a");
      if (a) {
        close(true);
        location.href = a.href;
      }
    } else if (e.key === "Tab") {
      // keep focus inside the dialog: the field and the close button
      var items = [input, overlay.querySelector(".s-close")];
      var i = items.indexOf(document.activeElement);
      e.preventDefault();
      items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    }
  }

  function setActive(i, scroll) {
    if (!options.length) return;
    if (active >= 0 && options[active]) options[active].classList.remove("is-active");
    active = (i + options.length) % options.length;
    var el = options[active];
    el.classList.add("is-active");
    input.setAttribute("aria-activedescendant", el.id);
    if (scroll) el.scrollIntoView({ block: "nearest" });
  }

  function hrefFor(entry) {
    var u = entry.u;
    var abs = ROOT + u;
    if (entry.k === "Theory" && query) {
      var hash = "";
      var h = abs.indexOf("#");
      if (h !== -1) {
        hash = abs.slice(h);
        abs = abs.slice(0, h);
      }
      abs += (abs.indexOf("?") === -1 ? "?" : "&") + "q=" + encodeURIComponent(query.trim()) + hash;
    }
    return abs;
  }

  function render(value) {
    query = value;
    list.textContent = "";
    options = [];
    active = -1;
    input.removeAttribute("aria-activedescendant");
    var res = search(value);
    if (!res) {
      var hint = document.createElement("p");
      hint.className = "s-empty";
      hint.textContent = value.trim().length === 1 ? "Keep typing…" : "Type at least two letters. Theory notes, diagrams, Anki decks and course topics are searched.";
      list.appendChild(hint);
      status.textContent = "";
      return;
    }
    if (!res.groups.length) {
      var none = document.createElement("p");
      none.className = "s-empty";
      none.textContent = "Nothing found for “" + value.trim() + "”. Try a shorter or different word.";
      list.appendChild(none);
      status.textContent = "No results";
      return;
    }
    var n = 0;
    res.groups.slice(0, MAX_GROUPS).forEach(function (g) {
      var box = document.createElement("div");
      box.className = "s-group";
      box.setAttribute("role", "group");
      box.setAttribute("aria-label", g.page);
      var head = document.createElement("p");
      head.className = "s-group__head";
      var name = document.createElement("span");
      name.textContent = g.page;
      var tag = document.createElement("span");
      tag.className = "s-tag s-tag--" + g.kind.toLowerCase();
      tag.textContent = KIND_LABEL[g.kind] || g.kind;
      head.appendChild(name);
      head.appendChild(tag);
      box.appendChild(head);
      g.items.slice(0, MAX_PER_GROUP).forEach(function (h) {
        var e = h.p.e;
        var li = document.createElement("div");
        li.setAttribute("role", "option");
        li.className = "s-opt";
        li.id = "s-opt-" + n++;
        var a = document.createElement("a");
        a.href = hrefFor(e);
        a.tabIndex = -1;
        var title = document.createElement("span");
        title.className = "s-opt__title";
        title.appendChild(highlight(e.t, res.tokens));
        a.appendChild(title);
        a.appendChild(snippet(e, res.tokens));
        li.appendChild(a);
        box.appendChild(li);
        options.push(li);
      });
      if (g.items.length > MAX_PER_GROUP) {
        var more = document.createElement("p");
        more.className = "s-more";
        more.textContent = "and " + (g.items.length - MAX_PER_GROUP) + " more in this page. Open it and search for the term there.";
        box.appendChild(more);
      }
      list.appendChild(box);
    });
    if (res.groups.length > MAX_GROUPS) {
      var rest = document.createElement("p");
      rest.className = "s-more s-more--end";
      rest.textContent = res.groups.length - MAX_GROUPS + " more pages match. Add a word to narrow the search.";
      list.appendChild(rest);
    }
    status.textContent = res.total + (res.total === 1 ? " result" : " results") + " in " + res.groups.length + (res.groups.length === 1 ? " page" : " pages");
    setActive(0, false);
  }

  function open() {
    if (!overlay) {
      build(open);
      return;
    }
    if (!overlay.hidden) return;
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.documentElement.classList.add("s-lock");
    input.focus();
    input.select();
  }
  function close(keepFocus) {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.documentElement.classList.remove("s-lock");
    if (keepFocus !== true && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  window.CCASearch = { open: open, close: close };
})();
