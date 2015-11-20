'use strict';

/**
 * @ngdoc function
 * @name quikieApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the quikieApp
 */
angular.module('quikieApp')
  .controller('LoginCtrl', [
    '$scope',
    '$state',
    '$rootScope',
    '$q',
    'UserService',
    '$ionicLoading',
    '$auth',
    '$logger',
    '$timeout',
    function ($scope,
              $state,
              $rootScope,
              $q,
              UserService,
              $ionicLoading,
              $auth,
              $logger,
              $timeout) {

      $scope.user = {
        username: '',
        password: ''
      };

      $scope.account = {password: ''};

      /*
       $scope.login = function () {
       $rootScope.user = $scope.user;
       $state.go('main.home');
       };
       */

      $scope.goSignin = function () {
        $scope.signin = true;
        $scope.signup = false;
      };

      $scope.goSignup = function () {
        $scope.signup = true;
        $scope.signin = false;
      };

      $scope.goBackLogin = function () {
        $scope.signin = false;
        $scope.signup = false;
      };

      $scope.signUp = function () {

        var username = $scope.account.email;
        var password = $scope.account.password;

        var signUpInfo = {
          username: username,
          password: password
        };
        if (password == $scope.account.rePassword) {
          //console.log('SignUp');
          //console.log($scope.account);

          $ionicLoading.show({
            template: 'Signing up...'
          });
          $auth.signUp(signUpInfo, function (err, msg) {
            if (err) {
              $scope.message = "password is not correct!";

              $ionicLoading.hide();
            } else {
              $rootScope.user = signUpInfo;
              $ionicLoading.hide();

              $logger.info('login', 'username', username);
              $logger.info('login', 'password', password);

              //console.log('Normal login');

              var loginInfo = {
                loginType: 1, // Normal front-end user login
                username: username,
                email: username,
                fullName: '',
                password: password,
                externalId: 0,
                externalAccessToken: '',
                externalExpiresIn: 0
              };

              $scope.processLogin(loginInfo);
            }
          });
        } else {
          $scope.message = 'Password math invalid';
          $scope.account.rePassword = null;
        }
      };


      $logger.moduleName = 'Login Controller';
      $logger.info('Login controller', 'start', true);

      $scope.login = function () {
        $rootScope.user = $scope.user;
        var userName = $scope.user.username;
        var password = $scope.user.password;

        $logger.info('login', 'username', userName);
        $logger.info('login', 'password', password);

        //console.log('Normal login');

        var loginInfo = {
          loginType: 1, // Normal front-end user login
          username: userName,
          email: userName,
          fullName: '',
          password: password,
          externalId: 0,
          externalAccessToken: '',
          externalExpiresIn: 0
        };

        $scope.processLogin(loginInfo);
      };

      $scope.processLogin = function (loginInfo) {
        $ionicLoading.show({
          template: 'Logging...'
        });

        $auth.login(loginInfo, function (err, result) {
          if (!!err) {
            //$logger.info('login', 'error', err);
          } else {
            //$logger.info('login', 'success', true);

            $logger.info('login', 'go', 'restaurantList');

            $timeout(function () {
              //$state.go('loading');
              $state.go('main.restaurantList');
            }, 200);
          }
          $ionicLoading.hide();
        });
      };


      //This is the success callback from the login method
      var fbLoginSuccess = function (response) {
        if (!response.authResponse) {
          fbLoginError("Cannot find the authResponse");
          return;
        }
        console.log('fbLoginSuccess, response: ', response);

        $state.go('main.home');

      };

      //This is the fail callback from the login method
      var fbLoginError = function (error) {
        console.log('fbLoginError');
      };

      //this method is to get the user profile info from the facebook api
      var getFacebookProfileInfo = function (authResponse) {
        var info = $q.defer();

        facebookConnectPlugin.api('/me?fields=about,bio,birthday,email,name&access_token=' + authResponse.accessToken, null,
          function (response) {
            info.resolve(response);
          },
          function (response) {
            info.reject(response);
          }
        );
        return info.promise;
      };

      //This method is executed when the user press the "Login with facebook" button
      $scope.loginFacebook = function () {
        $ionicLoading.show({
          template: 'Loading...'
        });
        console.log('run login facebook on web');

        if (!window.cordova) {
          //this is for browser only
          console.log('run login facebook on mobile');
          console.log(1438047819744701);

          facebookConnectPlugin.browserInit(1438047819744701);
        }

        facebookConnectPlugin.getLoginStatus(function (success) {
          if (success.status === 'connected') {
            // the user is logged in and has authenticated your app, and response.authResponse supplies
            // the user's ID, a valid access token, a signed request, and the time the access token
            // and signed request each expire
            console.log('getLoginStatus', success);

            var authResponse = success.authResponse;

            getFacebookProfileInfo(authResponse).then(function (res) {
              console.log(res);

              var loginInfo = {
                loginType: 2, // FB front-end user login
                username: res.email,
                email: res.email,
                fullName: res.name,
                password: authResponse.accessToken,
                externalId: res.id,
                externalAccessToken: authResponse.accessToken,
                externalExpiresIn: authResponse.expiresIn
              };

              console.log('FB login');

              $auth.login(loginInfo, function (err, result) {
                if (!!err) {
                  $logger.info('login', 'error', err);
                } else {
                  $logger.info('login', 'success', true);
                  $logger.info('login', 'go', 'restaurantList');

                  $timeout(function () {
                    //$state.go('loading');
                    $state.go('main.restaurantList');
                  }, 200);
                }
                $ionicLoading.hide();
              });
            });
            //$state.go('main.home');
          } else {
            //if (success.status === 'not_authorized') the user is logged in to Facebook, but has not authenticated your app
            //else The person is not logged into Facebook, so we're not sure if they are logged into this app or not.
            console.log('getLoginStatus', success.status);
            /*$ionicLoading.show({
             template: 'Logging in...'
             });*/

            //ask the permissions you need. You can learn more about FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
            facebookConnectPlugin.login(['email', 'public_profile', 'user_about_me', 'user_likes', 'user_location', 'user_posts', 'user_status', 'user_birthday', 'user_photos'], fbLoginSuccess, fbLoginError);
          }
        });
      }
    }]);
