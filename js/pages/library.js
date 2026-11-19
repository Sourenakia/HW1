// Library page (#/library): owned books and favorites.
(function (App) {
  "use strict";

  var el = App.utils.el;

  // Ids → books, newest first; unknown ids are skipped.
  function idsToBooks(ids) {
    return ids.slice().reverse().map(App.store.findBookById).filter(Boolean);
  }

  function renderEmpty(message, linkText, href) {
    return el("div", { class: "empty-state" }, [
      el("p", { text: message }),
      el("a", { class: "button button--neutral", href: href, text: linkText })
    ]);
  }

  function renderSection(id, title, books, renderCard, empty, headingAttrs) {
    var headingId = id + "-title";
    var attrs = { id: headingId, class: "section-title", text: title + " (" + App.utils.toPersianDigits(books.length) + ")" };
    Object.keys(headingAttrs || {}).forEach(function (key) { attrs[key] = headingAttrs[key]; });
    return el("section", { class: "library-section", "aria-labelledby": headingId }, [
      el("h2", attrs),
      books.length > 0 ? el("div", { class: "book-grid" }, books.map(renderCard)) : empty
    ]);
  }

  // Owned book: open the sample if there is one, otherwise the detail page.
  function renderOwnedCard(book) {
    var hasSample = App.store.hasSample(book);
    return App.components.renderBookCard(book, {
      href: (hasSample ? "#/read/" : "#/book/") + encodeURIComponent(book.id),
      actionLabel: "باز کردن"
    });
  }

  function renderFavoriteCard(book) {
    return App.components.renderBookCard(book);
  }

  // Runs before the heart's own click handler (capture phase), so the message
  // can say whether the book is being added or removed.
  function announceFavoriteChanges(node) {
    node.addEventListener("click", function (event) {
      var button = event.target.closest("[data-favorite-id]");
      if (!button) return;
      var book = App.store.findBookById(button.getAttribute("data-favorite-id"));
      if (!book) return;
      App.components.showToast(App.store.isFavorite(book.id)
        ? "«" + book.title + "» از علاقه‌مندی‌ها حذف شد."
        : "«" + book.title + "» به علاقه‌مندی‌ها اضافه شد.");
    }, true);
  }

  function renderLibraryPage() {
    var title = "کتابخانه";
    var state = App.store.state;

    var owned = renderSection("library-owned", "کتاب‌های من", idsToBooks(state.library), renderOwnedCard,
      renderEmpty("هنوز کتابی دریافت نکرده‌اید.", "دیدن فهرست کتاب‌ها", "#/books"));

    // After removing a favorite its button is gone; the router moves focus here.
    var favorites = renderSection("library-favorites", "علاقه‌مندی‌ها", idsToBooks(state.favorites), renderFavoriteCard,
      renderEmpty("هنوز کتابی را به علاقه‌مندی‌ها اضافه نکرده‌اید.", "دیدن همهٔ کتاب‌ها", "#/books"),
      { "data-focus-fallback": "" });

    var node = el("section", null, [el("h1", { text: title }), owned, favorites]);
    announceFavoriteChanges(node);
    return { title: title, node: node };
  }

  App.pages = App.pages || {};
  App.pages.library = renderLibraryPage;
})(window.App = window.App || {});
