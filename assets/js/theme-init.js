/* Runs in <head> before first paint so a saved theme choice never flashes the wrong colours. */
(function () {
  try {
    var saved = localStorage.getItem("cca-theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {
    /* storage can be blocked (private windows); the system theme is used instead */
  }
})();
