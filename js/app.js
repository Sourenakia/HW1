// Entry point: wires the modules together once the DOM is ready.
(function (App) {
  "use strict";

  // Favorites only change heart buttons, so update those in place instead of
  // rebuilding the page. The library page lists favorites, so it is rebuilt.
  // The theme is a root attribute + CSS variables, so the whole app follows it.
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", App.store.state.theme);
  }

  function handleStateChange(part) {
    if (part === "theme") {
      applyTheme();
      App.components.syncThemeToggles();
    } else if (part === "favorites" && !App.router.isLibraryRoute(App.router.parseHash())) {
      App.components.syncFavoriteButtons();
    } else {
      App.router.render();
    }
  }

  function init() {
    App.store.loadState();
    // theme-init.js already set it before first paint; this keeps both in agreement.
    applyTheme();
    App.components.renderHeader();
    App.components.renderFooter();
    App.components.renderToastRegion();
    App.components.renderLiveRegion();
    App.components.renderSkipLink();
    App.store.onChange(handleStateChange);
    window.addEventListener("hashchange", App.router.render);
    App.router.render();
  }

  document.addEventListener("DOMContentLoaded", init);
})(window.App = window.App || {});
