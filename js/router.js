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
    if (s.length === 1 && s[0] === "login") return function () { return pages.login(route.params); };
    if (s.length === 2 && s[0] === "book") return function () { return pages.book(s[1]); };
    if (s.length === 2 && s[0] === "read") return function () { return pages.reader(s[1]); };
    return pages.notFound;
  }

  function isBooksRoute(route) {
    return Boolean(route) && route.segments.length === 1 && route.segments[0] === "books";
  }

  function focusHeading(heading) {
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }

  // Re-rendering replaces every node in <main>, which would drop keyboard focus.
  // New page (any route change, from anywhere): focus its h1 so keyboard and
  // screen-reader users start at the new content. Same page (a filter or state
  // change): refocus the same control by id, else [data-focus-fallback] / h1,
  // but only if focus was inside <main> (e.g. not while typing in the header).
  // The very first render leaves focus alone. Focus never scrolls.
  function restoreFocus(app, focusedId, focusWasInApp, samePage, firstRender) {
    if (firstRender) return;
    if (!samePage) {
      focusHeading(app.querySelector("h1"));
      return;
    }
    var target = focusedId ? document.getElementById(focusedId) : null;
    if (target && app.contains(target)) {
      target.focus({ preventScroll: true });
      return;
    }
    if (focusWasInApp) {
      focusHeading(app.querySelector("[data-focus-fallback]") || app.querySelector("h1"));
    }
  }

  var lastPageKey = null;
  var hasRendered = false;

  function render() {
    var app = document.getElementById("app");
    var active = document.activeElement;
    var focusWasInApp = Boolean(active) && active !== app && app.contains(active);
    var focusedId = focusWasInApp ? active.id : "";
    var scrollBefore = window.scrollY;

    var route = parseHash();
    var pageKey = route ? route.segments.join("/") : null;
    var samePage = pageKey !== null && pageKey === lastPageKey;
    lastPageKey = pageKey;
    var page = matchRoute(route)();
    App.components.setSearchQuery(isBooksRoute(route) ? App.catalog.parseListFilters(route.params).q : "");
    App.components.updateAccount();
    app.textContent = "";
    app.appendChild(page.node);
    document.title = page.title + " | " + App.utils.SITE_NAME;

    restoreFocus(app, focusedId, focusWasInApp, samePage, !hasRendered);
    hasRendered = true;
    // A new page starts at the top; re-rendering the same page keeps the scroll
    // (emptying <main> above briefly shrinks the page, so restore it explicitly).
    window.scrollTo(0, samePage ? scrollBefore : 0);

    // Re-rendered content isn't announced by itself (e.g. a new result count
    // after a filter change), so pages can hand a message to a live region.
    if (samePage && page.announce) App.components.announce(page.announce);
  }

  function isLibraryRoute(route) {
    return Boolean(route) && route.segments.length === 1 && route.segments[0] === "library";
  }

  App.router = {
    parseHash: parseHash,
    isBooksRoute: isBooksRoute,
    isLibraryRoute: isLibraryRoute,
    render: render
  };
})(window.App = window.App || {});
