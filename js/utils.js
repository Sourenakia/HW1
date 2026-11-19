// Generic helpers with no knowledge of app state: DOM building, icons,
// number/price formatting and hash-link building.
(function (App) {
  "use strict";

  var SITE_NAME = "کتاب‌خوان فارسی";

  // ---------- Digits & formatting ----------

  var PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

  function toPersianDigits(value) {
    return String(value).replace(/\d/g, function (digit) {
      return PERSIAN_DIGITS[digit];
    });
  }

  // Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to Latin (0-9).
  function toLatinDigits(text) {
    return String(text)
      .replace(/[۰-۹]/g, function (digit) {
        return String(PERSIAN_DIGITS.indexOf(digit));
      })
      .replace(/[٠-٩]/g, function (digit) {
        return String(digit.charCodeAt(0) - 0x0660);
      });
  }

  // Makes Persian text comparable for search: Arabic ي/ك → Persian ی/ک,
  // ۀ → ه, harakat/hamza marks removed, ZWNJ treated as a space,
  // Latin lower-cased, whitespace collapsed and trimmed.
  function normalizeText(text) {
    return String(text)
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/ۀ/g, "ه")
      .replace(/[ً-ٰٟ]/g, "")
      .replace(/‌/g, " ")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
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

  // ---------- DOM ----------

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

  var ICON_PATHS = {
    heart: "M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z",
    search: "M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13zM20 20l-4.8-4.8",
    menu: "M4 7h16M4 12h16M4 17h16",
    moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
    "chevron-right": "M9 5l7 7-7 7",
    "chevron-left": "M15 5l-7 7 7 7",
    sun: "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
  };

  // Decorative only: the owning control always carries its own accessible name.
  function createIcon(name) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", ICON_PATHS[name]);
    svg.appendChild(path);
    return svg;
  }

  // ---------- Hash links ----------

  // Builds "#/books?..." from a plain object, skipping empty values.
  function buildBooksHash(values) {
    var params = new URLSearchParams();
    Object.keys(values || {}).forEach(function (key) {
      var value = values[key];
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      }
    });
    var query = params.toString();
    return "#/books" + (query ? "?" + query : "");
  }

  App.utils = {
    SITE_NAME: SITE_NAME,
    toPersianDigits: toPersianDigits,
    toLatinDigits: toLatinDigits,
    normalizeText: normalizeText,
    formatNumber: formatNumber,
    formatPrice: formatPrice,
    formatRating: formatRating,
    el: el,
    createIcon: createIcon,
    buildBooksHash: buildBooksHash
  };
})(window.App = window.App || {});
