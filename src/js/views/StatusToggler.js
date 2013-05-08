/*global define*/

// the issue status toggler
define(['backbone', 'jquery', 'libs/mustache', 'text!templates/status_toggler.html'], 
    function (Backbone, $, Mustache, StatusTogglerTemplate) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: 'statusToggler',
        initialize: function () {
            this.model.set('openActive', 'active');
        },
        render: function () {
            this.$el.html(Mustache.render(StatusTogglerTemplate, this.model.toJSON()));

            return this.$el;
        }
    });
});