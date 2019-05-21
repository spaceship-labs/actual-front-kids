(function (){
    'use strict';

    angular
        .module('actualApp')
        .factory('pmPeriodService', pmPeriodService);

    /** @ngInject */
    function pmPeriodService($http,localStorageService, api){

      var service = {
        getActive: getActive
      };

      return service;

      function getActive(params){
        var url = '/pmperiod/getactive/';
        return api.$http.post(url, params);
      }



    }


})();
