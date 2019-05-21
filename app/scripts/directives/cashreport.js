'use strict';

/**
 * @ngdoc directive
 * @name actualApp.directive:cashReport
 * @description
 * # cashReport
 */
angular
  .module('actualApp')
  .directive('cashReport', function(
    commonService,
    paymentService,
    authService,
    dialogService,
    storeService,
    siteService,
    $q
  ) {
    return {
      templateUrl: 'views/directives/cash-report/cash-report.html',
      restrict: 'E',
      replace: true,
      scope: {
        user: '=',
        print: '='
      },
      controller: [
        '$scope',
        'commonService',
        'paymentService',
        'authService',
        'dialogService',
        'storeService',
        'siteService',
        '$q',
        function postLink(
          $scope,
          commonService,
          paymentService,
          authService,
          dialogService,
          storeService,
          siteService,
          $q
        ) {
          angular.extend($scope, {
            init: init,
            filterStores: filterStores,
            isAdmin: authService.isAdmin,
            isSinglePaymentTerminal: paymentService.isSinglePaymentTerminal,
            isCardCreditOrDebitPayment:
              paymentService.isCardCreditOrDebitPayment,
            isStoreManager: authService.isStoreManager,
            isTransferOrDeposit: paymentService.isTransferOrDeposit,
            isUsdPayment: paymentService.isUsdPayment,
            isUserAdminOrManager: authService.isUserAdminOrManager,
            mapTerminalCode: commonService.mapTerminalCode,
            onSelectStartDate: onSelectStartDate,
            onSelectEndDate: onSelectEndDate,
            paymentTypes: paymentService.types,
            paymentRequiresBankColumn: paymentRequiresBankColumn,
            requiresBankColumn: requiresBankColumn,
            isWebStore: isWebStore,
            getCashReport: getCashReport,
            mapStatusType: paymentService.mapStatusType,
            getPaymentsCanceledQuantity: getPaymentsCanceledQuantity
          });

          $scope.init();

          function init() {
            $scope.startDate = moment().startOf('day');
            $scope.endDate = moment().endOf('day');
            $scope.startTime = moment().startOf('day');
            $scope.endTime = moment().endOf('day');
            $scope.storeFilter = 'all';
          }

          function onSelectStartDate(pikaday) {
            $scope.startDate = pikaday._d;
            //$scope.myPickerEndDate.setMinDate($scope.startDate);
          }

          function onSelectEndDate(pikaday) {
            $scope.endDate = pikaday._d;
            //$scope.myPickerStartDate.setMaxDate($scope.endDate);
          }

          function getCashReport() {
            $scope.startDate = commonService.combineDateTime(
              $scope.startDate,
              $scope.startTime
            );
            $scope.endDate = commonService.combineDateTime(
              $scope.endDate,
              $scope.endTime,
              59
            );

            var params = {
              startDate: $scope.startDate,
              endDate: $scope.endDate
            };

            $scope.isManagerReport = authService.isStoreManager($scope.user);
            $scope.isGeneralReport = authService.isAdmin($scope.user);

            var promise;
            if ($scope.isManagerReport) {
              promise = storeService.getManagerCashReport(params);
            } else if ($scope.isGeneralReport) {
              promise = storeService.getGlobalStoresCashReport(params);
            }

            $scope.isLoadingReport = true;
            promise
              .then(function(res) {
                $scope.report = res.data;
                console.log('$scope.report', $scope.report);
                $scope.isLoadingReport = false;
              })
              .catch(function(err) {
                console.log(err);
                authService.showUnauthorizedDialogIfNeeded(err);
                $scope.isLoadingReport = false;
                var error = err.data || err;
                error = error ? error.toString() : '';
                dialogService.showDialog('Hubo un error: ' + error);
              });
          }

          function isWebStore(store) {
            var storesNames = [
              'actualstudio.com',
              'actualhome.com',
              'actualkids.com'
            ];
            return storesNames.indexOf(store.name) > -1;
          }

          function requiresBankColumn(subdivision) {
            return (
              subdivision.group !== 1 ||
              $scope.isTransferOrDeposit(subdivision) ||
              $scope.isSinglePaymentTerminal(subdivision)
            );
          }

          function paymentRequiresBankColumn(payment) {
            return (
              $scope.isSinglePaymentTerminal(payment) ||
              payment.msi ||
              $scope.isTransferOrDeposit(payment)
            );
          }

          function filterStores(stores, storeFilter) {
            if (storeFilter === 'all') {
              return stores;
            } else {
              return stores.filter(function(store) {
                return store.id === storeFilter;
              });
            }
          }

          function getPaymentsCanceledQuantity(payments) {
            return payments.reduce(function(acum, payment) {
              if (paymentService.isCanceled(payment)) {
                acum++;
              }
              return acum;
            }, 0);
          }
        }
      ]
    };
  });
