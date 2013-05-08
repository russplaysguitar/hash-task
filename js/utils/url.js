/*global define*/

// a collection of stateless URL-related utilities
define([], function () {
    'use strict';

    return {
        // returns the value of a url parameter
        getURLParameter: function (name) {
            // from: http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
            return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[null,""])[1].replace(/\+/g, '%20'))||null;
        },

        getProject: function () {
            var splitUrl = location.hash.split('/');
            var project = splitUrl[0].substring(1, splitUrl[0].length);
            return project;
        },

        getTask: function () {
            var splitUrl = location.hash.split('/');
            if (splitUrl.length < 2) { 
                return null;
            }
            var task = splitUrl[1];
            return task;
        },

        getStatus: function () {
            var splitUrl = location.hash.split('/');
            if (splitUrl.length < 3) { 
                return null;
            }
            var status = splitUrl[2];
            return status;
        }
    };
});