// Demo login page (#/login): name + mobile, no password, no network.
(function (App) {
  "use strict";

  var el = App.utils.el;

  // Only in-app paths like "/book/x" are accepted; anything else goes home.
  function getReturnHash(params) {
    var from = params.get("from") || "";
    if (!/^\/(?!\/)/.test(from) || from.indexOf("/login") === 0) return "#/";
    return "#" + from;
  }

  function renderFormField(options) {
    var errorId = options.id + "-error";
    var input = el("input", options.attrs);
    input.id = options.id;
    var error = el("p", { id: errorId, class: "form-error", hidden: "" });
    return {
      node: el("div", { class: "form-field" }, [
        el("label", { for: options.id, text: options.label }),
        input,
        error
      ]),
      input: input,
      setError: function (message) {
        error.textContent = message;
        error.hidden = message === "";
        if (message) {
          input.setAttribute("aria-invalid", "true");
          input.setAttribute("aria-describedby", errorId);
        } else {
          input.removeAttribute("aria-invalid");
          input.removeAttribute("aria-describedby");
        }
      }
    };
  }

  // Keeps only digits (Persian, Arabic or Latin, shown as typed) and at most 11.
  // Conversion to Latin happens only when validating and saving.
  function keepPhoneDigits(input) {
    var cleaned = input.value.replace(/[^0-9۰-۹٠-٩]/g, "").slice(0, 11);
    if (cleaned !== input.value) input.value = cleaned;
  }

  function renderLoginForm(params) {
    var store = App.store;
    var nameField = renderFormField({
      id: "login-name",
      label: "نام نمایشی",
      attrs: { class: "text-input", type: "text", name: "name", autocomplete: "nickname" }
    });
    var phoneField = renderFormField({
      id: "login-phone",
      label: "شمارهٔ موبایل",
      attrs: {
        class: "text-input text-input--ltr", type: "tel", name: "phone", dir: "ltr",
        // No maxlength: it would cut pasted text like "0912-345 6789" before
        // keepPhoneDigits strips the separators. keepPhoneDigits caps at 11.
        inputmode: "numeric", autocomplete: "tel", placeholder: "۰۹۱۲۳۴۵۶۷۸۹"
      }
    });

    nameField.input.addEventListener("input", function () { nameField.setError(""); });
    phoneField.input.addEventListener("input", function () {
      keepPhoneDigits(phoneField.input);
      phoneField.setError("");
    });

    var form = el("form", { class: "login-form", novalidate: "" }, [
      params.get("reason") === "get"
        ? el("p", { class: "login-form__notice", text: "برای دریافت کتاب ابتدا وارد شوید." })
        : document.createTextNode(""),
      nameField.node,
      phoneField.node,
      el("button", { class: "button button--primary", type: "submit", text: "ورود" }),
      el("p", { class: "login-form__note", text: "ورود فقط نمایشی است؛ رمزی لازم نیست و اطلاعاتی به جایی فرستاده نمی‌شود." })
    ]);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var nameError = store.validateName(nameField.input.value);
      var phoneError = store.validatePhone(phoneField.input.value);
      nameField.setError(nameError);
      phoneField.setError(phoneError);
      if (nameError) { nameField.input.focus(); return; }
      if (phoneError) { phoneField.input.focus(); return; }

      // Change the hash first so the state change renders the destination page.
      location.hash = getReturnHash(params);
      store.setState("user", {
        name: nameField.input.value.trim(),
        phone: store.normalizePhone(phoneField.input.value)
      });
    });
    return form;
  }

  function renderLoggedInNotice(params) {
    var logout = el("button", { class: "button button--neutral", type: "button", text: "خروج" });
    logout.addEventListener("click", function () {
      App.store.setState("user", null);
    });
    return el("div", { class: "login-form" }, [
      el("p", null, [
        document.createTextNode("شما با نام «"),
        el("bdi", { text: App.store.state.user.name }),
        document.createTextNode("» وارد شده‌اید.")
      ]),
      el("a", { class: "button button--primary", href: getReturnHash(params), text: "بازگشت" }),
      logout
    ]);
  }

  function renderLoginPage(params) {
    var title = "ورود";
    var body = App.store.state.user ? renderLoggedInNotice(params) : renderLoginForm(params);
    return {
      title: title,
      node: el("section", { class: "login-page" }, [el("h1", { text: title }), body])
    };
  }

  App.pages = App.pages || {};
  App.pages.login = renderLoginPage;
})(window.App = window.App || {});
