'use strict';
angular.module('actualApp')
  .controller('QuotationsListCtrl', QuotationsListCtrl);

function QuotationsListCtrl(
    $q,
    $rootScope,
    $filter,
    commonService,
    authService,
    quotationService,
    storeService,
    userService
  ){

  var vm = this;
  angular.extend(vm,{
    apiResourceQuotations: quotationService.getList,
    applyFilters: applyFilters,
    createdRowCb: createdRowCb,
    isUserAdminOrManager:  authService.isUserAdminOrManager,
    isUserSellerOrAdmin: authService.isUserSellerOrAdmin,
    onDateEndSelect: onDateEndSelect,
    onDateStartSelect: onDateStartSelect,
    dateEnd: false,
    defaultSort: [6, 'asc'],
    closedOptions: [
      {label: 'Abiertas', value: {'!': true}},
      {label:'Cerradas', value: true}
    ],    
    columnsLeads: [
      {key: 'folio', label:'Folio'},
      {key:'Client.CardName', label:'Cliente', defaultValue:'Sin cliente'},
      {key:'Client.E_Mail', label:'Email', defaultValue:'Sin cliente'},
      {key:'createdAt', label:'Cotización' ,date:true},
      {key:'total', label: 'Total', currency:true},
      {key:'status', label:'Status', 
        mapper:{
          'to-order':'Cerrada(orden)',
          'closed': 'Cerrada',
        },
        defaultValue: 'Abierta'
      },
      {
        key:'tracing', 
        label:'Seguimiento', 
        defaultValue: '-',
        color: 'red',
        //defaultValue: moment().add(5,'days').toDate(),
        dateTime: true
      },
      {
        key:'source',
        label:'Fuente',
        defaultValue:'-'
      },
      {
        key:'Acceder',
        label:'Acceder',
        propId: 'id',
        actions:[
          {url:'/quotations/edit/',type:'edit'},
        ]
      },
    ],
    endDate: false,
    quotationsData:{},
    listScopes: [],
    filters: {
      User: $rootScope.user.id,
      isClosed: {'!': true}
    },
    startDate: false,
    store:{
      ammounts:{}
    },    
    user: $rootScope.user,
  });

  vm.globalDateRange = {
    field: 'tracing',
    start: vm.startDate,
    end: vm.endDate
  }; 

  vm.listScopes = [
    {label: 'Mis oportunidades', value: vm.user.id},
    {label: 'Todas las oportunidades', value:'none'}
  ];

  function createdRowCb(row, data, index){
    var day = moment().startOf('day').toDate();
    if(data.tracing){
      var tracing = moment(data.tracing).startOf('day').toDate();
      if(tracing <= day){
        $(row).addClass('highlight').children().css( "background-color", "#faadb2" );
      }
    }
  }

  function init(){
    if(authService.isUserManager()){
      console.log('vm.user', vm.user);
      vm.isManagerReport = true;
      //getSellersByStore(vm.user.mainStore.id);
      setupManagerData();
    }
    else{
      vm.isSellerReport = true;
      getQuotationDataByUser(vm.user.id)
        .then(function(values){
          var userTotals = values[0];
          var userCounts = values[1];
          setupSellerChart(userTotals, userCounts);
        })
        .catch(function(err){
          console.log('err', err);
        });
      getCurrentUserTotal(vm.user.id, {
        startDate: vm.startDate,
        endDate: vm.endDate,
      });
    }
    
  }

  function setupManagerData(){
    vm.isLoading = true;
    getManagerStores()
      .then(function(stores){
        console.log('stores', stores);
        var storePromises = stores.map(function(store){
          return populateStoreWithSellers(store);          
        });
        return $q.all(storePromises);
      })
      .then(function(stores){
        console.log('stores', stores);
        vm.stores = stores;
        vm.isLoading = false;
      })
      .catch(function(err){
        console.log('err', err);
      });      
  }

  function getManagerStores(){
    var userEmail = vm.user.email;
    return userService.getStores(userEmail);
  }

  function populateStoreWithSellers(store){
    var deferred = $q.defer();
    storeService.getSellersByStore(store.id)
      .then(function(res){
        store.sellers = res.data;
        store.sellers = store.sellers.map(function(seller){
          seller.filters = {
            User: seller.id
          };
          return seller;
        });
        return updateStoreSellers(store);
      })
      .then(function(store){
        deferred.resolve(store);
      })
      .catch(function(err){
        console.log(err);
        deferred.reject(err);
      });

    return deferred.promise;
  }

  function updateStoreSellers(store){
    var deferred = $q.defer();
    var sellers = store.sellers;

    if(sellers){
      var promisesTotals = sellers.map(function(seller){
        var params = {
          startDate: vm.startDate,
          endDate: vm.endDate,
          all: false,
          dateField: 'tracing',
          isClosed: vm.closedOptions[0].value
        };
        params.isClosed = seller.filters.isClosed || params.isClosed;
        return quotationService.getTotalsByUser(seller.id, params);
      });

      $q.all(promisesTotals)
        .then(function(totals){
          sellers = sellers.map(function(seller, index){
            seller.total = totals[index].data.byDateRange;
            return seller;
          });
          
          //store.ammounts.total = getStoreTotal(store.sellers);
          var promises = sellers.map(function(seller){
            return getQuotationDataByUser(seller.id, false, {objectMode:true});
          });
          return $q.all(promises);
        })
        .then(function(sellersData){
          var sellersAmounts = sellersData.map(function(data){
            return data.values[0];
          });
          var sellersQuantities = sellersData.map(function(data){
            return data.values[1];
          });

          store = setupStoreChartData(store, sellersAmounts, sellersQuantities);

          store.sellers = store.sellers.map(function(seller){
            seller.totals = _.findWhere(sellersData, {userId: seller.id});
            return seller;
          });

          deferred.resolve(store);          
        })
        .catch(function(err){
          console.log(err);
          deferred.reject(err);
        });
    }else{
      deferred.resolve();
    }
    return deferred.promise;
  }  

  function getStoreTotal(sellers){
    var total = sellers.reduce(function(acum,seller){
      return acum += seller.total;
    },0);    
    return total;
  }

  function getQuotationDataByUser(userId, params, options){
    var deferred = $q.defer();
    var defaultParams = {
      startDate : vm.startDate,
      endDate   : vm.endDate,
      dateField : 'tracing',
      isClosed  : {'!': true}
    };
    params = params || defaultParams;
    options = options || {};
    $q.all([
      quotationService.getTotalsByUser(userId, params),
      quotationService.getCountByUser(userId, params)
    ])
      .then(function(result){
        console.log('result', result);
        var values = [
          result[0].data,
          result[1].data
        ];

        if(options.objectMode){
          deferred.resolve({
            userId: userId,
            values: values
          });
        }else{
          deferred.resolve(values);
        }

      })
      .catch(function(err){
        console.log(err);
        deferred.reject(err);
      });

    return deferred.promise;
  }      


  function setupSellerChart(userTotals, userCounts){
    vm.quotationsData.untilTodayAmount  = userTotals.untilToday;
    vm.quotationsData.allByDateRangeAmount = userTotals.allByDateRange;
    vm.quotationsData.ammounts = {
      labels: ["Hoy", "Total"],
      data: [
        vm.quotationsData.untilTodayAmount,
        (vm.quotationsData.allByDateRangeAmount - vm.quotationsData.untilTodayAmount)
      ],
      colors: ["#C92933", "#48C7DB", "#FFCE56"],
      options:{
        tooltips: {
          callbacks: {
            label: commonService.getCurrencyTooltip
          }
        }
      },
    };

    vm.quotationsData.untilTodayQty = userCounts.untilToday;
    vm.quotationsData.allByDateRangeQty = userCounts.allByDateRange;
    vm.quotationsData.quantities = {
      labels: ["Hoy", "Restante"],
      data: [
        vm.quotationsData.untilTodayQty,
        (vm.quotationsData.allByDateRangeQty - vm.quotationsData.untilTodayQty)
      ],
      colors: ["#C92933", "#48C7DB", "#FFCE56"]
    };    
  }

  function getCurrentUserTotal(userId, dateRange){
    var deferred = $q.defer();
    var params = angular.extend(dateRange, {
      all:false,
      dateField: 'tracing'
    });
    quotationService.getTotalsByUser($rootScope.user.id, params)
      .then(function(res){
        console.log('res getCurrentUserTotal', res);
        var values = res.data;
        var total = values.byDateRange || 0;
        vm.currentUserTotal = total;
        deferred.resolve(values);
      })
      .catch(function(err){
        console.log(err);
        deferred.reject(err);
      });

    return deferred.promise;
  }

  function applyFilters(){
    var promises = [];
    vm.globalDateRange = {
      field: 'tracing',
      start: vm.startDate,
      end: vm.endDate
    }; 

    if(vm.isManagerReport){
      promises = vm.stores.map(function(store){
        return  updateStoreSellers(store);
      });
    }

    if(vm.isSellerReport){
      promises = [
        getQuotationDataByUser(vm.user.id),
        getCurrentUserTotal(vm.user.id, {
          startDate: vm.startDate,
          endDate: vm.endDate,
        })
      ];
    }

    vm.isLoading = true;
    $q.all(promises)
      .then(function(results){
        $rootScope.$broadcast('reloadTable', true);

        console.log('results', results);

        if( vm.isSellerReport ){
          var userTotals = results[0][0];
          var userCounts = results[0][1];
          setupSellerChart(userTotals, userCounts);
        }

        vm.isLoading = false;
      })
      .catch(function(err){
        console.log(err);
      });
      
  }

  function onDateStartSelect(pikaday){
    vm.startDate = pikaday._d;
  }

  function onDateEndSelect(pikaday){
    vm.endDate = pikaday._d;
  }

  //@param sellers Array of seller object with untiltoday and bydaterange amounts and quantities
  function setupStoreChartData(store, sellersAmounts, sellersQuantities){
    store.untilTodayAmount = sellersAmounts.reduce(function(acum, seller){
      acum += seller.untilToday;
      return acum;
    }, 0);
    
    store.allByDateRangeAmount = sellersAmounts.reduce(function(acum, seller){
      acum += seller.allByDateRange;
      return acum;
    }, 0);
    
    store.ammounts = {
      labels: ["Hoy", "Resto de la quincena"],
      data: [
        store.untilTodayAmount,
        (store.allByDateRangeAmount - store.untilTodayAmount)
      ],
      colors: ["#C92933", "#48C7DB", "#FFCE56"],
      options:{
        tooltips: {
          callbacks: {
            label: commonService.getCurrencyTooltip
          }
        }
      },
    };

    store.untilTodayQty = sellersQuantities.reduce(function(acum, seller){
      acum += seller.untilToday;
      return acum;
    }, 0);
     store.allByDateRangeQty = sellersQuantities.reduce(function(acum, seller){
      acum += seller.allByDateRange;
      return acum;
    }, 0);

    store.quantities = {
      labels: ["Hoy", "Restante"],
      data: [
        store.untilTodayQty,
        (store.allByDateRangeQty - store.untilTodayQty)
      ],
      colors: ["#C92933", "#48C7DB", "#FFCE56"]
    };

    return store;    
  }
  

  init();
}
