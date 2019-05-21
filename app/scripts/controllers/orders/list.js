'use strict';

angular.module('actualApp').controller('OrdersListCtrl', OrdersListCtrl);

function OrdersListCtrl(
  $filter,
  $location,
  $q,
  $rootScope,
  $routeParams,
  $timeout,
  authService,
  commonService,
  orderService,
  productService,
  storeService,
  commissionService,
  localStorageService,
  userService
) {
  var vm = this;
  vm.applyFilters = applyFilters;
  vm.isUserAdminOrManager = authService.isUserAdminOrManager;
  vm.isUserSellerOrAdmin = authService.isUserSellerOrAdmin;

  vm.currentDate = new Date();
  vm.dateRange = false;
  vm.ordersData = {};
  vm.listScopes = [];
  vm.defaultSort = [5, 'desc']; //Order by 5th column (begins on 0)
  vm.columnsOrders = [
    { key: 'folio', label: 'Folio' },
    { key: 'Client.CardName', label: 'Cliente' },
    { key: 'Broker.Name', label: 'Broker' },
    { key: 'total', label: 'Total', currency: true },
    { key: 'ammountPaid', label: 'Monto cobrado', currency: true },
    { key: 'createdAt', label: 'Venta', date: true },
    { key: 'status', label: 'Estatus', mapper: orderService.getStatusMap() },
    {
      key: 'Acciones',
      label: 'Acceder',
      actions: [{ url: '/checkout/order/', type: 'edit' }]
    }
  ];
  vm.apiResourceOrders = orderService.getList;
  vm.getFortnightNumber = getFortnightNumber;
  vm.getStoreTotal = getStoreTotal;
  vm.goal = 600000;

  function getOrdersData(options) {
    options = options || {};
    var dateRange = {
      startDate: moment().startOf('day'),
      endDate: moment().endOf('day')
    };

    var promises = [getCommisionsGoal()];

    if (!vm.isManagerReport) {
      promises.push(
        orderService.getTotalsByUser($rootScope.user.id, dateRange)
      );
    }

    $q.all(promises).then(function(results) {
      var commisionResult = results[0];
      var totalsResult;

      if (options.sellers) {
        vm.current = getStoreTotal(options.sellers);
      } else {
        totalsResult = results[1].data;
        vm.current = totalsResult.fortnight || 0;
      }

      if (vm.isManagerReport) {
        vm.goal = commisionResult.goal / 2;
      } else {
        vm.goal = commisionResult.goal / 2 / commisionResult.sellers;
      }

      vm.remaining = vm.goal - vm.current;
      vm.currentPercent = 100 - vm.remaining / (vm.goal / 100);
      vm.chartOptions = {
        labels: [
          'Venta al ' + $filter('date')(new Date(), 'd/MMM/yyyy'),
          'Falta para el objetivo'
        ],
        options: {
          tooltips: {
            callbacks: {
              label: commonService.getCurrencyTooltip
            }
          }
        },
        colors: ['#48C7DB', '#EADE56'],
        data: [vm.current, vm.goal - vm.current]
      };
    });
  }

  function init() {
    var fortnightRange = commonService.getFortnightRange();
    vm.startDate = fortnightRange.start.toString();
    vm.endDate = fortnightRange.end.toString();
    vm.isBroker = authService.isBroker($rootScope.user);

    if (vm.isBroker) {
      vm.filters = { Broker: $rootScope.user.id };
    } else {
      vm.filters = { User: $rootScope.user.id };
      vm.listScopes = [
        { label: 'Mis ventas', value: $rootScope.user.id },
        { label: 'Todas las ventas', value: 'none' }
      ];
    }

    vm.dateRange = {
      field: 'createdAt',
      start: vm.startDate,
      end: vm.endDate
    };
    vm.user = $rootScope.user;

    vm.isManagerReport = authService.isStoreManager(vm.user);
    vm.isBrokerReport = authService.isBroker(vm.user);
    vm.isSellerReport = authService.isUserSellerOrAdmin(vm.user);

    if (authService.isStoreManager(vm.user)) {
      setupManagerData();
    } else {
      getOrdersData();
      getTotalByDateRange(vm.user.id, {
        startDate: vm.startDate,
        endDate: vm.endDate
      });
    }
  }

  function setupManagerData() {
    vm.isLoading = true;
    getManagerStores()
      .then(function(stores) {
        console.log('stores', stores);
        var storePromises = stores.map(function(store) {
          return populateStoreWithSellers(store);
        });
        return $q.all(storePromises);
      })
      .then(function(stores) {
        console.log('stores', stores);
        vm.stores = stores;
        vm.isLoading = false;
      })
      .catch(function(err) {
        console.log('err', err);
      });
  }

  function getManagerStores() {
    var userEmail = vm.user.email;
    return userService.getStores(userEmail);
  }

  function getTotalByDateRange(userId, dateRange) {
    var params = angular.extend(dateRange, { all: false });
    orderService
      .getTotalsByUser($rootScope.user.id, params)
      .then(function(res) {
        console.log(res);
        vm.totalDateRange = res.data.dateRange || 0;
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  function applyFilters() {
    var promises = [];
    if (vm.dateStart._d && vm.dateEnd._d) {
      vm.dateRange = {
        field: 'createdAt',
        start: vm.dateStart._d,
        end: moment(vm.dateEnd._d).endOf('day')
      };
    }

    getTotalByDateRange(vm.user.id, {
      startDate: vm.dateRange.start,
      endDate: vm.dateRange.end
    });

    if (vm.isManagerReport) {
      promises = vm.stores.map(function(store) {
        return updateStoreSellers(store);
      });
    }

    vm.isLoading = true;
    $timeout(function() {
      vm.isLoading = false;
    }, 500);
    $rootScope.$broadcast('reloadTable', true);
  }

  function updateStoreSellers(store) {
    var deferred = $q.defer();
    if (store) {
      var promisesTotals = store.sellers.map(function(seller) {
        var params = {
          startDate: vm.dateRange.start,
          endDate: vm.dateRange.end,
          all: false
        };
        return orderService.getTotalsByUser(seller.id, params);
      });

      $q
        .all(promisesTotals)
        .then(function(totals) {
          console.log(totals);
          store.sellers = store.sellers.map(function(seller, index) {
            seller.total = totals[index].data.dateRange;
            return seller;
          });
          getOrdersData({
            sellers: store.sellers
          });

          store = setupStoreCharts(store);
          deferred.resolve(store);
        })
        .catch(function(err) {
          console.log(err);
          deferred.reject(err);
        });
    }

    return deferred.promise;
  }

  function populateStoreWithSellers(store) {
    var deferred = $q.defer();

    storeService
      .getSellersByStore(store.id)
      .then(function(res) {
        var promisesTotals = [];
        store.sellers = res.data;
        store.sellers = store.sellers.map(function(seller) {
          seller.filters = {
            User: seller.id
          };
          var params = {
            startDate: vm.startDate,
            endDate: vm.endDate,
            all: false
          };
          promisesTotals.push(orderService.getTotalsByUser(seller.id, params));
          return seller;
        });
        return updateStoreSellers(store);
      })
      .then(function(store) {
        deferred.resolve(store);
      })
      .catch(function(err) {
        console.log(err);
        deferred.reject(err);
      });

    return deferred.promise;
  }

  function setupStoreCharts(store) {
    store.ammounts = {
      total: store.sellers.reduce(function(acum, seller) {
        return (acum += seller.total);
      }, 0),
      labels: store.sellers.map(function(seller) {
        return seller.firstName + ' ' + seller.lastName;
      }),
      data: store.sellers.map(function(seller) {
        return seller.total;
      }),
      options: {
        legend: {
          display: true,
          position: 'bottom'
        },
        tooltips: {
          callbacks: {
            label: commonService.getCurrencyTooltip
          }
        }
      }
    };
    return store;
  }

  function getCommisionsGoal() {
    var fortnightRange = commonService.getFortnightRange();
    var start = moment()
      .startOf('month')
      .toDate();
    var end = moment()
      .endOf('month')
      .toDate();
    var storeId = localStorageService.get('activeStore');
    return commissionService.getGoal(storeId, start, end);
  }

  function getFortnightNumber() {
    var number = 1;
    var day = moment().format('D');
    if (day > 15) {
      number = 2;
    }
    return number;
  }

  function getStoreTotal(store) {
    if (!store || !store.sellers) {
      return 0;
    }
    var total = store.sellers.reduce(function(acum, seller) {
      acum += seller.total;
      return acum;
    }, 0);
    return total;
  }

  init();
}
