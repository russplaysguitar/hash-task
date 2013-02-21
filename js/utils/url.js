/*global define*/

// a collection of stateless URL-related utilities
define([], function () {
    'use strict';

    return {
        // returns the value of a url parameter
        getURLParameter: function (name) {
            // from: http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
            return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[null,""])[1].replace(/\+/g, '%20'))||null;
        }
    };
});