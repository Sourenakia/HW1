// Book list selection: search, filters and sorting.
// Pure functions only (no DOM, no app state).
(function (App) {
  "use strict";

  var normalizeText = App.utils.normalizeText;

  function isKnownCategory(id) {
    return CATEGORIES.some(function (category) {
      return category.id === id;
    });
  }

  function compareNewestFirst(a, b) {
    // ISO dates (YYYY-MM-DD) sort correctly as strings.
    if (a.addedAt === b.addedAt) return 0;
    return a.addedAt < b.addedAt ? 1 : -1;
  }

  var getFinalPrice = App.store.getFinalPrice;

  // Price sorts use the final (discounted) price, as CLAUDE.md requires.
  var SORT_COMPARATORS = {
    "price-asc": function (a, b) { return getFinalPrice(a) - getFinalPrice(b); },
    "price-desc": function (a, b) { return getFinalPrice(b) - getFinalPrice(a); },
    "rating": function (a, b) { return b.rating - a.rating; }
  };

  // Reads list filters from the hash query (a URLSearchParams).
  // Invalid values are silently treated as "no filter" / default order.
  function parseListFilters(params) {
    var category = params.get("category") || "";
    var sort = params.get("sort") || "";
    var q = (params.get("q") || "").trim();
    return {
      // trim() keeps ZWNJ, so also drop queries that normalize to nothing.
      q: normalizeText(q) === "" ? "" : q,
      category: isKnownCategory(category) ? category : "",
      free: params.get("free") === "1",
      sort: SORT_COMPARATORS.hasOwnProperty(sort) ? sort : ""
    };
  }

  // Sort is an ordering, not a filter, so it does not count here.
  function hasActiveFilters(filters) {
    return filters.q !== "" || filters.category !== "" || filters.free;
  }

  function buildListHash(filters) {
    return App.utils.buildBooksHash({
      q: filters.q,
      category: filters.category,
      free: filters.free ? "1" : "",
      sort: filters.sort
    });
  }

  function matchesQuery(book, normalizedQuery) {
    return normalizeText(book.title).indexOf(normalizedQuery) !== -1 ||
      normalizeText(book.author).indexOf(normalizedQuery) !== -1;
  }

  // Returns a new array; the input array is never modified
  // (filter() copies, and sort() then runs on that copy).
  // All filters are combined with AND; ties fall back to newest first.
  function selectBooks(books, filters) {
    var query = normalizeText(filters.q || "");
    var comparator = SORT_COMPARATORS[filters.sort];
    var result = books.filter(function (book) {
      if (query !== "" && !matchesQuery(book, query)) return false;
      if (filters.category && book.category !== filters.category) return false;
      if (filters.free && book.price !== 0) return false;
      return true;
    });
    return result.sort(function (a, b) {
      return (comparator ? comparator(a, b) : 0) || compareNewestFirst(a, b);
    });
  }

  App.catalog = {
    parseListFilters: parseListFilters,
    hasActiveFilters: hasActiveFilters,
    buildListHash: buildListHash,
    selectBooks: selectBooks
  };
})(window.App = window.App || {});
