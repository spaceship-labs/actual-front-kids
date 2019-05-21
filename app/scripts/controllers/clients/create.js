'use strict';
angular.module('actualApp')
  .controller('ClientCreateCtrl', ClientCreateCtrl);

function ClientCreateCtrl(
    $scope,
    $location, 
    $rootScope, 
    dialogService, 
    commonService, 
    clientService,
    quotationService,
    checkoutService,
    localStorageService,
    $interval
  ){
  var vm = this;
  var PERSONAL_DATA_TAB = 0;
  var FISCAL_DATA_TAB = 1;
  var DELIVERY_DATA_TAB = 3;

  angular.extend(vm, {
    activeTab       : 0,
    client          :{},
    contacts        :[{}],
    fiscalAddress   :{},
    loadingEstimate :0,
    companyNameMaxLength: 50,
    isLoadingProgress: false,
    intervalProgress: false,
    cfdiUseList: clientService.getCFDIUseList(),    
    titles          : clientService.getTitles(),
    genders         : clientService.getGenders(),
    states          : [],
    countries       : commonService.getCountries(),
    addContactForm  : addContactForm,
    create          : create,
    onPikadaySelect : onPikadaySelect,
    removeContactForm: removeContactForm,
    clearTabFields  : clearTabFields,
    copyPersonalDataToContact: copyPersonalDataToContact,
    fiscalAddressConstraints: clientService.fiscalAddressConstraints,
    PERSONAL_DATA_TAB: 0,
    FISCAL_DATA_TAB: 1,
    DELIVERY_DATA_TAB: 3
  });

  function onPikadaySelect(pikaday){
    vm.client.Birthdate = pikaday._d;
  }

  function clearPersonalDataTab(){
    vm.client = {};
    vm.pikadayDate.setDate(null);
  }

  function clearFiscalAddressTab(){
    vm.fiscalAddress = {};
    vm.client.LicTradNum = null;
  }

  function clearContactsTab(){
    vm.contacts = [{}];
  }

  function clearTabFields(){
    switch(vm.activeTab){
      case vm.PERSONAL_DATA_TAB:
        clearPersonalDataTab();
        break;
      case vm.FISCAL_DATA_TAB:
        clearFiscalAddressTab();
        break;
      case DELIVERY_DATA_TAB:
        clearContactsTab();
    }
  }

  function addContactForm(){
    vm.contacts.push({});
  }

  function removeContactForm(contactFormIndex){
    if(vm.contacts){
      vm.contacts.splice(contactFormIndex, 1);
    }
  }

  function addContact(form){
    if(form.$valid){
      vm.contacts.push({});
    }else{
      dialogService.showDialog('Campos incompletos');
    }
  }

  function init(){
    commonService.getStatesSap().then(function(res){
      vm.states = res.data;
    })
    .catch(function(err){
      console.log(err);
    });
  }


  function filterContacts(contact){
    return !_.isUndefined(contact.FirstName);
  }

  function validateClientEmails(client){
    if(client.contacts && client.contacts.length > 0){
      for(var i=0;i<client.contacts.length;i++){
        if(
          !commonService.isValidEmail(client.contacts[i].E_Mail, {excludeActualDomains: true}) && 
          !_.isEmpty(client.fiscalAddress)
        ){
          return false;
        }
      }
    }

    //if(client.fiscalAddress && !_.isEmpty(client.fiscalAddress) && !_.isEmpty(client.fiscalAddress.U_Correos)){
    if(client.fiscalAddress && !_.isEmpty(client.fiscalAddress) ){

      if(!commonService.isValidEmail(client.fiscalAddress.U_Correos, {excludeActualDomains: true})){
        return false;
      }
    }

    if(!commonService.isValidEmail(client.E_Mail, {excludeActualDomains: true})){
      return false;
    }

    return true;
  }


  function getFilledForms(formsRelations){
    var filledForms = formsRelations.reduce(function(acum, formRelation){

      if( angular.isArray(formRelation.data) ){
        var requiresValidation = false;

        //Validation for contact forms(multiple)
        for(var i = 0; i<formRelation.data.length; i++){
          if( !_.isEmpty(formRelation.data[i]) || formRelation.isRequired){
            requiresValidation = true;
          }
        }

        if(requiresValidation){
          console.log('requiresValidation', formRelation.form);
          formRelation.form.tab = formRelation.tab;
          acum.push(formRelation.form);
        }
      }

      //Validation for fiscal form
      else if( !_.isEmpty(formRelation.data)  || formRelation.isRequired){
        formRelation.form.tab = formRelation.tab;
        acum.push(formRelation.form);
      }
      return acum;
    },[]);

    return filledForms;
  }

  function validateForms(forms){
    if(forms.length > 0){
      var validFlag = true;
      var errorTabs = [];

      for(var i=0;i<forms.length;i++){
        if(!forms[i].$valid){
          validFlag = false;
          errorTabs = errorTabs.concat(forms[i].tab);
        }
      }
      return {
        valid: validFlag,
        errorTabs: errorTabs
      };
    }
    return {
      valid: true
    };
  }

  function validateAddedContactsIfNeeded(contacts){
    if( !$location.search().checkoutProcess ){
      return true;
    }

    if( $rootScope.activeQuotation ){
      //When activequotation contacts arent needed
      //if($rootScope.activeQuotation.immediateDelivery){
        return true;
      //} 
    }

    if(contacts.length > 0){
      var areFilled  = contacts.every(function(c){
        return !_.isEmpty(c);
      });
      return areFilled;
    }
    return false;
  }

  function copyPersonalDataToContact(client,contact){
    console.log('contact', contact);
    if(!contact.copyingPersonalData){
      contact.FirstName = _.clone(client.FirstName);
      contact.LastName = _.clone(client.LastName);
      contact.Tel1 = _.clone(client.Phone1);
      contact.Cellolar = _.clone(client.Cellular);
      contact.E_Mail = _.clone(client.E_Mail);
      contact._email = _.clone(client._email);
    }
    else{
      delete contact.FirstName;
      delete contact.LastName;
      delete contact.Tel1;
      delete contact.Cellolar;
      delete contact.E_Mail;
      delete contact._email;
    }
  }

  function create(createPersonalForm, createFiscalForm, createDeliveryForm){
    vm.isLoadingProgress = true;
    vm.loadingEstimate = 0;    
    animateProgress();

    vm.client.contacts = vm.contacts.filter(filterContacts);
    vm.client.fiscalAddress = vm.fiscalAddress || false;
    
    var formsRelations = [
      {form: createFiscalForm, data: vm.client.fiscalAddress, tab:'dirección fiscal'},
      {form: createDeliveryForm, data: vm.client.contacts,  tab: 'contactos'}      
    ];

    if($location.search().checkoutProcess && $rootScope.activeQuotation){
      //Require validation for contact forms
      if($rootScope.activeQuotation.immediateDelivery){
        formsRelations[1].isRequired = true;
      }
    }

    var areValidEmails = validateClientEmails(vm.client);
    var filledForms = getFilledForms(formsRelations);
    var validateFormsResult = validateForms(filledForms);
    var areFormsValid = validateFormsResult.valid;
    var formsValidationErrors = validateFormsResult.errorTabs;

    if( 
        areFormsValid && 
        createPersonalForm.$valid && 
        areValidEmails && 
        validateAddedContactsIfNeeded(vm.contacts)
      ){
      clientService.create(vm.client)
        .then(function(res){
          console.log(res);
          var created = res.data;
          //vm.isLoadingProgress = false;
          cancelProgressInterval();
          if(created.CardCode){
            //var isInCheckoutProcess = localStorageService.get('inCheckoutProcess');
            if($location.search().continueQuotation || $location.search().checkoutProcess){
              assignClientToQuotation(created.id);
            }
            else{
              $location
                .path('/clients/profile/'+created.id)
                .search({createdClient:true});
            }
          }
        })
        .catch(function(err){
          console.log(err);
          vm.isLoadingProgress = false;
          cancelProgressInterval();

          var error = err.data || err;
          error = error ? error.toString() : '';
          dialogService.showDialog('Hubo un error: ' + error );          
        });
    }
    else if(!areValidEmails){
      vm.isLoadingProgress = false;
      cancelProgressInterval();
      dialogService.showDialog('Emails no validos');
    }
    else{
      vm.isLoadingProgress = false;
      cancelProgressInterval();

      if( !validateAddedContactsIfNeeded(vm.contacts) ){
        dialogService.showDialog('Agregar direccion de envio', function(){
          vm.activeTab = 3;
        });
        return;
      }

      dialogService.showDialog('Datos incompletos');

      if( (formsValidationErrors && formsValidationErrors.length > 0) || !createPersonalForm.$valid){
        var errorTabs = [];
        var errorString = 'Datos incompletos, revisa las siguientes pestañas: ';
        if(!createPersonalForm.$valid){
          errorTabs = errorTabs.concat(['datos personales']);
        }

        if( (formsValidationErrors && formsValidationErrors.length > 0) ){
          errorTabs = errorTabs.concat(formsValidationErrors);
        }

        errorString += errorTabs.join(',');

        dialogService.showDialog(errorString);
      }

    }

  }

  function cancelProgressInterval(){
    if(vm.intervalProgress){
      $interval.cancel(vm.intervalProgress);
    }    
  }

  function animateProgress(){
    vm.loadingEstimate = 0;
    vm.intervalProgress = $interval(function(){
      vm.loadingEstimate += 5;
      if(vm.loadingEstimate >= 100){
        vm.loadingEstimate = 0;
      }
    },1000);
  }

  function assignClientToQuotation(clientId){
    var params = {Client: clientId};
    var activeQuotation = $rootScope.activeQuotation;
    if(activeQuotation.id){
      quotationService.update(activeQuotation.id, params)
      .then(function(res){
        var quotation = res.data;
        
        if(quotation && quotation.id){
          quotationService.setActiveQuotation(activeQuotation.id);
          localStorageService.remove('inCheckoutProcess');
          
          if($location.search().checkoutProcess && 
            $rootScope.activeQuotation.total && 
            !$location.search().startQuotation
          ){
            $location
              .path('/clients/profile/'+clientId)
              .search({
                createdClient:true,
                checkoutProcess: $location.search().checkoutProcess
              });            
          }

          else{
            $location
              .path('/quotations/edit/' + quotation.id)
              .search({createdClient:true});        
          }
        }
      })
      .catch(function(err){
        console.log('err', err);
      });
    }
  }


  $scope.$on('$destroy', function(){
    cancelProgressInterval();
  });  

  init();

}
