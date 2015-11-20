'use strict';

/**
 * @ngdoc service
 * @name quikieApp.order
 * @description
 * # order
 * Service in the quikieApp.
 */
angular.module('quikieApp')
    .service('order', function () {
        this.totalOrder = function (data) {
            var order = data;
            order.total = 0;
            order.quantity = 0;
            angular.forEach(order.foods, function (value) {
                if (!value.isHalf) {
                    order.total += (value.quantity * value.price);
                    order.quantity += value.quantity;
                } else {
                    order.total += (value.quantity * value.priceHalf);
                    order.quantity += value.quantity;
                }

            });
            return order
        }
    });
