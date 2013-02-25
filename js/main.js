/*global require*/

require.config({
    baseUrl: 'js',
    paths: {
        underscore: 'libs/underscore',
        backbone: 'libs/backbone',
        jquery: 'libs/jquery',
        sjcl: 'libs/sjcl',
        text: 'libs/text',
        bootstrap: 'libs/bootstrap'
    },
    shim: {
        underscore: {
            exports: '_'
        },
        jquery: {
            exports: '$'
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        sjcl: {
            exports: 'sjcl'
        },
        bootstrap: {
            deps: ['jquery']
        }
    }
});

// start the app
require(['app', 'jquery'], function (app, $) {
    $(document).ready(function () {
        app();
    });
});