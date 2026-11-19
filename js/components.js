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
      // On the list page, keep the active filters so search combines with them.
      var route = App.router.parseHash();
      var filters = App.router.isBooksRoute(route)
        ? App.catalog.parseListFilters(route.params)
        : App.catalog.parseListFilters(new URLSearchParams());
      filters.q = input.value.trim();
      location.hash = App.catalog.buildListHash(filters);
    });
    return form;
  }

  // Keeps the header search box in sync with the current list query.
  function setSearchQuery(query) {
    var input = document.getElementById("site-search-input");
    if (input && input.value !== query) {
      input.value = query;
    }
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
    // Mobile only (CSS): no room for the theme button in the top row at 360px.
    items.push(el("li", { class: "site-nav__theme" }, [renderThemeToggle("text")]));

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
      el("div", { class: "site-header__actions" }, [
        renderThemeToggle("icon", "site-header__theme"),
        el("div", { id: "site-account", class: "site-header__account" })
      ]),
      toggle
    ]);

    header.className = "site-header";
    header.textContent = "";
    header.appendChild(el("div", { class: "container" }, [top, nav]));
    setupMenuToggle(header, toggle, nav);
  }

  // The login link carries the current page so login can return there.
  // reason (optional) lets the login page explain why the user was sent.
  function buildLoginHash(reason) {
    var current = location.hash.replace(/^#/, "") || "/";
    if (current.indexOf("/login") === 0) return "#" + current;
    var params = { from: current };
    if (reason) params.reason = reason;
    return "#/login?" + new URLSearchParams(params).toString();
  }

  // Header account area: "ورود" link, or the user's name and a logout button.
  // Called on every render, since login/logout and navigation both change it.
  function updateAccount() {
    var box = document.getElementById("site-account");
    if (!box) return;
    var user = store.state.user;
    box.textContent = "";

    if (!user) {
      box.appendChild(el("a", { class: "button button--neutral", href: buildLoginHash(), text: "ورود" }));
      return;
    }

    var logout = el("button", { class: "button button--neutral", type: "button", text: "خروج" });
    logout.addEventListener("click", function () {
      store.setState("user", null);
      // The logout button no longer exists; keep keyboard focus in the same spot.
      var loginLink = box.querySelector("a");
      if (loginLink) loginLink.focus();
    });
    box.appendChild(el("span", { class: "site-account__name", title: user.name, text: user.name }));
    box.appendChild(logout);
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

  // options (optional): href replaces the link to the detail page;
  // actionLabel replaces the price line (e.g. for books the user owns).
  function renderBookCard(book, options) {
    // Also called as array.map(renderBookCard), where the 2nd argument is an index.
    var opts = options && typeof options === "object" ? options : {};
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

    var footer = opts.actionLabel
      ? el("p", { class: "book-card__price" }, [el("span", { class: "book-card__action", text: opts.actionLabel })])
      : renderCardPrice(book);

    var link = el("a", { class: "book-card__link", href: opts.href || "#/book/" + encodeURIComponent(book.id) }, [
      cover,
      el("h3", { class: "book-card__title", text: book.title }),
      el("p", { class: "book-card__author", text: book.author }),
      rating,
      footer
    ]);

    // Kept outside the link: interactive elements must not be nested.
    return el("article", { class: "book-card" }, [link, renderFavoriteButton(book, "card")]);
  }

  // ---------- Favorite button ----------

  // Sets pressed state and accessible text from the current favorites.
  // "card" buttons are icon-only (aria-label); "detail" buttons show text.
  function applyFavoriteState(button, book) {
    var on = store.isFavorite(book.id);
    button.setAttribute("aria-pressed", String(on));
    if (button.getAttribute("data-variant") === "card") {
      button.setAttribute("aria-label", on
        ? "حذف «" + book.title + "» از علاقه‌مندی‌ها"
        : "افزودن «" + book.title + "» به علاقه‌مندی‌ها");
    } else {
      button.querySelector(".favorite-label").textContent = on ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها";
    }
  }

  function renderFavoriteButton(book, variant) {
    var button = el("button", {
      class: variant === "card" ? "book-card__fav" : "button button--neutral detail-fav",
      type: "button",
      "data-favorite-id": book.id,
      "data-variant": variant
    }, [createIcon("heart")]);
    if (variant !== "card") button.appendChild(el("span", { class: "favorite-label" }));
    applyFavoriteState(button, book);

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      store.toggleFavorite(book.id);
    });
    return button;
  }

  // Updates every heart button on the page (a book can appear more than once).
  function syncFavoriteButtons() {
    document.querySelectorAll("[data-favorite-id]").forEach(function (button) {
      var book = store.findBookById(button.getAttribute("data-favorite-id"));
      if (book) applyFavoriteState(button, book);
    });
  }

  // ---------- Theme toggle ----------

  // A toggle button: its name stays "تم تیره" and aria-pressed says whether
  // dark is on. "icon" variant is icon-only; "text" variant also shows the label.
  function applyThemeToggleState(button) {
    var dark = store.state.theme === "dark";
    button.setAttribute("aria-pressed", String(dark));
    var icon = button.querySelector(".icon");
    if (icon) icon.replaceWith(createIcon(dark ? "sun" : "moon"));
  }

  function renderThemeToggle(variant, extraClass) {
    var isIcon = variant === "icon";
    var button = el("button", {
      class: (isIcon ? "theme-toggle" : "button button--neutral theme-toggle--text") + (extraClass ? " " + extraClass : ""),
      type: "button",
      "data-theme-toggle": ""
    }, [createIcon("moon")]);
    if (isIcon) {
      button.setAttribute("aria-label", "تم تیره");
    } else {
      button.appendChild(el("span", { text: "تم تیره" }));
    }
    applyThemeToggleState(button);
    button.addEventListener("click", function () {
      store.setState("theme", store.state.theme === "dark" ? "light" : "dark");
    });
    return button;
  }

  // Keeps every theme button (header and reader) in sync with the state.
  function syncThemeToggles() {
    document.querySelectorAll("[data-theme-toggle]").forEach(applyThemeToggleState);
  }

  // ---------- Toast ----------

  var toastTimer = null;

  // A single live region created once; it lives outside <main> so page
  // re-renders never remove it before the message is announced.
  function renderToastRegion() {
    document.body.appendChild(el("div", { id: "toast", class: "toast", role: "status", "aria-live": "polite" }));
  }

  function showToast(message) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-visible");
      toast.textContent = "";
    }, 4000);
  }

  // ---------- Screen-reader announcements ----------

  // A visually hidden live region that is never re-rendered, so screen readers
  // reliably read what is put into it (e.g. the new result count).
  function renderLiveRegion() {
    document.body.appendChild(el("div", { id: "live-status", class: "visually-hidden", role: "status", "aria-live": "polite" }));
  }

  function announce(message) {
    var region = document.getElementById("live-status");
    if (!region) return;
    // Clear first so the same message twice in a row is still announced.
    region.textContent = "";
    setTimeout(function () { region.textContent = message; }, 50);
  }

  // ---------- Skip link ----------

  // First focusable element on every page. It can't be a plain href="#app"
  // because the hash is our router, so it moves focus to the page heading.
  function renderSkipLink() {
    var link = el("a", { class: "skip-link", href: "#app", text: "پرش به محتوای اصلی" });
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var heading = document.querySelector("#app h1");
      var target = heading || document.getElementById("app");
      target.setAttribute("tabindex", "-1");
      target.focus();
    });
    document.body.insertBefore(link, document.body.firstChild);
  }

  // ---------- Dialog ----------

  var FOCUSABLE = "button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])";

  // Modal confirm dialog. Focus moves inside and is trapped there; Escape,
  // the cancel button or a backdrop click close it and return focus to opener.
  function openDialog(options) {
    var opener = options.opener || document.activeElement;
    var background = document.querySelectorAll("body > header, body > main, body > footer");

    var confirm = el("button", { class: "button button--primary", type: "button", text: options.confirmLabel });
    var cancel = el("button", { class: "button button--neutral", type: "button", text: options.cancelLabel || "انصراف" });
    var dialog = el("div", {
      class: "dialog",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "dialog-title",
      "aria-describedby": "dialog-body"
    }, [
      el("h2", { id: "dialog-title", class: "dialog__title", text: options.title }),
      el("div", { id: "dialog-body", class: "dialog__body" }, options.body),
      el("div", { class: "dialog__actions" }, [confirm, cancel])
    ]);
    var backdrop = el("div", { class: "dialog-backdrop" }, [dialog]);

    function close(restoreFocus) {
      backdrop.remove();
      background.forEach(function (node) { node.inert = false; });
      document.body.classList.remove("has-dialog");
      window.removeEventListener("hashchange", onHashChange);
      if (restoreFocus && opener && document.contains(opener)) opener.focus();
    }

    function onHashChange() {
      close(false);
    }

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== "Tab") return;
      var focusables = dialog.querySelectorAll(FOCUSABLE);
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) close(true);
    });
    cancel.addEventListener("click", function () { close(true); });
    confirm.addEventListener("click", function () {
      close(true);
      options.onConfirm();
    });
    window.addEventListener("hashchange", onHashChange);

    background.forEach(function (node) { node.inert = true; });
    document.body.classList.add("has-dialog");
    document.body.appendChild(backdrop);
    confirm.focus();
  }

  App.components = {
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    renderBookCard: renderBookCard,
    renderCoverBadge: renderCoverBadge,
    setSearchQuery: setSearchQuery,
    updateAccount: updateAccount,
    buildLoginHash: buildLoginHash,
    renderFavoriteButton: renderFavoriteButton,
    syncFavoriteButtons: syncFavoriteButtons,
    renderThemeToggle: renderThemeToggle,
    syncThemeToggles: syncThemeToggles,
    renderToastRegion: renderToastRegion,
    renderLiveRegion: renderLiveRegion,
    announce: announce,
    renderSkipLink: renderSkipLink,
    showToast: showToast,
    openDialog: openDialog
  };
})(window.App = window.App || {});
