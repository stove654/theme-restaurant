/**
 * Created by jodomax-user-1 on 21-Sep-15.
 */
'use strict';

angular.module('quikieApp')
  .factory('auth', ['$http', '$rootScope', 'logger', 'localStorageService', '$q', 'appConstant',
    function ($http, $rootScope, logger, localStorageService, $q, appConstant) {
    /**
     * setting for logger Factory
     *
     * @param {string} moduleName Module Name
     * @param {boolean} disableLog.info Enable or Disable info log
     * @param {boolean} disableLog.error Enable or Disable error log
     */
    logger.moduleName = 'Auth Factory';

    var _userKey = 'user';
    var _tokenKey = 'token';
    var _lastLoginNameKey = 'lastLoginName';
    var _authorizationKey = 'Authorization';

    var _setHeaderToken = function (token) {
      $http.defaults.headers.common[_authorizationKey] = token;

      logger.info('_setHeaderToken', 'done', true);
    };

    var _clearHeaderToken = function() {
      delete $http.defaults.headers.common[_authorizationKey];

      logger.info('_clearHeaderToken', 'done', true);
    };

    return {
      pendingStateChange: null,

      clearCurrentUser: function() {
        this.clearUser();

        logger.info('clearCurrentUser', 'done', true);
      },

      setCurrentUser: function(user) {
        user.nextState = 'main.home';

        this.setUser(user);

        logger.info('setCurrentUser', 'done', true);
      },

      getCurrentUser: function() {
        var user = this.getUser();
        if (user) {
          user.nextState = 'main.home';
        }

        logger.info('getCurrentUser', 'done', true);
        return user;
      },

      clearUser : function () {
        this.user = null;
      },

      setUser: function(user){
        this.user = user;
      },

      getUser : function () {
        return this.user || null;

      },

      setToken: function(token) {
        _setHeaderToken(token);
        localStorageService.set(_tokenKey, token);
      },

      getToken: function () {
        return localStorageService.get(_tokenKey);
      },

      clearToken : function () {
        _clearHeaderToken();
        localStorageService.set(_tokenKey, null);
      },

      setHeaderToken: function() {
        var token = this.getToken();

        if (token) {
          _setHeaderToken(token);
        }

        logger.info('setHeaderToken', 'done', true);
      },

      assignSocketIoEvent: function(callBack) {
        window.socketIo.on('connect', function () {
          logger.info('connectSocketIo', 'established a working and authorized connection success', true);

          callBack(true);
        });

        window.socketIo.on('disconnect', function () {
          logger.info('connectSocketIo', 'disconnect by some reason', true);
        });

        window.socketIo.on('error', function (reason) {
          logger.error('connectSocketIo', 'error', reason);

          callBack(false);
        });
      },

      connectSocketIo: function(callBack) {
        logger.info('connectSocketIo', 'starting', true);

        var token = this.getToken();

        if (!window.socketIo) {
          logger.info('connectSocketIo', 'connect first time', true);
          //window.socketIo = window.io.connect(appConstant.apiUrl + '/crud?token=' + token, {'force new connection': true});
          window.socketIo = window.io.connect(appConstant.apiUrl + '/notification?token=' + token, {'force new connection': true});

          this.assignSocketIoEvent(callBack);
        } else {
          window.socketIo.disconnect();
          logger.info('connectSocketIo', 'disconnect', true);

          //window.socketIo = window.io.connect(appConstant.apiUrl + '/crud?token=' + token, {'force new connection': true});
          window.socketIo = window.io.connect(appConstant.apiUrl + '/notification?token=' + token, {'force new connection': true});
          logger.info('connectSocketIo', 're-connect', true);

          this.assignSocketIoEvent(callBack);
        }


      },

      resolvePendingState: function (httpPromise) {
        var _functionName = 'resolvePendingState';
        logger.info(_functionName, 'starting', true);

        var checkUser = $q.defer();
        var me = this;
        var pendingState = me.pendingStateChange;

        httpPromise
          .success(function(data){
            if (data.success) {
              me.setCurrentUser(data.user);

              if (pendingState.to.accessLevel === undefined || me.authorize(pendingState.to.accessLevel) ) {
                logger.info(_functionName, 'success and authorized', true);

                checkUser.resolve();
              } else {
                logger.info(_functionName, 'success BUT Unauthorized', true);

                checkUser.reject( 'unauthorized' ); // may be 403
              }
            } else {
              checkUser.reject( '401' );

              logger.info(_functionName, 'error', data.message);
            }
          })
          .error(function (err, status, headers, config) {
            checkUser.reject( status.toString() );

            logger.info(_functionName, 'error', err);
          });

        me.pendingStateChange = null;
        return checkUser.promise;
      },

      //login: function (username, password, cb) {
      login: function (loginInfo, cb) {
        var me = this;

        //var loginType = loginInfo.loginType;
        //var username = loginInfo.username;
        //var password = loginInfo.password;

        $rootScope.crudProcessing = true;

        $http(
          {
            'method': 'POST',
            //'data': { siteId: appConstant.siteId, 'username': username, 'password': password},
            'data': loginInfo,
            'url': appConstant.apiUrl + '/login'
          })
          .success(function(data) { //.success(function(data, status, headers, config)
            logger.info('login', 'success', true);

            var user = data.user;
            var token = data.token;

            me.setCurrentUser(user);
            me.setToken(token);
            me.setLastLoginName();
            me.pendingStateChange = null;

            $rootScope.crudProcessing = false;
            $rootScope.loginError = '';

            cb(null, data);
          })
          .error(function (err) {
            logger.error('login', 'error', err);

            $rootScope.crudProcessing = false;
            $rootScope.loginError = err;

            cb(err, null);
          });
      },

      signUp: function (signUpInfo, cb) {
        var me = this;

        $rootScope.crudProcessing = true;

        $http(
          {
            'method': 'POST',
            'data': signUpInfo,
            'url': appConstant.apiUrl + '/register'
          })
          .success(function(data) { //.success(function(data, status, headers, config)
            if (data.success) {
              logger.info('signUp', 'success', true);

              cb(null, data.message);
              $rootScope.signUpError = '';
            } else {
              logger.error('signUp', 'error', data.message);

              cb(data.message, null);
              $rootScope.signUpError = data.message;
            }
          })
          .error(function (err) {
            logger.error('signUp', 'error', err);

            $rootScope.signUpError = err;
            cb(err, null);
          });
      },

      fbLogin: function (info, cb) {
        var me = this;
        $rootScope.crudProcessing = true;

        $http(
          {
            'method': 'POST',
            'data': { siteId: 0, 'email': info.email, 'name': name, fbId: info.fbId},
            'url': appConstant.apiUrl + '/fbLogin'
          })
          .success(function(data) { //.success(function(data, status, headers, config)
            logger.info('login', 'success', true);

            var user = data.user;
            var token = data.token;

            me.setCurrentUser(user);
            me.setToken(token);
            me.setLastLoginName();
            me.pendingStateChange = null;

            $rootScope.crudProcessing = false;
            $rootScope.loginError = '';

            cb(null, data);
          })
          .error(function (err) {
            logger.error('login', 'error', err);

            $rootScope.crudProcessing = false;
            $rootScope.loginError = err;

            cb(err, null);
          });
      },

      logout: function (callBack) {
        var me = this;
        $rootScope.logoutProcessing = true;

        $http(
          {
            'method': 'POST',
            'url': appConstant.apiUrl + '/logout'
          })
          .success(function(data) {
            logger.info('logout', 'success', true);

            me.clearCurrentUser();
            me.clearToken();

            $rootScope.logoutProcessing = false;

            callBack(true);
          })
          .error(function (err) {
            logger.error('logout', 'error', err);

            $rootScope.logoutProcessing = false;

            callBack(false);
          });
      },

      setLastLoginName: function() {
        //$cookieStore.put(_lastLoginNameKey, this.getUserName());
        localStorageService.set(_lastLoginNameKey, this.getUserName());
      },

      getLastLoginName: function() {
        //return $cookieStore.get(_lastLoginNameKey);
        return localStorageService.get(_lastLoginNameKey);
      },

      getUserId: function() {
        var user = this.getUser();

        if (!!user) {
          return user.id;
        }
        return '';
      },

      getUserName: function() {
        var user = this.getUser();

        if (!!user) {
          return user.name;
        }
        return '';
      },

      getUserFullName: function() {
        var user = this.getUser();

        if (!!user) {
          return user.fullname;
        }
        return '';
      },

      getUserRole: function() {
        var user = this.getUser();

        if (!!user) {
          return user.role;
        }

        return null;
      },

      getUserSite: function() {
        var user = this.getUser();

        if (!!user && user.site) {
          return user.site;
        }

        return null;
      },

      authorize: function(accessLevel) {
        var userRole = this.getUserRole();

        if (null !== userRole) {
          var result = accessLevel.bitMask <= userRole.bitMask;

          logger.info('authorize', 'result', result);

          return result;
        } else {
          logger.info('authorize', 'userRole', 'null');

          return false;
        }
      }
    };
  }]);

