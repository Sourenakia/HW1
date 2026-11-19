(function () {
  "use strict";

  var SITE_NAME = "کتاب‌خوان فارسی";

  // ---------- Storage ----------

  var STORAGE_KEYS = {
    favorites: "taaghche-hw1:favorites",
    library: "taaghche-hw1:owned",
    user: "taaghche-hw1:user",
    theme: "taaghche-hw1:theme",
    reader: "taaghche-hw1:reader"
  };

  var THEMES = ["light", "dark"];
  var READER_SIZES = ["small", "medium", "large"];

  function getDefaultState() {
    return {
      favorites: [],
      library: [],
      user: null,
      theme: "light",
      reader: "medium"
    };
  }

  var state = getDefaultState();

  // sanitize returns undefined when the stored value has the wrong shape.
  function readStored(key, fallback, sanitize) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      var clean = sanitize(JSON.parse(raw));
      return clean === undefined ? fallback : clean;
    } catch (error) {
      return fallback;
    }
  }

  function writeStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Storage may be full or blocked; the app keeps working in memory.
    }
  }

  // ---------- Validation ----------

  function toLatinDigits(text) {
    return String(text).replace(/[۰-۹]/g, function (digit) {
      return String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
    });
  }

  function isValidPhone(phone) {
    return /^09\d{9}$/.test(toLatinDigits(phone));
  }

  function sanitizeIdList(value) {
    if (!Array.isArray(value)) return undefined;
    var result = [];
    value.forEach(function (id) {
      if (typeof id === "string" && findBookById(id) && result.indexOf(id) === -1) {
        result.push(id);
      }
    });
    return result;
  }

  function sanitizeUser(value) {
    if (value === null) return null;
    if (!value || typeof value !== "object") return undefined;
    if (typeof value.name !== "string" || value.name.trim() === "") return undefined;
    if (typeof value.phone !== "string" || !isValidPhone(value.phone)) return undefined;
    return { name: value.name.trim(), phone: value.phone };
  }

  function sanitizeOneOf(allowed) {
    return function (value) {
      return allowed.indexOf(value) === -1 ? undefined : value;
    };
  }

  var SANITIZERS = {
    favorites: sanitizeIdList,
    library: sanitizeIdList,
    user: sanitizeUser,
    theme: sanitizeOneOf(THEMES),
    reader: sanitizeOneOf(READER_SIZES)
  };

  // ---------- State ----------

  function loadState() {
    var defaults = getDefaultState();
    Object.keys(STORAGE_KEYS).forEach(function (part) {
      state[part] = readStored(STORAGE_KEYS[part], defaults[part], SANITIZERS[part]);
    });
  }

  function saveState(part) {
    writeStored(STORAGE_KEYS[part], state[part]);
  }

  // The single path for every change: update state, persist, re-render.
  function setState(part, value) {
    state[part] = value;
    saveState(part);
    render();
  }

  // ---------- Data ----------

  function findBookById(id) {
    for (var i = 0; i < BOOKS.length; i++) {
      if (BOOKS[i].id === id) return BOOKS[i];
    }
    return null;
  }

  // ---------- Formatting ----------

  var PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

  function toPersianDigits(value) {
    return String(value).replace(/\d/g, function (digit) {
      return PERSIAN_DIGITS[digit];
    });
  }

  function formatNumber(number) {
    var grouped = String(Math.round(number)).replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
    return toPersianDigits(grouped);
  }

  function formatPrice(amount) {
    return amount === 0 ? "رایگان" : formatNumber(amount) + " تومان";
  }

  function formatRating(rating) {
    return toPersianDigits(rating.toFixed(1)).replace(".", "٫");
  }

  // ---------- Pricing ----------

  function getDiscountPercent(book) {
    var percent = book.discountPercent;
    if (book.price === 0) return 0;
    if (!Number.isInteger(percent) || percent < 0 || percent > 90) return 0;
    return percent;
  }

  function getFinalPrice(book) {
    var discounted = book.price * (100 - getDiscountPercent(book)) / 100;
    return Math.round(discounted / 100) * 100;
  }

  // The data has no vote counts, so derive a stable fake one from the id
  // (same book always shows the same number across renders and reloads).
  function getRatingCount(book) {
    var hash = 0;
    for (var i = 0; i < book.id.length; i++) {
      hash = (hash * 31 + book.id.charCodeAt(i)) >>> 0;
    }
    return 50 + (hash % 2950);
  }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (name) {
        if (name === "text") {
          node.textContent = props[name];
        } else {
          node.setAttribute(name, props[name]);
        }
      });
    }
    (children || []).forEach(function (child) {
      node.appendChild(child);
    });
    return node;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";

  function createHeartIcon() {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z");
    svg.appendChild(path);
    return svg;
  }

  // ---------- Components ----------

  function renderCoverBadge(book) {
    if (book.price === 0) {
      return el("span", { class: "book-card__badge book-card__badge--free", text: "رایگان" });
    }
    var percent = getDiscountPercent(book);
    if (percent > 0) {
      return el("span", { class: "book-card__badge book-card__badge--discount", text: "٪" + toPersianDigits(percent) });
    }
    return null;
  }

  function renderCardPrice(book) {
    var box = el("p", { class: "book-card__price" });
    if (book.price === 0) {
      box.appendChild(el("span", { class: "book-card__price-free", text: formatPrice(0) }));
      return box;
    }
    box.appendChild(el("span", { class: "book-card__price-final", text: formatPrice(getFinalPrice(book)) }));
    if (getDiscountPercent(book) > 0) {
      box.appendChild(el("del", { class: "book-card__price-original", text: formatNumber(book.price) }));
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
      el("span", { text: formatRating(book.rating) }),
      el("span", { text: "(" + formatNumber(getRatingCount(book)) + ")" })
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
    favButton.appendChild(createHeartIcon());

    return el("article", { class: "book-card" }, [link, favButton]);
  }

  // ---------- Pages (placeholders) ----------

  function renderPlaceholder(title) {
    return { title: title, node: el("h1", { text: title }) };
  }

  function renderHomePage() {
    var title = "صفحهٔ اصلی";
    // TEMP: grid of all cards for testing renderBookCard.
    var grid = el("div", { class: "book-grid" }, BOOKS.map(renderBookCard));
    return { title: title, node: el("section", null, [el("h1", { text: title }), grid]) };
  }

  function renderBooksPage() {
    return renderPlaceholder("فهرست کتاب‌ها");
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

  // ---------- Router ----------

  // Returns { segments, params }, or null when the hash cannot be decoded.
  function parseHash() {
    var hash = location.hash.replace(/^#\/?/, "");
    var queryStart = hash.indexOf("?");
    var path = queryStart === -1 ? hash : hash.slice(0, queryStart);
    var query = queryStart === -1 ? "" : hash.slice(queryStart + 1);
    try {
      var segments = path.split("/").filter(Boolean).map(decodeURIComponent);
      return { segments: segments, params: new URLSearchParams(query) };
    } catch (error) {
      return null;
    }
  }

  function matchRoute(route) {
    if (!route) return renderNotFoundPage;
    var s = route.segments;
    if (s.length === 0) return renderHomePage;
    if (s.length === 1 && s[0] === "books") return function () { return renderBooksPage(route.params); };
    if (s.length === 1 && s[0] === "library") return renderLibraryPage;
    if (s.length === 1 && s[0] === "login") return renderLoginPage;
    if (s.length === 2 && s[0] === "book") return function () { return renderBookPage(s[1]); };
    if (s.length === 2 && s[0] === "read") return function () { return renderReaderPage(s[1]); };
    return renderNotFoundPage;
  }

  function render() {
    var app = document.getElementById("app");
    var page = matchRoute(parseHash())();
    app.textContent = "";
    app.appendChild(page.node);
    document.title = page.title + " | " + SITE_NAME;
    window.scrollTo(0, 0);
  }

  // ---------- Start ----------

  function init() {
    loadState();
    console.info("state", state); // TEMP: remove once real pages exist
    window.addEventListener("hashchange", render);
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
