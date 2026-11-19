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

  function isBooksRoute(route) {
    return Boolean(route) && route.segments.length === 1 && route.segments[0] === "books";
  }

  // Re-rendering replaces every node in <main>, which would drop keyboard focus.
  // On the same page (only the query changed, e.g. a filter), refocus the same
  // control by id and keep the scroll position. On a new page, move focus to
  // its heading and let render() scroll to the top.
  function restoreFocus(app, focusedId, focusWasInApp, samePage) {
    var target = samePage && focusedId ? document.getElementById(focusedId) : null;
    if (target && app.contains(target)) {
      target.focus({ preventScroll: true });
      return true;
    }
    if (focusWasInApp) {
      var heading = app.querySelector("h1");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
    }
    return false;
  }

  var lastPageKey = null;

  function render() {
    var app = document.getElementById("app");
    var active = document.activeElement;
    var focusWasInApp = Boolean(active) && active !== app && app.contains(active);
    var focusedId = focusWasInApp ? active.id : "";

    var route = parseHash();
    var pageKey = route ? route.segments.join("/") : null;
    var samePage = pageKey !== null && pageKey === lastPageKey;
    lastPageKey = pageKey;
    var page = matchRoute(route)();
    App.components.setSearchQuery(isBooksRoute(route) ? App.catalog.parseListFilters(route.params).q : "");
    app.textContent = "";
    app.appendChild(page.node);
    document.title = page.title + " | " + App.utils.SITE_NAME;

    if (!restoreFocus(app, focusedId, focusWasInApp, samePage)) {
      window.scrollTo(0, 0);
    }
  }

  App.router = {
    parseHash: parseHash,
    isBooksRoute: isBooksRoute,
    render: render
  };
})(window.App = window.App || {});
