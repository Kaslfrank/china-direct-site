(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var referrer = document.referrer || '';
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  var isQaEntry =
    params.get('qa') === '1' ||
    params.get('utm_source') === 'codex_test' ||
    params.get('utm_medium') === 'qa' ||
    /metrika\.yandex\.(ru|com)/i.test(referrer) ||
    /search\.google\.com\/search-console/i.test(referrer);

  if (isQaEntry) {
    try {
      sessionStorage.setItem('chinadirect_qa_session', '1');
    } catch (error) {
      // Analytics can still be disabled for the current page when storage is unavailable.
    }
  }

  var isQaSession = false;
  try {
    isQaSession = sessionStorage.getItem('chinadirect_qa_session') === '1';
  } catch (error) {
    isQaSession = false;
  }

  window.__chinaDirectAnalyticsDisabled = isLocal || isQaEntry || isQaSession;

  if (window.__chinaDirectAnalyticsDisabled) {
    window['ga-disable-G-R8L3DZK9VP'] = true;
  }
})();
