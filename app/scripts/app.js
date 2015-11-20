'use strict';

/**
 * @ngdoc overview
 * @name quikieApp
 * @description
 * # quikieApp
 *
 * Main module of the application.
 */
angular
  .module('quikieApp', [
    'ionic',
    'LocalStorageModule',
    'ngTouch',
    'ui.router',
    'uiGmapgoogle-maps',
    'quikie',
    'ngResource',
    'ngCollection',
    'LocalStorageModule',
    'toastr'
  ])
  .constant("appConstant", {
    /*
     "apiUrl": "http://quikie-api.jodomax.com",
     "siteId": "55f8bbb23e2dc7865911e7f1", // Jodomax server
     */

    /*
     "apiUrl": "http://192.168.1.99:9999",
     "siteId": "55f90371ba34952f09a48002", // Local server
     */

    //"currencyText": "&#8377;",
    "currencyText": "INR",
    "logoText": "QUiKiE!"
  })
  .config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'qConfig', function ($stateProvider, $urlRouterProvider, $httpProvider, qConfig) {

    $stateProvider
      .state('intro', {
        url: "/intro",
        templateUrl: "views/intro.html",
        controller: "IntroCtrl"
      })
      .state('login', {
        url: "/login",
        templateUrl: "views/login.html",
        controller: "LoginCtrl"
      })
      .state('main', {
        url: "/main",
        resolve: {
          'user': ['$auth', '$q', '$http', function ($auth, $q, $http) {
            var userDefined = $q.defer();

            if ($auth.pendingStateChange) {
              return $auth.resolvePendingState($http.get(qConfig.apiHost + '/validate'));
            } else {
              userDefined.resolve();
            }
            return userDefined.promise;
          }]
        },
        templateUrl: "views/main.html",
        controller: "MainCtrl"
      })
      .state('main.home', {
        url: "/home",
        views: {
          'menuContent': {
            templateUrl: "views/states/home.html",
            controller: "HomeCtrl"
          }
        }
      })
      .state('main.restaurantList', {
        url: "/restaurantList",
        views: {
          'menuContent': {
            templateUrl: "views/states/restaurantList.html",
            controller: "RestaurantListCtrl"
          }
        }
      })
      .state('main.restaurant', {
        url: "/restaurant/:id",
        views: {
          'menuContent': {
            templateUrl: "views/states/restaurant.html",
            controller: "RestaurantCtrl"
          }
        }
      })
      .state('main.category', {
        url: "/category/:type",
        views: {
          'menuContent': {
            templateUrl: "views/states/category.html",
            controller: "CategoryCtrl"
          }
        }
      })
      .state('main.menu', {
        url: "/menu/:type/:idRestaurant",
        views: {
          'menuContent': {
            templateUrl: "views/states/menu.html",
            controller: "MenuCtrl"
          }
        }
      })
      .state('main.order', {
        url: "/order/:type/:idRestaurant",
        views: {
          'menuContent': {
            templateUrl: "views/states/order.html",
            controller: "OrderCtrl"
          }
        }
      })
      .state('main.orderSummary', {
        url: "/orderSummary/:type/:idRestaurant",
        views: {
          'menuContent': {
            templateUrl: "views/states/orderSummary.html",
            controller: "OrderSummaryCtrl"
          }
        }
      })
      .state('main.orderPayment', {
        url: "/orderPayment/:type/:idRestaurant",
        views: {
          'menuContent': {
            templateUrl: "views/states/orderPayment.html",
            controller: "OrderPaymentCtrl"
          }
        }
      })
      .state('main.orderConfirm', {
        url: "/orderConfirm/:type/:idRestaurant",
        views: {
          'menuContent': {
            templateUrl: "views/states/orderConfirm.html",
            controller: "OrderConfirmCtrl"
          }
        }
      })
      .state('main.ordersHistory', {
        url: "/ordersHistory",
        views: {
          'menuContent': {
            templateUrl: "views/states/orders_history.html",
            controller: "OrdersHistoryCtrl"
          }
        }
      })
      .state('main.orderHistory', {
        url: "/ordersHistory/:id",
        views: {
          'menuContent': {
            templateUrl: "views/states/order_history.html",
            controller: "OrderHistoryCtrl"
          }
        }
      });

    //$urlRouterProvider.otherwise("/intro");
    $urlRouterProvider.otherwise("/main/restaurantList");

    /* Intercept http errors */
    /*
     var interceptor = ['$rootScope', '$q', '$location', 'logger', function ( $rootScope, $q, $location, logger ) {

     var success = function ( response ) {
     return response;
     };

     var error = function ( response ) {
     var status = response.status;
     var config = response.config;
     var method = config.method;
     var url = config.url;

     if (400 <= status && status <= 499) {
     logger.moduleName = 'Application-Config';
     var errMsg = 'Method: ' + method + ', url: ' + url + ', status: ' + status;

     logger.error('httpInterceptor', 'Error', errMsg);
     logger.error('httpInterceptor', 'Server response text', response.data);
     }

     return $q.reject(response);
     };

     return function ( promise ) {
     return promise.then(success, error);
     };
     }];

     $httpProvider.responseInterceptors.push(interceptor);
     */


  }])

  .config(function ($ionicConfigProvider) {
    $ionicConfigProvider.views.transition('none');
    $ionicConfigProvider.views.maxCache(0);

  })
  .run(['$rootScope', 'appConstant', '$state', '$ionicHistory', '$logger', '$stateParams', '$auth', '$ionicPlatform', function ($rootScope, appConstant, $state, $ionicHistory, $logger, $stateParams, $auth, $ionicPlatform) {
    $logger.moduleName = 'Application';
    $logger.info('Application', 'run', true);

    $rootScope.backView = function (state, params) {
      if (params) {
        $state.go(state, params);
      } else {
        $state.go(state);
      }
    };

    $ionicPlatform.registerBackButtonAction(function(event) {
      console.log('testing back button android', event);
    }, 100);

    $rootScope.logoText = appConstant.logoText;
    $rootScope.currencyText = appConstant.currencyText;

    $rootScope.goToPage = function (url, id) {
      if (id) {
        $state.go(url, id)
      } else {
        $state.go(url);
      }
    };

    $rootScope.getLogoRestaurent = function (url) {
      if (!url) {
        return 'images/no-avatar.jpg';
      } else {
        return appConfig.mediaHost + url;
      }
    };


    /*
     * $rootScope events
     */
    $rootScope.logout = function () {
      $auth.logout(function (res) {
        $state.go('login');
      });
    };

    $rootScope.$on('$stateChangeSuccess', function () {
      $rootScope.doingResolve = false;
    });

    $rootScope.$on('$stateChangeStart', function (event, to, toParams, from, fromParams) {
      $logger.info('$stateChangeStart', 'change to state', to.name);

      $rootScope.doingResolve = true;

      if ($auth.getCurrentUser() === null) {
        $auth.pendingStateChange = {
          to: to,
          toParams: toParams
        };

        $logger.info('$stateChangeStart', 'current user is NULL', true);

        return;
      }

      if (to.accessLevel === undefined || $auth.authorize(to.accessLevel)) {
        $logger.info('$stateChangeStart', 'authorized', true);

        $rootScope.title = $rootScope.appName + ' - ' + to.title;
        angular.noop();
      } else {
        $logger.info('$stateChangeStart', 'unauthorized - preventDefault', true);

        event.preventDefault();
        $state.go('unauthorized', {error: 'unauthorized'}, {location: false, inherit: false});
      }
    });


    $rootScope.$on('$stateChangeError', function (event, to, toParams, from, fromParams, error) {
      $logger.info('$rootScope.$on', '$stateChangeError', true);

      var errorObj, redirectObj;

      $logger.info('$stateChangeError', 'error', error);

      if (/^[45]\d{2}$/.test(error)) {
        //console.log('come here');
      }

      if (angular.isDefined(to.redirectMap) && angular.isDefined(to.redirectMap[error])) {
        if (typeof to.redirectMap[error] === 'string') {

          return $state.go(to.redirectMap[error], {error: error}, {location: false, inherit: false});

        } else {

          if (typeof to.redirectMap[error] === 'object') {

            redirectObj = to.redirectMap[error];
            return $state.go(redirectObj.state, {error: redirectObj.prefix + error}, {location: false, inherit: false});
          }
        }
      }

      //return $state.go('login', {error: error});
      return $state.go('intro', {error: error});
    });

    $rootScope.$on('unauthenticated', function () {
      $logger.info('unauthenticated', 'go login', true);

      //$state.go('login');
      $state.go('intro');
    });

    /*
     * start application
     */
    $auth.setHeaderToken();
  }]).directive('checkStrength', function () {

    return {
      replace: false,
      restrict: 'EACM',
      link: function (scope, iElement, iAttrs) {

        var strength = {
          colors: ['rgba(65, 136, 171, 0.93)', '#F90', '#FF0', '#9F0', '#0F0'],
          mesureStrength: function (p) {

            var _force = 0;
            var _regex = /[$-/:-?{-~!"^_`\[\]]/g;

            var _lowerLetters = /[a-z]+/.test(p);
            var _upperLetters = /[A-Z]+/.test(p);
            var _numbers = /[0-9]+/.test(p);
            var _symbols = _regex.test(p);

            var _flags = [_lowerLetters, _upperLetters, _numbers, _symbols];
            var _passedMatches = $.grep(_flags, function (el) {
              return el === true;
            }).length;

            _force += 2 * p.length + ((p.length >= 10) ? 1 : 0);
            _force += _passedMatches * 10;

            // penality (short password)
            _force = (p.length <= 6) ? Math.min(_force, 10) : _force;

            // penality (poor variety of characters)
            _force = (_passedMatches == 1) ? Math.min(_force, 10) : _force;
            _force = (_passedMatches == 2) ? Math.min(_force, 20) : _force;
            _force = (_passedMatches == 3) ? Math.min(_force, 40) : _force;

            return _force;

          },
          getColor: function (s) {

            var idx = 0;
            if (s <= 10) {
              idx = 0;
            }
            else if (s <= 30) {
              idx = 1;
            }
            else if (s <= 40) {
              idx = 2;
            }
            else if (s <= 50) {
              idx = 3;
            }
            else {
              idx = 5;
            }

            return {idx: idx + 1, col: this.colors[idx]};

          }
        };

        scope.$watch(iAttrs.checkStrength, function () {
          if (scope.account.password === '') {
            iElement.css({"display": "none"});
          } else {
            var c = strength.getColor(strength.mesureStrength(scope.account.password));
            iElement.css({"display": "inline"});
            iElement.children('li')
              .css({"background": "#DDD"})
              .slice(0, c.idx)
              .css({"background": c.col});
          }
        });

      },
      template: '<li class="point"></li><li class="point"></li><li class="point"></li><li class="point"></li><li class="point"></li>'
    };

  });
