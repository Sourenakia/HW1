// Loaded in <head>, before the stylesheet and before any rendering, so the
// saved theme is applied on the very first paint (no light→dark flash).
// Defines no globals. The key must match STORAGE_KEYS.theme in store.js.
(function () {
  "use strict";
  var theme = "light";
  try {
    var saved = JSON.parse(localStorage.getItem("taaghche-hw1:theme"));
    if (saved === "dark" || saved === "light") theme = saved;
  } catch (error) {
    // Missing, blocked or corrupt storage: keep the light theme.
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
