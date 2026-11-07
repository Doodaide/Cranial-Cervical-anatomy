/* Home page: the hero (layers building up on one diagram), the diagram index, and the count.
 * Everything here is read from data/atlas.js, so adding a diagram to the manifest adds its tile.
 */
(function () {
  "use strict";

  var ATLAS = window.ATLAS;
  if (!ATLAS) return;
  var INK = window.ATLAS_INK || {};
  var HERO = window.ATLAS_HERO;

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      n.appendChild(c);
    });
    return n;
  }

  /* ---- count line ---- */
  var nLayers = ATLAS.sets.reduce(function (n, s) {
    return n + s.layers.length;
  }, 0);
  document.getElementById("count").textContent = ATLAS.sets.length + " diagrams, " + nLayers + " layers";

  /* ---- diagram index ---- */
  var host = document.getElementById("atlas-groups");
  ATLAS.homeGroups.forEach(function (g) {
    var sets = ATLAS.sets.filter(function (s) {
      return s.home === g.id;
    });
    if (!sets.length) return;

    var list = el("ul", { class: "tiles" });
    sets.forEach(function (s) {
      var main = s.layers.filter(function (l) {
        return !l.labelFor;
      }).length;
      var labelled = s.layers.some(function (l) {
        return l.labelFor;
      });
      var meta = main + (main === 1 ? " layer" : " layers") + (labelled ? " · with labels" : "");

      var img = el("img", {
        src: "assets/thumbs/" + s.id + ".webp",
        width: "720",
        height: "540",
        alt: "",
        loading: "lazy",
        decoding: "async"
      });
      var a = el("a", { class: "tile", href: "viewer.html?set=" + encodeURIComponent(s.id) }, [
        el("span", { class: "tile__plate" }, [img]),
        el("span", { class: "tile__title", text: s.title }),
        el("span", { class: "tile__meta", text: meta })
      ]);
      list.appendChild(el("li", {}, [a]));
    });

    host.appendChild(
      el("div", { class: "atlas-group" }, [
        el("div", { class: "atlas-group__head" }, [
          el("h3", { text: g.title }),
          el("p", { text: sets.length + (sets.length === 1 ? " diagram" : " diagrams") })
        ]),
        list
      ])
    );
  });

  /* ---- hero ---- */
  var hero = ATLAS.hero;
  var heroSet = hero && ATLAS.sets.filter(function (s) { return s.id === hero.set; })[0];
  var plate = document.getElementById("hero-plate");
  if (!hero || !heroSet || !HERO || !plate) {
    var fig = document.querySelector(".hero__figure");
    if (fig) fig.hidden = true;
    return;
  }

  var chips = document.getElementById("hero-chips");
  var openLink = document.getElementById("hero-open");
  var replay = document.getElementById("hero-replay");
  document.getElementById("hero-caption").textContent = heroSet.title;
  plate.style.setProperty("--ar", HERO.aspect[0] + " / " + HERO.aspect[1]);

  var order = heroSet.layers.map(function (l) { return l.id; });
  var steps = hero.steps;
  var on = {};
  var imgs = {};
  var chipEls = {};

  // images are stacked in the diagram's own order, whatever order the steps are listed in
  steps
    .slice()
    .sort(function (a, b) { return order.indexOf(a.layer) - order.indexOf(b.layer); })
    .forEach(function (st) {
      var img = el("img", { src: HERO.layers[st.layer], alt: "", decoding: "async" });
      imgs[st.layer] = img;
      plate.appendChild(img);
    });

  steps.forEach(function (st) {
    var dot = el("span", { class: "ink-dot" });
    var ink = INK[hero.set + "/" + st.layer];
    if (ink) dot.style.setProperty("--ink", ink);
    else dot.className += " ink-dot--pencil";
    var chip = el("button", { class: "chip", type: "button", "aria-pressed": "false" }, [dot, document.createTextNode(st.label)]);
    chip.addEventListener("click", function () {
      stop();
      on[st.layer] = !on[st.layer];
      render();
    });
    chipEls[st.layer] = chip;
    chips.appendChild(chip);
  });

  function render() {
    var ids = [];
    order.forEach(function (id) {
      if (!imgs[id]) return;
      var isOn = !!on[id];
      imgs[id].classList.toggle("is-on", isOn);
      chipEls[id].setAttribute("aria-pressed", String(isOn));
      if (isOn) ids.push(id);
    });
    openLink.href = "viewer.html?set=" + encodeURIComponent(hero.set) + "&on=" + (ids.length ? ids.join(",") : "none");
  }

  /* ---- build-up ---- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var timer = null;
  var playing = false;

  function stop() {
    playing = false;
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function showAll() {
    steps.forEach(function (st) { on[st.layer] = true; });
    render();
  }

  function play() {
    stop();
    playing = true;
    replay.hidden = true;
    on = {};
    on[steps[0].layer] = true;
    render();
    var i = 0;
    (function next() {
      timer = setTimeout(function () {
        if (!playing) return;
        i += 1;
        on[steps[i].layer] = true;
        render();
        if (i < steps.length - 1) next();
        else {
          playing = false;
          replay.hidden = false;
        }
      }, i === 0 ? 1200 : 1400);
    })();
  }

  replay.addEventListener("click", play);

  if (reduceMotion) {
    showAll();
  } else {
    // start once the pictures are in, so the first step is not a blank plate
    var pending = Object.keys(imgs).length;
    var started = false;
    var go = function () {
      if (started) return;
      started = true;
      play();
    };
    Object.keys(imgs).forEach(function (id) {
      var img = imgs[id];
      var done = function () {
        pending -= 1;
        if (pending <= 0) go();
      };
      if (img.complete) done();
      else {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }
    });
    setTimeout(go, 4000);
    // until then, show the first layer so the plate is not empty
    on[steps[0].layer] = true;
    render();
  }
})();
