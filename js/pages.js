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

  // Puts the user's query inside «…» as text. <bdi> isolates its direction so
  // characters like < > or Latin text don't reorder the surrounding Persian.
  function quotedQuery(before, query, after) {
    return [
      document.createTextNode(before + "«"),
      el("bdi", { text: query }),
      document.createTextNode("»" + after)
    ];
  }

  function renderListSummary(count, query) {
    // "هیچ" instead of "۰": the Persian zero looks like a dot in many fonts.
    var countText = count === 0 ? "هیچ" : App.utils.toPersianDigits(count);
    var children = query
      ? quotedQuery(countText + (count === 0 ? " نتیجه‌ای" : " نتیجه") + " برای ", query, "")
      : [document.createTextNode(countText + (count === 0 ? " کتابی" : " کتاب"))];
    return el("p", { class: "list-summary", role: "status" }, children);
  }

  function renderEmptyResults(filters) {
    var children = filters.q
      ? quotedQuery("کتابی با ", filters.q, " و این فیلترها پیدا نشد.")
      : [document.createTextNode("کتابی با این فیلترها پیدا نشد.")];
    // Same as "پاک کردن فیلترها": drop search and filters, keep the sort order.
    var allBooksHash = App.catalog.buildListHash({ q: "", category: "", free: false, sort: filters.sort });
    return el("div", { class: "empty-state" }, [
      el("p", null, children),
      el("a", { class: "button button--neutral", href: allBooksHash, text: "نمایش همهٔ کتاب‌ها" })
    ]);
  }

  // Navigates to the list with one filter changed and all others kept.
  function goToFilters(filters, key, value) {
    var next = { q: filters.q, category: filters.category, free: filters.free, sort: filters.sort };
    next[key] = value;
    location.hash = App.catalog.buildListHash(next);
  }

  var SORT_OPTIONS = [
    { value: "", label: "جدیدترین" },
    { value: "price-asc", label: "ارزان‌ترین" },
    { value: "price-desc", label: "گران‌ترین" },
    { value: "rating", label: "بیشترین امتیاز" }
  ];

  function renderSortSelect(filters) {
    var select = el("select", { id: "filter-sort", class: "list-filters__select" },
      SORT_OPTIONS.map(function (option) {
        return el("option", { value: option.value, text: option.label });
      }));
    select.value = filters.sort;
    select.addEventListener("change", function () {
      goToFilters(filters, "sort", select.value);
    });
    return el("div", { class: "list-filters__field" }, [
      el("label", { for: "filter-sort", text: "مرتب‌سازی" }),
      select
    ]);
  }

  function renderFreeCheckbox(filters) {
    var checkbox = el("input", { id: "filter-free", type: "checkbox" });
    checkbox.checked = filters.free;
    checkbox.addEventListener("change", function () {
      goToFilters(filters, "free", checkbox.checked);
    });
    return el("div", { class: "list-filters__field" }, [
      checkbox,
      el("label", { for: "filter-free", text: "فقط رایگان" })
    ]);
  }

  function renderListFilters(filters) {
    var form = el("form", { class: "list-filters", "aria-label": "فیلتر کتاب‌ها" }, [
      renderFreeCheckbox(filters),
      renderSortSelect(filters)
    ]);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });

    if (App.catalog.hasActiveFilters(filters)) {
      var clear = el("button", { class: "button button--neutral list-filters__clear", type: "button", text: "پاک کردن فیلترها" });
      clear.addEventListener("click", function () {
        // Clears search and filters; the chosen sort order is kept.
        location.hash = App.catalog.buildListHash({ q: "", category: "", free: false, sort: filters.sort });
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
      : renderEmptyResults(filters);

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
