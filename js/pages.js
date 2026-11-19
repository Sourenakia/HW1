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

  function renderBooksPage() {
    return renderPlaceholder("فهرست کتاب‌ها");
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
