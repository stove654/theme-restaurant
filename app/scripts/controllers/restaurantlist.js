'use strict';

/**
 * @ngdoc function
 * @name quikieApp.controller:RestaurantListCtrl
 * @description
 * # RestaurantListCtrl
 * Controller of the quikieApp
 */
angular.module('quikieApp')
  .controller('RestaurantListCtrl', ['$scope', '$state', 'localStorageService', 'qConfig', '$fetchData', '$auth',
    function ($scope, $state, localStorageService, qConfig, $fetchData, $auth) {

    $fetchData.getData('Site').then(function (resp) {
      $scope.restaurants = _.each(resp.all(), function (item) {
        item.rate = 4;
        item.review = 67;
        item.hearth = false;
      });
      console.log( $scope.restaurants);
    });

    $scope.bookmarkRestaurant = function (item, event) {
      event.stopPropagation();
      item.hearth = !item.hearth;
    };

    $scope.goDetailRestaurant = function (item) {
      localStorageService.set('restaurant', item);
      $state.go('main.restaurant', {id: item.id});
    };

    var user = $auth.getCurrentUser();
    if ( user && user.nextState) {
      $auth.connectSocketIo(function(result){
        //$logger.info('auth.connectSocketIo', 'result', result);
      });

      if (window.cordova && window.plugins.OneSignal) {
        window.plugins.OneSignal.sendTag("guid", user.id);
      }
    };

    $scope.title = 'Hello!';
    $scope.subtitle = "Today's QUiKie Picks";
    $scope.content = "We've picked 10 restaurants around you. Let see how hungry you are today!";

  }]);

