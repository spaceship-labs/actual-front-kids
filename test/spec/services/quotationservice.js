'use strict';

describe('Service: quotationService', function() {
  // load the service's module
  beforeEach(module('actualApp'));

  // instantiate service
  var quotationService;
  beforeEach(inject(function(_quotationService_) {
    quotationService = _quotationService_;
  }));

  it('should create detail from params', function() {
    var genericDate = new Date();
    var params = {
      quantity: 1,
      shipDate: genericDate,
      originalShipDate: genericDate,
      productDate: genericDate,
      shipCompany: 'shipCompany.id',
      shipCompanyFrom: 'shipCompanyFrom.id',
      promotionPackage: 'promotionPackage.id',
      PurchaseAfter: 'purchaseAfter',
      PurchaseDocument: 'PurchaseDocument.example',
      immediateDelivery: false
    };
    var productId = 'product.id';
    var quotationId = 'quotation.id';
    var result = quotationService.createDetailObjectFromParams(
      productId,
      params,
      quotationId
    );
    var expected = {
      Product: productId,
      quantity: params.quantity,
      Quotation: quotationId,
      shipDate: genericDate,
      originalShipDate: genericDate,
      productDate: genericDate,
      shipCompany: params.shipCompany,
      shipCompanyFrom: params.shipCompanyFrom,
      PromotionPackage: params.promotionPackage,
      PurchaseAfter: params.PurchaseAfter,
      PurchaseDocument: params.PurchaseDocument,
      immediateDelivery: false
    };

    //console.log('result', result);
    expect(result).toEqual(expected);
  });

  //TODO: Revisar mejor forma de hacer este proceso de merging
  //Actualmente se hace porque details ya esta populado con productos que tienen populados a su vez
  // FilterValues
  it('should map detailsstock result with details', function() {
    var details = [{ id: 'detail1.id' }, { id: 'detail2.id' }];
    var detailsStockArray = [
      { id: 'detail1.id', validStock: true },
      { id: 'detail2.id', validStock: false }
    ];
    var result = quotationService.mapDetailsStock(details, detailsStockArray);
    var mutatedDetails = [
      { id: 'detail1.id', validStock: true },
      { id: 'detail2.id', validStock: false }
    ];
    expect(result).toEqual(mutatedDetails);
  });

  it('should validate correctly the details stock', function() {
    var details = [
      { id: 'detail1.id', validStock: true },
      { id: 'detail2.id', validStock: true }
    ];
    var result = quotationService.isValidStock(details);
    expect(result).toBe(true);
  });

  it('should validate correctly the details stock when not valid', function() {
    var details = [
      { id: 'detail1.id', validStock: true },
      { id: 'detail2.id', validStock: false }
    ];
    var result = quotationService.isValidStock(details);
    expect(result).toBe(false);
  });

  describe('isValidQuotationAddress', function() {
    it('should validate to true the quotation address when it has immediate delivery', function() {
      var quotation = { immediateDelivery: true };
      var result = quotationService.isValidQuotationAddress(quotation);
      expect(result).toBe(true);
    });

    it('should validate to true the quotation address when it has an address', function() {
      var quotation = { Address: {} };
      var result = quotationService.isValidQuotationAddress(quotation);
      expect(result).toBe(true);
    });

    it('should validate to false when the quotation doesnt have an address neither an immediateDelivery', function() {
      var quotation = {};
      var result = quotationService.isValidQuotationAddress(quotation);
      expect(result).toBe(false);
    });
  });
});
