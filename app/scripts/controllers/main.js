'use strict';

/**
 * @ngdoc function
 * @name quikieApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the quikieApp
 */
angular.module('quikieApp')
  .controller('MainCtrl', ['$scope', '$state', '$ionicPopup', '$timeout', 'order', '$rootScope', 'toastr', '$fetchData', '$stateParams', 'MathNumber',
    function ($scope, $state, $ionicPopup, $timeout, order, $rootScope, toastr, $fetchData, $stateParams, MathNumber) {
      $scope.order = {};

      $scope.clearOrder = function () {
        $scope.order = {

          isDelivery: 0,
          customerNumber: 0,

          foods: [],
          calculation: {
            totalQty: 0,
            subTotal: 0,

            taxTotal: {
              1: 0,
              2: 0,
              3: 0,
              4: 0
            },

            typeTotal: {
              '1': 0,
              '2': 0,
              '3': 0,
              '4': 0
            },
            total: 0
          },
          orderItems: []
        };
      };
      var _loadTaxClass = function (query) {
        $fetchData.getDataV2('TaxClass', query).then(function (resp) {

          $scope.taxClasses = resp.all();
        });
      };


      $scope.addNewItem = function (menuItem) {

        event.preventDefault();
        event.stopPropagation();

        var addItem = angular.copy(menuItem);
        addItem.quantity = 1;

        if (!_.isUndefined(addItem.isHalf)) {
          addItem.price = parseFloat(addItem.priceHalf);
          addItem.isHalf = true;
        } else {
          addItem.price = parseFloat(addItem.price);
          addItem.isHalf = false;
        }

        if (!_.isUndefined(menuItem.quantity)) {
          addItem.quantity = menuItem.quantity;
        }

        var foundOrderItem = _.find($scope.order.foods, function (orderItem) {
          return (orderItem._id == addItem._id && orderItem.isHalf == addItem.isHalf);
        });

        if (foundOrderItem) {

          foundOrderItem.quantity += addItem.quantity;
          $scope.calculateOrder();

        } else {
          $scope.order.foods.push(addItem);
          $scope.calculateOrder();
        }

        /*var newItem;
         var listItem = $scope.order.foods;
         var size = order.isHalf ? 2 : 1;
         var price = order.isHalf ? order.priceHalf : order.price;

         var hasBatch = _.find(listItem, function (item) {
         return item.id == order.id && item.size == size;
         });

         if (hasBatch != undefined) {
         hasBatch.quantity += order.quantity;
         hasBatch.price += price * order.quantity;
         } else {
         newItem = {
         id: order.id,
         price: price * order.quantity,
         quantity: order.quantity,
         size: size,
         name: order.name,
         category: order.category.id,
         categoryName: order.category.name
         };

         $scope.order.foods.push(newItem);

         //$scope.order.orderItems.push(newItem);
         }

         $scope.order.quantity += order.quantity;
         $scope.order.total += order.quantity * price;*/
      };


      $scope.calculateOrder = function () {
        var done = true;

        _.each($scope.order.foods, function (item) {
          $scope.calculateOrderItem(item);
        });

        var calculation = {
          totalQty: 0,
          subTotal: 0,

          taxTotal: {
            1: 0,
            2: 0,
            3: 0,
            4: 0
          },

          typeTotal: {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0
          },

          VAT: 0,
          total: 0
        };


        //TODO : foreach order item
        _.each($scope.order.foods, function (orderItem) {
          calculation.totalQty += orderItem.quantity;
          calculation.subTotal += orderItem.amount;
          calculation.total += orderItem.total;

          for (var i = 1; i <= 4; i++) {
            calculation.taxTotal[i] += orderItem.taxTotal[i];
            calculation.typeTotal[i] += orderItem.typeTotal[i];
          }
          done = (orderItem.status==3) && done;
        });


        calculation.subTotal = MathNumber.mathNumber(calculation.subTotal, 2);
        for (var i = 1; i <= 4; i++) {
          calculation.taxTotal[i] = MathNumber.mathNumber(calculation.taxTotal[i], 2);
          calculation.typeTotal[i] = MathNumber.mathNumber(calculation.typeTotal[i], 2);
        }
        calculation.VAT = MathNumber.mathNumber(calculation.taxTotal[2] + calculation.taxTotal[3] + calculation.taxTotal[4], 2);
        calculation.total = MathNumber.mathNumber(calculation.total, 2);

        $scope.order.calculation = calculation;

        //Handling MRP
        $scope.order.done = done;
      };


      $scope.calculateOrderItem = function (orderItem) {
        var amountGross, amount,
          priceGross, price,
          total;

        orderItem.taxRate = {
          1: 0,
          2: 0,
          3: 0,
          4: 0
        };

        var taxClass = _.find($scope.taxClasses, function (el) {
          return (orderItem.taxClass == el.id);
        });

        if (taxClass) {
          _.each(taxClass.taxes, function (eachTax) {
            var idx = eachTax.sort;
            orderItem.taxRate[idx] = eachTax.percent;
          });
        }

        priceGross = (orderItem.isHalf) ? orderItem.priceHalf : orderItem.price;
        price = priceGross / (1 + (orderItem.taxRate[1] + orderItem.taxRate[2] + orderItem.taxRate[3] + orderItem.taxRate[4]) / 100);

        price = MathNumber.mathNumber(price, 2);

        amount = price * orderItem.quantity;
        amountGross = priceGross * orderItem.quantity;

        amount = MathNumber.mathNumber(amount, 2);
        amountGross = MathNumber.mathNumber(amountGross, 2);

        orderItem.taxTotal = {
          1: 0,
          2: 0,
          3: 0,
          4: 0
        };

        orderItem.typeTotal = {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0
        };

        if (taxClass) {
          _.each(taxClass.taxes, function (eachTax) {
            var idx = eachTax.sort;
            var percent = eachTax.percent;
            var taxAmount;

            taxAmount = amount * percent / 100;

            taxAmount = MathNumber.mathNumber(taxAmount, 2);
            orderItem.taxTotal[idx] = taxAmount;
          });
        }

        orderItem.price = priceGross;
        orderItem.amount = amount;
        orderItem.total = amountGross;
        orderItem.typeTotal[orderItem.type] = amount;

        //MRP handling
        orderItem.status = (orderItem.category.name=='MRP') ? 3 : 1; // 3 is DONE/Completed and 1 is waiting for kitchen preparing

      };

      $scope.totalOrder = function () {
        $scope.order = order.totalOrder($scope.order);
      };

      $scope.removeFood = function (index) {

        $scope.order.foods.splice(index, 1);
        $scope.calculateOrder();
      };

      $scope.addFoodNote = function (item) {
        $scope.data = {};
        if (item.note) {
          $scope.data.note = angular.copy(item.note);
        }
        var myPopup = $ionicPopup.show({
          template: '<input type="text" ng-model="data.note" placeholder="write note for food...">',
          title: 'Note',
          scope: $scope,
          buttons: [
            {text: 'Cancel'},
            {
              text: '<b>Save</b>',
              type: 'button-positive',
              onTap: function (e) {
                if (!$scope.data.note) {
                  e.preventDefault();
                } else {
                  return $scope.data.note;
                }
              }
            }
          ]
        });
        myPopup.then(function (res) {
          if (res) {
            item.note = res;
          }
        });
      };

      $scope.addQuantity = function (item) {
        item.quantity++;
      };

      $scope.subQuantity = function (item) {
        if (item.quantity > 1) {
          item.quantity--;
        }
      };

      $scope.ChooseTypeItem = function (item, type) {
        item.isHalf = type;
      };

      /* $scope.checkHalf = function (item) {
       item.isHalf = true;
       };

       $scope.checkFull = function (item) {
       item.isHalf = false;
       };*/

      $scope.logOut = function () {
        if (!window.cordova) {
          //this is for browser only
          facebookConnectPlugin.browserInit(895357913876223);
        }

        facebookConnectPlugin.logout(function () {
          //success
          $state.go('login');
        })
      };

      var _init = function () {

        var queryTaxClass = {
          filters: {
            property: 'site',
            value: $stateParams.idRestaurant,
            type: 'string',
            comparison: 'eq'
          }
        };

        _loadTaxClass(queryTaxClass);
        $scope.order = {

          isDelivery: 0,
          customerNumber: 0,

          foods: [],
          calculation: {
            totalQty: 0,
            subTotal: 0,

            taxTotal: {
              1: 0,
              2: 0,
              3: 0,
              4: 0
            },

            typeTotal: {
              '1': 0,
              '2': 0,
              '3': 0,
              '4': 0
            },
            total: 0
          },
          orderItems: []
        };
      };

      _init();

      $rootScope.$on('order_done', function (event, data) {
        toastr.success('Order is DONE', 'Order #' + data.orderNo);
      });

    }]);
