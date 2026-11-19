// Entry point: wires the modules together once the DOM is ready.
(function (App) {
  "use strict";

  function init() {
    App.store.loadState();
    console.info("state", App.store.state); // TEMP: remove once real pages exist
    App.components.renderHeader();
    App.components.renderFooter();
    App.store.onChange(App.router.render);
    window.addEventListener("hashchange", App.router.render);
    App.router.render();
  }

  document.addEventListener("DOMContentLoaded", init);
})(window.App = window.App || {});
