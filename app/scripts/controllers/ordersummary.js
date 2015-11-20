'use strict';

/**
 * @ngdoc function
 * @name quikieApp.controller:OrderSummaryCtrl
 * @description
 * # OrderSummaryCtrl
 * Controller of the quikieApp
 */
angular.module('quikieApp')
    .controller('OrderSummaryCtrl', ['$scope', 'localStorageService', '$stateParams', 'order',
        function ($scope, localStorageService, $stateParams, order) {
            $scope.restaurant = localStorageService.get('restaurant');
            console.log(order);
            $scope.typeOrder = $stateParams.type;
            $scope.date = {
                now: new Date()
            };
        }]);
