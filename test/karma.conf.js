// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2016-01-15 using
// generator-karma 1.0.1

module.exports = function(config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    // as well as any additional frameworks (requirejs/chai/sinon/...)
    frameworks: [
      "jasmine"
      //"mocha",
      //"chai",
      //'sinon-chai'
    ],
    // list of files / patterns to load in the browser
    files: [
      // bower:js
      'bower_components/jquery/dist/jquery.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-resource/angular-resource.js',
      'bower_components/angular-route/angular-route.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-touch/angular-touch.js',
      'bower_components/angularLocalStorage/dist/angularLocalStorage.min.js',
      'bower_components/ngstorage/ngStorage.js',
      'bower_components/slick-carousel/slick/slick.min.js',
      'bower_components/angular-slick/dist/slick.js',
      'bower_components/angular-local-storage/dist/angular-local-storage.js',
      'bower_components/angular-jwt/dist/angular-jwt.js',
      'bower_components/underscore/underscore.js',
      'bower_components/moment/moment.js',
      'bower_components/angular-aria/angular-aria.js',
      'bower_components/angular-messages/angular-messages.js',
      'bower_components/angular-material/angular-material.js',
      'bower_components/angular-material-datetimepicker/js/angular-material-datetimepicker.js',
      'bower_components/datatables.net/js/jquery.dataTables.js',
      'bower_components/angular-datatables/dist/angular-datatables.js',
      'bower_components/angular-datatables/dist/plugins/bootstrap/angular-datatables.bootstrap.js',
      'bower_components/angular-datatables/dist/plugins/colreorder/angular-datatables.colreorder.js',
      'bower_components/angular-datatables/dist/plugins/columnfilter/angular-datatables.columnfilter.js',
      'bower_components/angular-datatables/dist/plugins/light-columnfilter/angular-datatables.light-columnfilter.js',
      'bower_components/angular-datatables/dist/plugins/colvis/angular-datatables.colvis.js',
      'bower_components/angular-datatables/dist/plugins/fixedcolumns/angular-datatables.fixedcolumns.js',
      'bower_components/angular-datatables/dist/plugins/fixedheader/angular-datatables.fixedheader.js',
      'bower_components/angular-datatables/dist/plugins/scroller/angular-datatables.scroller.js',
      'bower_components/angular-datatables/dist/plugins/tabletools/angular-datatables.tabletools.js',
      'bower_components/angular-datatables/dist/plugins/buttons/angular-datatables.buttons.js',
      'bower_components/angular-datatables/dist/plugins/select/angular-datatables.select.js',
      'bower_components/ez-plus/src/jquery.ez-plus.js',
      'bower_components/angular-ez-plus/js/angular-ezplus.js',
      'bower_components/pikaday/pikaday.js',
      'bower_components/pikaday-angular/pikaday-angular.js',
      'bower_components/jquery-timepicker-jt/jquery.timepicker.js',
      'bower_components/angular-jquery-timepicker/src/timepickerdirective.js',
      'bower_components/ng-file-upload/ng-file-upload.js',
      'bower_components/scalyr/scalyr.js',
      'bower_components/photoswipe/dist/photoswipe.js',
      'bower_components/photoswipe/dist/photoswipe-ui-default.js',
      'bower_components/ng-photoswipe/angular-photoswipe.min.js',
      'bower_components/angular-input-masks/angular-input-masks-standalone.js',
      'bower_components/ngInfiniteScroll/build/ng-infinite-scroll.js',
      'bower_components/object-hash/dist/object_hash.js',
      'bower_components/chosen/chosen.jquery.js',
      'bower_components/angular-chosen-localytics/dist/angular-chosen.js',
      'bower_components/ng-currency/dist/ng-currency.js',
      'bower_components/angular-google-analytics/dist/angular-google-analytics.min.js',
      'bower_components/angular-mocks/angular-mocks.js',
      // endbower
      "app/scripts/**/*.js",
      "test/mock/**/*.js",
      "test/spec/**/*.js",
      "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.2.1/Chart.min.js",
      "https://cdn.jsdelivr.net/angular.chartjs/latest/angular-chart.min.js"
    ],

    // list of files / patterns to exclude
    exclude: [
    ],

    // web server port
    port: 8080,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      "PhantomJS"
    ],

    // Code coverage report
    reporters: ['progress', 'coverage'],
    preprocessors: {
      'app/scripts/**/*.js': ['coverage']
    },
    coverageReporter: {
      type: 'lcov',
      dir: 'coverage'
    },

    // Which plugins to enable
    plugins: [
      "karma-jasmine",
      'karma-coverage',      
      "karma-phantomjs-launcher"

      /*
      'karma-mocha',
      'karma-chai',
      'karma-coverage',
      'karma-sinon-chai'
      */
    ],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
};
