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
