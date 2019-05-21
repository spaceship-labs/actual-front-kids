(function() {
  'use strict';

  angular.module('actualApp').factory('orderService', orderService);

  /** @ngInject */
  function orderService($http, $q, $rootScope, api) {
    var statusTypes = {
      CANCELED: 'canceled',
      PAID: 'paid'
    };

    var service = {
      calculateBalance: calculateBalance,
      create: create,
      cancel: cancel,
      addPayment: addPayment,
      getEwalletAmmount: getEwalletAmmount,
      getList: getList,
      getById: getById,
      getTotalsByUser: getTotalsByUser,
      getCountByUser: getCountByUser,
      formatAddress: formatAddress,
      isCanceled: isCanceled,
      mapStatusType: mapStatusType,
      statusTypes: statusTypes,
      getStatusMap: getStatusMap
    };

    return service;

    function getStatusMap() {
      var mapper = {};
      mapper[statusTypes.CANCELED] = 'Cancelado';
      mapper[statusTypes.PAID] = 'Pagado';
      return mapper;
    }

    function mapStatusType(status) {
      var mapper = getStatusMap();
      return mapper[status] || status;
    }

    function isCanceled(order) {
      return order.status === statusTypes.CANCELED;
    }

    function create(params) {
      var url = '/order';
      return api.$http.post(url, params);
    }

    function cancel(id) {
      var url = '/order/' + id + '/cancel';
      return api.$http.post(url);
    }

    function addPayment(orderId, params) {
      var url = '/order/addpayment/' + orderId;
      return api.$http.post(url, params);
    }

    function getList(page, params) {
      var p = page || 1;
      var url = '/order/find/' + p;
      return api.$http.post(url, params);
    }

    function getById(id) {
      var url = '/order/findbyid/' + id;
      return api.$http.post(url);
    }

    function getTotalsByUser(userId, params) {
      var url = '/order/user/' + userId + '/totals';
      return api.$http.post(url, params);
    }

    function getCountByUser(userId, params) {
      var url = '/order/user/' + userId + '/count';
      return api.$http.post(url, params);
    }

    function calculateBalance(paid, total) {
      return paid - total;
    }

    function getEwalletAmmount(ewalletRecords, type) {
      ewalletRecords = ewalletRecords || [];
      ewalletRecords = ewalletRecords.filter(function(record) {
        return record.type === type;
      });
      var amount = ewalletRecords.reduce(function(acum, record) {
        acum += record.amount;
        return acum;
      }, 0);
      return amount;
    }

    function formatAddress(address) {
      //TODO: check why address is empty in some orders
      if (!address) {
        return {};
      }
      address.name =
        address.FirstName && address.LastName
          ? address.FirstName + ' ' + address.LastName
          : address.Name;
      address.address = address.Address;
      address.phone = address.phone || address.Tel1;
      address.mobile = address.mobilePhone || address.Cellolar;
      return address;
    }
  }
})();
