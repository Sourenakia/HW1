// Book list selection: pure functions only (no DOM, no app state).
// Filters and sorting for the list page will be added here.
(function (App) {
  "use strict";

  var normalizeText = App.utils.normalizeText;

  // Reads list filters from the hash query (a URLSearchParams).
  function parseListFilters(params) {
    return {
      q: (params.get("q") || "").trim()
    };
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
  function selectBooks(books, filters) {
    var query = normalizeText(filters.q || "");
    var result = books.filter(function (book) {
      return query === "" || matchesQuery(book, query);
    });
    return result.sort(compareNewestFirst);
  }

  App.catalog = {
    parseListFilters: parseListFilters,
    selectBooks: selectBooks
  };
})(window.App = window.App || {});
