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
      ? "کتابی با «" + query + "» و این فیلترها پیدا نشد."
      : "کتابی با این فیلترها پیدا نشد.";
    return el("div", { class: "empty-state" }, [
      el("p", { text: message }),
      el("a", { class: "button button--neutral", href: "#/books", text: "نمایش همهٔ کتاب‌ها" })
    ]);
  }

  function goToFilters(filters) {
    location.hash = App.catalog.buildListHash(filters);
  }

  function renderCategorySelect(filters) {
    var select = el("select", { id: "filter-category", class: "list-filters__select" }, [
      el("option", { value: "", text: "همهٔ دسته‌ها" })
    ]);
    App.store.getCategoriesInUse().forEach(function (category) {
      select.appendChild(el("option", { value: category.id, text: category.label }));
    });
    select.value = filters.category;
    select.addEventListener("change", function () {
      goToFilters({ q: filters.q, category: select.value, free: filters.free });
    });
    return el("div", { class: "list-filters__field" }, [
      el("label", { for: "filter-category", text: "دسته" }),
      select
    ]);
  }

  function renderFreeCheckbox(filters) {
    var checkbox = el("input", { id: "filter-free", type: "checkbox" });
    checkbox.checked = filters.free;
    checkbox.addEventListener("change", function () {
      goToFilters({ q: filters.q, category: filters.category, free: checkbox.checked });
    });
    return el("div", { class: "list-filters__field" }, [
      checkbox,
      el("label", { for: "filter-free", text: "فقط رایگان" })
    ]);
  }

  function renderListFilters(filters) {
    var form = el("form", { class: "list-filters", "aria-label": "فیلتر کتاب‌ها" }, [
      renderCategorySelect(filters),
      renderFreeCheckbox(filters)
    ]);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });

    if (App.catalog.hasActiveFilters(filters)) {
      var clear = el("button", { class: "button button--neutral list-filters__clear", type: "button", text: "پاک کردن فیلترها" });
      clear.addEventListener("click", function () {
        location.hash = "#/books";
      });
      form.appendChild(clear);
    }
    return form;
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
      renderListFilters(filters),
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
