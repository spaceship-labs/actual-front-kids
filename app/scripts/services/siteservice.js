(function (){
    'use strict';

    angular
        .module('actualApp')
        .factory('siteService', siteService);

    /** @ngInject */
    function siteService($http, $q, api){

      var service = {
        findByHandle: findByHandle,
        getSitesCashReport: getSitesCashReport
      };

      return service;

      function findByHandle(handle){
        var url = '/site/findbyhandle/' + handle;
        return api.$http.post(url);
      }

      function getSitesCashReport(params){
        var url = '/sites/cashreport';
        return api.$http.post(url, params);
      }

    }


})();
