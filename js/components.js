// Reusable UI pieces: site header, footer and the book card.
(function (App) {
  "use strict";

  var utils = App.utils;
  var store = App.store;
  var el = utils.el;
  var createIcon = utils.createIcon;

  // ---------- Header ----------

  function renderSearchForm() {
    var inputId = "site-search-input";
    var input = el("input", {
      id: inputId,
      class: "site-search__input",
      type: "search",
      name: "q",
      placeholder: "جستجو در کتاب‌ها",
      autocomplete: "off"
    });
    var submit = el("button", { class: "site-search__submit", type: "submit", "aria-label": "جستجو" });
    submit.appendChild(createIcon("search"));

    var form = el("form", { class: "site-search", role: "search" }, [
      el("label", { class: "visually-hidden", for: inputId, text: "جستجو در عنوان یا نام نویسنده" }),
      input,
      submit
    ]);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      location.hash = utils.buildBooksHash({ q: input.value.trim() });
    });
    return form;
  }

  function renderSiteNav(navId) {
    var items = store.getCategoriesInUse().map(function (category) {
      return el("li", null, [
        el("a", { class: "site-nav__link", href: utils.buildBooksHash({ category: category.id }), text: category.label })
      ]);
    });
    items.push(el("li", { class: "site-nav__library" }, [
      el("a", { class: "site-nav__link", href: "#/library", text: "کتابخانه" })
    ]));

    return el("nav", { id: navId, class: "site-nav", "aria-label": "دسته‌ها و کتابخانه" }, [
      el("ul", { class: "site-nav__list" }, items)
    ]);
  }

  function setupMenuToggle(header, toggle, nav) {
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    }
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    header.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener("hashchange", function () {
      setOpen(false);
    });
  }

  function renderHeader() {
    var header = document.querySelector("body > header");
    var navId = "site-nav";

    var toggle = el("button", {
      class: "site-menu-toggle",
      type: "button",
      "aria-expanded": "false",
      "aria-controls": navId,
      "aria-label": "منوی دسته‌ها"
    });
    toggle.appendChild(createIcon("menu"));

    var nav = renderSiteNav(navId);

    var top = el("div", { class: "site-header__top" }, [
      el("a", { class: "site-logo", href: "#/", text: utils.SITE_NAME }),
      renderSearchForm(),
      el("div", { class: "site-header__account" }, [
        el("a", { class: "button button--neutral", href: "#/login", text: "ورود" })
      ]),
      toggle
    ]);

    header.className = "site-header";
    header.textContent = "";
    header.appendChild(el("div", { class: "container" }, [top, nav]));
    setupMenuToggle(header, toggle, nav);
  }

  // ---------- Footer ----------

  function renderFooter() {
    var footer = document.querySelector("body > footer");
    var links = [
      { href: "#/", text: "خانه" },
      { href: "#/books", text: "همهٔ کتاب‌ها" },
      { href: "#/library", text: "کتابخانه" },
      { href: "#/login", text: "ورود" }
    ].map(function (link) {
      return el("li", null, [el("a", { class: "site-footer__link", href: link.href, text: link.text })]);
    });

    footer.className = "site-footer";
    footer.textContent = "";
    footer.appendChild(el("div", { class: "container site-footer__inner" }, [
      el("p", { class: "site-footer__name", text: utils.SITE_NAME }),
      el("nav", { "aria-label": "پیوندهای پابرگ" }, [el("ul", { class: "site-footer__links" }, links)])
    ]));
  }

  // ---------- Book card ----------

  function renderCoverBadge(book) {
    if (book.price === 0) {
      return el("span", { class: "book-card__badge book-card__badge--free", text: "رایگان" });
    }
    var percent = store.getDiscountPercent(book);
    if (percent > 0) {
      return el("span", { class: "book-card__badge book-card__badge--discount", text: "٪" + utils.toPersianDigits(percent) });
    }
    return null;
  }

  function renderCardPrice(book) {
    var box = el("p", { class: "book-card__price" });
    if (book.price === 0) {
      box.appendChild(el("span", { class: "book-card__price-free", text: utils.formatPrice(0) }));
      return box;
    }
    box.appendChild(el("span", { class: "book-card__price-final", text: utils.formatPrice(store.getFinalPrice(book)) }));
    if (store.getDiscountPercent(book) > 0) {
      box.appendChild(el("del", { class: "book-card__price-original", text: utils.formatNumber(book.price) }));
    }
    return box;
  }

  function renderBookCard(book) {
    var cover = el("div", { class: "book-card__cover" }, [
      el("img", { src: book.cover, alt: book.coverAlt, width: "400", height: "600", loading: "lazy" })
    ]);
    var badge = renderCoverBadge(book);
    if (badge) cover.appendChild(badge);

    var rating = el("p", { class: "book-card__rating" }, [
      el("span", { class: "book-card__star", "aria-hidden": "true", text: "★" }),
      el("span", { text: utils.formatRating(book.rating) }),
      el("span", { text: "(" + utils.formatNumber(store.getRatingCount(book)) + ")" })
    ]);

    var link = el("a", { class: "book-card__link", href: "#/book/" + encodeURIComponent(book.id) }, [
      cover,
      el("h3", { class: "book-card__title", text: book.title }),
      el("p", { class: "book-card__author", text: book.author }),
      rating,
      renderCardPrice(book)
    ]);

    // Kept outside the link: interactive elements must not be nested.
    var favButton = el("button", {
      class: "book-card__fav",
      type: "button",
      "aria-label": "افزودن «" + book.title + "» به علاقه‌مندی‌ها",
      "aria-pressed": "false"
    });
    favButton.appendChild(createIcon("heart"));

    return el("article", { class: "book-card" }, [link, favButton]);
  }

  App.components = {
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    renderBookCard: renderBookCard
  };
})(window.App = window.App || {});
