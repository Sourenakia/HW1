// Book list selection: pure functions only (no DOM, no app state).
// Sorting for the list page will be added here.
(function (App) {
  "use strict";

  var normalizeText = App.utils.normalizeText;

  function isKnownCategory(id) {
    return CATEGORIES.some(function (category) {
      return category.id === id;
    });
  }

  // Reads list filters from the hash query (a URLSearchParams).
  // Invalid values are silently treated as "no filter".
  function parseListFilters(params) {
    var category = params.get("category") || "";
    return {
      q: (params.get("q") || "").trim(),
      category: isKnownCategory(category) ? category : "",
      free: params.get("free") === "1"
    };
  }

  function hasActiveFilters(filters) {
    return filters.q !== "" || filters.category !== "" || filters.free;
  }

  function buildListHash(filters) {
    return App.utils.buildBooksHash({
      q: filters.q,
      category: filters.category,
      free: filters.free ? "1" : ""
    });
  }

  function matchesQuery(book, normalizedQuery) {
    return normalizeText(book.title).indexOf(normalizedQuery) !== -1 ||
      normalizeText(book.author).indexOf(normalizedQuery) !== -1;
  }

  function compareNewestFirst(a, b) {
    // ISO dates (YYYY-MM-DD) sort correctly as strings.
    if (a.addedAt === b.addedAt) return 0;
    return a.addedAt < b.addedAt ? 1 : -1;
  }

  // Returns a new array; the input array is never modified.
  // All filters are combined with AND.
  function selectBooks(books, filters) {
    var query = normalizeText(filters.q || "");
    var result = books.filter(function (book) {
      if (query !== "" && !matchesQuery(book, query)) return false;
      if (filters.category && book.category !== filters.category) return false;
      if (filters.free && book.price !== 0) return false;
      return true;
    });
    return result.sort(compareNewestFirst);
  }

  App.catalog = {
    parseListFilters: parseListFilters,
    hasActiveFilters: hasActiveFilters,
    buildListHash: buildListHash,
    selectBooks: selectBooks
  };
})(window.App = window.App || {});
