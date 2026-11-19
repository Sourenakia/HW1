// List page (#/books): filters, sort, results.
(function (App) {
  "use strict";

  var el = App.utils.el;
  var renderBookCard = App.components.renderBookCard;

  // Puts the user's query inside «…» as text. <bdi> isolates its direction so
  // characters like < > or Latin text don't reorder the surrounding Persian.
  function quotedQuery(before, query, after) {
    return [
      document.createTextNode(before + "«"),
      el("bdi", { text: query }),
      document.createTextNode("»" + after)
    ];
  }

  // "هیچ" instead of "۰": the Persian zero looks like a dot in many fonts.
  function countPhrase(count, query) {
    var countText = count === 0 ? "هیچ" : App.utils.toPersianDigits(count);
    if (query) return countText + (count === 0 ? " نتیجه‌ای" : " نتیجه") + " برای ";
    return countText + (count === 0 ? " کتابی" : " کتاب");
  }

  // Visible line. Not a live region itself: it is rebuilt on every change,
  // so the router announces summaryText() through a persistent region instead.
  function renderListSummary(count, query) {
    var children = query
      ? quotedQuery(countPhrase(count, query), query, "")
      : [document.createTextNode(countPhrase(count, query))];
    return el("p", { class: "list-summary" }, children);
  }

  function summaryText(count, query) {
    return query ? countPhrase(count, query) + "«" + query + "»" : countPhrase(count, query);
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

  // Category filter as a row of pills ("همه" + each category), like the
  // category chips on Taaghche's list page. Each pill is a link to the same
  // list with only the category changed; the active one has aria-current.
  // Stable ids let the router keep focus on the clicked pill.
  function renderCategoryChips(filters) {
    var options = [{ id: "", label: "همه" }].concat(App.store.getCategoriesInUse());
    var chips = options.map(function (category) {
      var next = { q: filters.q, category: category.id, free: filters.free, sort: filters.sort };
      var link = el("a", {
        id: "filter-category-" + (category.id || "all"),
        class: "chip",
        href: App.catalog.buildListHash(next),
        text: category.label
      });
      if (filters.category === category.id) link.setAttribute("aria-current", "true");
      return el("li", null, [link]);
    });
    return el("div", { class: "list-filters__categories", role: "group", "aria-labelledby": "filter-category-label" }, [
      el("span", { id: "filter-category-label", class: "list-filters__label", text: "دسته" }),
      el("ul", { class: "chips" }, chips)
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
      renderCategoryChips(filters),
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
      // Keeps heading levels in order (h1 → h2 → card h3) for screen readers.
      el("h2", { class: "visually-hidden", text: "نتیجه‌ها" }),
      content
    ]);
    return { title: title, node: node, announce: summaryText(books.length, filters.q) };
  }

  App.pages = App.pages || {};
  App.pages.books = renderBooksPage;
})(window.App = window.App || {});
