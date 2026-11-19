// One render function per route. Each returns { title, node }.
(function (App) {
  "use strict";

  var el = App.utils.el;
  var renderBookCard = App.components.renderBookCard;

  function renderPlaceholder(title) {
    return { title: title, node: el("h1", { text: title }) };
  }

  function renderHomePage() {
    var title = "صفحهٔ اصلی";
    // TEMP: grid of all cards for testing renderBookCard.
    var grid = el("div", { class: "book-grid" }, BOOKS.map(renderBookCard));
    return { title: title, node: el("section", null, [el("h1", { text: title }), grid]) };
  }

  function renderListSummary(count, query) {
    var countText = App.utils.toPersianDigits(count);
    var text = query
      ? countText + " نتیجه برای «" + query + "»"
      : countText + " کتاب";
    return el("p", { class: "list-summary", role: "status", text: text });
  }

  function renderEmptyResults(query) {
    var message = query
      ? "کتابی با «" + query + "» پیدا نشد."
      : "کتابی برای نمایش نیست.";
    return el("div", { class: "empty-state" }, [
      el("p", { text: message }),
      el("a", { class: "button button--neutral", href: "#/books", text: "نمایش همهٔ کتاب‌ها" })
    ]);
  }

  function renderBooksPage(params) {
    var title = "فهرست کتاب‌ها";
    var filters = App.catalog.parseListFilters(params);
    var books = App.catalog.selectBooks(BOOKS, filters);

    var content = books.length > 0
      ? el("div", { class: "book-grid" }, books.map(renderBookCard))
      : renderEmptyResults(filters.q);

    var node = el("section", null, [
      el("h1", { text: title }),
      renderListSummary(books.length, filters.q),
      content
    ]);
    return { title: title, node: node };
  }

  function renderBookPage(id) {
    return renderPlaceholder("جزئیات کتاب: " + id);
  }

  function renderReaderPage(id) {
    return renderPlaceholder("نمونه‌خوان: " + id);
  }

  function renderLibraryPage() {
    return renderPlaceholder("کتابخانه");
  }

  function renderLoginPage() {
    return renderPlaceholder("ورود");
  }

  function renderNotFoundPage() {
    var title = "صفحه پیدا نشد";
    var node = el("section", null, [
      el("h1", { text: title }),
      el("a", { href: "#/", text: "بازگشت به صفحهٔ اصلی" })
    ]);
    return { title: title, node: node };
  }

  App.pages = {
    home: renderHomePage,
    books: renderBooksPage,
    book: renderBookPage,
    reader: renderReaderPage,
    library: renderLibraryPage,
    login: renderLoginPage,
    notFound: renderNotFoundPage
  };
})(window.App = window.App || {});
