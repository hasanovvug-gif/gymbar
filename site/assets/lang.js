/* Переключатель языка для статических страниц.
   Страница объявляет window.T = { en: {...}, ru: {...} } и, при нужде, window.render(dict).
   Элементы с data-i18n="key" получают текст, data-i18n-html="key" — разметку. */
(function () {
  var KEY = 'gymbar.lang';

  function pick() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved === 'en' || saved === 'ru') return saved;
    var nav = (navigator.language || 'en').toLowerCase();
    return (nav.indexOf('ru') === 0 || nav.indexOf('uk') === 0 || nav.indexOf('be') === 0) ? 'ru' : 'en';
  }

  function apply(lang) {
    var dict = window.T[lang] || window.T.en;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n')];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n-html')];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-lang]').forEach(function (el) {
      el.style.display = el.getAttribute('data-lang') === lang ? 'block' : 'none';
    });
    if (dict.pageTitle) document.title = dict.pageTitle;
    if (typeof window.render === 'function') window.render(dict, lang);

    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.setLang === lang));
    });
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.addEventListener('click', function () { apply(b.dataset.setLang); });
    });
    apply(pick());
  });
})();
