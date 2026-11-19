// Book detail page (#/book/<id>) and the simulated purchase dialog.
(function (App) {
  "use strict";

  var el = App.utils.el;
  var renderBookCard = App.components.renderBookCard;

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

  function addAndAnnounce(book) {
    if (App.store.addToLibrary(book.id)) {
      App.components.showToast("کتاب «" + book.title + "» به کتابخانهٔ شما اضافه شد.");
    }
  }

  function openPurchaseDialog(book, opener) {
    var utils = App.utils;
    var finalPrice = App.store.getFinalPrice(book);
    var priceLine = el("p", { class: "dialog__price" }, [
      el("span", { text: "مبلغ: " }),
      el("strong", { text: utils.formatPrice(finalPrice) })
    ]);
    if (finalPrice !== book.price) {
      priceLine.appendChild(el("del", { class: "dialog__original", text: utils.formatPrice(book.price) }));
    }
    App.components.openDialog({
      title: "خرید «" + book.title + "»",
      body: [
        priceLine,
        el("p", { class: "dialog__note", text: "این خرید شبیه‌سازی است و هیچ پرداختی انجام نمی‌شود." })
      ],
      confirmLabel: "تأیید خرید",
      cancelLabel: "انصراف",
      opener: opener,
      onConfirm: function () { addAndAnnounce(book); }
    });
  }

  // Owned → link to the library. Otherwise get (free) or buy (paid);
  // both need a logged-in user. Same id in both states keeps focus after re-render.
  function renderGetControl(book) {
    if (App.store.isOwned(book.id)) {
      return el("a", { id: "detail-get", class: "button button--soft", href: "#/library", text: "در کتابخانهٔ شما ✓" });
    }
    var isFree = book.price === 0;
    var button = el("button", {
      id: "detail-get",
      class: "button " + (isFree ? "button--soft" : "button--primary"),
      type: "button",
      text: isFree ? "دریافت رایگان" : "خرید"
    });
    button.addEventListener("click", function () {
      if (!App.store.state.user) {
        location.hash = App.components.buildLoginHash("get");
      } else if (isFree) {
        addAndAnnounce(book);
      } else {
        openPurchaseDialog(book, button);
      }
    });
    return button;
  }

  function renderPurchaseBox(book) {
    var getButton = renderGetControl(book);

    var readControl;
    if (App.store.hasSample(book)) {
      readControl = el("a", { class: "button button--outline", href: "#/read/" + encodeURIComponent(book.id), text: "خواندن نمونه" });
    } else {
      readControl = el("div", { class: "purchase-box__read" }, [
        // aria-disabled (not disabled) keeps it reachable with Tab, so the
        // explanation is read; it has no click handler, so it does nothing.
        el("button", { class: "button button--outline", type: "button", "aria-disabled": "true", "aria-describedby": "no-sample-note", text: "خواندن نمونه" }),
        el("p", { id: "no-sample-note", class: "purchase-box__note", text: "برای این کتاب نمونه‌ای موجود نیست" })
      ]);
    }

    var favButton = App.components.renderFavoriteButton(book, "detail");
    favButton.id = "detail-fav";

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

  App.pages = App.pages || {};
  App.pages.book = renderBookPage;
  App.pages.bookNotFound = renderBookNotFound;
})(window.App = window.App || {});
