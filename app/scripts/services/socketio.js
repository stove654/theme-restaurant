/**
 * Created by jodomax-user-1 on 25-Sep-15.
 */
'use strict';

angular.module('quikieApp')
  .factory('socketIoFactory', ['$rootScope', '$timeout', 'logger', '$q',
    function ($rootScope, $timeout, logger, $q) {
    /**
     * setting for logger Factory
     *
     * @param {string} moduleName Module Name
     * @param {boolean} disableLog.info Enable or Disable info log
     * @param {boolean} disableLog.error Enable or Disable error log
     */
    logger.moduleName = 'Socket.io Factory';
    logger.disableLog.info = false;
    logger.disableLog.error = false;

    var socketIoFactory = {};

    socketIoFactory.connect = function(token) {
      var defer = $q.defer();

      var socket = window.io.connect($rootScope.apiHost + '/crud?token=' + token);

      socket.on('connect', function () {
        defer.resolve(socket);

        logger.info('socket.io', 'established a working and authorized connection', 'success');
      });

      socket.on('error', function (reason) {
        defer.reject(reason);

        logger.error('socket.io', 'error', reason);
      });

      return defer.promise;
    };

    return socketIoFactory;
  }]);

