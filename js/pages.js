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

  // ---------- Book detail ----------

  function renderBreadcrumb(book, category) {
    var items = [el("li", null, [el("a", { href: "#/", text: "خانه" })])];
    if (category) {
      items.push(el("li", null, [
        el("a", { href: App.utils.buildBooksHash({ category: category.id }), text: category.label })
      ]));
    }
    items.push(el("li", null, [el("span", { "aria-current": "page", text: book.title })]));
    return el("nav", { class: "breadcrumb", "aria-label": "مسیر صفحه" }, [el("ol", null, items)]);
  }

  function renderDetailCover(book) {
    var cover = el("div", { class: "book-detail__cover" }, [
      el("img", { src: book.cover, alt: book.coverAlt, width: "400", height: "600" })
    ]);
    var badge = App.components.renderCoverBadge(book);
    if (badge) cover.appendChild(badge);
    return cover;
  }

  function renderBookInfo(book, category) {
    var utils = App.utils;
    var rating = el("p", { class: "book-detail__rating" }, [
      el("span", { class: "book-card__star", "aria-hidden": "true", text: "★" }),
      el("strong", { text: utils.formatRating(book.rating) }),
      el("span", { text: "(" + utils.formatNumber(App.store.getRatingCount(book)) + " رأی)" })
    ]);

    var categoryValue = category
      ? el("a", { href: utils.buildBooksHash({ category: category.id }), text: category.label })
      : el("span", { text: "—" });

    var meta = el("dl", { class: "book-detail__meta" }, [
      el("dt", { text: "نویسنده" }),
      el("dd", { text: book.author }),
      el("dt", { text: "دسته‌بندی" }),
      el("dd", null, [categoryValue])
    ]);

    return el("div", { class: "book-detail__info" }, [
      el("h1", { class: "book-detail__title", text: book.title }),
      rating,
      meta
    ]);
  }

  function renderPurchasePrice(book) {
    var utils = App.utils;
    if (book.price === 0) {
      return el("p", { class: "purchase-box__final", text: utils.formatPrice(0) });
    }
    var percent = App.store.getDiscountPercent(book);
    var box = el("div", { class: "purchase-box__price" });
    if (percent > 0) {
      box.appendChild(el("p", { class: "purchase-box__original" }, [
        el("del", { text: utils.formatPrice(book.price) }),
        el("span", { class: "purchase-box__discount", text: "٪" + utils.toPersianDigits(percent) + " تخفیف" })
      ]));
    }
    box.appendChild(el("p", { class: "purchase-box__final", text: utils.formatPrice(App.store.getFinalPrice(book)) }));
    return box;
  }

  // Buttons are visual only for now; behavior is added in later steps.
  function renderPurchaseBox(book) {
    var isFree = book.price === 0;
    var getButton = el("button", {
      id: "detail-get",
      class: "button " + (isFree ? "button--soft" : "button--primary"),
      type: "button",
      text: isFree ? "دریافت رایگان" : "خرید"
    });

    var readControl;
    if (App.store.hasSample(book)) {
      readControl = el("a", { class: "button button--outline", href: "#/read/" + encodeURIComponent(book.id), text: "خواندن نمونه" });
    } else {
      readControl = el("div", { class: "purchase-box__read" }, [
        el("button", { class: "button button--outline", type: "button", disabled: "", "aria-describedby": "no-sample-note", text: "خواندن نمونه" }),
        el("p", { id: "no-sample-note", class: "purchase-box__note", text: "برای این کتاب نمونه‌ای موجود نیست" })
      ]);
    }

    var favButton = el("button", { id: "detail-fav", class: "button button--neutral", type: "button", "aria-pressed": "false" }, [
      App.utils.createIcon("heart"),
      el("span", { text: "افزودن به علاقه‌مندی‌ها" })
    ]);

    return el("aside", { class: "purchase-box", "aria-label": "خرید و دریافت" }, [
      renderPurchasePrice(book),
      getButton,
      readControl,
      favButton
    ]);
  }

  function renderRelatedBooks(book) {
    var related = App.store.getRelatedBooks(book);
    if (related.length === 0) return null;
    return el("section", { class: "book-detail__section" }, [
      el("h2", { class: "section-title", text: "کتاب‌های مرتبط" }),
      el("div", { class: "book-grid" }, related.map(renderBookCard))
    ]);
  }

  function renderBookNotFound() {
    var title = "کتاب یافت نشد";
    return {
      title: title,
      node: el("section", { class: "empty-state" }, [
        el("h1", { text: title }),
        el("p", { text: "کتابی با این نشانی وجود ندارد." }),
        el("a", { class: "button button--neutral", href: "#/books", text: "بازگشت به فهرست کتاب‌ها" })
      ])
    };
  }

  function renderBookPage(id) {
    var book = App.store.findBookById(id);
    if (!book) return renderBookNotFound();
    var category = App.store.findCategoryById(book.category);

    var top = el("div", { class: "book-detail__top" }, [
      renderDetailCover(book),
      renderBookInfo(book, category),
      renderPurchaseBox(book)
    ]);

    var about = el("section", { class: "book-detail__section" }, [
      el("h2", { class: "section-title", text: "معرفی کتاب" }),
      el("p", { class: "book-detail__description", text: book.description })
    ]);

    var children = [renderBreadcrumb(book, category), top, about];
    var related = renderRelatedBooks(book);
    if (related) children.push(related);

    return { title: book.title, node: el("article", { class: "book-detail" }, children) };
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
