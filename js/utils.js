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

  function toLatinDigits(text) {
    return String(text).replace(/[۰-۹]/g, function (digit) {
      return String(PERSIAN_DIGITS.indexOf(digit));
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
    menu: "M4 7h16M4 12h16M4 17h16"
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
    formatNumber: formatNumber,
    formatPrice: formatPrice,
    formatRating: formatRating,
    el: el,
    createIcon: createIcon,
    buildBooksHash: buildBooksHash
  };
})(window.App = window.App || {});
