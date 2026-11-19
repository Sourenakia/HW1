// Home page (#/): intro banner, categories and three horizontal book rows.
(function (App) {
  "use strict";

  var el = App.utils.el;
  var utils = App.utils;

  // ---------- Prev / next buttons ----------

  // aria-disabled (not disabled) so a focused button keeps focus at the end.
  function renderStepButton(direction, label, onClick) {
    // In RTL "previous" sits on the right and points right.
    var button = el("button", {
      class: "step-button",
      type: "button",
      "aria-label": label
    }, [utils.createIcon(direction === "prev" ? "chevron-right" : "chevron-left")]);
    button.addEventListener("click", function () {
      if (button.getAttribute("aria-disabled") !== "true") onClick();
    });
    return button;
  }

  function setStepEnabled(button, enabled) {
    button.setAttribute("aria-disabled", String(!enabled));
  }

  // ---------- Banner ----------

  function booksOf(ids) {
    return ids.map(App.store.findBookById).filter(Boolean);
  }

  function categoryBooks(id, count) {
    return BOOKS.filter(function (book) { return book.category === id; }).slice(0, count);
  }

  // Each slide links to one book or one category. Colors come from CSS tokens.
  function getSlides() {
    return [
      {
        tone: 1,
        title: "آسمان شب را از نو ببینید",
        text: "نمونهٔ «ستاره‌هایی که نمی‌بینیم» را بخوانید؛ کتابی ساده دربارهٔ بخش پنهان آسمان.",
        cta: "مشاهدهٔ کتاب",
        href: "#/book/unseen-stars",
        books: booksOf(["unseen-stars"])
      },
      {
        tone: 2,
        title: "قصه‌های شب برای بچه‌ها",
        text: "از روباه و فانوس جادویی تا قلعهٔ ابرها؛ چند تایشان رایگان است.",
        cta: "دیدن کتاب‌های کودک",
        href: utils.buildBooksHash({ category: "kids" }),
        books: categoryBooks("kids", 3)
      },
      {
        tone: 3,
        title: "داستان‌هایی که با شما می‌مانند",
        text: "رمان و داستان کوتاه از نویسنده‌های تازه.",
        cta: "دیدن داستان و رمان",
        href: utils.buildBooksHash({ category: "fiction" }),
        books: categoryBooks("fiction", 3)
      }
    ];
  }

  // Kept between renders so the banner doesn't jump back to slide 1.
  var currentSlide = 0;

  function renderSlide(slide, index, total) {
    var covers = el("div", { class: "banner__covers" }, slide.books.map(function (book) {
      return el("img", { src: book.cover, alt: book.coverAlt, width: "400", height: "600" });
    }));
    var node = el("div", {
      class: "banner__slide banner__slide--" + slide.tone,
      role: "group",
      "aria-roledescription": "اسلاید",
      "aria-label": utils.toPersianDigits(index + 1) + " از " + utils.toPersianDigits(total)
    }, [
      el("div", { class: "banner__text" }, [
        el("h2", { class: "banner__title", text: slide.title }),
        el("p", { text: slide.text }),
        el("a", { class: "button banner__cta", href: slide.href, text: slide.cta })
      ]),
      covers
    ]);
    node.hidden = index !== currentSlide;
    return node;
  }

  function renderBanner() {
    var slides = getSlides();
    var nodes = slides.map(function (slide, i) { return renderSlide(slide, i, slides.length); });
    var status = el("p", { class: "banner__status", "aria-live": "polite" });

    function show(index) {
      currentSlide = (index + slides.length) % slides.length;
      nodes.forEach(function (node, i) { node.hidden = i !== currentSlide; });
      status.textContent = "اسلاید " + utils.toPersianDigits(currentSlide + 1) + " از " + utils.toPersianDigits(slides.length);
    }

    var controls = el("div", { class: "banner__controls" }, [
      renderStepButton("prev", "اسلاید قبلی", function () { show(currentSlide - 1); }),
      status,
      renderStepButton("next", "اسلاید بعدی", function () { show(currentSlide + 1); })
    ]);
    show(currentSlide);

    // No auto-rotation: content shouldn't move unless the user asks.
    return el("section", { class: "banner", "aria-roledescription": "اسلایدشو", "aria-label": "معرفی‌ها" },
      nodes.concat(controls));
  }

  // ---------- Categories ----------

  function renderCategories() {
    var tiles = App.store.getCategoriesInUse().map(function (category) {
      var count = BOOKS.filter(function (book) { return book.category === category.id; }).length;
      return el("li", null, [
        el("a", { class: "category-tile", href: utils.buildBooksHash({ category: category.id }) }, [
          el("span", { class: "category-tile__label", text: category.label }),
          el("span", { class: "category-tile__count", text: utils.toPersianDigits(count) + " کتاب" })
        ])
      ]);
    });
    return el("section", { class: "home-section", "aria-labelledby": "home-categories-title" }, [
      el("h2", { id: "home-categories-title", class: "section-title", text: "دسته‌ها" }),
      el("ul", { class: "category-tiles" }, tiles)
    ]);
  }

  // ---------- Book rows ----------

  // Shared by all three rows. The track scrolls horizontally inside the row
  // (the page itself never scrolls sideways); prev/next move one "screen".
  function renderBookRow(options) {
    var titleId = options.id + "-title";
    var trackId = options.id + "-track";
    var track = el("div", { id: trackId, class: "book-row__track" }, options.books.map(App.components.renderBookCard));

    // RTL scrollLeft is 0 at the start and negative toward the end.
    function step(sign) {
      var rtl = getComputedStyle(track).direction === "rtl";
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollBy({ left: sign * (rtl ? -1 : 1) * track.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
    }

    var prev = renderStepButton("prev", "قبلی در " + options.title, function () { step(-1); });
    var next = renderStepButton("next", "بعدی در " + options.title, function () { step(1); });
    prev.setAttribute("aria-controls", trackId);
    next.setAttribute("aria-controls", trackId);

    function updateButtons() {
      var scrolled = Math.abs(track.scrollLeft);
      setStepEnabled(prev, scrolled > 2);
      setStepEnabled(next, scrolled + track.clientWidth < track.scrollWidth - 2);
    }
    track.addEventListener("scroll", updateButtons);
    // Fires once the row is in the page and again on resize.
    if (window.ResizeObserver) new ResizeObserver(updateButtons).observe(track);

    return el("section", { class: "home-section book-row", "aria-labelledby": titleId }, [
      el("div", { class: "book-row__header" }, [
        el("h2", { id: titleId, class: "section-title", text: options.title }),
        el("a", { class: "book-row__more", href: options.moreHref, "aria-label": "مشاهدهٔ همهٔ " + options.title, text: "مشاهدهٔ همه" }),
        el("div", { class: "book-row__steps" }, [prev, next])
      ]),
      track
    ]);
  }

  function pick(filters, count) {
    var all = { q: "", category: "", free: false, sort: "" };
    Object.keys(filters).forEach(function (key) { all[key] = filters[key]; });
    return App.catalog.selectBooks(BOOKS, all).slice(0, count);
  }

  function renderHomePage() {
    var title = "صفحهٔ اصلی";
    var node = el("div", { class: "home" }, [
      el("h1", { class: "visually-hidden", text: utils.SITE_NAME + "، " + title }),
      renderBanner(),
      renderCategories(),
      renderBookRow({ id: "row-top", title: "پیشنهادها", books: pick({ sort: "rating" }, 8), moreHref: utils.buildBooksHash({ sort: "rating" }) }),
      renderBookRow({ id: "row-new", title: "تازه‌ها", books: pick({}, 8), moreHref: "#/books" }),
      renderBookRow({ id: "row-free", title: "رایگان‌ها", books: pick({ free: true }, 8), moreHref: utils.buildBooksHash({ free: "1" }) })
    ]);
    return { title: title, node: node };
  }

  App.pages = App.pages || {};
  App.pages.home = renderHomePage;
})(window.App = window.App || {});
