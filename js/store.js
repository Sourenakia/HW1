// App state, its persistence in localStorage, and read-only queries on BOOKS.
(function (App) {
  "use strict";

  var toLatinDigits = App.utils.toLatinDigits;

  // ---------- Book data ----------

  function findBookById(id) {
    for (var i = 0; i < BOOKS.length; i++) {
      if (BOOKS[i].id === id) return BOOKS[i];
    }
    return null;
  }

  // Categories that actually have books; labels and order come from CATEGORIES.
  function getCategoriesInUse() {
    return CATEGORIES.filter(function (category) {
      return BOOKS.some(function (book) {
        return book.category === category.id;
      });
    });
  }

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

  var state = getDefaultState();
  var changeListeners = [];

  function loadState() {
    var defaults = getDefaultState();
    Object.keys(STORAGE_KEYS).forEach(function (part) {
      state[part] = readStored(STORAGE_KEYS[part], defaults[part], SANITIZERS[part]);
    });
  }

  function saveState(part) {
    writeStored(STORAGE_KEYS[part], state[part]);
  }

  // Lets app.js hook rendering in without store.js depending on router.js.
  function onChange(listener) {
    changeListeners.push(listener);
  }

  // The single path for every change: update state, persist, re-render.
  function setState(part, value) {
    state[part] = value;
    saveState(part);
    changeListeners.forEach(function (listener) {
      listener();
    });
  }

  App.store = {
    state: state,
    loadState: loadState,
    setState: setState,
    onChange: onChange,
    isValidPhone: isValidPhone,
    findBookById: findBookById,
    getCategoriesInUse: getCategoriesInUse,
    getDiscountPercent: getDiscountPercent,
    getFinalPrice: getFinalPrice,
    getRatingCount: getRatingCount
  };
})(window.App = window.App || {});
