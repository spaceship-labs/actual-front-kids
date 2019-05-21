'use strict';

/**
 * @ngdoc function
 * @name actualApp.controller:CommissionsListCtrl
 * @description
 * # CommissionsListCtrl
 * Controller of the actualApp
 */
angular.module('actualApp')
  .controller('CommissionsListCtrl', CommissionsListCtrl);

function CommissionsListCtrl(
  $q,
  $rootScope,
  $scope,
  $location,
  $filter,
  commissionService,
  authService,
  storeService
) {
  var vm = this;
  var today = new Date();
  vm.filters = {};
  vm.user = Object.assign({}, $rootScope.user);
  vm.sellers = [];
  vm.USER_ROLES = authService.USER_ROLES;

  $scope.year = today.getFullYear();
  $scope.month = today.getMonth();
  $scope.period = today.getDate() < 16 ? 1: 2;
  setFilterDate($scope.year, $scope.month, $scope.period);
  vm.columns = [
      {key: 'folio', label: 'Folio'},
      {key: 'quotation', label: 'Oportunidad', seeUrl:'http://ventas.miactual.com/quotations/edit/', propId: 'quotation'},
      {key: 'order', label: 'Orden', seeUrl:'http://ventas.miactual.com/checkout/order/', propId: 'order'},
      {key: 'datePayment', label: 'Fecha de pago', date: true },
      {key: 'ammountPayment', label: 'Monto de pago', currency: true},
      {key: 'rate', label: 'Comisión', isRateNormalized: true, rate: true},
      {key: 'ammount', label: 'Monto de comisión', currency: true},
      {key: 'status', label: 'Estatus',  mapper: {paid: 'pagada', pending: 'pendiente'}, color: {paid: 'green', pending: 'red'}},
      {key: 'user.name', label: 'Usuario'},
  ];
  vm.apiResource = commissionService.getCommissions;
  vm.years  = range(new Date().getFullYear(), 1999, -1);
  vm.months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ].map(function(m, i) { return [i, m]; });
  vm.setFilterDate = setFilterDate;
  vm.getFortnightNumber = getFortnightNumber;
  init();

  function init() {
    if (vm.user.role.name === authService.USER_ROLES.SELLER) {
      vm.filters.user = vm.user.id;
      totalsSeller();
    } else if (vm.user.role.name === authService.USER_ROLES.STORE_MANAGER) {
      getSellersByStore(vm.user.mainStore.id)
        .then(function(sellers) {
          vm.sellers = sellers;
        });
      totalsSellers();
    }
    var f = vm.filters.createdAt;
    var dateFrom = f['>='];
    var dateTo = f['<'];
    commissionService
      .getGoal(vm.user.mainStore.id, dateFrom, dateTo)
      .then(function(g){
        vm.goal = g;
      });
  }

  function getFortnightNumber(){
    var number = 1;
    var day = moment().format('D');
    if(day > 15){
      number = 2;
    }
    return number;
  }


  function totalsSeller() {
    $scope.$watch(function() {
      return vm.filters && vm.filters.createdAt && vm.filters.createdAt['>='];
    }, function() {
      totalsUser(vm.user.id).then(function(totals){
        vm.user.total = totals.total;
        vm.user.commissions = totals.commissions;
        setChart();
      });
      $rootScope.$broadcast('reloadTable', true);
    });
  }

  function totalsSellers() {
    $scope.$watch(function() {
      return vm.sellers.length && vm.filters && vm.filters.createdAt && vm.filters.createdAt['>='];
    }, function() {
      vm.sellers.map(function(s) {
        s.filters = Object.assign({}, s.filters, vm.filters);
        return s;
      });
      var totals = vm.sellers.map(function(s) {
        return totalsUser(s.id);
      });
      $q.all(totals).then(function(totals) {
        totals.forEach(function(t, i) {
          vm.sellers[i].commissions = t.commissions;
          vm.sellers[i].total = t.total;
        });
        setChart();
      });
      $rootScope.$broadcast('reloadTable', true);
    });
  }

  function totalsUser(user) {
    return getTotalByUser(user).then(function(totals) {
      return totals;
    });
  }

  function getSellersByStore(storeId){
    return storeService
      .getSellersByStore(storeId)
      .then(function(res){
        return res.data;
      })
      .then(function(sellers) {
        return sellers.map(function(seller) {
          seller.filters = Object.assign({}, vm.filters, {user: seller.id});
          return seller;
        });
      });
  }

  function getTotalByUser (user) {
    var f = vm.filters.createdAt;
    var dateFrom = f['>='];
    var dateTo = f['<'];
    return commissionService.getTotalByUser(user, dateFrom, dateTo);
  }


  function range(from, to, step) {
    var step   = step || 1;
    var length = Math.abs((to - from) / step);
    var acum   = [];
    for (var i = 0; i < length; i++) {
      acum = acum.concat(from + (i * step));
    }
    return acum;
  }

  function setFilterDate(year, month, period) {
    if (!(year && month && period)) {
      return;
    }
    if (period == 1) {
      var dateFrom = new Date(year, month, 1);
      var dateTo   = new Date(year, month, 16);
    } else {
      var dateFrom = new Date(year, month, 16);
      var dateTo   = setLastDay(new Date(year, month, 1));
    }
    vm.filters.createdAt =  {
      '>=': dateFrom,
      '<': dateTo
    };
  }

  function setLastDay(date) {
    var date = new Date(date);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  function setChart() {
    if (!vm.goal) {
      return;
    }
    if (vm.user.role.name === authService.USER_ROLES.SELLER) {
      vm.goal = vm.goal.goal / vm.goal.sellers / 2;
      vm.current = vm.user.total;
      vm.remaining = vm.goal - vm.current;
      vm.currentDate = new Date();
      vm.currentPercent = 100 * vm.current / vm.goal;
      vm.chartOptions = {
        labels: [
          'Venta al ' + $filter('date')(new Date(),'d/MMM/yyyy'),
          'Falta para el objetivo'
        ],
        colors: ["#48C7DB", "#EADE56"],
        data: [vm.current, vm.remaining],
      };
    } else  {
      vm.goal = vm.goal.goal / 2;
      vm.current = vm.sellers.reduce(function(acum, s) {
        var c = s.total || 0;
        return acum + c;
      }, 0);
      vm.remaining = vm.goal - vm.current;
      vm.currentDate = new Date();
      vm.currentPercent = 100 * vm.current / vm.goal;
      vm.chartOptions = {
        labels: [
          'Venta al ' + $filter('date')(new Date(),'d/MMM/yyyy'),
          'Falta para el objetivo'
        ],
        colors: ["#48C7DB", "#EADE56"],
        data: [vm.current, vm.remaining],
      };
      vm.store = {};
      vm.store.ammounts = {
        total: vm.sellers.reduce(function(acum,seller){return acum+=seller.total;},0),
        labels: vm.sellers.map(function(seller){return seller.firstName + ' ' + seller.lastName;}),
        data: vm.sellers.map(function(seller){return seller.total;}),
        options:{
          legend:{
            display:true,
            position: 'bottom'
          },
        },
      };
    }
  }
}

