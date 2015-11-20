/**
 * @module libraryQuikie
 * @description Parrent of @module core.quikie
 */

'use strict';

angular.module('quikie', ['core.quikie'])
/**
 * @memberOf libraryQuikie
 * @function qConfig
 * @description Description for system
 * @param {String} deviceId ID of device
 * @param {String} apiHost of server REST API
 * @param {String} mediaHost of server
 */
  .constant('qConfig', {
    name: 'QUiKiE!',
    "currencyText": "&#8377;",
    "logoText": "QUiKiE!",
    "slogan": "Book Fast, Eat Slow",


    apiHost: 'http://api-dev.quikie.in',
    siteId: '560f35459863974d0ed70851', // Quikie server
    mediaHost: 'http://api-dev.quikie.in/file-upload'

    /*
     apiHost: 'http://api.quikie.in', // Prod API URL
     siteId: '5627bda9274bc3937007f441', // Olives - Prod database
     mediaHost: 'http://api.quikie.in/file-upload'
     */


    /*  apiHost: 'http://quikie-api.jodomax.com',
     siteId: '55f8bbb23e2dc7865911e7f1', // online server
     mediaHost: 'http://quikie-api.jodomax.com/file-upload'
     */

    /*
     apiHost: 'http://192.168.1.99:9999', //local server
     siteId: '55f90371ba34952f09a48002', //local server
     mediaHost: 'http://192.168.1.99:9999/file-upload'
     */
  });

angular.module('core.quikie', [
  'core.quikie.restful',
  'core.quikie.logger',
  'core.quikie.BaseModel',
  'core.quikie.fetchData',
  //'core.quikie.upload', // bower install ng-file-upload --save
  'core.quikie.auth',
  'core.quikie.socketIo'
]);
angular.module('core.quikie.logger', [])
  .constant('loggerConfig', {
    disableLog: {
      info: true,
      error: false,
      debug: false
    }
  })
  .factory('$logger', ['loggerConfig', function (loggerConfig) {
    /**
     * logger Factory
     *
     * @param {String} moduleName name of the module which will be logged
     * @param {boolean} disableLoginfo disable the info log or not
     * @param {boolean} disableLogerror disable the error log or not
     */

    var _stringify = function (args) {
      var msg = '';

      for (var i = 0; i < args.length; i++) {
        var item = args[i];

        if (angular.isString(item)) {
          msg += item;
        } else {
          msg += JSON.stringify(item, null, '\t') + ' ';
        }
      }

      return msg;
    };

    var _getDateTimeStr = function () {
      var date = new Date();
      var dateStr = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
      var timeStr = date.toLocaleTimeString();
      var result = dateStr + ' ' + timeStr;

      return result;
    };

    var _log = function (logLevel, args) {
      if (loggerConfig.disableLog[logLevel]) {
        return false;
      }

      var separator = ' - ';
      var separatorParam = ': ';

      var moduleName = this.moduleName;
      var functionName = args[0];
      var paramDisplay = args[1];

      args.splice(0, 1); //delete first element;
      args.splice(0, 1); //delete second element;

      var content = _stringify(args);
      var msg = _getDateTimeStr() + separator + moduleName + separator + functionName + separator + paramDisplay + separatorParam + content;

      console[this.functionName[logLevel]](msg);
    };

    return {
      moduleName: 'NO MODULE',
      //disableLog: { info: false, error:false, debug: false },
      functionName: {info: 'info', error: 'error', debug: 'debug'},

      /**
       * log the messages into Info logging
       *
       * @param {String} functionName name of the function need to log
       * @param {String} displayParam the param need to display
       * @param {Array} theValues the values that need to display
       */
      info: function () {
        var args = Array.prototype.slice.call(arguments, 0);

        angular.bind(this, _log, 'info', args)();
      },

      /**
       * log the messages into Error logging
       *
       * @param {String} functionName name of the function need to log
       * @param {String} displayParam the param need to display
       * @param {Array} theValues the values that need to display
       */
      error: function () {
        var args = Array.prototype.slice.call(arguments, 0);
        angular.bind(this, _log, 'error', args)();
      },

      /**
       * log the messages into Error logging
       *
       * @param {String} functionName name of the function need to log
       * @param {String} displayParam the param need to display
       * @param {Array} theValues the values that need to display
       */
      debug: function () {
        var args = Array.prototype.slice.call(arguments, 0);
        angular.bind(this, _log, 'debug', args)();
      }
    };
  }]);

angular.module('core.quikie.restful', ['core.quikie.logger'])
  .service('$restful', ['$resource', 'qConfig', '$logger', function ($resource, qConfig, $logger) {

    $logger.moduleName = 'core.quikie.restful - Restful Service';

    return $resource(qConfig.apiHost + '/:api/:databases/:abc/:collections/:table/:id', {
      api: 'api',
      databases: 'databases',
      abc: 'abc',
      collections: 'collections',
      table: '@table',
      id: '@id'
    }, {
      'get': {method: 'GET'},
      'save': {method: 'POST', params: {}},
      'put': {method: 'PUT', params: {}},
      'query': {method: 'GET', isArray: true},
      'delete': {method: 'DELETE', params: {}}
    });
  }]);


angular.module('core.quikie.BaseModel', ['core.quikie.logger', 'core.quikie.restful'])
  .factory('$baseModel', ['$resource', '$http', '$rootScope', '$logger', '$window', '$restful',
    function ($resource, $http, $rootScope, $logger, $window, $restful) {
      $logger.moduleName = 'BaseModel Factory';

      var BaseModel = function (tableName, data) {
        this.omitFields = ['omitFields', 'tableName', 'busy', 'cid', 'acceptSocket'];
        this.tableName = tableName;
        this.busy = false;
        this.acceptSocket = false;
        this.socketData = {};
        //this.cid = window.uuid.v4();

        var me = this;
        angular.extend(me, data);
      };

      BaseModel.prototype.fetch = function () {
        var me = this;

        if (me.busy) {
          return;
        }
        me.busy = true;

        $restful.get({table: me.tableName, id: me.id}, function (resp) {
          me.busy = false;

          if (resp.success) {
            if (angular.isObject(window.data)) {
              angular.extend(me, window.data);

              if (me._id) {
                me.id = me._id;
              }
            } else {

            }
          } else {
            //var errMsg = resp.message;
            //todo: send or broadcast errMsg to somewhere
          }

          $logger.debug('fetch', 'resp', resp);
        });
      };

      BaseModel.prototype.save = function (callback) {
        $logger.info('save model', 'start', true);

        var me = this;
        var _isNew = false;

        if (me.busy) {
          return;
        }
        me.busy = true;

        if (me.id) {
          _isNew = false;
        } else {
          _isNew = true;
        }

        var saveData = window._.omit(me, me.omitFields);

        if (_isNew) {
          $logger.info('$restful save', 'start', true);
          $restful.save({table: me.tableName}, saveData, function (resp) {
            me.busy = false;

            if (resp.success) {
              me._id = resp.data._id;
              me.id = me._id;
              if (me.acceptSocket) {
                console.log('$restful save', 'acceptSocket', true);

                var socketData = {
                  table: me.tableName,
                  action: 'create',
                  id: resp.data._id
                };

                if (me.socketData) {
                  socketData = window._.extend(socketData, me.socketData);
                }

                window.socketIo.emit('socket', socketData);
              }
            } else {
              //var errMsg = resp.message;
              //TODO: send or broadcast errMsg to somewhere

            }

            $logger.info('create new model', 'resp', resp);

            if (callback) {
              callback(resp.success ? null : resp.message, resp.data);
            }
          });
        } else {
          $logger.info('$restful put', 'start', true);
          $restful.put({table: me.tableName, id: me.id}, saveData, function (resp) {
            me.busy = false;

            if (resp.success) {
              if (me.acceptSocket) {
                console.log('$restful put', 'acceptSocket', true);
                var socketData = {
                  table: me.tableName,
                  action: 'update',
                  id: resp.data.id
                };

                if (me.socketData) {
                  socketData = window._.extend(socketData, me.socketData);
                }

                window.socketIo.emit('socket', socketData);
              }
              //TODO:
            } else {
              //var errMsg = resp.message;
              //TODO: send or broadcast errMsg to somewhere
            }

            $logger.info('update existing model', 'resp', resp);

            if (callback) {
              callback(resp.success ? null : resp.message, resp.data);
            }
          });
        }
      };

      BaseModel.prototype.destroy = function (callback) {
        var me = this;

        if (me.busy) {
          return;
        }
        me.busy = true;


        $restful.delete({table: me.tableName, id: me.id}, function (resp) {
          me.busy = false;

          if (resp.success) {

            if (me.acceptSocket) {
              var socketData = {
                table: me.tableName,
                action: 'delete',
                id: resp.data.id
              };

              if (me.socketData) {
                socketData = window._.extend(socketData, me.socketData);
              }

              window.socketIo.emit('socket', socketData);
            }

            if (callback) {
              callback(null, resp.data);
            }
          } else {
            //var errMsg = resp.message;
            //TODO: send or broadcast errMsg to somewhere
            if (callback) {
              callback(resp.message, null);
            }
          }

          $logger.info('delete model', 'resp', resp);
        });
      };


      return BaseModel;
    }]);

angular.module('core.quikie.fetchData', ['core.quikie.logger', 'core.quikie.restful', 'core.quikie.BaseModel'])
  .factory('$fetchData', ['$baseModel', '$restful', '$q', '$collection', '$logger', function ($baseModel, $restful, $q, $collection, $logger) {

    $logger.moduleName = 'Fetch Data Factory';

    var fetchData;

    fetchData = {
      getData: function (tableName, start, limit, filters, sorters) {

        var _start, _limit, _filters, _sorters;

        var defer = $q.defer();
        var collection = $collection;
        var dataCollection = null;

        dataCollection = collection.getInstance();


        _start = start || 0;
        _limit = limit || 1000;
        _filters = JSON.stringify(filters) || null;
        _sorters = JSON.stringify(sorters) || null;


        $restful.get({
          table: tableName,
          start: _start,
          limit: _limit,
          filter: _filters,
          sort: _sorters
        }, function (resp) {
          if (resp.success) {
            var items = resp.data;
            angular.forEach(items, function (item) {
              var dataModel = new $baseModel(tableName, item);

              dataCollection.add(dataModel);
            });
            dataCollection.total = resp.total;
            defer.resolve(dataCollection);

          } else {
            defer.reject(resp.message);
          }
        }, function (err) {
          defer.reject(err);
        });

        return defer.promise;
      },
      getDataV2: function (tableName, query) {
        query = query || {};

        var _start, _limit, _filters, _sorters;

        var defer = $q.defer();
        var collection = $collection;
        var dataCollection = null;

        dataCollection = collection.getInstance();


        _start = query.start || 0;
        _limit = query.limit || 1000;
        _filters = JSON.stringify(query.filters) || null;
        _sorters = JSON.stringify(query.sorters) || null;


        $restful.get({
          table: tableName,
          start: _start,
          limit: _limit,
          filter: _filters,
          sort: _sorters
        }, function (resp) {
          if (resp.success) {
            var items = resp.data;
            angular.forEach(items, function (item) {
              var dataModel = new $baseModel(tableName, item);

              dataCollection.add(dataModel);
            });
            dataCollection.total = resp.total;
            defer.resolve(dataCollection);

          } else {
            defer.reject(resp.message);
          }
        }, function (err) {
          defer.reject(err);
        });

        return defer.promise;
      }
    };
    return fetchData;
  }]);

angular.module('core.quikie.upload', ['ngFileUpload'])
  .factory('qUpload', ['$logger', '$q', 'Upload', 'qConfig', function ($logger, $q, Upload, qConfig) {
    $logger.moduleName = 'Quikie upload';
    var uploadImage;
    uploadImage = {
      upload: function (files, folder) {
        var _def = $q.defer();
        if (files && files.length) {
          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            Upload.upload({
              url: qConfig.mediaHost,
              fields: {'tableName': folder},
              file: file
            }).progress(function (evt) {
              var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            }).success(function (data, status, headers, config) {
              _def.resolve(qConfig.apiHost + '/' + data.url);
            }).error(function (data, status, headers, config) {
              _def.reject(data);
            });
          }
        }
        return _def.promise;
      }
    };
    return uploadImage;

  }]);

angular.module('core.quikie.auth', ['core.quikie.logger', 'core.quikie.restful', 'core.quikie.fetchData'])
  .factory('$auth', ['$http', '$rootScope', '$logger', 'localStorageService', '$q', 'qConfig', 'toastr',
    function ($http, $rootScope, $logger, localStorageService, $q, qConfig, toastr) {
      /**
       * setting for $logger Factory
       *
       * @param {string} moduleName Module Name
       * @param {boolean} disableLog.info Enable or Disable info log
       * @param {boolean} disableLog.error Enable or Disable error log
       */
      $logger.moduleName = 'Auth Factory';


      var _userKey = 'user';
      var _tokenKey = 'token';
      var _lastLoginNameKey = 'lastLoginName';
      var _authorizationKey = 'Authorization';

      var _setHeaderToken = function (token) {
        $http.defaults.headers.common[_authorizationKey] = token;

        $logger.info('_setHeaderToken', 'done', true);
      };

      var _clearHeaderToken = function () {
        delete $http.defaults.headers.common[_authorizationKey];

        $logger.info('_clearHeaderToken', 'done', true);
      };

      return {
        pendingStateChange: null,

        clearCurrentUser: function () {
          this.clearUser();

          $logger.info('clearCurrentUser', 'done', true);
        },

        setCurrentUser: function (user) {
          user.nextState = 'main.pos';

          this.setUser(user);

          $logger.info('setCurrentUser', 'done', true);
        },

        getCurrentUser: function () {
          var user = this.getUser();
          var userRole = this.getUserRole();

          if (user && userRole) {
            if (userRole.title === 'admin' || userRole.title === 'admin') {
              user.nextState = 'main.dashboard';
            } else if (userRole.title === 'kitchen') {
              user.nextState = 'main.kitchen';
            }
            else {
              user.nextState = 'main.pos';
            }
          }

          //$logger.info('getCurrentUser', 'user:', user);
          return user;
        },

        clearUser: function () {
          this.user = null;
        },

        setUser: function (user) {
          this.user = user;
        },

        getUser: function () {
          return this.user || null;

        },

        setToken: function (token) {
          _setHeaderToken(token);
          localStorageService.set(_tokenKey, token);
        },

        getToken: function () {
          return localStorageService.get(_tokenKey);
        },

        clearToken: function () {
          _clearHeaderToken();
          localStorageService.set(_tokenKey, null);
        },

        setHeaderToken: function () {
          var token = this.getToken();

          //console.log('token', token);
          if (token) {
            _setHeaderToken(token);
          }

          $logger.info('setHeaderToken', 'done', true);
        },

        assignSocketIoEvent: function (callBack) {
          window.socketIo.on('connect', function () {
            $logger.info('connectSocketIo', 'established a working and authorized connection success', true);

            callBack(true);
          });

          window.socketIo.on('disconnect', function () {
            $logger.info('connectSocketIo', 'disconnect by some reason', true);
          });

          window.socketIo.on('error', function (reason) {
            $logger.error('connectSocketIo', 'error', reason);

            callBack(false);
          });

          window.socketIo.on('order_done', function (data) {
            console.log('window.socketIo.on order_done, data: ', data);
            $rootScope.$broadcast('order_done', data);
          });
        },

        connectSocketIo: function (callBack) {
          $logger.info('connectSocketIo', 'starting', true);

          var token = this.getToken();

          if (!window.socketIo) {
            $logger.info('connectSocketIo', 'connect first time', true);
            window.socketIo = window.io.connect(qConfig.apiHost + '/frontend?token=' + token, {'force new connection': true});

            this.assignSocketIoEvent(callBack);
          } else {
            /*
             window.socketIo.disconnect();
             $logger.info('connectSocketIo', 'disconnect', true);

             window.socketIo = window.io.connect(qConfig.apiHost + '/frontend?token=' + token, {'force new connection': true});
             $logger.info('connectSocketIo', 're-connect', true);

             this.assignSocketIoEvent(callBack);
             */
          }
        },

        disconnectSocketIo: function () {
          if (!!window.socketIo) {
            window.socketIo.disconnect();
            $logger.debug('connectSocketIo', 'disconnect', true);
            window.socketIo = null;
          }
        },

        resolvePendingState: function (httpPromise) {
          var _functionName = 'resolvePendingState';
          $logger.info(_functionName, 'starting', true);

          var checkUser = $q.defer();
          var me = this;
          var pendingState = me.pendingStateChange;

          httpPromise
            .success(function (data) {
              if (data.success) {
                me.setCurrentUser(data.user);

                if (pendingState.to.accessLevel === undefined || me.authorize(pendingState.to.accessLevel)) {
                  $logger.info(_functionName, 'success and authorized', true);

                  checkUser.resolve();
                } else {
                  $logger.info(_functionName, 'success BUT Unauthorized', true);

                  checkUser.reject('unauthorized'); // may be 403
                }
              } else {
                checkUser.reject('401');

                $logger.info(_functionName, 'error', data.message);
              }
            })
            .error(function (err, status, headers, config) {
              checkUser.reject(status.toString());

              $logger.info(_functionName, 'error', err);
            });

          me.pendingStateChange = null;
          return checkUser.promise;
        },

        login: function (loginInfo, cb) {
          var me = this;

          $rootScope.crudProcessing = true;

          $http(
            {
              'method': 'POST',
              'data': loginInfo,
              'url': qConfig.apiHost + '/login'
            })
            .success(function (data) { //.success(function(data, status, headers, config)
              $logger.info('login', 'success', true);

              var user = data.user;
              var token = data.token;
              $logger.info('login', 'token', token);

              me.setCurrentUser(user);
              me.setToken(token);
              me.setLastLoginName();
              me.pendingStateChange = null;

              $rootScope.crudProcessing = false;
              $rootScope.loginError = '';

              cb(null, data);
            })
            .error(function (err) {
              //$logger.error('login', 'error', err);
              toastr.error("Error", "Invalid login !");

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
              'url': qConfig.apiHost + '/register'
            })
            .success(function (data) { //.success(function(data, status, headers, config)
              if (data.success) {
                $logger.info('signUp', 'success', true);

                cb(null, data.message);
                $rootScope.signUpError = '';
              } else {
                $logger.error('signUp', 'error', data.message);

                cb(data.message, null);
                $rootScope.signUpError = data.message;
              }
            })
            .error(function (err) {
              $logger.error('signUp', 'error', err);

              $rootScope.signUpError = err;
              cb(err, null);
            });
        },

        logout: function (callBack) {
          var me = this;
          $rootScope.logoutProcessing = true;

          $http(
            {
              'method': 'POST',
              'url': qConfig.apiHost + '/logout'
            })
            .success(function (data) {
              $logger.info('logout', 'success', true);

              me.clearCurrentUser();
              me.clearToken();
              me.disconnectSocketIo();

              $rootScope.logoutProcessing = false;

              callBack(true);
            })
            .error(function (err) {
              $logger.error('logout', 'error', err);

              $rootScope.logoutProcessing = false;

              callBack(false);
            });
        },

        setLastLoginName: function () {
          //$cookieStore.put(_lastLoginNameKey, this.getUserName());
          localStorageService.set(_lastLoginNameKey, this.getUserName());
        },

        getLastLoginName: function () {
          //return $cookieStore.get(_lastLoginNameKey);
          return localStorageService.get(_lastLoginNameKey);
        },

        getUserId: function () {
          var user = this.getUser();

          if (!!user) {
            return user.id;
          }
          return '';
        },

        getUserName: function () {
          var user = this.getUser();

          if (!!user) {
            return user.name;
          }
          return '';
        },

        getUserFullName: function () {
          var user = this.getUser();

          if (!!user) {
            return user.fullname;
          }
          return '';
        },

        getUserRole: function () {
          var user = this.getUser();
          if (!!user) {
            return user.role;
          }

          return null;
        },

        getUserSite: function () {
          var user = this.getUser();

          if (!!user && user.site) {
            return user.site;
          }

          return null;
        },

        authorize: function (accessLevel) {
          var userRole = this.getUserRole();

          if (null !== userRole) {
            //var result = accessLevel.bitMask <= userRole.bitMask;
            var result = accessLevel.bitMask == userRole.bitMask;

            $logger.info('authorize', 'result', result);

            return result;
          } else {
            $logger.info('authorize', 'userRole', 'null');

            return false;
          }
        }
      };
    }]);

angular.module('core.quikie.socketIo', [])
  .factory('$socketIo', function ($rootScope) {
    var socket = window.socketIo;
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    };
  });

