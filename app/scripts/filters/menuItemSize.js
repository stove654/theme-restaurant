/**
 * Created by jodomax-user-1 on 06-Oct-15.
 */
'use strict';

angular.module('quikieApp')
  .filter('menuItemSize', function () {
    return function (input) {
      if (input ==1) {
        return 'F';
      } else {
        return 'H';
      }
    };
  });

