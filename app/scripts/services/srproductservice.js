(function (){
    'use strict';

    angular
        .module('actualApp')
        .factory('srproductService', srproductService);

    /** @ngInject */
    function srproductService($http, $q, $rootScope, api){
      function search(params){
        params = params || {page: 1, items: 10};
        var url = '/srservices';
        return api.$http.get(url, params);
      }      

      var service = {
        search: search
      };

      return service;

    }

})();
