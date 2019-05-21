(function (){
    'use strict';

    angular
        .module('actualApp')
        .factory('userService', userService);

    /** @ngInject */
    function userService($http, $q, $rootScope, api){
      var service = {
        getClients: getClients,
        getBrokers: getBrokers,
        getUser: getUser,
        getStores: getStores,
        getActiveStore: getActiveStore,
        getCashReport: getCashReport,
        update: update,
        sendPasswordRecovery: sendPasswordRecovery,
        resetPassword: resetPassword
      };

      return service;

      function resetPassword(params){
        var url = '/user/update_password';
        return api.$http.post(url, params);        
      }

      function sendPasswordRecovery(email){
        var params = {email:email};
        var url = '/user/send_password_recovery';
        return api.$http.post(url, params);
      }

      function getClients(page, params){
        var p      = page || 1;
        var seller = $rootScope.user.SlpCode || 49;
        var url    = '/client/findbyseller/' + seller;
        return api.$http.post(url, params);
      }

      function getUser(id, params){
        var url = '/user/findbyid/' + id;
        return api.$http.post(url, params);
      }

      function update(params){
        var url = '/me/update';
        return api.$http.post(url, params);
      }

      function getBrokers(page, limit) {
        var url      = '/brokers';
        var params   = {};

        return api.$http.get(url, params).then(function(res){
         return res.data;
        });
      }

      function getStores(email) {
        var url      = '/user/stores';
        var params   = {email: email};
        return api.$http.get(url, params).then(function(res){
         return res.data;
        });
      }

      function getActiveStore() {
        var url      = '/me/activeStore';
        return api.$http.get(url).then(function(res){
         return res.data;
        });
      }

      function getCashReport(params){
        var url = '/me/cashreport';
        return api.$http.post(url, params);
      }

    }
})();
