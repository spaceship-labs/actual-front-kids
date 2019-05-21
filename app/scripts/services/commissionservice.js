(function (){
  'use strict';

  angular
    .module('actualApp')
    .factory('commissionService', commissionService);

  function commissionService(api) {
    return {
      getCommissions: getCommissions,
      getTotalByUser: getTotalByUser,
      getGoal: getGoal
    };

    function getCommissions(page, _params) {
      var url    = '/commission/find/';
      var params = Object.assign({} ,_params, {
        page: page || 1
      });
      return api.$http.post(url, params);
    }

    function getTotalByUser(user, dateFrom, dateTo) {
      var url    = '/commission/total';
      var params = {
        user: user,
        dateFrom: dateFrom,
        dateTo: dateTo
      };
      return api.$http.post(url, params).then(function(res) {
        return res.data;
      });
    }

    function getGoal(store, dateFrom, dateTo) {
      var url = '/goal/searchByDate';
      var params = {
        store: store,
        dateFrom: dateFrom,
        dateTo: dateTo
      };
      return api.$http.post(url, params).then(function(res){
        return res.data;
      });
    }
  }
})();
