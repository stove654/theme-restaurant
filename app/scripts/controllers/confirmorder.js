'use strict';

/**
 * @ngdoc function
 * @name quikieApp.controller:OrderConfirmCtrl
 * @description
 * # OrderConfirmCtrl
 * Controller of the quikieApp
 */
angular.module('quikieApp')
    .controller('OrderConfirmCtrl', ['$scope', 'localStorageService', '$stateParams', function ($scope, localStorageService, $stateParams) {
        $scope.restaurant = localStorageService.get('restaurant');

        $scope.typeOrder = $stateParams.type;
    }]);
