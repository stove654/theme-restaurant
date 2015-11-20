'use strict';

/**
 * @ngdoc service
 * @name quikieApp.order
 * @description
 * # order
 * Service in the quikieApp.
 */
angular.module('quikieApp')

.service('UserService', function() {

//for the purpose of this example I will store user data on ionic local storage but you should save it on a database

  var setUser = function(user_data) {
    window.localStorage['ionFB_user'] = JSON.stringify(user_data);
  };

  var userIsLoggedIn = function(){
    var user = getUser();
    return user.authResponse.userID != null;
  };

  var getUser = function(){
    return JSON.parse(window.localStorage['ionFB_user'] || '{}');
  };

  return {
    getUser: getUser,
    setUser : setUser,
    userIsLoggedIn : userIsLoggedIn
  }
});
