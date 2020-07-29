/**
 * ES6 module implementation of Paul Irish's DOM based routing
 * @link https://gist.github.com/nathanaelnsmith/efc1ce2dd0b78db11632d47727361319
 *
 */


/**
 * Example usage:
 *
 * import Router from './modules/DomBasedRouter';
 *
 * let routes = {
 *   'common': {
 *     init() {
 *       commonInit();
 *     },
 *     finalize() {
 *       commonFinalize();
 *     }
 *   },
 *   'front_page': {       // a page body class
 *     init() {
 *       // functions, etc that should only run on home page
 *     }
 *   }
 * };

 * let router = new Router(routes);
 * router.load();
 */

export default (routes) => {
  return {
    fire (func,funcname, args){
      funcname = (funcname === undefined) ? 'init' : funcname;
      if (func !== '' && routes[func] && typeof routes[func][funcname] == 'function'){
        routes[func][funcname](args);
      }
    },
    load() {
      var bodyId = document.body.id;
      let Router = this;
      // hit up common first.
      Router.fire('common');

      // do all the classes too.
      $.each(document.body.className.replace(/-/g, '_').split(/\s+/),function(i,classnm){
        Router.fire(classnm);
        Router.fire(classnm,bodyId);
      });

      Router.fire('common','finalize');
    }
  };
};
