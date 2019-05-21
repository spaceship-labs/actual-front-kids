(function() {
  'use strict';

  angular.module('actualApp').factory('deliveryService', deliveryService);

  function deliveryService($filter) {
    var service = {
      getAvailableByDeliveries: getAvailableByDeliveries,
      groupDeliveryDates: groupDeliveryDates,
      groupDetails: groupDetails,
      getFarthestDelivery: getFarthestDelivery,
      sortDeliveriesByHierarchy: sortDeliveriesByHierarchy,
    };

    function groupDetails(details) {
      var groups = [];
      var groupedDetails = _.groupBy(details, function(detail) {
        var discountPercent = detail.discountPercent || 0;
        var date = moment(detail.shipDate).startOf('day');
        return detail.Product.ItemCode + '#' + date + '#' + discountPercent;
      });
      for (var key in groupedDetails) {
        var group = _.clone(groupedDetails[key][0]);
        group.quantity = 0;
        group.subtotal = 0;
        group.total = 0;
        group.discount = 0;
        group.ewallet = 0;
        for (var i = 0; i < groupedDetails[key].length; i++) {
          var detail = groupedDetails[key][i];
          group.quantity += detail.quantity;
          group.subtotal += detail.subtotal;
          group.total += detail.total;
          group.discount += detail.discount;
          group.ewallet += detail.ewallet;
        }
        group.details = groupedDetails[key];
        var invalidStock = _.findWhere(group.details, { validStock: false });
        group.validStock = invalidStock ? false : true;
        groups.push(group);
      }
      return groups;
    }

    function convertDatetimeToDate(datetime) {
      var date = moment(datetime)
        .startOf('day')
        .toDate();
      return date;
    }

    function isDateImmediateDelivery(delivery) {
      var FORMAT = 'D/M/YYYY';
      var currentDate = convertDatetimeToDate(new Date());
      var deliveryDate = convertDatetimeToDate(delivery.date);
      return (
        moment(currentDate).format(FORMAT) ===
        moment(deliveryDate).format(FORMAT)
      );
    }

    function groupDeliveryDates(deliveries) {
      var groups = [];
      for (var i = deliveries.length - 1; i >= 0; i--) {
        var items = _.filter(deliveries, function(delivery) {
          if (
            delivery.companyFrom !== deliveries[i].companyFrom &&
            convertDatetimeToDate(delivery.date) <=
              convertDatetimeToDate(deliveries[i].date) &&
            !isDateImmediateDelivery(delivery)
          ) {
            return true;
          } else {
            return false;
          }
        });
        items.push(deliveries[i]);

        if (items.length > 0) {
          items = $filter('orderBy')(items, 'date');
          var farthestDelivery = getFarthestDelivery(items);
          var group = {
            available: getAvailableByDeliveries(items),
            days: farthestDelivery.days,
            deliveries: items,
            date: farthestDelivery.date,
            ImmediateDelivery: _.every(items, function(delivery) {
              return delivery.ImmediateDelivery;
            }),
          };
          groups.push(group);
        }
      }
      groups = _.uniq(groups, false, function(group) {
        return group.date;
      });

      return groups;
    }

    function getFarthestDelivery(deliveries) {
      var farthestDelivery = {};
      for (var i = 0; i < deliveries.length; i++) {
        if (
          (farthestDelivery.date &&
            new Date(deliveries[i].date) >= new Date(farthestDelivery.date)) ||
          i === 0
        ) {
          farthestDelivery = deliveries[i];
        }
      }
      return farthestDelivery;
    }

    function getAvailableByDeliveries(deliveries) {
      var warehousesIds = getWarehousesIdsByDeliveries(deliveries);
      var available = 0;
      available = warehousesIds.reduce(function(acum, whsId) {
        return acum + getDeliveryStockByWarehouse(whsId, deliveries);
      }, 0);
      return available;
    }

    function getDeliveryStockByWarehouse(warehouseId, deliveries) {
      var stock = deliveries.reduce(function(acum, delivery) {
        if (delivery.companyFrom === warehouseId && delivery.available > acum) {
          return delivery.available;
        }
        return acum;
      }, 0);
      return stock;
    }

    function getWarehousesIdsByDeliveries(deliveries) {
      var warehousesIds = deliveries.reduce(function(warehouses, delivery) {
        if (warehouses.indexOf(delivery.companyFrom) === -1) {
          return warehouses.concat(delivery.companyFrom);
        }
        return warehouses;
      }, []);
      return warehousesIds;
    }

    function sortDeliveriesByHierarchy(
      deliveries,
      allWarehouses,
      activeStoreWarehouse
    ) {
      var sortedDeliveries = [];

      var warehouses = deliveries.map(function(delivery) {
        var warehouse = _.findWhere(allWarehouses, {
          id: delivery.companyFrom,
        });
        return warehouse;
      });
      warehouses = sortWarehousesByHierarchy(warehouses, activeStoreWarehouse);

      var afterPurchaseDeliveries = getAfterPurchaseDeliveries(deliveries);
      var onWarehouseDeliveries = getOnWarehouseDeliveries(deliveries);

      for (var i = 0; i < warehouses.length; i++) {
        var deliveriesWithWhsMatch = _.where(afterPurchaseDeliveries, {
          companyFrom: warehouses[i].id,
        });
        sortedDeliveries = sortedDeliveries.concat(deliveriesWithWhsMatch);
        //var delivery = _.findWhere(deliveries, {companyFrom: warehouses[i].id});
        //sortedDeliveries.push( delivery );
      }

      for (i = 0; i < warehouses.length; i++) {
        var deliveriesWithWhsMatch2 = _.where(onWarehouseDeliveries, {
          companyFrom: warehouses[i].id,
        });
        sortedDeliveries = sortedDeliveries.concat(deliveriesWithWhsMatch2);
        //var delivery = _.findWhere(deliveries, {companyFrom: warehouses[i].id});
        //sortedDeliveries.push( delivery );
      }

      return sortedDeliveries;
    }

    function getAfterPurchaseDeliveries(deliveries) {
      var afterPurchaseDeliveries = [];
      return (afterPurchaseDeliveries = deliveries.filter(function(delivery) {
        return delivery.PurchaseAfter;
      }));
    }

    function getOnWarehouseDeliveries(deliveries) {
      var onWarehouseDeliveries = [];
      return (onWarehouseDeliveries = deliveries.filter(function(delivery) {
        return !delivery.PurchaseAfter;
      }));
    }

    function sortWarehousesByHierarchy(warehouses, activeStoreWarehouse) {
      var warehousesHierarchy = getWarehousesHierarchyByActiveWarehouse(
        activeStoreWarehouse,
        warehouses
      );
      console.log('warehousesHierarchy', warehousesHierarchy);

      var sorted = [];
      for (var i = 0; i < warehousesHierarchy.length; i++) {
        var warehouseMatch = _.findWhere(warehouses, {
          WhsCode: warehousesHierarchy[i],
        });
        if (warehouseMatch) {
          sorted.push(warehouseMatch);
        }
      }

      console.log('sorted', sorted);

      return sorted;
    }

    function assignStoreWarehouseAtTop(warehouses, activeStoreWarehouse) {
      var storeWhsId = activeStoreWarehouse.id;
      warehouses.sort(function(a, b) {
        return a.id == storeWhsId ? -1 : b.id == storeWhsId ? 1 : 0;
      });

      return warehouses;
    }

    function sortDeliveriesByDate(deliveries) {
      var sortedByDate = deliveries.sort(function(a, b) {
        var dateA = new Date(a.date).getTime();
        var dateB = new Date(b.date).getTime();
        return dateA < dateB ? 1 : -1;
      });
      return sortedByDate;
    }

    function getWarehouseHash(warehouse) {
      var hash = warehouse.cedis ? 'cedis#' : '#';
      hash += warehouse.region;
      return hash;
    }

    function getWarehousesHierarchyByActiveWarehouse(
      activeWarehouse,
      warehouses
    ) {
      var CEDIS_QROO = '01';
      var STUDIO_MALECON = '02';
      var STUDIO_PLAYA = '03';
      var STUDIO_CUMBRES = '05';
      var CEDIS_MERIDA = '10';
      var STUDIO_MERIDA = '11';
      var HOME_XCARET = '81';
      var PUERTO_CANCUN = '82';

      var hierarchy = [];
      switch (activeWarehouse.WhsCode) {
        //STUDIO MALECON
        case STUDIO_MALECON:
          hierarchy = [
            CEDIS_QROO,
            STUDIO_MALECON,
            STUDIO_PLAYA,
            STUDIO_CUMBRES,
            HOME_XCARET,
            PUERTO_CANCUN,
          ];
          //hierarchy = ["01","02","03","05", "81", "82"];
          break;

        //STUDIO PLAYA
        case STUDIO_PLAYA:
          hierarchy = [
            CEDIS_QROO,
            STUDIO_PLAYA,
            STUDIO_MALECON,
            STUDIO_CUMBRES,
            HOME_XCARET,
            PUERTO_CANCUN,
          ];
          //hierarchy = ["01","03","02", "05","81","82"];
          break;

        //STUDIO CUMBRES
        case STUDIO_CUMBRES:
          hierarchy = [
            CEDIS_QROO,
            STUDIO_CUMBRES,
            STUDIO_MALECON,
            STUDIO_PLAYA,
            HOME_XCARET,
            PUERTO_CANCUN,
          ];
          //hierarchy = ["01","05","02","03","81","82"];
          break;

        //HOME XCARET
        case HOME_XCARET:
          hierarchy = [
            CEDIS_QROO,
            HOME_XCARET,
            PUERTO_CANCUN,
            STUDIO_MALECON,
            STUDIO_PLAYA,
            STUDIO_CUMBRES,
          ];
          //hierarchy = ["01","81","82","02","03","05"];
          break;

        //HOME PUERTO CANCUN
        case PUERTO_CANCUN:
          hierarchy = [
            CEDIS_QROO,
            PUERTO_CANCUN,
            HOME_XCARET,
            STUDIO_MALECON,
            STUDIO_PLAYA,
            STUDIO_CUMBRES,
          ];
          //hierarchy = ["01","82","81","02","03","05"];
          break;

        //STUDIO MERIDA
        case STUDIO_MERIDA:
          hierarchy = [
            CEDIS_MERIDA,
            CEDIS_QROO,
            STUDIO_MERIDA,
            HOME_XCARET,
            PUERTO_CANCUN,
            STUDIO_MALECON,
            STUDIO_PLAYA,
            STUDIO_CUMBRES,
          ];
          //hierarchy = ["10","01","11","81","82","02","03","05"];
          break;

        default:
          hierarchy = [];
          break;
      }

      return hierarchy;
    }

    return service;
  }
})();
