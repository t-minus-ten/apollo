(function () {
  'use strict';

  function handleFirstTab(e) {
    if (e.keyCode === 9) {
      document.body.classList.add('u-keyboard-user');
      window.removeEventListener('keydown', handleFirstTab);
    }
  }
  /**
   * Site Default fucntions
   *
   */


  function initSiteDefaults() {
    // Add keyboard user class
    window.addEventListener('keydown', handleFirstTab);
  }

  (function ($) {
    initSiteDefaults();
  })(jQuery);

}());

//# sourceMappingURL=app.js.map
