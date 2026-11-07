/* Shared page shell: the header (every page) and footer (pages that have #site-footer).
 * Load this as a plain script at the very top of <body>, in place of the header markup, so the
 * header exists before the first paint. Links are built from this file's own location, so the
 * same script works from the site root and from sub-folders.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var root = new URL("../../", script.src).href; // assets/js/shell.js -> site root

  var ICON = {
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    moon: '<svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/></svg>',
    sun: '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>'
  };

  var headerHtml =
    '<a class="skip-link" href="#main">Skip to content</a>' +
    '<header class="site-header"><div class="site-header__inner">' +
    '<a class="brand" href="' + root + 'index.html">Cranial Cervical Anatomy</a>' +
    '<nav class="site-nav" id="site-nav" aria-label="Main">' +
    '<a href="' + root + 'index.html#atlas">Diagrams</a>' +
    '<a href="' + root + 'index.html#resources">Resources</a>' +
    '<a href="' + root + 'index.html#about">About</a>' +
    "</nav>" +
    '<button class="icon-btn nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">' + ICON.menu + "</button>" +
    '<button class="icon-btn theme-toggle" type="button">' + ICON.moon + ICON.sun + "</button>" +
    "</div></header>";

  var mount = document.getElementById("site-header");
  if (mount) {
    mount.outerHTML = headerHtml;
  } else {
    document.body.insertAdjacentHTML("afterbegin", headerHtml);
  }

  /* ---- menu (small screens) ---- */
  var nav = document.getElementById("site-nav");
  var navToggle = document.querySelector(".nav-toggle");
  navToggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.focus();
    }
  });

  /* ---- theme ---- */
  var themeBtn = document.querySelector(".theme-toggle");
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  function effective() {
    var t = document.documentElement.getAttribute("data-theme");
    return t || (mq.matches ? "dark" : "light");
  }
  function labelTheme() {
    themeBtn.setAttribute("aria-label", effective() === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  themeBtn.addEventListener("click", function () {
    var next = effective() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("cca-theme", next);
    } catch (e) {
      /* not saved; applies for this visit only */
    }
    labelTheme();
  });
  if (mq.addEventListener) mq.addEventListener("change", labelTheme);
  labelTheme();

  /* ---- footer ---- */
  document.addEventListener("DOMContentLoaded", function () {
    var f = document.getElementById("site-footer");
    if (!f) return;
    f.outerHTML =
      '<footer class="site-footer"><div class="container site-footer__inner">' +
      "<p>Drawn by Alex He. The diagrams may contain mistakes. If you spot one, " +
      '<a href="mailto:business.alexander.he@gmail.com">email a correction</a>.</p>' +
      '<p><a href="' + root + 'index.html#atlas">Diagrams</a> &nbsp; ' +
      '<a href="' + root + 'index.html#resources">Resources</a> &nbsp; ' +
      '<a href="' + root + 'index.html#about">About</a></p>' +
      "</div></footer>";
  });
})();
