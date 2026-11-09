/* Theory pages: the contents list, and the table-of-contents page with its ticks and filters.
 * The pages are complete HTML without this script; it adds behaviour only.
 */
(function () {
  "use strict";

  var page = document.body.getAttribute("data-page");

  /* ---- contents (region pages) ---- */
  var toc = document.querySelector(".t-toc__d");
  if (toc) {
    var summary = toc.querySelector("summary");
    var wide = window.matchMedia("(min-width: 960px)");
    var syncToc = function () {
      toc.open = wide.matches;
      if (wide.matches) summary.setAttribute("tabindex", "-1");
      else summary.removeAttribute("tabindex");
    };
    syncToc();
    if (wide.addEventListener) wide.addEventListener("change", syncToc);
    summary.addEventListener("click", function (e) {
      if (wide.matches) e.preventDefault();
    });
    toc.addEventListener("click", function (e) {
      if (!wide.matches && e.target.closest("a")) toc.open = false;
    });

    var links = {};
    var order = [];
    toc.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var el = document.getElementById(a.hash.slice(1));
      if (el) {
        links[el.id] = a;
        order.push(el);
      }
    });
    var current = null;
    var ticking = false;
    var spy = function () {
      ticking = false;
      var line = 96;
      var pick = order[0];
      for (var i = 0; i < order.length; i++) {
        if (order[i].getBoundingClientRect().top <= line) pick = order[i];
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) pick = order[order.length - 1];
      if (pick && pick.id !== current) {
        if (current && links[current]) links[current].removeAttribute("aria-current");
        current = pick.id;
        links[current].setAttribute("aria-current", "location");
      }
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(spy);
        }
      },
      { passive: true }
    );
    spy();
  }

  /* ---- collapsible sections and search on this page ---- */
  var article = document.querySelector(".t-body");
  var folds = article ? Array.prototype.slice.call(article.querySelectorAll("details.t-fold")) : [];

  // Open the section (and the sections around it) that holds an element, so it can be seen.
  function openFor(el) {
    if (!el) return;
    var own = el.matches("details") ? el : el.querySelector(":scope > details.t-fold");
    if (own) own.open = true;
    for (var d = el.closest("details"); d; d = d.parentElement && d.parentElement.closest("details")) d.open = true;
  }
  function targetOf(hash) {
    if (!hash || hash.length < 2) return null;
    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch (e) {
      return null;
    }
  }
  if (folds.length) {
    var startTarget = targetOf(location.hash);
    if (startTarget) {
      openFor(startTarget);
      startTarget.scrollIntoView();
    }
    window.addEventListener("hashchange", function () {
      var t = targetOf(location.hash);
      if (t) {
        openFor(t);
        t.scrollIntoView();
      }
    });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a) openFor(targetOf(a.getAttribute("href")));
    });
  }

  var find = document.querySelector(".t-find");
  if (find && article) initFind(find);

  function initFind(bar) {
    bar.hidden = false;
    var input = bar.querySelector("input");
    var count = bar.querySelector(".t-find__count");
    var prev = bar.querySelector('[data-find="prev"]');
    var next = bar.querySelector('[data-find="next"]');
    var toggle = bar.querySelector("[data-fold]");
    var marks = [];
    var cur = -1;
    var timer = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* collapse / expand all */
    function labelToggle() {
      var any = folds.some(function (d) {
        return d.open;
      });
      toggle.textContent = any ? "Collapse all" : "Expand all";
    }
    toggle.addEventListener("click", function () {
      var any = folds.some(function (d) {
        return d.open;
      });
      folds.forEach(function (d) {
        d.open = !any;
      });
      labelToggle();
    });
    folds.forEach(function (d) {
      d.addEventListener("toggle", labelToggle);
    });
    labelToggle();

    /* highlighting */
    function norm(s) {
      return s.replace(/[\u2018\u2019\u02bc]/g, "'").replace(/[\u201c\u201d]/g, '"').toLowerCase();
    }
    function clear() {
      marks.forEach(function (m) {
        var p = m.parentNode;
        if (!p) return;
        p.replaceChild(document.createTextNode(m.textContent), m);
        p.normalize();
      });
      marks = [];
      cur = -1;
    }
    function textNodes() {
      var out = [];
      var w = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          if (!n.data.trim()) return NodeFilter.FILTER_REJECT;
          var p = n.parentNode;
          if (p.closest(".t-find, .t-anchor, .visually-hidden, script, style")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      while (w.nextNode()) out.push(w.currentNode);
      return out;
    }
    function mark(terms) {
      var nodes = textNodes();
      nodes.forEach(function (node) {
        var text = node.data;
        var low = norm(text);
        var hits = [];
        terms.forEach(function (t) {
          var i = low.indexOf(t);
          while (i !== -1) {
            hits.push([i, i + t.length]);
            i = low.indexOf(t, i + t.length);
          }
        });
        if (!hits.length) return;
        hits.sort(function (a, b) {
          return a[0] - b[0] || b[1] - a[1];
        });
        var frag = document.createDocumentFragment();
        var pos = 0;
        hits.forEach(function (h) {
          if (h[0] < pos) return;
          if (h[0] > pos) frag.appendChild(document.createTextNode(text.slice(pos, h[0])));
          var m = document.createElement("mark");
          m.className = "t-hit";
          m.textContent = text.slice(h[0], h[1]);
          frag.appendChild(m);
          marks.push(m);
          pos = h[1];
        });
        if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
        node.parentNode.replaceChild(frag, node);
      });
    }
    function go(i, scroll) {
      if (!marks.length) return;
      if (cur >= 0 && marks[cur]) marks[cur].classList.remove("is-current");
      cur = (i + marks.length) % marks.length;
      var m = marks[cur];
      m.classList.add("is-current");
      openFor(m);
      count.textContent = cur + 1 + " of " + marks.length;
      if (scroll) m.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    }
    function run(query, fromLink) {
      clear();
      var q = norm(query.trim());
      var has = q.length >= 2;
      prev.disabled = next.disabled = true;
      count.textContent = "";
      if (!has) return;
      mark([q]);
      var words = q.split(/\s+/).filter(function (w) {
        return w.length >= 2;
      });
      if (!marks.length && words.length > 1) mark(words); // no exact phrase: show each word
      if (!marks.length) {
        count.textContent = "No matches";
        return;
      }
      // sections that hold a match must be open, or the highlight cannot be seen
      marks.forEach(function (m) {
        openFor(m);
      });
      prev.disabled = next.disabled = false;
      var start = 0;
      var t = fromLink ? targetOf(location.hash) : null;
      if (t) {
        for (var i = 0; i < marks.length; i++) {
          if (t.contains(marks[i])) {
            start = i;
            break;
          }
        }
      }
      go(start, !t);
      if (t) t.scrollIntoView();
    }

    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        run(input.value, false);
      }, 160);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(timer);
        if (!marks.length) run(input.value, false);
        else go(cur + (e.shiftKey ? -1 : 1), true);
      } else if (e.key === "Escape") {
        input.value = "";
        run("", false);
      }
    });
    prev.addEventListener("click", function () {
      go(cur - 1, true);
    });
    next.addEventListener("click", function () {
      go(cur + 1, true);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;
      e.preventDefault();
      input.focus();
      input.select();
    });
    window.addEventListener("beforeprint", clear);

    // arriving from the site-wide search: highlight the term that was searched for
    var q0 = "";
    try {
      q0 = new URLSearchParams(location.search).get("q") || "";
    } catch (e) {
      q0 = "";
    }
    if (q0) {
      input.value = q0;
      run(q0, true);
    }
  }

  window.addEventListener("beforeprint", function () {
    document.querySelectorAll("details").forEach(function (d) {
      d.open = true;
    });
  });

  /* ---- objectives checklist ---- */
  if (page === "contents") initChecklist();

  function initChecklist() {
    var KEY = "cca-theory-ticks";
    var ticks = {};
    try {
      ticks = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch (e) {
      ticks = {};
    }
    function save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(ticks));
      } catch (e) {
        /* not saved; ticks last for this visit only */
      }
    }

    var root = document.getElementById("t-checklist");
    var toolbar = document.getElementById("t-toolbar");
    var progress = document.getElementById("t-progress");
    var chips = toolbar.querySelectorAll("[data-filter]");
    var filter = "all";
    var rows = Array.prototype.slice.call(root.querySelectorAll("li.t-item")).reverse(); // children before parents

    function box(li) {
      return li.querySelector(":scope > .t-item__row .t-item__tick");
    }
    function childItems(li) {
      return li.querySelectorAll(":scope > ul > li.t-item");
    }

    rows.forEach(function (li) {
      if (!childItems(li).length && ticks[li.getAttribute("data-id")]) box(li).checked = true;
    });

    function refresh() {
      var total = 0;
      var done = 0;
      rows.forEach(function (li) {
        var b = box(li);
        var kids = childItems(li);
        if (kids.length) {
          var on = 0;
          var part = 0;
          kids.forEach(function (c) {
            var cb = box(c);
            if (cb.checked) on++;
            else if (cb.indeterminate) part++;
          });
          b.checked = on === kids.length;
          b.indeterminate = !b.checked && (on > 0 || part > 0);
        } else {
          total++;
          if (b.checked) done++;
        }
        li.classList.toggle("is-done", b.checked);
      });
      progress.textContent = "Ticked " + done + " of " + total + " items.";

      rows.forEach(function (li) {
        var kids = childItems(li);
        var show;
        if (kids.length) {
          show = Array.prototype.some.call(kids, function (c) {
            return !c.hidden;
          });
        } else if (filter === "covered") {
          show = li.getAttribute("data-status") !== "none";
        } else if (filter === "todo") {
          show = !box(li).checked;
        } else {
          show = true;
        }
        li.hidden = !show;
      });
      root.querySelectorAll(".t-group").forEach(function (g) {
        g.hidden = !g.querySelector(".t-list--top > li:not([hidden])");
      });
      root.querySelectorAll(".t-region-sec").forEach(function (s) {
        s.hidden = !s.querySelector(".t-group:not([hidden])");
      });
    }

    root.addEventListener("change", function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains("t-item__tick")) return;
      var li = t.closest("li.t-item");
      var leaves = childItems(li).length ? li.querySelectorAll("li.t-item:not(:has(li.t-item))") : [li];
      Array.prototype.forEach.call(leaves, function (l) {
        box(l).checked = t.checked;
        if (t.checked) ticks[l.getAttribute("data-id")] = 1;
        else delete ticks[l.getAttribute("data-id")];
      });
      save();
      refresh();
    });

    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        filter = c.getAttribute("data-filter");
        chips.forEach(function (o) {
          o.setAttribute("aria-pressed", String(o === c));
        });
        refresh();
      });
    });

    toolbar.hidden = false;
    refresh();
  }
})();
