/* Legacy lab doodles gallery. Reads data/legacy.js.
 * The page address keeps the position (legacy_lab.html#12), so one image can be linked to.
 */
(function () {
  "use strict";

  var DATA = window.LEGACY_LAB;
  if (!DATA) return;
  var images = DATA.images;
  var total = images.length;

  var img = document.getElementById("g-img");
  var stage = document.getElementById("gstage");
  var count = document.getElementById("g-count");
  var caption = document.getElementById("g-caption");
  var full = document.getElementById("g-full");
  var list = document.getElementById("g-list");
  var current = -1;

  function src(i) {
    return DATA.dir + "/" + images[i].file;
  }

  /* ---- index ---- */
  var buttons = images.map(function (it, i) {
    var b = document.createElement("button");
    b.type = "button";
    var n = document.createElement("span");
    n.className = "gindex__n";
    n.textContent = String(i + 1);
    var t = document.createElement("span");
    t.textContent = it.caption;
    b.appendChild(n);
    b.appendChild(t);
    b.addEventListener("click", function () {
      show(i, true);
    });
    var li = document.createElement("li");
    li.appendChild(b);
    list.appendChild(li);
    return b;
  });

  // Scroll the index (only the index, never the page) so the current row stays visible.
  // On narrow screens the index is part of the page, and the picture stays put above it.
  function keepInView(b) {
    var box = list.parentNode;
    if (box.scrollHeight <= box.clientHeight + 1) return;
    var r = b.getBoundingClientRect();
    var c = box.getBoundingClientRect();
    if (r.top < c.top) box.scrollTop -= c.top - r.top + 8;
    else if (r.bottom > c.bottom) box.scrollTop += r.bottom - c.bottom + 8;
  }

  /* ---- show one image ---- */
  function show(i, fromUser) {
    i = ((i % total) + total) % total;
    if (i === current) return;
    var previous = current;
    current = i;

    img.classList.add("is-loading");
    img.onload = img.onerror = function () {
      img.classList.remove("is-loading");
    };
    img.src = src(i);
    img.alt = images[i].caption;
    count.textContent = "Image " + (i + 1) + " of " + total;
    caption.textContent = images[i].caption;
    full.href = src(i);

    if (previous >= 0) buttons[previous].removeAttribute("aria-current");
    buttons[i].setAttribute("aria-current", "true");
    if (fromUser !== "init") keepInView(buttons[i]);

    // warm the neighbours so Next and Previous are instant
    [i - 1, i + 1].forEach(function (j) {
      var k = ((j % total) + total) % total;
      new Image().src = src(k);
    });

    try {
      history.replaceState(null, "", "#" + (i + 1));
    } catch (e) {
      /* file:// in some browsers; the address just does not update */
    }
  }

  function fromHash() {
    var n = parseInt(location.hash.slice(1), 10);
    return n >= 1 && n <= total ? n - 1 : 0;
  }

  /* ---- controls ---- */
  document.getElementById("g-prev").addEventListener("click", function () {
    show(current - 1, true);
  });
  document.getElementById("g-next").addEventListener("click", function () {
    show(current + 1, true);
  });
  window.addEventListener("hashchange", function () {
    show(fromHash(), true);
  });
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowLeft") show(current - 1, true);
    else if (e.key === "ArrowRight") show(current + 1, true);
    else if (e.key === "Home") show(0, true);
    else if (e.key === "End") show(total - 1, true);
    else return;
    e.preventDefault();
  });

  // swipe on the picture (vertical movement is left to the page)
  var startX = null;
  var startY = null;
  stage.addEventListener(
    "touchstart",
    function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true }
  );
  stage.addEventListener(
    "touchend",
    function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1), true);
    },
    { passive: true }
  );

  show(fromHash(), "init");
  keepInView(buttons[current]);
})();
