// Sample reader (#/read/<id>): font size and theme controls, exit to the book.
(function (App) {
  "use strict";

  var el = App.utils.el;

  var FONT_SIZES = [
    { value: "small", label: "کوچک" },
    { value: "medium", label: "متوسط" },
    { value: "large", label: "بزرگ" }
  ];

  function bookHash(book) {
    return "#/book/" + encodeURIComponent(book.id);
  }

  // Native radios: arrow keys move between sizes, and the checked one is the
  // active size. Ids stay the same across re-renders so focus is restored.
  function renderFontSizeControl() {
    var current = App.store.state.reader;
    var options = [];
    FONT_SIZES.forEach(function (size) {
      var id = "reader-size-" + size.value;
      var input = el("input", { id: id, class: "visually-hidden", type: "radio", name: "reader-size", value: size.value });
      input.checked = size.value === current;
      input.addEventListener("change", function () {
        App.store.setState("reader", size.value);
      });
      options.push(input, el("label", { class: "reader-size", for: id, text: size.label }));
    });
    return el("fieldset", { class: "reader-sizes" }, [el("legend", { text: "اندازهٔ قلم" })].concat(options));
  }

  function renderToolbar(book) {
    return el("div", { class: "reader-toolbar" }, [
      el("a", { class: "button button--neutral", href: bookHash(book), text: "بازگشت به صفحهٔ کتاب" }),
      renderFontSizeControl(),
      App.components.renderThemeToggle("text")
    ]);
  }

  function renderNoSample(book) {
    var title = "نمونهٔ «" + book.title + "»";
    return {
      title: title,
      node: el("section", { class: "empty-state" }, [
        el("h1", { text: book.title }),
        el("p", { text: "برای این کتاب نمونه‌ای موجود نیست." }),
        el("a", { class: "button button--neutral", href: bookHash(book), text: "بازگشت به صفحهٔ کتاب" })
      ])
    };
  }

  function renderReaderPage(id) {
    var book = App.store.findBookById(id);
    if (!book) return App.pages.bookNotFound();
    if (!App.store.hasSample(book)) return renderNoSample(book);

    var paragraphs = book.sample
      .filter(function (text) { return typeof text === "string"; })
      .map(function (text) { return el("p", { text: text }); });

    var article = el("article", { class: "reader", "data-size": App.store.state.reader }, [
      el("header", { class: "reader__header" }, [
        el("h1", { class: "reader__title", text: book.title }),
        el("p", { class: "reader__author", text: book.author + " · نمونهٔ کتاب" })
      ]),
      el("div", { class: "reader__text" }, paragraphs),
      el("footer", { class: "reader__end" }, [
        el("p", { text: "پایان نمونه" }),
        el("a", { class: "button button--primary", href: bookHash(book), text: "رفتن به صفحهٔ کتاب" })
      ])
    ]);

    return {
      title: "نمونهٔ «" + book.title + "»",
      node: el("section", { class: "reader-page" }, [renderToolbar(book), article])
    };
  }

  App.pages = App.pages || {};
  App.pages.reader = renderReaderPage;
})(window.App = window.App || {});
