'use strict';

/**
 * @ngdoc function
 * @name quikieApp.controller:IntroCtrl
 * @description
 * # IntroCtrl
 * Controller of the quikieApp
 */
angular.module('quikieApp')
  .controller('IntroCtrl', function ($scope, $state) {

    $scope.goLogin = function () {
      $state.go('login');
    }

  });
