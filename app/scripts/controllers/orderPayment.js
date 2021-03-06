'use strict';

/**
 * @ngdoc function
 * @name quikieApp.controller:OrderSummaryCtrl
 * @description
 * # OrderSummaryCtrl
 * Controller of the quikieApp
 */
angular.module('quikieApp')
    .controller('OrderPaymentCtrl', ['$scope', 'localStorageService', '$stateParams',
        function ($scope, localStorageService, $stateParams) {
            $scope.restaurant = localStorageService.get('restaurant');
            $scope.date = {
                now: new Date()
            };
            $scope.typeOrder = $stateParams.type;

            //console.log($scope.typeOrder);

          $scope.orderNow = function() {
            console.log('order now press');
            var data = {
              test: 'test'
            };

            window.socketIo.emit('new order', JSON.stringify(data));
          }
        }]);
