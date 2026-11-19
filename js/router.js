// Hash router: reads location.hash and renders the matching page into <main id="app">.
(function (App) {
  "use strict";

  var pages = App.pages;

  // Returns { segments, params }, or null when the hash cannot be decoded.
  function parseHash() {
    var hash = location.hash.replace(/^#\/?/, "");
    var queryStart = hash.indexOf("?");
    var path = queryStart === -1 ? hash : hash.slice(0, queryStart);
    var query = queryStart === -1 ? "" : hash.slice(queryStart + 1);
    try {
      var segments = path.split("/").filter(Boolean).map(decodeURIComponent);
      return { segments: segments, params: new URLSearchParams(query) };
    } catch (error) {
      return null;
    }
  }

  function matchRoute(route) {
    if (!route) return pages.notFound;
    var s = route.segments;
    if (s.length === 0) return pages.home;
    if (s.length === 1 && s[0] === "books") return function () { return pages.books(route.params); };
    if (s.length === 1 && s[0] === "library") return pages.library;
    if (s.length === 1 && s[0] === "login") return pages.login;
    if (s.length === 2 && s[0] === "book") return function () { return pages.book(s[1]); };
    if (s.length === 2 && s[0] === "read") return function () { return pages.reader(s[1]); };
    return pages.notFound;
  }

  function render() {
    var app = document.getElementById("app");
    var page = matchRoute(parseHash())();
    app.textContent = "";
    app.appendChild(page.node);
    document.title = page.title + " | " + App.utils.SITE_NAME;
    window.scrollTo(0, 0);
  }

  App.router = {
    parseHash: parseHash,
    render: render
  };
})(window.App = window.App || {});
