// The not-found page for unknown routes.
(function (App) {
  "use strict";

  var el = App.utils.el;

  function renderNotFoundPage() {
    var title = "صفحه پیدا نشد";
    var node = el("section", null, [
      el("h1", { text: title }),
      el("a", { href: "#/", text: "بازگشت به صفحهٔ اصلی" })
    ]);
    return { title: title, node: node };
  }

  App.pages = App.pages || {};
  App.pages.notFound = renderNotFoundPage;
})(window.App = window.App || {});
