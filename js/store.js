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

  function findCategoryById(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return null;
  }

  // A sample counts only if it has at least one paragraph; null/missing = none.
  function hasSample(book) {
    return Array.isArray(book.sample) && book.sample.length > 0;
  }

  // Other books of the same category, best rated first.
  function getRelatedBooks(book) {
    return BOOKS.filter(function (other) {
      return other.category === book.category && other.id !== book.id;
    }).sort(function (a, b) {
      return b.rating - a.rating;
    });
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

  function normalizePhone(raw) {
    return toLatinDigits(raw).trim();
  }

  // Validators return an error message, or "" when the value is valid.
  function validateName(name) {
    return String(name).trim() === "" ? "نام نمایشی را وارد کنید." : "";
  }

  function validatePhone(raw) {
    var phone = normalizePhone(raw);
    if (phone === "") return "شمارهٔ موبایل را وارد کنید.";
    if (!/^09\d{9}$/.test(phone)) return "شماره باید ۱۱ رقم باشد و با ۰۹ شروع شود.";
    return "";
  }

  function isValidPhone(phone) {
    return validatePhone(phone) === "";
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

  // The single path for every change: update state, persist, then tell
  // listeners which part changed so they can update the page.
  function setState(part, value) {
    state[part] = value;
    saveState(part);
    changeListeners.forEach(function (listener) {
      listener(part);
    });
  }

  // ---------- Favorites & library ----------

  function isFavorite(id) {
    return state.favorites.indexOf(id) !== -1;
  }

  // Returns true if the book is a favorite after the toggle.
  function toggleFavorite(id) {
    var wasFavorite = isFavorite(id);
    var next = wasFavorite
      ? state.favorites.filter(function (favId) { return favId !== id; })
      : state.favorites.concat(id);
    setState("favorites", next);
    return !wasFavorite;
  }

  function isOwned(id) {
    return state.library.indexOf(id) !== -1;
  }

  // Never adds a book twice. Returns true only if the book was newly added.
  function addToLibrary(id) {
    if (isOwned(id) || !findBookById(id)) return false;
    setState("library", state.library.concat(id));
    return true;
  }

  App.store = {
    state: state,
    loadState: loadState,
    setState: setState,
    onChange: onChange,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    isOwned: isOwned,
    addToLibrary: addToLibrary,
    isValidPhone: isValidPhone,
    normalizePhone: normalizePhone,
    validateName: validateName,
    validatePhone: validatePhone,
    findBookById: findBookById,
    findCategoryById: findCategoryById,
    hasSample: hasSample,
    getRelatedBooks: getRelatedBooks,
    getCategoriesInUse: getCategoriesInUse,
    getDiscountPercent: getDiscountPercent,
    getFinalPrice: getFinalPrice,
    getRatingCount: getRatingCount
  };
})(window.App = window.App || {});
