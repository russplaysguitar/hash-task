/*global define*/

define([
    'backbone', 
    'underscore', 
    'jquery', 
    'libs/mustache', 
    'bootstrap', 
    'text!templates/welcome.html'
], function (Backbone, _, $, Mustache, bootstrap, WelcomeTemplate) {
    'use strict';

    return Backbone.View.extend({
        initialize: function () {
            this.render();
        },
        render: function () {
            // do render
            var rendered = Mustache.render(WelcomeTemplate);
            this.$el.html(rendered);
        }
    });
});
