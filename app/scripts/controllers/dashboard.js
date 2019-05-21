'use strict';
angular.module('actualApp')
  .controller('DashboardCtrl', DashboardCtrl);

function DashboardCtrl(
    $rootScope, 
    $filter, 
    $q, 
    orderService, 
    quotationService,
    commonService
  ){
  var vm = this;
  angular.extend(vm,{
    quotationsData: {},
    ordersData:{},
    getAverageTicket: getAverageTicket,
    getClosingPercentage: getClosingPercentage,
    currentDate: new Date()
  });

  function setupSellerChart(userTotals, userCounts){
    vm.quotationsData.untilTodayAmount  = userTotals.untilToday;
    vm.quotationsData.byDateRangeAmount = userTotals.byDateRange;
    vm.quotationsData.ammounts = {
      labels: ["Hoy", "Total"],
      data: [
        vm.quotationsData.untilTodayAmount,
        (vm.quotationsData.byDateRangeAmount - vm.quotationsData.untilTodayAmount)
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
    vm.quotationsData.byDateRangeQty = userCounts.byDateRange;
    vm.quotationsData.quantities = {
      labels: ["Hoy", "Restante"],
      data: [
        vm.quotationsData.untilTodayQty,
        (vm.quotationsData.byDateRangeQty - vm.quotationsData.untilTodayQty)
      ],
      colors: ["#C92933", "#48C7DB", "#FFCE56"]
    };    
  }  

  function getQuotationDataByUser(userId, params){
    var deferred = $q.defer();
    var fortnightRange = commonService.getFortnightRange();
    var defaultParams = {
      startDate : fortnightRange.start,
      endDate   : fortnightRange.end,
      dateField : 'tracing',
      isClosed  : {'!': true}
    };
    params = params || defaultParams;
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
        deferred.resolve(values);
      })
      .catch(function(err){
        console.log(err);
        deferred.reject(err);
      });

    return deferred.promise;
  }     

  function getQuotationsData(){

    getQuotationDataByUser($rootScope.user.id)
      .then(function(values){
        var userTotals = values[0];
        var userCounts = values[1];
        setupSellerChart(userTotals, userCounts);
      })
      .catch(function(err){
        console.log('err', err);
      });

  }

  function getOrdersData(){
    var dateRange = {
      startDate: moment().startOf('day'),
      endDate: moment().endOf('day'),
    };
    orderService.getTotalsByUser($rootScope.user.id, dateRange)
      .then(function(res){
        console.log('res', res);
        vm.ordersData.todayAmmount = res.data.dateRange;
        vm.ordersData.fortnightAmount = res.data.fortnight;
        vm.ordersData.ammounts = {
          labels: ["Hoy", "Resto del mes"],
          data: [
            vm.ordersData.todayAmmount,
            (vm.ordersData.fortnightAmount - vm.ordersData.todayAmmount)
          ],
          colors: ["#C92933", "#48C7DB", "#FFCE56"],
          options:{
            tooltips: {
              callbacks: {
                label: function(tooltipItem, data) {
                  return $filter('currency')(data.datasets[0].data[tooltipItem.index]);
                }
              }
            }
          },
        };
      });

    orderService.getCountByUser($rootScope.user.id, dateRange)
      .then(function(res){
        vm.ordersData.todayQty = res.data.dateRange;
        vm.ordersData.fortnightQty = res.data.fortnight;
        vm.ordersData.quantities = {
          labels: ["Hoy", "Resto del mes"],
          data: [
            vm.ordersData.todayQty,
            (vm.ordersData.fortnightQty - vm.ordersData.todayQty)
          ],
          colors: ["#C92933", "#48C7DB", "#FFCE56"]
        };
      });
  }

  function getAverageTicket(){
    var average = 0;
    if(vm.ordersData.fortnightQty && vm.ordersData.monthAmmount){
      average = vm.ordersData.monthAmmount / vm.ordersData.fortnightQty;
    }
    return average;
  }

  function getClosingPercentage(){
    var percentage = 0;
    var onePercent = 0;
    if(vm.quotationsData.fortnightQty && vm.ordersData.fortnightQty){
      onePercent = vm.quotationsData.fortnightQty / 100;
      percentage = vm.ordersData.fortnightQty / onePercent;
    }
    percentage = percentage.toFixed(2);
    return percentage + '%';
  }

  function init(){
    getQuotationsData();
    getOrdersData();
  }

  init();

}

DashboardCtrl.$inject = [
  '$rootScope',
  '$filter',
  '$q',
  'orderService',
  'quotationService',
  'commonService'
];
