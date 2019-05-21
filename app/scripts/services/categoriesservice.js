(function (){
  'use strict';

  angular
    .module('actualApp')
    .factory('categoriesService', categoriesService);

  function categoriesService(api){
    var service = {
      getCategoriesGroups: getCategoriesGroups,
      createCategoriesTree: createCategoriesTree,
      getCategoryByHandle: getCategoryByHandle,
      getCategoryIcon: getCategoryIcon,
      getLowestCategory: getLowestCategory
    };

    function getCategoriesGroups(){
      var url = '/productcategory/getcategoriesgroups';
      return api.$http.post(url);
    }

    function createCategoriesTree(){
      var url = '/productcategory/getcategoriestree';
      return api.$http.post(url);
    }


    function getCategoryByHandle(handle){
      var url = '/productcategory/findbyhandle/' + handle;
      return api.$http.post(url);
    }

    function getCategoryIcon(handle){
      var icons = {
        'ambientes': 'ambientes',
        'colchones': 'colchones',
        'mesas': 'mesas',
        'sillas': 'sillas',
        'bebes': 'bebes',
        'ninos': 'ninos',
        'blancos': 'blancos',
        'decoracion': 'decoracion',
      };
      
      if(icons[handle]){
        return icons[handle];
      }
      return 'murbles';

    }

    function getLowestCategory(categories){
      var lowestCategoryLevel = 0;
      var lowestCategory = false;
      categories.forEach(function(category){
        if(category.CategoryLevel > lowestCategoryLevel){
          lowestCategory = category;
          lowestCategoryLevel = category.CategoryLevel;
        }
      });
      return lowestCategory;
    }

    return service;
  }

})();
